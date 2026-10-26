import { createSlice } from '@reduxjs/toolkit';
import {
  DEFAULT_APPEARANCE,
  isValidHex,
  normalizeHex,
  applyTheme,
} from '../../utils/theme';

const STORAGE_KEY = 'nexora_ui_preferences';

const loadPreferences = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized);
      return {
        theme: parsed.theme || DEFAULT_APPEARANCE.theme,
        accentColor: isValidHex(parsed.accentColor)
          ? normalizeHex(parsed.accentColor)
          : DEFAULT_APPEARANCE.accentColor,
        accentName: parsed.accentName || DEFAULT_APPEARANCE.accentName,
        surfaceStyle: parsed.surfaceStyle || DEFAULT_APPEARANCE.surfaceStyle,
        messageSpacing:
          parsed.messageSpacing ||
          parsed.messageDensity ||
          DEFAULT_APPEARANCE.messageSpacing,
      };
    }
  } catch (e) {
    console.error('Failed to load UI preferences from localStorage:', e);
  }
  return { ...DEFAULT_APPEARANCE };
};

const initialPrefs = loadPreferences();

// Apply initial theme synchronously as early as possible to prevent flashing
if (typeof window !== 'undefined') {
  applyTheme(initialPrefs);
}

const initialState = {
  theme: initialPrefs.theme, // 'dark' | 'light' | 'system'
  accentColor: initialPrefs.accentColor, // HEX
  accentName: initialPrefs.accentName,
  surfaceStyle: initialPrefs.surfaceStyle, // 'midnight' | 'graphite' | 'oled'
  messageSpacing: initialPrefs.messageSpacing, // 'compact' | 'comfortable'
  messageDensity: initialPrefs.messageSpacing, // Backwards-compatible alias
  isMobileDrawerOpen: false,
  isMobileMembersOpen: false,
  isGlobalSearchOpen: false,
  activeModal: null, // { type, props }
  toasts: [],
};

const savePrefs = (state) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: state.theme,
        accentColor: state.accentColor,
        accentName: state.accentName,
        surfaceStyle: state.surfaceStyle,
        messageSpacing: state.messageSpacing,
      })
    );
  } catch (e) {
    console.error('Failed to save UI preferences to localStorage:', e);
  }
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      applyTheme({
        theme: state.theme,
        accentColor: state.accentColor,
        surfaceStyle: state.surfaceStyle,
        messageSpacing: state.messageSpacing,
      });
      savePrefs(state);
    },
    setAccentColor: (state, action) => {
      const { hex, name } =
        typeof action.payload === 'string'
          ? { hex: action.payload, name: 'Custom' }
          : action.payload;

      if (isValidHex(hex)) {
        state.accentColor = normalizeHex(hex);
        state.accentName = name || 'Custom';
        applyTheme({
          theme: state.theme,
          accentColor: state.accentColor,
          surfaceStyle: state.surfaceStyle,
          messageSpacing: state.messageSpacing,
        });
        savePrefs(state);
      }
    },
    setSurfaceStyle: (state, action) => {
      state.surfaceStyle = action.payload;
      applyTheme({
        theme: state.theme,
        accentColor: state.accentColor,
        surfaceStyle: state.surfaceStyle,
        messageSpacing: state.messageSpacing,
      });
      savePrefs(state);
    },
    setMessageSpacing: (state, action) => {
      state.messageSpacing = action.payload;
      state.messageDensity = action.payload;
      applyTheme({
        theme: state.theme,
        accentColor: state.accentColor,
        surfaceStyle: state.surfaceStyle,
        messageSpacing: state.messageSpacing,
      });
      savePrefs(state);
    },
    setMessageDensity: (state, action) => {
      // Alias for backwards compatibility
      state.messageSpacing = action.payload;
      state.messageDensity = action.payload;
      applyTheme({
        theme: state.theme,
        accentColor: state.accentColor,
        surfaceStyle: state.surfaceStyle,
        messageSpacing: state.messageSpacing,
      });
      savePrefs(state);
    },
    resetAppearanceDefaults: (state) => {
      state.theme = DEFAULT_APPEARANCE.theme;
      state.accentColor = DEFAULT_APPEARANCE.accentColor;
      state.accentName = DEFAULT_APPEARANCE.accentName;
      state.surfaceStyle = DEFAULT_APPEARANCE.surfaceStyle;
      state.messageSpacing = DEFAULT_APPEARANCE.messageSpacing;
      state.messageDensity = DEFAULT_APPEARANCE.messageSpacing;
      applyTheme(DEFAULT_APPEARANCE);
      savePrefs(state);
    },
    syncAppearanceFromUser: (state, action) => {
      if (!action.payload) return;
      const app = action.payload;
      if (app.theme) state.theme = app.theme;
      if (isValidHex(app.accentColor)) {
        state.accentColor = normalizeHex(app.accentColor);
        state.accentName = app.accentName || 'Custom';
      }
      if (app.surfaceStyle) state.surfaceStyle = app.surfaceStyle;
      if (app.messageSpacing) {
        state.messageSpacing = app.messageSpacing;
        state.messageDensity = app.messageSpacing;
      }
      applyTheme({
        theme: state.theme,
        accentColor: state.accentColor,
        surfaceStyle: state.surfaceStyle,
        messageSpacing: state.messageSpacing,
      });
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
  setAccentColor,
  setSurfaceStyle,
  setMessageSpacing,
  setMessageDensity,
  resetAppearanceDefaults,
  syncAppearanceFromUser,
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
