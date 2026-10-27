import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as friendService from '../../services/friend.service';

const recalcCounts = (state) => {
  const onlineCount = (state.friends || []).filter(
    (f) => f.status === 'online' || f.status === 'idle'
  ).length;
  const allCount = (state.friends || []).length;
  const incomingCount = (state.incomingRequests || []).length;
  const outgoingCount = (state.outgoingRequests || []).length;
  state.counts = {
    online: onlineCount,
    all: allCount,
    pending: incomingCount + outgoingCount,
    incoming: incomingCount,
    outgoing: outgoingCount,
  };
  state.requests = [
    ...(state.incomingRequests || []),
    ...(state.outgoingRequests || []),
  ];
};

export const fetchConnections = createAsyncThunk(
  'friends/fetchConnections',
  async (_, { rejectWithValue }) => {
    try {
      const data = await friendService.getConnectionOverview();
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch connections'
      );
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'friends/sendFriendRequest',
  async (target, { rejectWithValue }) => {
    try {
      let payload = {};
      if (typeof target === 'string') {
        const clean = target.trim();
        payload = clean.startsWith('@') || !clean.match(/^[0-9a-fA-F]{24}$/)
          ? { username: clean.replace(/^@/, '') }
          : { recipientId: clean };
      } else if (target && typeof target === 'object') {
        const id = target._id || target.id || target.userId;
        const idStr = id ? String(id).trim() : '';
        if (idStr && idStr.match(/^[0-9a-fA-F]{24}$/)) {
          payload = { recipientId: idStr };
        } else if (target.username) {
          payload = { username: String(target.username).trim().replace(/^@/, '') };
        }
      }
      const data = await friendService.sendConnectionRequest(payload);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to send connection request'
      );
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptFriendRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await friendService.acceptConnectionRequest(requestId);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to accept connection request'
      );
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'friends/rejectFriendRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await friendService.declineConnectionRequest(requestId);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to decline connection request'
      );
    }
  }
);

export const cancelFriendRequest = createAsyncThunk(
  'friends/cancelFriendRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const data = await friendService.cancelConnectionRequest(requestId);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to cancel connection request'
      );
    }
  }
);

export const removeFriend = createAsyncThunk(
  'friends/removeFriend',
  async (friendId, { rejectWithValue }) => {
    try {
      const data = await friendService.removeConnection(friendId);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to remove connection'
      );
    }
  }
);

export const searchUsersForConnections = createAsyncThunk(
  'friends/searchUsersForConnections',
  async (query, { rejectWithValue }) => {
    try {
      const data = await friendService.searchConnections(query);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to search users'
      );
    }
  }
);

const initialState = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  requests: [],
  suggestions: [],
  counts: {
    online: 0,
    all: 0,
    pending: 0,
    incoming: 0,
    outgoing: 0,
  },
  activeTab: 'online', // 'online' | 'all' | 'pending' | 'add'
  loading: false,
  error: null,
  actionLoading: {},
  searchResults: [],
  searchLoading: false,
};

