/**
 * shape-choreographer/assets/choreographer-shared.js
 *
 * Shared constants and pure helpers loaded by both taskpane and overlay.
 * No SDK calls here — this file has no side effects on load.
 */

// ─── Entrance Presets ───────────────────────────────────────────────────────

const PRESETS = {
  "fly-in-left": {
    label: "Fly In ← Left",
    icon: "←",
    description: "Slides in from the left with eased deceleration.",
    color: "#3b82f6",
    /** @param {{ startX, startY, slideWidth, slideHeight, durationSeconds }} p */
    buildLayers(runtimeNodeId, p) {
      const offLeft = -p.slideWidth * 0.15;
      return {
        runtimeNodeId,
        properties: {
          PositionX: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,   value: { number: offLeft } },
              { normalizedTime: 0.72, value: { number: p.startX + 4 } },
              { normalizedTime: 1,   value: { number: p.startX } }
            ]
          },
          Opacity: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: 0 } },
              { normalizedTime: 0.18, value: { number: 1 } }
            ]
          }
        }
      };
    }
  },

  "fly-in-right": {
    label: "Fly In → Right",
    icon: "→",
    description: "Slides in from the right.",
    color: "#8b5cf6",
    buildLayers(runtimeNodeId, p) {
      const offRight = p.slideWidth * 1.12;
      return {
        runtimeNodeId,
        properties: {
          PositionX: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: offRight } },
              { normalizedTime: 0.72, value: { number: p.startX - 4 } },
              { normalizedTime: 1,    value: { number: p.startX } }
            ]
          },
          Opacity: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: 0 } },
              { normalizedTime: 0.18, value: { number: 1 } }
            ]
          }
        }
      };
    }
  },

  "fly-in-top": {
    label: "Fly In ↑ Top",
    icon: "↑",
    description: "Drops in from above.",
    color: "#06b6d4",
    buildLayers(runtimeNodeId, p) {
      const offTop = -p.slideHeight * 0.15;
      return {
        runtimeNodeId,
        properties: {
          PositionY: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: offTop } },
              { normalizedTime: 0.72, value: { number: p.startY + 5 } },
              { normalizedTime: 1,    value: { number: p.startY } }
            ]
          },
          Opacity: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: 0 } },
              { normalizedTime: 0.18, value: { number: 1 } }
            ]
          }
        }
      };
    }
  },

  "fly-in-bottom": {
    label: "Fly In ↓ Bottom",
    icon: "↓",
    description: "Rises in from below.",
    color: "#f59e0b",
    buildLayers(runtimeNodeId, p) {
      const offBottom = p.slideHeight * 1.15;
      return {
        runtimeNodeId,
        properties: {
          PositionY: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: offBottom } },
              { normalizedTime: 0.72, value: { number: p.startY - 5 } },
              { normalizedTime: 1,    value: { number: p.startY } }
            ]
          },
          Opacity: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: 0 } },
              { normalizedTime: 0.18, value: { number: 1 } }
            ]
          }
        }
      };
    }
  },

  "fade-in": {
    label: "Fade In",
    icon: "◎",
    description: "Pure opacity fade from invisible.",
    color: "#10b981",
    buildLayers(runtimeNodeId, p) {
      return {
        runtimeNodeId,
        properties: {
          Opacity: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,   value: { number: 0 } },
              { normalizedTime: 1,   value: { number: 1 } }
            ]
          }
        }
      };
    }
  },

  "scale-pop": {
    label: "Scale Pop",
    icon: "✦",
    description: "Pops in from a small scale with overshoot.",
    color: "#f43f5e",
    buildLayers(runtimeNodeId, p) {
      return {
        runtimeNodeId,
        properties: {
          ScaleX: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: 0 } },
              { normalizedTime: 0.62, value: { number: 112 } },
              { normalizedTime: 0.82, value: { number: 95 } },
              { normalizedTime: 1,    value: { number: 100 } }
            ]
          },
          ScaleY: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: 0 } },
              { normalizedTime: 0.62, value: { number: 112 } },
              { normalizedTime: 0.82, value: { number: 95 } },
              { normalizedTime: 1,    value: { number: 100 } }
            ]
          },
          Opacity: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: 0 } },
              { normalizedTime: 0.2,  value: { number: 1 } }
            ]
          }
        }
      };
    }
  },

  "spin-in": {
    label: "Spin In",
    icon: "↻",
    description: "Spins 360° into final position.",
    color: "#a78bfa",
    buildLayers(runtimeNodeId, p) {
      return {
        runtimeNodeId,
        properties: {
          Rotation: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,   value: { number: -180 } },
              { normalizedTime: 1,   value: { number: 0 } }
            ]
          },
          Opacity: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: 0 } },
              { normalizedTime: 0.25, value: { number: 1 } }
            ]
          }
        }
      };
    }
  },

  "bounce-in": {
    label: "Bounce In",
    icon: "⟳",
    description: "Drops in and bounces at the landing.",
    color: "#fb923c",
    buildLayers(runtimeNodeId, p) {
      const offTop = -p.slideHeight * 0.12;
      return {
        runtimeNodeId,
        properties: {
          PositionY: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,    value: { number: offTop } },
              { normalizedTime: 0.5,  value: { number: p.startY + 18 } },
              { normalizedTime: 0.68, value: { number: p.startY - 10 } },
              { normalizedTime: 0.82, value: { number: p.startY + 6 } },
              { normalizedTime: 0.92, value: { number: p.startY - 3 } },
              { normalizedTime: 1,    value: { number: p.startY } }
            ]
          },
          Opacity: {
            durationSeconds: p.durationSeconds,
            keyframes: [
              { normalizedTime: 0,   value: { number: 0 } },
              { normalizedTime: 0.1, value: { number: 1 } }
            ]
          }
        }
      };
    }
  }
};

// ─── Channel ID ───────────────────────────────────────────────────────────────

const CHANNEL_ID = "shape-choreographer.v1";

// ─── Message Types ────────────────────────────────────────────────────────────

const MSG = {
  // Taskpane → Overlay
  SCENE_UPDATE:    "choreographer:scene-update",   // full track list
  SETTINGS_UPDATE: "choreographer:settings-update", // global settings
  BAKE_START:      "choreographer:bake-start",
  BAKE_DONE:       "choreographer:bake-done",

  // Overlay → Taskpane
  OFFSET_CHANGED:  "choreographer:offset-changed",  // { runtimeNodeId, offsetSeconds }
  DURATION_CHANGED:"choreographer:duration-changed",// { runtimeNodeId, durationSeconds }
  PRESET_CHANGED:  "choreographer:preset-changed",  // { runtimeNodeId, presetId }
  TRACK_REMOVED:   "choreographer:track-removed",   // { runtimeNodeId }
};

// ─── Default Stagger ─────────────────────────────────────────────────────────

const DEFAULT_STAGGER_SECONDS = 0.18;
const DEFAULT_DURATION_SECONDS = 0.7;
const TIMELINE_WIDTH_SECONDS   = 4.0;   // overlay ruler spans this many seconds

// Export as globals (no module bundler in these single-file pages)
window.CHOREOGRAPHER = {
  PRESETS,
  CHANNEL_ID,
  MSG,
  DEFAULT_STAGGER_SECONDS,
  DEFAULT_DURATION_SECONDS,
  TIMELINE_WIDTH_SECONDS
};
