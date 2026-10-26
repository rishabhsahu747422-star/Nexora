/**
 * Nexora Appearance & Custom Accent Theme Architecture
 * Provides centralized theme definitions, color calculations, and DOM application.
 */

export const ACCENT_PRESETS = [
  { id: "crimson", name: "Crimson", hex: "#E10600", isDefault: true },
  { id: "lavender", name: "Lavender", hex: "#B69CFF" },
  { id: "electric-blue", name: "Electric Blue", hex: "#4D8DFF" },
  { id: "saffron", name: "Saffron", hex: "#FFC247" },
  { id: "mint-emerald", name: "Mint Emerald", hex: "#35D6A2" },
  { id: "neon-rose", name: "Neon Rose", hex: "#FF75B5" },
  { id: "arctic-cyan", name: "Arctic Cyan", hex: "#40D9E8" },
  { id: "ember-orange", name: "Ember Orange", hex: "#FF8A4C" },
];

export const SURFACE_STYLES = {
  midnight: {
    id: "midnight",
    name: "Midnight",
    desc: "Default deep charcoal-black",
    colors: {
      appBg: "#090909",
      workspaceBg: "#0B0B0D",
      surfacePrimary: "#111113",
      surfaceSecondary: "#161619",
      surfaceElevated: "#1C1C20",
      surfaceHover: "#252529",
      textPrimary: "#F5F5F5",
      textSecondary: "#A1A1AA",
      borderSubtle: "#2D2D32",
    },
  },
  graphite: {
    id: "graphite",
    name: "Graphite",
    desc: "Slightly lighter charcoal surfaces",
    colors: {
      appBg: "#121215",
      workspaceBg: "#151518",
      surfacePrimary: "#1B1C22",
      surfaceSecondary: "#24252C",
      surfaceElevated: "#2D2F38",
      surfaceHover: "#383B46",
      textPrimary: "#F5F5F5",
      textSecondary: "#A6ABB8",
      borderSubtle: "#3B3D47",
    },
  },
  oled: {
    id: "oled",
    name: "OLED",
    desc: "Pure-black primary background",
    colors: {
      appBg: "#000000",
      workspaceBg: "#000000",
      surfacePrimary: "#0C0C0C",
      surfaceSecondary: "#141414",
      surfaceElevated: "#1F1F1F",
      surfaceHover: "#2A2A2A",
      textPrimary: "#F5F5F5",
      textSecondary: "#9CA3AF",
      borderSubtle: "#2A2A2A",
    },
  },
};

export const LIGHT_SURFACE = {
  appBg: "#F6F7FB",
  workspaceBg: "#FFFFFF",
  surfacePrimary: "#FFFFFF",
  surfaceSecondary: "#F0F2F6",
  surfaceElevated: "#E5E7EB",
  surfaceHover: "#EAECEF",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  borderSubtle: "#E5E7EB",
};

export const DEFAULT_APPEARANCE = {
  theme: "dark", // "dark" | "light" | "system"
  accentColor: "#E10600",
  accentName: "Crimson",
  surfaceStyle: "midnight", // "midnight" | "graphite" | "oled"
  messageSpacing: "compact", // "compact" | "comfortable"
};

/**
 * Validates a HEX color string (with or without #, 3 or 6 chars)
 */
export const isValidHex = (hex) => {
  if (typeof hex !== "string") return false;
  const clean = hex.startsWith("#") ? hex : `#${hex}`;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(clean);
};

/**
 * Normalizes HEX string to 6-digit format with leading #
 */
