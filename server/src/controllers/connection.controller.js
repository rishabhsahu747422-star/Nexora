import connectionRequestModel from "../models/connectionRequest.model.js";
import userModel from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isUserOnline, emitToUser } from "../config/soocket.js";

const formatRelativeTime = (date) => {
  if (!date) return "Just now";
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const uid = user._id ? user._id.toString() : user.id;
  return {
    id: uid,
    userId: uid,
    name: user.fullname || user.name || "User",
    username: user.username,
    avatar: user.profile_pic,
    status: isUserOnline(uid) ? "online" : "offline",
    customStatus: user.customStatus || "",
    bio: user.bio || "",
  };
};

/**
 * GET /api/connections
 * Returns accepted connections, pending incoming/outgoing requests, counts, and suggestions
 */
export const getConnectionOverview = async (req, res, next) => {
  try {
    const currentUserId = req.user.id || req.user._id;

    const currentUser = await userModel
      .findById(currentUserId)
      .populate("friends", "_id fullname username profile_pic bio customStatus")
      .lean();

    if (!currentUser) {
      throw new ApiError(404, "User not found");
    }

    // 1. Accepted Connections
    const rawFriends = currentUser.friends || [];
    const connections = rawFriends.map((f) => sanitizeUser(f));

    // 2. Pending Requests
    const [incomingDocs, outgoingDocs] = await Promise.all([
      connectionRequestModel
        .find({ recipient: currentUserId, status: "pending" })
        .populate("sender", "_id fullname username profile_pic bio customStatus")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      connectionRequestModel
        .find({ sender: currentUserId, status: "pending" })
        .populate("recipient", "_id fullname username profile_pic bio customStatus")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
    ]);

    const incomingRequests = incomingDocs
      .filter((doc) => doc.sender)
      .map((doc) => ({
        id: doc._id.toString(),
        requestId: doc._id.toString(),
        userId: doc.sender._id.toString(),
        name: doc.sender.fullname,
        username: doc.sender.username,
        avatar: doc.sender.profile_pic,
        status: isUserOnline(doc.sender._id) ? "online" : "offline",
        type: "incoming",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        time: formatRelativeTime(doc.updatedAt || doc.createdAt),
      }));

    const outgoingRequests = outgoingDocs
      .filter((doc) => doc.recipient)
      .map((doc) => ({
        id: doc._id.toString(),
        requestId: doc._id.toString(),
        userId: doc.recipient._id.toString(),
        name: doc.recipient.fullname,
        username: doc.recipient.username,
        avatar: doc.recipient.profile_pic,
        status: isUserOnline(doc.recipient._id) ? "online" : "offline",
        type: "outgoing",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        time: formatRelativeTime(doc.updatedAt || doc.createdAt),
      }));

    const allRequests = [...incomingRequests, ...outgoingRequests];

    // 3. Counts
    const onlineCount = connections.filter((c) => c.status === "online").length;
    const counts = {
      online: onlineCount,
      all: connections.length,
      pending: allRequests.length,
      incoming: incomingRequests.length,
      outgoing: outgoingRequests.length,
    };

    // 4. Suggested Connections (Network Pioneers)
    const friendIdStrings = rawFriends.map((f) => f._id.toString());
    const incomingSenderIds = incomingDocs.map((d) => d.sender?._id?.toString()).filter(Boolean);
    const outgoingRecipientIds = outgoingDocs.map((d) => d.recipient?._id?.toString()).filter(Boolean);

    const excludeSet = new Set([
      currentUserId.toString(),
      ...friendIdStrings,
      ...incomingSenderIds,
      ...outgoingRecipientIds,
    ]);

    const rawSuggestions = await userModel
      .find({ _id: { $nin: Array.from(excludeSet) } })
      .select("_id fullname username profile_pic bio customStatus")
      .limit(6)
      .lean();

    const suggestions = rawSuggestions.map((u) => sanitizeUser(u));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          connections,
          incomingRequests,
          outgoingRequests,
          requests: allRequests,
          counts,
          suggestions,
        },
        "Connection overview retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/connections/search?q=...
 * Search users and annotate each with relation status to authenticated user
 */
export const searchConnections = async (req, res, next) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json(new ApiResponse(200, [], "Search completed"));
    }

    const cleanQ = q.trim().replace(/^@/, "");
    const escapedQ = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const matchedUsers = await userModel
      .find({
        _id: { $ne: currentUserId },
        $or: [
          { username: { $regex: escapedQ, $options: "i" } },
          { fullname: { $regex: escapedQ, $options: "i" } },
        ],
      })
      .select("_id fullname username profile_pic bio customStatus")
      .limit(20)
      .lean();

    if (matchedUsers.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No users found"));
    }

    // Determine current user's friendships and pending requests
    const currentUser = await userModel.findById(currentUserId).select("friends").lean();
    const friendSet = new Set((currentUser?.friends || []).map((id) => id.toString()));

    const targetUserIds = matchedUsers.map((u) => u._id);

    const pendingRequests = await connectionRequestModel
      .find({
        status: "pending",
        $or: [
          { sender: currentUserId, recipient: { $in: targetUserIds } },
          { recipient: currentUserId, sender: { $in: targetUserIds } },
        ],
      })
      .lean();

    const outgoingReqMap = new Map();
    const incomingReqMap = new Map();

    for (const pr of pendingRequests) {
      if (pr.sender.toString() === currentUserId.toString()) {
        outgoingReqMap.set(pr.recipient.toString(), pr._id.toString());
      } else {
        incomingReqMap.set(pr.sender.toString(), pr._id.toString());
      }
    }

    const results = matchedUsers.map((user) => {
      const uid = user._id.toString();
      let relationship = "none";
      let requestId = null;

      if (friendSet.has(uid)) {
        relationship = "connected";
      } else if (outgoingReqMap.has(uid)) {
        relationship = "pending_outgoing";
        requestId = outgoingReqMap.get(uid);
      } else if (incomingReqMap.has(uid)) {
        relationship = "pending_incoming";
        requestId = incomingReqMap.get(uid);
      }

      return {
        ...sanitizeUser(user),
        relationship,
        requestId,
      };
    });

    return res.status(200).json(new ApiResponse(200, results, "Users retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/connections/request
 * Send a connection request to a user by recipientId or username
 */
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { recipientId, username } = req.body;

    let targetUser = null;
    if (recipientId) {
      targetUser = await userModel.findById(recipientId);
    } else if (username) {
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
      targetUser = await userModel.findOne({
        username: { $regex: new RegExp(`^${cleanUsername}$`, "i") },
      });
    }

    if (!targetUser) {
      throw new ApiError(404, "User not found on the Nexora network");
    }

    const targetUserId = targetUser._id.toString();

    if (targetUserId === currentUserId.toString()) {
      throw new ApiError(400, "You cannot send a connection request to yourself");
    }

    const currentUser = await userModel.findById(currentUserId);
    if (!currentUser) {
      throw new ApiError(404, "Authenticated user not found");
    }

    // Check if already connected
    const isAlreadyFriend = (currentUser.friends || []).some(
      (f) => f.toString() === targetUserId
    );
    if (isAlreadyFriend) {
      throw new ApiError(400, "You are already connected with this user");
    }

    // Check if recipient has already sent a pending request to us -> auto-accept!
    const reversePending = await connectionRequestModel.findOne({
      sender: targetUserId,
      recipient: currentUserId,
      status: "pending",
    });

    if (reversePending) {
      reversePending.status = "accepted";
      await reversePending.save();

      await Promise.all([
        userModel.findByIdAndUpdate(currentUserId, { $addToSet: { friends: targetUser._id } }),
        userModel.findByIdAndUpdate(targetUser._id, { $addToSet: { friends: currentUser._id } }),
      ]);

      const friendPayloadForCurrentUser = sanitizeUser(targetUser);
      const friendPayloadForTargetUser = sanitizeUser(currentUser);

      // Realtime notification to sender
      emitToUser(targetUser._id, "connection:request-accepted", {
        requestId: reversePending._id.toString(),
        friend: friendPayloadForTargetUser,
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            autoAccepted: true,
            friend: friendPayloadForCurrentUser,
          },
          `Connected with @${targetUser.username}!`
        )
      );
    }

    // Check if we already have an active pending request to them
    const existingPending = await connectionRequestModel.findOne({
      sender: currentUserId,
      recipient: targetUserId,
      status: "pending",
    });

    if (existingPending) {
      throw new ApiError(400, "Connection request has already been sent to this user");
    }

    // Upsert or create new connection request
    const newRequest = await connectionRequestModel.findOneAndUpdate(
      { sender: currentUserId, recipient: targetUserId },
      { status: "pending", updatedAt: new Date() },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const outgoingPayload = {
      id: newRequest._id.toString(),
      requestId: newRequest._id.toString(),
      userId: targetUser._id.toString(),
      name: targetUser.fullname,
      username: targetUser.username,
      avatar: targetUser.profile_pic,
      status: isUserOnline(targetUser._id) ? "online" : "offline",
      type: "outgoing",
      createdAt: newRequest.createdAt,
      time: "Just now",
    };

    const incomingPayloadForRecipient = {
      id: newRequest._id.toString(),
      requestId: newRequest._id.toString(),
      userId: currentUser._id.toString(),
      name: currentUser.fullname,
      username: currentUser.username,
      avatar: currentUser.profile_pic,
      status: isUserOnline(currentUser._id) ? "online" : "offline",
      type: "incoming",
      createdAt: newRequest.createdAt,
      time: "Just now",
    };

    // Emit real-time event to recipient
    emitToUser(targetUser._id, "connection:request-received", incomingPayloadForRecipient);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          request: outgoingPayload,
          targetUser: sanitizeUser(targetUser),
        },
        `Connection request dispatched to @${targetUser.username}`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/connections/request/:requestId/accept
 * Accept an incoming connection request
 */
export const acceptConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { requestId } = req.params;

    const request = await connectionRequestModel
      .findById(requestId)
      .populate("sender", "_id fullname username profile_pic bio customStatus");

    if (!request || request.status !== "pending") {
      throw new ApiError(404, "Pending connection request not found or already handled");
    }

    if (request.recipient.toString() !== currentUserId.toString()) {
      throw new ApiError(403, "You are not authorized to accept this connection request");
    }

    request.status = "accepted";
    await request.save();

    const currentUser = await userModel.findById(currentUserId);

    // Atomically link both users as friends
    await Promise.all([
      userModel.findByIdAndUpdate(currentUserId, { $addToSet: { friends: request.sender._id } }),
      userModel.findByIdAndUpdate(request.sender._id, { $addToSet: { friends: currentUserId } }),
    ]);

    const acceptedFriend = sanitizeUser(request.sender);
    const currentUserAsFriend = sanitizeUser(currentUser);

    // Notify the sender in real-time
    emitToUser(request.sender._id, "connection:request-accepted", {
      requestId: request._id.toString(),
      friend: currentUserAsFriend,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          requestId: request._id.toString(),
          friend: acceptedFriend,
        },
        `Connected with ${acceptedFriend.name}!`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/connections/request/:requestId/decline
 * Decline an incoming connection request
 */
export const declineConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { requestId } = req.params;

    const request = await connectionRequestModel.findById(requestId);

    if (!request) {
      throw new ApiError(404, "Connection request not found");
    }

    if (request.recipient.toString() !== currentUserId.toString()) {
      throw new ApiError(403, "You are not authorized to decline this request");
    }

    request.status = "rejected";
    await request.save();

    // Notify sender in real-time
    emitToUser(request.sender, "connection:request-declined", {
      requestId: request._id.toString(),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { requestId: request._id.toString() },
        "Connection request dismissed"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/connections/request/:requestId/cancel
 * Cancel an outgoing connection request sent by authenticated user
 */
export const cancelConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { requestId } = req.params;

    const request = await connectionRequestModel.findById(requestId);

    if (!request) {
      throw new ApiError(404, "Connection request not found");
    }

    if (request.sender.toString() !== currentUserId.toString()) {
      throw new ApiError(403, "You are not authorized to cancel this connection request");
    }

    request.status = "cancelled";
    await request.save();

    // Notify recipient in real-time
    emitToUser(request.recipient, "connection:request-cancelled", {
      requestId: request._id.toString(),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { requestId: request._id.toString() },
        "Connection request cancelled"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/connections/:friendId
 * Disconnect/remove an accepted friend
 */
export const removeConnection = async (req, res, next) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { friendId } = req.params;

    await Promise.all([
      userModel.findByIdAndUpdate(currentUserId, { $pull: { friends: friendId } }),
      userModel.findByIdAndUpdate(friendId, { $pull: { friends: currentUserId } }),
      connectionRequestModel.deleteMany({
        $or: [
          { sender: currentUserId, recipient: friendId },
          { sender: friendId, recipient: currentUserId },
        ],
      }),
    ]);

    // Notify the removed friend in real-time
    emitToUser(friendId, "connection:removed", {
      userId: currentUserId.toString(),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { friendId },
        "Connection removed successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};
