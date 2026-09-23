import { createSlice } from '@reduxjs/toolkit';
import { MOCK_FRIENDS, MOCK_FRIEND_REQUESTS } from '../../data/mockFriends';

const STORAGE_KEY = 'nexora_friends_state';

const loadPersistedFriends = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (err) {
    console.error('Failed to load friends from localStorage:', err);
  }
  return {
    friends: MOCK_FRIENDS,
    requests: MOCK_FRIEND_REQUESTS,
    activeTab: 'online', // 'online' | 'all' | 'pending' | 'add'
  };
};

const initialState = loadPersistedFriends();

export const friendSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    sendFriendRequest: (state, action) => {
      const user = action.payload; // { id, name, username, avatar }
      const newReq = {
        id: 'req_' + Date.now(),
        userId: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        type: 'outgoing',
        mutualServersCount: 1,
        time: 'Just now',
      };
      state.requests.unshift(newReq);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    acceptFriendRequest: (state, action) => {
      const requestId = action.payload;
      const req = state.requests.find((r) => r.id === requestId);
      if (req) {
        state.friends.push({
          id: 'fr_' + req.userId,
          userId: req.userId,
          name: req.name,
          username: req.username,
          avatar: req.avatar,
          status: 'online',
          customStatus: 'Connected via Nexora',
          mutualServersCount: req.mutualServersCount || 1,
        });
        state.requests = state.requests.filter((r) => r.id !== requestId);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error(e);
        }
      }
    },
    rejectFriendRequest: (state, action) => {
      const requestId = action.payload;
      state.requests = state.requests.filter((r) => r.id !== requestId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    removeFriend: (state, action) => {
      const friendId = action.payload;
      state.friends = state.friends.filter((f) => f.id !== friendId && f.userId !== friendId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
  },
});

export const {
  setActiveTab,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} = friendSlice.actions;

export default friendSlice.reducer;