export const normalizeHex = (hex) => {
  if (!isValidHex(hex)) return DEFAULT_APPEARANCE.accentColor;
  let clean = hex.startsWith("#") ? hex.slice(1) : hex;
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${clean.toUpperCase()}`;
};

/**
 * Converts HEX to RGB components
 */
export const hexToRgb = (hex) => {
  const norm = normalizeHex(hex).slice(1);
  const num = parseInt(norm, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

/**
 * Computes relative luminance of an RGB color
 */
export const getLuminance = (r, g, b) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

/**
 * Calculates readable contrast text color for the given accent
 */
export const getContrastColor = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const lum = getLuminance(r, g, b);
  // If luminance is high (e.g. Saffron or Mint Emerald), use dark text; otherwise white
  return lum > 0.45 ? "#0B0B0D" : "#FFFFFF";
};

/**
 * Darkens or lightens a hex color for hover states
 */
export const adjustBrightness = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const clamp = (val) => Math.min(255, Math.max(0, Math.round(val)));
  const newR = clamp(r * factor);
  const newG = clamp(g * factor);
  const newB = clamp(b * factor);
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1).toUpperCase()}`;
};

/**
 * Generates all derived accent CSS variables
 */
export const generateAccentVariables = (hex) => {
  const norm = normalizeHex(hex);
  const { r, g, b } = hexToRgb(norm);
  const contrast = getContrastColor(norm);
  const lum = getLuminance(r, g, b);
  const hoverHex = lum > 0.5 ? adjustBrightness(norm, -12) : adjustBrightness(norm, 15);

  return {
    "--accent": norm,
    "--accent-hover": hoverHex,
    "--accent-soft": `rgba(${r}, ${g}, ${b}, 0.15)`,
    "--accent-soft-hover": `rgba(${r}, ${g}, ${b}, 0.25)`,
    "--accent-border": `rgba(${r}, ${g}, ${b}, 0.35)`,
    "--accent-contrast": contrast,
    "--accent-glow": `rgba(${r}, ${g}, ${b}, 0.35)`,
    "--accent-rgb": `${r}, ${g}, ${b}`,
  };
};

/**
 * Resolves current theme mode ('dark' | 'light' | 'system')
 */
export const resolveThemeMode = (mode) => {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  // 'system'
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "dark";
};

/**
 * Applies the complete appearance theme to the document root
 */
export const applyTheme = (appearance = {}) => {
  if (typeof document === "undefined") return;

  const prefs = {
    ...DEFAULT_APPEARANCE,
    ...appearance,
  };

  const root = document.documentElement;
  const resolvedMode = resolveThemeMode(prefs.theme);
  const surfaceKey = prefs.surfaceStyle in SURFACE_STYLES ? prefs.surfaceStyle : "midnight";
  const spacingKey = prefs.messageSpacing === "comfortable" ? "comfortable" : "compact";

  // Data attributes for CSS selectors
  root.setAttribute("data-theme", resolvedMode);
  root.setAttribute("data-surface", surfaceKey);
  root.setAttribute("data-spacing", spacingKey);

  // Toggle dark class for Tailwind darkMode: 'class' compatibility
  if (resolvedMode === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }

  // Choose surface colors based on mode
  const surfaceColors =
    resolvedMode === "light"
      ? LIGHT_SURFACE
      : SURFACE_STYLES[surfaceKey].colors;

  // Set CSS custom properties on root
  root.style.setProperty("--app-bg", surfaceColors.appBg);
  root.style.setProperty("--workspace-bg", surfaceColors.workspaceBg || surfaceColors.appBg);
  root.style.setProperty("--surface-primary", surfaceColors.surfacePrimary);
  root.style.setProperty("--surface-secondary", surfaceColors.surfaceSecondary);
  root.style.setProperty("--surface-elevated", surfaceColors.surfaceElevated);
  root.style.setProperty("--surface-hover", surfaceColors.surfaceHover);
  root.style.setProperty("--text-primary", surfaceColors.textPrimary);
  root.style.setProperty("--text-secondary", surfaceColors.textSecondary);
  root.style.setProperty("--border-subtle", surfaceColors.borderSubtle);

  // Accent variables
  const accentVars = generateAccentVariables(prefs.accentColor);
  Object.entries(accentVars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  // Message density / spacing
  const messageGap = spacingKey === "comfortable" ? "12px" : "4px";
  root.style.setProperty("--message-gap", messageGap);
};
