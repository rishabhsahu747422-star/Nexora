import { createSlice } from '@reduxjs/toolkit';
import { MOCK_SERVERS } from '../../data/mockServers';

const STORAGE_KEY = 'nexora_servers_state';

const loadPersistedServers = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (err) {
    console.error('Failed to load servers from localStorage:', err);
  }
  return {
    servers: MOCK_SERVERS,
    activeServerId: 'srv_synthetix',
  };
};

const initialState = loadPersistedServers();

export const serverSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    selectServer: (state, action) => {
      state.activeServerId = action.payload;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    createServer: (state, action) => {
      const newServer = {
        id: 'srv_' + Date.now(),
        name: action.payload.name,
        tag: (action.payload.tag || action.payload.name.substring(0, 4)).toUpperCase(),
        description: action.payload.description || '',
        icon: action.payload.icon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        banner: action.payload.banner || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
        category: action.payload.category || 'Community',
        ownerId: 'usr_me',
        memberCount: 1,
        onlineCount: 1,
        defaultChannelId: 'chn_' + Date.now(),
        inviteCode: 'nx-' + Math.random().toString(36).substring(2, 8),
        roles: [
          { id: 'role_founder', name: 'Server Creator', color: '#00F0FF' },
          { id: 'role_member', name: 'Member', color: '#94A3B8' },
        ],
        members: ['usr_me'],
      };
      state.servers.push(newServer);
      state.activeServerId = newServer.id;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
      return state;
    },
    updateServer: (state, action) => {
      const { id, data } = action.payload;
      const index = state.servers.findIndex((s) => s.id === id);
      if (index !== -1) {
        state.servers[index] = { ...state.servers[index], ...data };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error(e);
        }
      }
    },
    deleteServer: (state, action) => {
      const id = action.payload;
      state.servers = state.servers.filter((s) => s.id !== id);
      if (state.activeServerId === id) {
        state.activeServerId = state.servers[0]?.id || null;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    leaveServer: (state, action) => {
      const id = action.payload;
      const server = state.servers.find((s) => s.id === id);
      if (server) {
        server.members = server.members.filter((m) => m !== 'usr_me');
        server.memberCount = Math.max(0, server.memberCount - 1);
      }
      state.servers = state.servers.filter((s) => s.id !== id);
      if (state.activeServerId === id) {
        state.activeServerId = state.servers[0]?.id || null;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    regenerateInvite: (state, action) => {
      const id = action.payload;
      const server = state.servers.find((s) => s.id === id);
      if (server) {
        server.inviteCode = 'nx-' + Math.random().toString(36).substring(2, 9);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error(e);
        }
      }
    },
  },
});

export const {
  selectServer,
  createServer,
  updateServer,
  deleteServer,
  leaveServer,
  regenerateInvite,
} = serverSlice.actions;

export default serverSlice.reducer;
