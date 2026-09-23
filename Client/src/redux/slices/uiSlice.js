import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'nexora_ui_preferences';

const loadPreferences = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (e) {
    console.error(e);
  }
  return {
    theme: 'dark', // 'dark' | 'light' | 'system'
    messageDensity: 'comfortable', // 'comfortable' | 'compact'
  };
};

const initialPrefs = loadPreferences();

const initialState = {
  theme: initialPrefs.theme,
  messageDensity: initialPrefs.messageDensity,
  isMobileDrawerOpen: false,
  isMobileMembersOpen: false,
  isGlobalSearchOpen: false,
  activeModal: null, // { type: 'CREATE_SERVER' | 'CREATE_CHANNEL' | 'INVITE' | 'SERVER_SETTINGS' | 'USER_SETTINGS' | 'PROFILE' | 'DELETE_CONFIRM' | 'IMAGE_PREVIEW', props: {} }
  toasts: [], // [{ id, type: 'success'|'error'|'info'|'warning', message, duration }]
};

const savePrefs = (state) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: state.theme,
        messageDensity: state.messageDensity,
      })
    );
  } catch (e) {
    console.error(e);
  }
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      savePrefs(state);
    },
    setMessageDensity: (state, action) => {
      state.messageDensity = action.payload;
      savePrefs(state);
    },
    toggleMobileDrawer: (state) => {
      state.isMobileDrawerOpen = !state.isMobileDrawerOpen;
    },
    setMobileDrawerOpen: (state, action) => {
      state.isMobileDrawerOpen = action.payload;
    },
    toggleMobileMembers: (state) => {
      state.isMobileMembersOpen = !state.isMobileMembersOpen;
    },
    setMobileMembersOpen: (state, action) => {
      state.isMobileMembersOpen = action.payload;
    },
    openGlobalSearch: (state) => {
      state.isGlobalSearchOpen = true;
    },
    closeGlobalSearch: (state) => {
      state.isGlobalSearchOpen = false;
    },
    openModal: (state, action) => {
      state.activeModal = {
        type: action.payload.type,
        props: action.payload.props || {},
      };
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    addToast: (state, action) => {
      const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 4);
      state.toasts.push({
        id,
        type: action.payload.type || 'info',
        message: action.payload.message,
        duration: action.payload.duration || 3500,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setTheme,
  setMessageDensity,
  toggleMobileDrawer,
  setMobileDrawerOpen,
  toggleMobileMembers,
  setMobileMembersOpen,
  openGlobalSearch,
  closeGlobalSearch,
  openModal,
  closeModal,
  addToast,
  removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
