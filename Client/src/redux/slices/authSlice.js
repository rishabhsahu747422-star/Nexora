import { createSlice } from '@reduxjs/toolkit';
import { CURRENT_USER } from '../../data/mockUsers';

const STORAGE_KEY = 'nexora_auth_state';

const loadPersistedAuth = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (err) {
    console.error('Failed to load auth from localStorage:', err);
  }
  return {
    currentUser: CURRENT_USER,
    isAuthenticated: true, // Default to true for smooth exploration, can logout
    token: 'mock_jwt_token_nexora_7849',
    loading: false,
    error: null,
  };
};

const initialState = loadPersistedAuth();

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.currentUser = action.payload.user;
      state.token = action.payload.token || 'mock_jwt_token_nexora_7849';
      state.error = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    registerSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.currentUser = action.payload.user;
      state.token = 'mock_jwt_token_nexora_' + Date.now();
      state.error = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.token = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
    },
    updateProfile: (state, action) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error(e);
        }
      }
    },
    setUserStatus: (state, action) => {
      if (state.currentUser) {
        state.currentUser.status = action.payload;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error(e);
        }
      }
    },
    setCustomStatus: (state, action) => {
      if (state.currentUser) {
        state.currentUser.customStatus = action.payload;
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
  loginStart,
  loginSuccess,
  loginFailure,
  registerSuccess,
  logout,
  updateProfile,
  setUserStatus,
  setCustomStatus,
} = authSlice.actions;

export default authSlice.reducer;
