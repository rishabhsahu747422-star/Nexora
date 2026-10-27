import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isConnected: false,
  isConnecting: false,
  serverId: null,
  channelId: null,
  channelName: null,
  isMuted: false,
  isDeafened: false,
  isVideo: false,
  isScreenSharing: false,
  isSpeaking: false,
  participants: [], // array of { socketId, userId, user: { _id, username, fullname, profile_pic }, muted, deafened, video, isSpeaking }
  error: null,
  incomingCall: null, // { callId, caller, conversationId, isVideo, callerSocketId }
  activeDirectCall: null, // { callId, conversationId, peer, isVideo, isCaller, status: 'ringing' | 'connected' }
};

export const voiceSlice = createSlice({
  name: "voice",
  initialState,
  reducers: {
    startConnecting: (state, action) => {
      const { serverId, channelId, channelName } = action.payload || {};
      state.isConnecting = true;
      state.error = null;
      state.serverId = serverId || state.serverId;
      state.channelId = channelId || state.channelId;
      state.channelName = channelName || state.channelName;
    },

    connectedVoiceChannel: (state, action) => {
      const { serverId, channelId, channelName, participants = [] } = action.payload;
      state.isConnected = true;
      state.isConnecting = false;
      state.serverId = serverId || state.serverId;
      state.channelId = channelId || state.channelId;
      state.channelName = channelName || state.channelName;
      state.participants = participants;
      state.error = null;
    },

    addVoiceParticipant: (state, action) => {
      const participant = action.payload;
      if (!participant) return;

      const exists = state.participants.some(
        (p) => p.socketId === participant.socketId || p.userId === participant.userId
      );
      if (!exists) {
        state.participants.push(participant);
      }
    },

    removeVoiceParticipant: (state, action) => {
      const { socketId, userId } = action.payload || {};
      state.participants = state.participants.filter(
        (p) => p.socketId !== socketId && p.userId !== userId
      );
    },

    updateVoiceParticipant: (state, action) => {
      const { socketId, muted, deafened, video, isSpeaking } = action.payload;
      const participant = state.participants.find((p) => p.socketId === socketId);
      if (participant) {
        if (muted !== undefined) participant.muted = muted;
        if (deafened !== undefined) participant.deafened = deafened;
        if (video !== undefined) participant.video = video;
        if (isSpeaking !== undefined) participant.isSpeaking = isSpeaking;
      }
    },

    setParticipantSpeaking: (state, action) => {
      const { socketId, isSpeaking } = action.payload;
      const participant = state.participants.find((p) => p.socketId === socketId);
      if (participant) {
        participant.isSpeaking = isSpeaking;
      }
    },

    leaveVoiceChannel: (state) => {
      state.isConnected = false;
      state.isConnecting = false;
      state.serverId = null;
      state.channelId = null;
      state.channelName = null;
      state.isMuted = false;
      state.isDeafened = false;
      state.isVideo = false;
      state.isScreenSharing = false;
      state.isSpeaking = false;
      state.participants = [];
      state.error = null;
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

    toggleVideo: (state) => {
      state.isVideo = !state.isVideo;
    },

    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },

    setUserSpeaking: (state, action) => {
      state.isSpeaking = action.payload;
    },

    setVoiceError: (state, action) => {
      state.error = action.payload;
      state.isConnecting = false;
    },

    setIncomingCall: (state, action) => {
      state.incomingCall = action.payload;
    },

    clearIncomingCall: (state) => {
      state.incomingCall = null;
    },

    startDirectCall: (state, action) => {
      state.activeDirectCall = action.payload;
      state.incomingCall = null;
    },

    setDirectCallConnected: (state, action) => {
      if (state.activeDirectCall) {
        state.activeDirectCall.status = "connected";
        if (action.payload?.peer) {
          state.activeDirectCall.peer = action.payload.peer;
        }
      }
    },

    endDirectCall: (state) => {
      state.activeDirectCall = null;
      state.incomingCall = null;
    },
  },
});

export const {
  startConnecting,
  connectedVoiceChannel,
  addVoiceParticipant,
  removeVoiceParticipant,
  updateVoiceParticipant,
  setParticipantSpeaking,
  leaveVoiceChannel,
  toggleMute,
  toggleDeafen,
  toggleVideo,
  toggleScreenShare,
  setUserSpeaking,
  setVoiceError,
  setIncomingCall,
  clearIncomingCall,
  startDirectCall,
  setDirectCallConnected,
  endDirectCall,
} = voiceSlice.actions;

// Compatibility alias for existing components
export const joinVoiceChannel = (payload) => (dispatch) => {
  dispatch(startConnecting(payload));
};

export default voiceSlice.reducer;
