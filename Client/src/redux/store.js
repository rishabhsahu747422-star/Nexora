import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import serverReducer from './slices/serverSlice';
import channelReducer from './slices/channelSlice';
import messageReducer from './slices/messageSlice';
import dmReducer from './slices/dmSlice';
import friendReducer from './slices/friendSlice';
import notificationReducer from './slices/notificationSlice';
import voiceReducer from './slices/voiceSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    servers: serverReducer,
    channels: channelReducer,
    messages: messageReducer,
    dms: dmReducer,
    friends: friendReducer,
    notifications: notificationReducer,
    voice: voiceReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allows flexible mock objects if needed
    }),
});

export default store;
