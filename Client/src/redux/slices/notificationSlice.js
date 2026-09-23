import { createSlice } from '@reduxjs/toolkit';
import { MOCK_NOTIFICATIONS } from '../../data/mockNotifications';

const STORAGE_KEY = 'nexora_notifications_state';

const loadPersistedNotifications = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (err) {
    console.error('Failed to load notifications from localStorage:', err);
  }
  return {
    notifications: MOCK_NOTIFICATIONS,
  };
};

const initialState = loadPersistedNotifications();

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markAsRead: (state, action) => {
      const id = action.payload;
      const notif = state.notifications.find((n) => n.id === id);
      if (notif) {
        notif.read = true;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error(e);
        }
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    deleteNotification: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.filter((n) => n.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    addNotification: (state, action) => {
      state.notifications.unshift({
        id: 'notif_' + Date.now(),
        read: false,
        timestamp: 'Just now',
        ...action.payload,
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
  },
});

export const { markAsRead, markAllAsRead, deleteNotification, addNotification } =
  notificationSlice.actions;

export default notificationSlice.reducer;