export const friendSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchLoading = false;
    },
    // Realtime Socket Handlers
    onConnectionRequestReceived: (state, action) => {
      const req = action.payload;
      if (!req || (!req.id && !req.requestId)) return;
      const reqId = String(req.id || req.requestId);
      const exists = (state.incomingRequests || []).some(
        (r) => String(r.id || r.requestId) === reqId
      );
      if (!exists) {
        state.incomingRequests.unshift(req);
        // remove from suggestions if present
        const senderUserId = String(req.userId || req.sender?._id || '');
        if (senderUserId) {
          state.suggestions = (state.suggestions || []).filter(
            (s) => String(s.id || s.userId) !== senderUserId
          );
        }
        recalcCounts(state);
      }
    },
    onConnectionRequestAccepted: (state, action) => {
      const { requestId, friend } = action.payload || {};
      if (requestId) {
        const rId = String(requestId);
        state.outgoingRequests = (state.outgoingRequests || []).filter(
          (r) => String(r.id || r.requestId) !== rId
        );
      }
      if (friend) {
        const friendId = String(friend.id || friend.userId || friend._id || '');
        const exists = (state.friends || []).some(
          (f) => String(f.id || f.userId || f._id) === friendId
        );
        if (!exists) {
          state.friends.unshift(friend);
        }
        state.suggestions = (state.suggestions || []).filter(
          (s) => String(s.id || s.userId) !== friendId
        );
      }
      recalcCounts(state);
    },
    onConnectionRequestDeclined: (state, action) => {
      const { requestId } = action.payload || {};
      if (requestId) {
        const rId = String(requestId);
        state.outgoingRequests = (state.outgoingRequests || []).filter(
          (r) => String(r.id || r.requestId) !== rId
        );
        recalcCounts(state);
      }
    },
    onConnectionRequestCancelled: (state, action) => {
      const { requestId } = action.payload || {};
      if (requestId) {
        const rId = String(requestId);
        state.incomingRequests = (state.incomingRequests || []).filter(
          (r) => String(r.id || r.requestId) !== rId
        );
        recalcCounts(state);
      }
    },
    onConnectionRemoved: (state, action) => {
      const { userId } = action.payload || {};
      if (userId) {
        const uid = String(userId);
        state.friends = (state.friends || []).filter(
          (f) => String(f.id || f.userId || f._id) !== uid
        );
        recalcCounts(state);
      }
    },
    onUserPresenceChange: (state, action) => {
      const { userId, status } = action.payload || {};
      if (!userId) return;
      const uid = String(userId);

      const updateItemStatus = (item) => {
        if (item && (String(item.id || item.userId) === uid)) {
          item.status = status;
        }
      };

      (state.friends || []).forEach(updateItemStatus);
      (state.suggestions || []).forEach(updateItemStatus);
      (state.incomingRequests || []).forEach(updateItemStatus);
      (state.outgoingRequests || []).forEach(updateItemStatus);
      (state.requests || []).forEach(updateItemStatus);
      recalcCounts(state);
    },
  },
  extraReducers: (builder) => {
    // fetchConnections
    builder
      .addCase(fetchConnections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        state.friends = payload.connections || [];
        state.incomingRequests = payload.incomingRequests || [];
        state.outgoingRequests = payload.outgoingRequests || [];
        state.requests = payload.requests || [
          ...(payload.incomingRequests || []),
          ...(payload.outgoingRequests || []),
        ];
        state.suggestions = payload.suggestions || [];
        state.counts = payload.counts || {
          online: 0,
          all: 0,
          pending: 0,
          incoming: 0,
          outgoing: 0,
        };
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // sendFriendRequest
    builder
      .addCase(sendFriendRequest.pending, (state, action) => {
        const key = action.meta.arg?._id || action.meta.arg?.id || 'send';
        state.actionLoading[key] = true;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        const key = action.meta.arg?._id || action.meta.arg?.id || 'send';
        delete state.actionLoading[key];

        const payload = action.payload || {};
        if (payload.autoAccepted && payload.friend) {
          const fid = payload.friend.id || payload.friend.userId;
          if (!state.friends.some((f) => f.id === fid || f.userId === fid)) {
            state.friends.push(payload.friend);
          }
          state.incomingRequests = state.incomingRequests.filter(
            (r) => r.userId !== fid
          );
        } else if (payload.request) {
          const reqId = payload.request.id;
          if (!state.outgoingRequests.some((r) => r.id === reqId)) {
            state.outgoingRequests.unshift(payload.request);
          }
        }

        // Also update relationship state in searchResults if applicable
        const targetId = action.meta.arg?._id || action.meta.arg?.id || action.meta.arg?.userId;
        if (targetId) {
          state.searchResults = state.searchResults.map((sr) =>
            sr.id === targetId || sr.userId === targetId
              ? {
                  ...sr,
                  relationship: payload.autoAccepted ? 'connected' : 'pending_outgoing',
                  requestId: payload.request?.id,
                }
              : sr
          );
        }

        // Remove from suggestions
        if (targetId) {
          state.suggestions = state.suggestions.filter(
            (s) => s.id !== targetId && s.userId !== targetId
          );
        }

        recalcCounts(state);
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        const key = action.meta.arg?._id || action.meta.arg?.id || 'send';
        delete state.actionLoading[key];
      });

    // acceptFriendRequest
    builder
      .addCase(acceptFriendRequest.pending, (state, action) => {
        state.actionLoading[action.meta.arg] = true;
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const requestId = String(action.payload?.requestId || action.meta.arg);
        delete state.actionLoading[action.meta.arg];

        state.incomingRequests = state.incomingRequests.filter(
          (r) => String(r.id || r.requestId) !== requestId
        );

        if (action.payload?.friend) {
          const fid = String(action.payload.friend.id || action.payload.friend.userId || action.payload.friend._id);
          if (!state.friends.some((f) => String(f.id || f.userId || f._id) === fid)) {
            state.friends.unshift(action.payload.friend);
          }
          state.suggestions = state.suggestions.filter(
            (s) => String(s.id || s.userId || s._id) !== fid
          );
        }

        recalcCounts(state);
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg];
      });

    // rejectFriendRequest
    builder
      .addCase(rejectFriendRequest.pending, (state, action) => {
        state.actionLoading[action.meta.arg] = true;
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        const requestId = String(action.payload?.requestId || action.meta.arg);
        delete state.actionLoading[action.meta.arg];

        state.incomingRequests = state.incomingRequests.filter(
          (r) => String(r.id || r.requestId) !== requestId
        );
        recalcCounts(state);
      })
      .addCase(rejectFriendRequest.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg];
      });

    // cancelFriendRequest
    builder
      .addCase(cancelFriendRequest.pending, (state, action) => {
        state.actionLoading[action.meta.arg] = true;
      })
      .addCase(cancelFriendRequest.fulfilled, (state, action) => {
        const requestId = String(action.payload?.requestId || action.meta.arg);
        delete state.actionLoading[action.meta.arg];

        state.outgoingRequests = state.outgoingRequests.filter(
          (r) => String(r.id || r.requestId) !== requestId
        );
        recalcCounts(state);
      })
      .addCase(cancelFriendRequest.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg];
      });

    // removeFriend
    builder
      .addCase(removeFriend.pending, (state, action) => {
        state.actionLoading[action.meta.arg] = true;
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        const friendId = String(action.payload?.friendId || action.meta.arg);
        delete state.actionLoading[action.meta.arg];

        state.friends = state.friends.filter(
          (f) => String(f.id || f.userId || f._id) !== friendId
        );
        recalcCounts(state);
      })
      .addCase(removeFriend.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg];
      });

    // searchUsersForConnections
    builder
      .addCase(searchUsersForConnections.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchUsersForConnections.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload || [];
      })
      .addCase(searchUsersForConnections.rejected, (state) => {
        state.searchLoading = false;
        state.searchResults = [];
      });
  },
});

export const {
  setActiveTab,
  clearSearchResults,
  onConnectionRequestReceived,
  onConnectionRequestAccepted,
  onConnectionRequestDeclined,
  onConnectionRequestCancelled,
  onConnectionRemoved,
  onUserPresenceChange,
} = friendSlice.actions;

export default friendSlice.reducer;
