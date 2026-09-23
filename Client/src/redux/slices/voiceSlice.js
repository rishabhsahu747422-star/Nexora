import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  serverId: null,
  channelId: null,
  channelName: null,
  isMuted: false,
  isDeafened: false,
  isScreenSharing: false,
  isSpeaking: false,
  activeParticipants: [],
};

export const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    joinVoiceChannel: (state, action) => {
      const { serverId, channelId, channelName, existingParticipants = [] } = action.payload;
      state.isConnected = true;
      state.serverId = serverId;
      state.channelId = channelId;
      state.channelName = channelName;
      state.isMuted = false;
      state.isDeafened = false;
      state.isScreenSharing = false;
      state.isSpeaking = false;

      // Always include current user plus any existing mock participants
      state.activeParticipants = [
        'usr_me',
        ...existingParticipants.filter((id) => id !== 'usr_me'),
      ];
    },
    leaveVoiceChannel: (state) => {
      state.isConnected = false;
      state.serverId = null;
      state.channelId = null;
      state.channelName = null;
      state.isMuted = false;
      state.isDeafened = false;
      state.isScreenSharing = false;
      state.isSpeaking = false;
      state.activeParticipants = [];
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
      if (state.isMuted) {
        state.isSpeaking = false;
      }
    },
    toggleDeafen: (state) => {
      state.isDeafened = !state.isDeafened;
      if (state.isDeafened) {
        state.isMuted = true;
        state.isSpeaking = false;
      }
    },
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },
    setUserSpeaking: (state, action) => {
      state.isSpeaking = action.payload;
    },
  },
});

export const {
  joinVoiceChannel,
  leaveVoiceChannel,
  toggleMute,
  toggleDeafen,
  toggleScreenShare,
  setUserSpeaking,
} = voiceSlice.actions;

export default voiceSlice.reducer;
