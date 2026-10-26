import assert from "node:assert";
import {
  ACCENT_PRESETS,
  SURFACE_STYLES,
  DEFAULT_APPEARANCE,
  isValidHex,
  normalizeHex,
  hexToRgb,
  getContrastColor,
  generateAccentVariables,
  resolveThemeMode,
  applyTheme,
} from "./theme.js";

console.log("=== Running Nexora Midnight Appearance Test Suite ===");

// 1. Verify Presets
console.log("Testing 8 Accent Presets...");
assert.strictEqual(ACCENT_PRESETS.length, 8, "Must have exactly 8 selectable presets");
const expectedPresets = [
  { name: "Crimson", hex: "#E10600" },
  { name: "Lavender", hex: "#B69CFF" },
  { name: "Electric Blue", hex: "#4D8DFF" },
  { name: "Saffron", hex: "#FFC247" },
  { name: "Mint Emerald", hex: "#35D6A2" },
  { name: "Neon Rose", hex: "#FF75B5" },
  { name: "Arctic Cyan", hex: "#40D9E8" },
  { name: "Ember Orange", hex: "#FF8A4C" },
];

expectedPresets.forEach((exp) => {
  const match = ACCENT_PRESETS.find(
    (p) => p.name === exp.name && p.hex.toUpperCase() === exp.hex.toUpperCase()
  );
  assert.ok(match, `Preset ${exp.name} (${exp.hex}) must be present`);
});
console.log("✓ 8 Presets verified successfully.");

// 2. Verify Hex Validation
console.log("Testing HEX Validation & Normalization...");
assert.strictEqual(isValidHex("#E10600"), true);
assert.strictEqual(isValidHex("#35d6a2"), true);
assert.strictEqual(isValidHex("FFC247"), true);
assert.strictEqual(isValidHex("#FFF"), true);
assert.strictEqual(isValidHex("000"), true);
assert.strictEqual(isValidHex("#GGGGGG"), false);
assert.strictEqual(isValidHex("#12345"), false);
assert.strictEqual(isValidHex("1234567"), false);
assert.strictEqual(isValidHex(""), false);
assert.strictEqual(isValidHex(null), false);

assert.strictEqual(normalizeHex("#fff"), "#FFFFFF");
assert.strictEqual(normalizeHex("e10600"), "#E10600");
assert.strictEqual(normalizeHex("invalid"), DEFAULT_APPEARANCE.accentColor);
console.log("✓ HEX validation & normalization verified.");

// 3. Verify RGB conversion & Contrast calculation
console.log("Testing Contrast Calculation...");
const rgbCrimson = hexToRgb("#E10600");
assert.deepStrictEqual(rgbCrimson, { r: 225, g: 6, b: 0 });

// Crimson is dark, text must be white
assert.strictEqual(getContrastColor("#E10600"), "#FFFFFF");
// Saffron (#FFC247) is bright yellow/orange, text must be dark
assert.strictEqual(getContrastColor("#FFC247"), "#0B0B0D");
// Mint Emerald (#35D6A2) is bright green, text must be dark
assert.strictEqual(getContrastColor("#35D6A2"), "#0B0B0D");
// Neon Rose (#FF75B5) is mid-bright
assert.ok(getContrastColor("#FF75B5") === "#0B0B0D" || getContrastColor("#FF75B5") === "#FFFFFF");
console.log("✓ Contrast calculation verified.");

// 4. Verify Derived Accent CSS Variables
console.log("Testing Derived CSS Variables...");
const crimsonVars = generateAccentVariables("#E10600");
assert.strictEqual(crimsonVars["--accent"], "#E10600");
assert.strictEqual(crimsonVars["--accent-contrast"], "#FFFFFF");
assert.strictEqual(crimsonVars["--accent-soft"], "rgba(225, 6, 0, 0.15)");
assert.ok(crimsonVars["--accent-hover"]);
assert.ok(crimsonVars["--accent-border"]);
assert.ok(crimsonVars["--accent-glow"]);
console.log("✓ Derived accent variables verified.");

// 5. Verify Surface Styles
console.log("Testing Surface Styles...");
assert.ok(SURFACE_STYLES.midnight, "Midnight surface must be defined");
assert.strictEqual(SURFACE_STYLES.midnight.colors.appBg, "#0B0B0D");
assert.strictEqual(SURFACE_STYLES.midnight.colors.surfacePrimary, "#141416");
assert.strictEqual(SURFACE_STYLES.midnight.colors.surfaceElevated, "#252529");

assert.ok(SURFACE_STYLES.graphite, "Graphite surface must be defined");
assert.strictEqual(SURFACE_STYLES.graphite.colors.appBg, "#131417");

assert.ok(SURFACE_STYLES.oled, "OLED surface must be defined");
assert.strictEqual(SURFACE_STYLES.oled.colors.appBg, "#000000");
console.log("✓ Surface styles verified.");

// 6. Verify Defaults
console.log("Testing Default Parameters...");
assert.strictEqual(DEFAULT_APPEARANCE.theme, "dark");
assert.strictEqual(DEFAULT_APPEARANCE.accentColor, "#E10600");
assert.strictEqual(DEFAULT_APPEARANCE.accentName, "Crimson");
assert.strictEqual(DEFAULT_APPEARANCE.surfaceStyle, "midnight");
assert.strictEqual(DEFAULT_APPEARANCE.messageSpacing, "compact");
console.log("✓ Default appearance parameters verified.");

// 7. Verify Theme Application with Mock DOM
console.log("Testing Mock DOM Theme Application...");
const mockElement = {
  attributes: {},
  classList: {
    classes: new Set(),
    add(cls) { this.classes.add(cls); },
    remove(cls) { this.classes.delete(cls); },
    contains(cls) { return this.classes.has(cls); },
  },
  style: {
    properties: {},
    setProperty(prop, val) { this.properties[prop] = val; },
    getPropertyValue(prop) { return this.properties[prop]; },
  },
  setAttribute(attr, val) { this.attributes[attr] = val; },
  getAttribute(attr) { return this.attributes[attr]; },
};

global.document = {
  documentElement: mockElement,
};

applyTheme({
  theme: "dark",
  accentColor: "#35D6A2",
  accentName: "Mint Emerald",
  surfaceStyle: "oled",
  messageSpacing: "comfortable",
});

assert.strictEqual(mockElement.getAttribute("data-theme"), "dark");
assert.strictEqual(mockElement.getAttribute("data-surface"), "oled");
assert.strictEqual(mockElement.getAttribute("data-spacing"), "comfortable");
assert.strictEqual(mockElement.classList.contains("dark"), true);
assert.strictEqual(mockElement.style.getPropertyValue("--app-bg"), "#000000");
assert.strictEqual(mockElement.style.getPropertyValue("--accent"), "#35D6A2");
assert.strictEqual(mockElement.style.getPropertyValue("--accent-contrast"), "#0B0B0D");
assert.strictEqual(mockElement.style.getPropertyValue("--message-gap"), "12px");

// Test Reset to Defaults application
applyTheme(DEFAULT_APPEARANCE);
assert.strictEqual(mockElement.getAttribute("data-surface"), "midnight");
assert.strictEqual(mockElement.getAttribute("data-spacing"), "compact");
assert.strictEqual(mockElement.style.getPropertyValue("--app-bg"), "#0B0B0D");
assert.strictEqual(mockElement.style.getPropertyValue("--accent"), "#E10600");
assert.strictEqual(mockElement.style.getPropertyValue("--message-gap"), "4px");
console.log("✓ Mock DOM application and reset to default verified.");

console.log("=== All Nexora Appearance System Tests Passed! ===");
