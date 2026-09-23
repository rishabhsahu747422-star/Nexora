import { createSlice } from '@reduxjs/toolkit';
import { MOCK_DMS } from '../../data/mockDms';

const STORAGE_KEY = 'nexora_dms_state';

const loadPersistedDms = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (err) {
    console.error('Failed to load DMs from localStorage:', err);
  }
  return {
    conversations: MOCK_DMS,
    activeDmId: 'dm_elena',
  };
};

const initialState = loadPersistedDms();

export const dmSlice = createSlice({
  name: 'dms',
  initialState,
  reducers: {
    selectDm: (state, action) => {
      state.activeDmId = action.payload;
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) {
        conv.unreadCount = 0;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    openOrCreateDm: (state, action) => {
      const user = action.payload;
      let existing = state.conversations.find((c) => c.recipientId === user.id);
      if (!existing) {
        existing = {
          id: 'dm_' + user.username.replace(/[^a-zA-Z0-9]/g, '_'),
          recipientId: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          status: user.status || 'online',
          lastMessage: 'Conversation started',
          timestamp: 'Just now',
          unreadCount: 0,
        };
        state.conversations.unshift(existing);
      }
      state.activeDmId = existing.id;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    updateLastDmMessage: (state, action) => {
      const { dmId, lastMessage } = action.payload;
      const conv = state.conversations.find((c) => c.id === dmId);
      if (conv) {
        conv.lastMessage = lastMessage;
        conv.timestamp = 'Just now';
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error(e);
        }
      }
    },
  },
});

export const { selectDm, openOrCreateDm, updateLastDmMessage } = dmSlice.actions;

export default dmSlice.reducer;
