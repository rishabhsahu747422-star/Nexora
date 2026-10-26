import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Moon,
  Sun,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
  Pipette,
  Hash,
  AlertCircle,
  Layers,
  AlignJustify,
  Maximize2,
} from "lucide-react";
import Button from "../common/Button";
import {
  ACCENT_PRESETS,
  SURFACE_STYLES,
  DEFAULT_APPEARANCE,
  isValidHex,
  normalizeHex,
} from "../../utils/theme";
import {
  setTheme,
  setAccentColor,
  setSurfaceStyle,
  setMessageSpacing,
  resetAppearanceDefaults,
  addToast,
} from "../../redux/slices/uiSlice";
import { updateProfile } from "../../redux/slices/authSlice";

export default function AppearanceSettings() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const { theme, accentColor, accentName, surfaceStyle, messageSpacing } =
    useSelector((state) => state.ui);

  // Custom HEX input local state
  const [customHexInput, setCustomHexInput] = useState(accentColor || "#E10600");
  const [customHexError, setCustomHexError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize custom input if external accent color changes
  useEffect(() => {
    setCustomHexInput(accentColor);
    setCustomHexError("");
  }, [accentColor]);

  // Check if current accent is one of the presets
  const currentPreset = ACCENT_PRESETS.find(
    (p) => p.hex.toUpperCase() === (accentColor || "").toUpperCase()
  );
  const isCustomAccent = !currentPreset;

  // Persist preferences to backend if authenticated
  const persistAppearance = async (newPrefs) => {
    if (!currentUser) return; // Guest mode persists via Redux/localStorage automatically
    try {
      setIsSaving(true);
      await dispatch(
        updateProfile({
          appearance: {
            theme: newPrefs.theme !== undefined ? newPrefs.theme : theme,
            accentColor:
              newPrefs.accentColor !== undefined
                ? newPrefs.accentColor
                : accentColor,
            accentName:
              newPrefs.accentName !== undefined
                ? newPrefs.accentName
                : accentName,
            surfaceStyle:
              newPrefs.surfaceStyle !== undefined
                ? newPrefs.surfaceStyle
                : surfaceStyle,
            messageSpacing:
              newPrefs.messageSpacing !== undefined
                ? newPrefs.messageSpacing
                : messageSpacing,
          },
        })
      ).unwrap();
    } catch (err) {
      console.warn("Could not sync appearance to account cloud storage:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers
  const handleSelectPreset = (preset) => {
    dispatch(setAccentColor({ hex: preset.hex, name: preset.name }));
    persistAppearance({ accentColor: preset.hex, accentName: preset.name });
  };

  const handleCustomHexChange = (value) => {
    setCustomHexInput(value);
    const clean = value.startsWith("#") ? value : `#${value}`;
    if (!isValidHex(clean)) {
      setCustomHexError("Enter a valid 3 or 6 digit HEX code");
      return;
    }
    setCustomHexError("");
    const normalized = normalizeHex(clean);
    dispatch(setAccentColor({ hex: normalized, name: "Custom" }));
    persistAppearance({ accentColor: normalized, accentName: "Custom" });
  };

  const handleNativeColorPicker = (e) => {
    const hex = e.target.value.toUpperCase();
    setCustomHexInput(hex);
    setCustomHexError("");
    dispatch(setAccentColor({ hex, name: "Custom" }));
    persistAppearance({ accentColor: hex, accentName: "Custom" });
  };

  const handleThemeChange = (newTheme) => {
    dispatch(setTheme(newTheme));
    persistAppearance({ theme: newTheme });
  };

  const handleSurfaceChange = (newSurface) => {
    dispatch(setSurfaceStyle(newSurface));
    persistAppearance({ surfaceStyle: newSurface });
  };

  const handleSpacingChange = (newSpacing) => {
    dispatch(setMessageSpacing(newSpacing));
    persistAppearance({ messageSpacing: newSpacing });
  };

  const handleResetDefaults = () => {
    dispatch(resetAppearanceDefaults());
    setCustomHexInput(DEFAULT_APPEARANCE.accentColor);
    setCustomHexError("");
    persistAppearance(DEFAULT_APPEARANCE);
    dispatch(
      addToast({
        type: "success",
        message: "Appearance restored to Nexora default parameters.",
      })
    );
  };

  return (
    <div className="space-y-8 pb-4 text-slate-100">
      {/* Header and Reset Action */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: "var(--accent)" }} />
            Appearance & Interface
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize Nexora's visual identity, accent hues, and ambient depth.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RotateCcw}
          onClick={handleResetDefaults}
          title="Reset to default Nexora theme"
          className="text-xs"
        >
          Reset Defaults
        </Button>
      </div>

      {/* 1. Accent Color Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display text-sm font-semibold text-slate-200">
              Accent Color
            </h4>
            <p className="text-xs text-slate-400">
              Selected accent highlights buttons, active channels, indicators, and focus states.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-white font-medium">{accentName}</span>
            <span className="text-slate-400">{accentColor}</span>
          </div>
        </div>

        {/* 8 Preset Swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ACCENT_PRESETS.map((preset) => {
            const isSelected =
              !isCustomAccent &&
              (accentColor || "").toUpperCase() === preset.hex.toUpperCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group ${
                  isSelected
                    ? "bg-white/[0.08] border-white/40 shadow-sm"
                    : "bg-[#141416] border-white/5 hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-inner"
                  style={{
                    backgroundColor: preset.hex,
                    boxShadow: isSelected ? `0 0 10px ${preset.hex}88` : "none",
                  }}
                >
                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5"
                      style={{
                        color:
                          preset.id === "saffron" || preset.id === "mint-emerald"
                            ? "#0B0B0D"
                            : "#FFFFFF",
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium block truncate text-slate-200">
                    {preset.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    {preset.hex}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Color Option */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            isCustomAccent
              ? "bg-white/[0.08] border-white/30"
              : "bg-[#141416] border-white/5"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <input
                  type="color"
                  value={isValidHex(customHexInput) ? normalizeHex(customHexInput) : "#E10600"}
                  onChange={handleNativeColorPicker}
                  className="opacity-0 absolute inset-0 w-8 h-8 cursor-pointer z-10"
                  title="Open Color Wheel"
                />
                <div
                  className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center shadow-inner cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <Pipette className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Custom Accent Color
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Fine-tune using native picker or enter any valid 3/6-digit HEX code.
                </span>
              </div>
            </div>

            {/* HEX Input Field */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  maxLength={7}
                  value={customHexInput}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  placeholder="#E10600"
                  className={`pl-7 pr-3 py-1.5 w-32 rounded-lg bg-[#0B0B0D] border text-xs font-mono uppercase tracking-wider text-white focus:outline-none focus:ring-1 ${
                    customHexError
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-white/10 focus:border-white/30 focus:ring-white/20"
                  }`}
                />
              </div>

              {isCustomAccent && (
                <div className="px-2 py-1 rounded bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[10px] font-mono text-[var(--accent)] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active Custom
                </div>
              )}
            </div>
          </div>

          {customHexError && (
            <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{customHexError}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Appearance Mode Section */}
      <div className="space-y-3">
        <div>
          <h4 className="font-display text-sm font-semibold text-slate-200">
            Appearance Mode
          </h4>
          <p className="text-xs text-slate-400">
            Choose ambient lighting behavior. Retains your chosen accent in every mode.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            {
              id: "dark",
              label: "Dark",
              desc: "Signature deep background",
              icon: Moon,
            },
            {
              id: "light",
              label: "Light",
              desc: "Clean, high-visibility surfaces",
              icon: Sun,
            },
            {
              id: "system",
              label: "System",
              desc: "Synchronize with OS theme",
              icon: Laptop,
            },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = theme === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleThemeChange(mode.id)}
                className={`flex flex-col items-center text-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[var(--accent-soft)] border-[var(--accent-border)] text-white shadow-sm"
                    : "bg-[#141416] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                <Icon
                  className="w-5 h-5 mb-2"
                  style={{ color: isSelected ? "var(--accent)" : "currentColor" }}
                />
                <span className="text-xs font-semibold block">{mode.label}</span>
                <span className="text-[10px] opacity-70 block mt-0.5">
                  {mode.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Surface Style Section */}
      <div className="space-y-3">
        <div>
          <h4 className="font-display text-sm font-semibold text-slate-200">
            Surface Style
          </h4>
          <p className="text-xs text-slate-400">
            Choose your dark canvas depth without changing your selected accent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.values(SURFACE_STYLES).map((surface) => {
            const isSelected = (surfaceStyle || "midnight") === surface.id;
            return (
              <button
                key={surface.id}
                type="button"
                onClick={() => handleSurfaceChange(surface.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? "bg-[var(--accent-soft)] border-[var(--accent-border)] shadow-sm"
                    : "bg-[#141416] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white">
                    {surface.name}
                  </span>
                  {isSelected && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  )}
                </div>

                {/* Surface mini palette preview */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-5 h-5 rounded border border-white/15"
                    style={{ backgroundColor: surface.colors.appBg }}
                    title="Root canvas"
                  />
                  <div
                    className="w-5 h-5 rounded border border-white/15"
                    style={{ backgroundColor: surface.colors.surfacePrimary }}
                    title="Primary container"
                  />
                  <div
                    className="w-5 h-5 rounded border border-white/15"
                    style={{ backgroundColor: surface.colors.surfaceElevated }}
                    title="Elevated layer"
                  />
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {surface.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Message Spacing Section */}
      <div className="space-y-3">
        <div>
          <h4 className="font-display text-sm font-semibold text-slate-200">
            Message Spacing
          </h4>
          <p className="text-xs text-slate-400">
            Adjust information density across transmission feeds and conversation decks.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: "compact",
              label: "Compact",
              desc: "Tighter spacing for maximum transmission density",
              icon: AlignJustify,
            },
            {
              id: "comfortable",
              label: "Comfortable",
              desc: "Generous breathing room and roomier avatars",
              icon: Maximize2,
            },
          ].map((sp) => {
            const Icon = sp.icon;
            const isSelected = (messageSpacing || "compact") === sp.id;
            return (
              <button
                key={sp.id}
                type="button"
                onClick={() => handleSpacingChange(sp.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-[var(--accent-soft)] border-[var(--accent-border)]"
                    : "bg-[#141416] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon
                    className="w-4 h-4"
                    style={{
                      color: isSelected ? "var(--accent)" : "currentColor",
                    }}
                  />
                  <span className="text-xs font-semibold text-white">
                    {sp.label}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {sp.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Live Theme Preview Card */}
      <div className="p-4 rounded-2xl border border-white/10 bg-[#0B0B0D] space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            Live Interface Preview
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Mode: {theme} • Style: {surfaceStyle}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/5 bg-[#141416] space-y-3">
          {/* Mock Channel List Item */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                #
              </span>
              <span className="text-xs font-medium text-white">
                announcements
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-contrast)",
              }}
            >
              ACTIVE
            </span>
          </div>

          {/* Mock Message Item */}
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#1B1B1F] border border-white/5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-contrast)",
              }}
            >
              NX
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Nexora Core</span>
                <span className="text-[10px] font-mono text-slate-400">12:00 PM</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Accent color verified: {accentName} ({accentColor}). Ambient surfaces adjusted.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="primary">
              Primary Action
            </Button>
            <Button size="sm" variant="outline">
              Secondary
            </Button>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "var(--accent)" }}
              />
              <span className="text-[11px] font-mono">Active Focus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
