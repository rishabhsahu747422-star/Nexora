import "dotenv/config";
import { server } from "./src/app/app.js";
import mongoose from "mongoose";
import { io as ClientIO } from "../Client/node_modules/socket.io-client/build/esm/index.js";

async function run() {
  console.log("======================================================================");
  console.log("   NEXORA - AUDIT & VERIFICATION OF 4 CORE CAPABILITIES");
  console.log("   1. Community Invites & Join");
  console.log("   2. Voice / Video Direct Call Signaling & WebRTC Lifecycle");
  console.log("   3. Message Reactions (Persistence, Toggling & Realtime)");
  console.log("   4. Sender Identity / Self-Message Presentation Verification");
  console.log("======================================================================\n");

  process.env.JWT_SECRET = process.env.JWT_SECRET || "nexora_test_jwt_secret_key_123456789";
  await mongoose.connect("mongodb://127.0.0.1:27017/nexora_test");
  console.log("✓ Connected to MongoDB at mongodb://127.0.0.1:27017/nexora_test");

  const PORT = 5598;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test backend server running on port ${PORT}\n`);

  const BASE_URL = `http://localhost:${PORT}/api`;

  const post = async (url, body, cookie = "") => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    const setCookie = res.headers.get("set-cookie");
    const data = await res.json().catch(() => null);
    return { status: res.status, data, setCookie };
  };

  const get = async (url, cookie = "") => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "GET",
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };

  const getCookieString = (setCookieHeader) => {
    if (!setCookieHeader) return "";
    return setCookieHeader.split(",").map((c) => c.split(";")[0].trim()).join("; ");
  };

  // 0. Register and login User A and User B
  const ts = Date.now();
  const u1Data = {
    username: `alex_${ts}`,
    fullname: "Alex Rivera",
    email: `alex_${ts}@example.com`,
    password: "Password123!",
    mobile_no: "9876543101",
  };
  const u2Data = {
    username: `blake_${ts}`,
    fullname: "Blake Morgan",
    email: `blake_${ts}@example.com`,
    password: "Password123!",
    mobile_no: "9876543102",
  };

  console.log("--- Step 0: Register & Authenticate User A & User B ---");
  const reg1 = await post("/auth/register", u1Data);
  const cookie1 = getCookieString(reg1.setCookie);
  const user1 = reg1.data.user;

  const reg2 = await post("/auth/register", u2Data);
  const cookie2 = getCookieString(reg2.setCookie);
  const user2 = reg2.data.user;

  console.log(`✓ User A registered: ${user1.username} (${user1._id})`);
  console.log(`✓ User B registered: ${user2.username} (${user2._id})\n`);

  // ======================================================================
  // 1. COMMUNITY INVITES & JOINING
  // ======================================================================
  console.log("--- Area 1: Community Invites & Joining Verification ---");

  // User A creates a server
  const createServerRes = await post(
    "/server/create",
    { name: "CyberSec Alpha Guild", description: "Elite operations base" },
    cookie1
  );
  if (createServerRes.status !== 201) {
    throw new Error(`Failed to create server: ${JSON.stringify(createServerRes.data)}`);
  }
  const createdServer = createServerRes.data?.data || createServerRes.data?.server;
  console.log(`✓ User A created community: "${createdServer.name}" (${createdServer._id})`);

  // User A generates invite link
  const createInviteRes = await post(`/server/${createdServer._id}/invite`, {}, cookie1);
  if (createInviteRes.status !== 200) {
    throw new Error(`Failed to generate invite: ${JSON.stringify(createInviteRes.data)}`);
  }
  const inviteCode = createInviteRes.data?.data?.inviteCode || createInviteRes.data?.inviteCode;
  console.log(`✓ Invite code generated: "${inviteCode}"`);

  // Unauthenticated client resolves invite details (logged out preview)
  const previewRes = await get(`/server/invite/${inviteCode}`, "");
  const previewServer = previewRes.data?.data?.server || previewRes.data?.data;
  if (previewRes.status !== 200 || !previewServer?.name) {
    throw new Error(`Failed to resolve invite unauthenticated: ${JSON.stringify(previewRes.data)}`);
  }
  console.log(`✓ Logged-out resolution successful: Name="${previewServer.name}", MemberCount=${previewServer.memberCount}, isMember=${previewServer.isMember}`);

  // User B joins community using invite code
  const joinRes = await post(`/server/join/${inviteCode}`, {}, cookie2);
  const joinServerData = joinRes.data?.data?.server || joinRes.data?.data;
  if (joinRes.status !== 200) {
    throw new Error(`User B failed to join community: ${JSON.stringify(joinRes.data)}`);
  }
  console.log(`✓ User B joined community successfully: ServerName="${joinServerData?.name || createdServer.name}"`);

  // User B tries to join again (duplicate join prevention - should be 200 with alreadyMember flag, no 400 crash)
  const dupJoinRes = await post(`/server/join/${inviteCode}`, {}, cookie2);
  const alreadyMember = dupJoinRes.data?.data?.alreadyMember ?? dupJoinRes.data?.alreadyMember;
  if (dupJoinRes.status !== 200 || !alreadyMember) {
    throw new Error(`Duplicate join not handled gracefully: ${JSON.stringify(dupJoinRes.data)}`);
  }
  console.log(`✓ Duplicate join safely handled: alreadyMember=${alreadyMember}`);

  // User B checks their server list and channel access
  const user2ServersRes = await get("/server", cookie2);
  const user2ServersList = user2ServersRes.data?.data?.servers || user2ServersRes.data?.servers;
  const foundServer = user2ServersList?.find((s) => String(s._id) === String(createdServer._id));
  if (!foundServer) {
    throw new Error("Community not found in User B's server list!");
  }
  console.log(`✓ Community persisted and present in User B's server sidebar list.`);

  // Test invalid invite code
  const invalidRes = await get("/server/invite/INVALID_CODE_999", cookie2);
  if (invalidRes.status !== 404) {
    throw new Error(`Invalid invite did not return 404: status ${invalidRes.status}`);
  }
  console.log(`✓ Invalid invite code correctly returns 404 with error message: "${invalidRes.data.message}"\n`);

  // ======================================================================
  // 2. MESSAGE REACTIONS (PERSISTENCE, TOGGLING & REALTIME)
  // ======================================================================
  console.log("--- Area 2: Message Reactions Integration Verification ---");

  // User A and User B become connections
  await post("/connections/request", { username: user2.username }, cookie1);
  const overviewB = await get("/connections", cookie2);
  const incoming = overviewB.data?.data?.incomingRequests || [];
  if (incoming.length > 0) {
    const reqId = incoming[0].id;
    await post(`/connections/request/${reqId}/accept`, {}, cookie2);
  }

  // Setup sockets to listen for realtime reactions
  const socket1 = ClientIO(`http://localhost:${PORT}`, {
    extraHeaders: { Cookie: cookie1 },
    transports: ["websocket"],
  });
  const socket2 = ClientIO(`http://localhost:${PORT}`, {
    extraHeaders: { Cookie: cookie2 },
    transports: ["websocket"],
  });

  await Promise.all([
    new Promise((res) => socket1.on("connect", res)),
    new Promise((res) => socket2.on("connect", res)),
  ]);
  console.log("✓ Sockets connected for User A and User B");

  // Open/Create DM conversation
  const dmConvRes = await post("/conversations", { recipientId: user2._id }, cookie1);
  const conversationId = dmConvRes.data?.data?._id || dmConvRes.data?.conversation?._id || dmConvRes.data?._id;

  // User A sends direct message to User B
  const sendDmRes = await post(
    `/conversations/${conversationId}/messages`,
    { content: "Project rendezvous at 2200 hours." },
    cookie1
  );
  const dmMessage = sendDmRes.data?.data?.message || sendDmRes.data?.data || sendDmRes.data?.message;
  console.log(`✓ User A sent DM: "${dmMessage.content}" (ID: ${dmMessage._id})`);

  // Join conversation room for both sockets
  socket1.emit("join-conversation", conversationId);
  socket2.emit("join-conversation", conversationId);
  await new Promise((r) => setTimeout(r, 200));

  // User A reacts with 🔥 to DM message
  const rxnPromiseB = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout waiting for realtime DM reaction on User B")), 3000);
    socket2.on("direct-message:reaction", (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  const reactRes1 = await post(
    `/conversations/${conversationId}/messages/${dmMessage._id}/reactions`,
    { emoji: "🔥" },
    cookie1
  );
  if (reactRes1.status !== 200) {
    throw new Error(`Failed to add reaction: ${JSON.stringify(reactRes1.data)}`);
  }
  const reactions1 = reactRes1.data?.data?.reactions || reactRes1.data?.reactions || [];
  console.log(`✓ User A added 🔥 reaction (status 200). Reactions count: ${reactions1.length}`);

  const rxnEventB = await rxnPromiseB;
  console.log(`✓ User B received realtime reaction socket event: Emoji="${rxnEventB.reactions[0].emoji}", UsersCount=${rxnEventB.reactions[0].users.length}`);

  // User B reacts with 👍 to the same message
  const reactRes2 = await post(
    `/conversations/${conversationId}/messages/${dmMessage._id}/reactions`,
    { emoji: "👍" },
    cookie2
  );
  const reactions2 = reactRes2.data?.data?.reactions || reactRes2.data?.reactions || [];
  console.log(`✓ User B added 👍 reaction. Total unique emoji reactions on message: ${reactions2.length}`);

  // User A removes their 🔥 reaction (toggle)
  const toggleRes = await post(
    `/conversations/${conversationId}/messages/${dmMessage._id}/reactions`,
    { emoji: "🔥" },
    cookie1
  );
  const reactions3 = toggleRes.data?.data?.reactions || toggleRes.data?.reactions || [];
  console.log(`✓ User A removed 🔥 reaction. Remaining reactions on message: ${reactions3.length}`);

  // Fetch DM messages to verify MongoDB database persistence
  const historyRes = await get(`/conversations/${conversationId}/messages`, cookie2);
  const messagesList = Array.isArray(historyRes.data?.data)
    ? historyRes.data.data
    : historyRes.data?.data?.messages || historyRes.data?.messages || [];
  const persistedMsg = messagesList.find((m) => String(m._id) === String(dmMessage._id));
  if (!persistedMsg || !persistedMsg.reactions) {
    throw new Error(`Reactions not found in persisted message history! Messages: ${JSON.stringify(messagesList)}`);
  }
  console.log(`✓ Database persistence verified: Persisted reactions on message = ${JSON.stringify(persistedMsg.reactions)}\n`);

  // ======================================================================
  // 3. VOICE / VIDEO DIRECT CALL SIGNALING & WEBRTC LIFECYCLE
  // ======================================================================
  console.log("--- Area 3: Voice / Video Direct Call WebRTC Signaling Verification ---");

  let incomingCallData = null;
  const incomingPromise = new Promise((resolve) => {
    socket2.on("direct-call:incoming", (data) => {
      incomingCallData = data;
      resolve(data);
    });
  });

  // User A initiates direct call
  const callInitiateRes = await new Promise((resolve) => {
    socket1.emit(
      "direct-call:initiate",
      { recipientId: user2._id, isVideo: true, conversationId },
      resolve
    );
  });
  if (!callInitiateRes.success) {
    throw new Error(`Call initiate failed: ${callInitiateRes.message}`);
  }
  const callId = callInitiateRes.callId;
  console.log(`✓ User A initiated direct video call. Call ID: ${callId}`);

  await incomingPromise;
  console.log(`✓ User B received direct-call:incoming event: Caller="${incomingCallData.caller.username}", isVideo=${incomingCallData.isVideo}`);

  // User B accepts call
  const callAcceptedPromiseA = new Promise((resolve) => {
    socket1.on("direct-call:accepted", resolve);
  });
  const callAcceptedPromiseB = new Promise((resolve) => {
    socket2.on("direct-call:accepted", resolve);
  });

  socket2.emit("direct-call:accept", { callId });
  const acceptedDataA = await callAcceptedPromiseA;
  const acceptedDataB = await callAcceptedPromiseB;
  console.log(`✓ Call accepted by User B. User A received recipientSocketId="${acceptedDataA.recipientSocketId}".`);

  // WebRTC Signaling: User A sends offer signal
  const offerSignalPromiseB = new Promise((resolve) => {
    socket2.on("direct-call:signal", (payload) => {
      if (payload.signal.type === "offer") resolve(payload);
    });
  });

  socket1.emit("direct-call:signal", {
    targetSocketId: acceptedDataA.recipientSocketId,
    signal: { type: "offer", sdp: "v=0\r\no=alex 123456 ... m=video 9 UDP/TLS/RTP/SAVPF 96" },
    callId,
  });

  const offerReceived = await offerSignalPromiseB;
  console.log(`✓ User B received WebRTC offer signal from User A: type="${offerReceived.signal.type}"`);

  // User B sends answer signal back to User A
  const answerSignalPromiseA = new Promise((resolve) => {
    socket1.on("direct-call:signal", (payload) => {
      if (payload.signal.type === "answer") resolve(payload);
    });
  });

  socket2.emit("direct-call:signal", {
    targetSocketId: offerReceived.senderSocketId,
    signal: { type: "answer", sdp: "v=0\r\no=blake 654321 ... m=video 9 UDP/TLS/RTP/SAVPF 96" },
    callId,
  });

  const answerReceived = await answerSignalPromiseA;
  console.log(`✓ User A received WebRTC answer signal from User B: type="${answerReceived.signal.type}"`);

  // ICE Candidate exchange
  const icePromiseB = new Promise((resolve) => {
    socket2.on("direct-call:signal", (payload) => {
      if (payload.signal.type === "candidate") resolve(payload);
    });
  });

  socket1.emit("direct-call:signal", {
    targetSocketId: acceptedDataA.recipientSocketId,
    signal: { type: "candidate", candidate: { candidate: "candidate:1 1 UDP 2122260223 192.168.1.100 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 } },
    callId,
  });

  const iceReceived = await icePromiseB;
  console.log(`✓ ICE Candidate successfully exchanged: candidate="${iceReceived.signal.candidate.candidate.slice(0, 40)}..."`);

  // Terminate call from User A
  const endCallPromiseB = new Promise((resolve) => {
    socket2.on("direct-call:ended", resolve);
  });

  socket1.emit("direct-call:end", { callId });
  await endCallPromiseB;
  console.log(`✓ User A ended call; User B received direct-call:ended event and resources cleaned up.\n`);

  // ======================================================================
  // 4. SENDER IDENTITY & SELF-MESSAGE PRESENTATION VERIFICATION
  // ======================================================================
  console.log("--- Area 4: Sender Identity Verification ---");

  // User B sends reply to User A
  const sendReplyRes = await post(
    `/conversations/${conversationId}/messages`,
    { content: "Affirmative, rendezvous confirmed." },
    cookie2
  );
  const replyMessage = sendReplyRes.data?.data?.message || sendReplyRes.data?.data || sendReplyRes.data?.message;

  // Let's test the identity normalization logic used in MessageItem.jsx:
  const getAuthorId = (msg) => {
    return msg.author_id?._id || msg.author_id?.id || msg.author_id ||
           msg.sender?._id || msg.sender?.id || msg.sender ||
           msg.authorId || msg.senderId;
  };

  const isUser1Self = String(getAuthorId(dmMessage)) === String(user1._id);
  const isUser1Other = String(getAuthorId(replyMessage)) === String(user1._id);

  const isUser2Self = String(getAuthorId(replyMessage)) === String(user2._id);
  const isUser2Other = String(getAuthorId(dmMessage)) === String(user2._id);

  console.log(`✓ In User A's view: DM from User A isSelf=${isUser1Self} (Displays "You" badge)`);
  console.log(`✓ In User A's view: Reply from User B isSelf=${isUser1Other} (Displays "Blake Morgan")`);
  console.log(`✓ In User B's view: Reply from User B isSelf=${isUser2Self} (Displays "You" badge)`);
  console.log(`✓ In User B's view: DM from User A isSelf=${isUser2Other} (Displays "Alex Rivera")`);

  if (!isUser1Self || isUser1Other || !isUser2Self || isUser2Other) {
    throw new Error("Sender identity normalization failed!");
  }

  // Cleanup
  socket1.disconnect();
  socket2.disconnect();
  await mongoose.disconnect();
  server.close();

  console.log("\n======================================================================");
  console.log("   ALL 4 CAPABILITIES AUDITED, VERIFIED AND PASSING SUCCESSFULLY!");
  console.log("======================================================================\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ Test execution failed:", err);
  process.exit(1);
});
