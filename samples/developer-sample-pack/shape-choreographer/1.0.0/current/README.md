# Shape Choreographer

**A multi-shape entrance animation sequencer for yoAnime 1.0.2.**

Compose coordinated entrance animations across multiple PowerPoint shapes. Each shape gets its own entrance preset, start-offset, and duration. Timing can be adjusted either through the taskpane controls or by dragging bars in the visual overlay timeline editor.

---

## Package Contents

```
shape-choreographer/
  manifest.json                  Manifest v2 — overlay-taskpane surface
  taskpane.html                  Shape list, preset selectors, bake controls
  overlay.html                   Visual timeline editor (draggable bars)
  assets/
    choreographer-shared.js      Shared constants, preset definitions, channel IDs
  README.md                      This file
```

---

## Installation

1. Open PowerPoint with the yoAnime add-in loaded.
2. In the **yoAnime Welcome Screen**, go to **Extensions → Install Extension Folder**.
3. Select the `shape-choreographer` folder.
4. yoAnime validates the manifest and installs.

To install as a zip, compress the `shape-choreographer` folder and use **Install From Zip**.

---

## Quick Start

1. **Open the taskpane** — click the Shape Choreographer entry in the Extension Manager.
2. **Select shapes** in PowerPoint — click one or more shapes on the slide.
3. **Click ＋ Add** — each shape is added to the sequence with a staggered offset.
4. **Adjust settings** — change the default preset, stagger spacing, and per-shape duration.
5. **Open the overlay** — click **⊞ Overlay** to launch the visual timing editor.
6. **Drag bars** — each shape has a coloured bar; drag it to change its start time, drag the right edge to change its duration.
7. **Click ▶ Bake** — the sequence is baked as a single yoAnime timeline and plays automatically.

---

## Entrance Presets

| Icon | Preset | Description |
|------|--------|-------------|
| ← | Fly In Left | Slides in from the left with eased deceleration |
| → | Fly In Right | Slides in from the right |
| ↑ | Fly In Top | Drops in from above |
| ↓ | Fly In Bottom | Rises in from below |
| ◎ | Fade In | Pure opacity fade |
| ✦ | Scale Pop | Pops in from zero scale with overshoot |
| ↻ | Spin In | Rotates 360° into resting position |
| ⟳ | Bounce In | Falls from above and bounces on landing |

---

## Permissions Used

| Permission | Reason |
|------------|--------|
| `selection.read` | Read selected shapes to add to sequence |
| `scene.read` | Read shape positions (slide-point coordinates) for keyframe generation |
| `scene.write` | Tag shapes with metadata for sequencer identity |
| `geometry.read` | Read slide dimensions to calculate off-slide starting positions |
| `timeline.read` | Check timeline state before baking |
| `timeline.write` | `timeline.bake()` — commit the animation sequence |
| `timeline.playback` | `timeline.playFrom(0)` after baking |
| `interaction.write` | Overlay visibility and interactive region ownership |
| `surface.messaging` | Runtime channel for taskpane ↔ overlay coordination |
| `extensions.read` | List installed extensions (informational) |

---

## Test Plan

### Smoke Tests

**T-01 — SDK Boot**
1. Open the extension taskpane.
2. Expected: status bar shows "Connected · local", SDK version is displayed, log reads "Ready."

**T-02 — Add Single Shape**
1. Click one shape in PowerPoint.
2. Click ＋ Add.
3. Expected: shape appears in the track list with name, preset pill, offset 0.00s, and duration 0.70s.

**T-03 — Add Multiple Shapes with Stagger**
1. Select three shapes.
2. Click ＋ Add.
3. Expected: three tracks appear with offset values 0.00s, 0.18s, 0.36s (matching stagger input).

**T-04 — Prevent Duplicate Add**
1. Add a shape.
2. Select the same shape and click ＋ Add again.
3. Expected: log shows "already in sequence", track count unchanged.

**T-05 — Change Preset via Pill**
1. Add a shape.
2. Click the preset pill for that track.
3. Select "Bounce In" in the picker.
4. Expected: pill updates to show bounce-in label/color. Overlay bar (if open) also updates.

**T-06 — Change Offset and Duration Inputs**
1. Add a shape.
2. Change the offset input to `0.50`.
3. Change the duration input to `1.20`.
4. Expected: values persist in track state; overlay bar moves/resizes to match.

**T-07 — Open Overlay**
1. Click ⊞ Overlay.
2. Expected: overlay panel appears anchored to bottom-right of the slide area.
3. Panel shows ruler and one coloured bar per track.
4. Empty overlay space passes through to PowerPoint (clicking a slide shape selects it).

**T-08 — Overlay Bar Drag (Offset)**
1. Open overlay with at least one track.
2. Drag a bar horizontally to a new time position.
3. Expected: bar snaps to new position; taskpane offset input updates to match.

**T-09 — Overlay Bar Resize (Duration)**
1. Open overlay with at least one track.
2. Drag the right edge of a bar.
3. Expected: bar width changes; taskpane duration input updates.

**T-10 — Bake and Play**
1. Add 3 shapes with different presets.
2. Click ▶ Bake.
3. Expected: "Baking sequence…" log; then shapes animate in PowerPoint in the correct order with the assigned motions; playhead moves in the overlay.

**T-11 — Overlay Bake button**
1. Open overlay.
2. Click ▶ Bake & Play directly from overlay.
3. Expected: sends scene update + bake request to taskpane; animation plays.

**T-12 — Remove Track**
1. Add two shapes.
2. Click × on the first track.
3. Expected: track removed from taskpane list and from overlay; other track remains.

**T-13 — Clear All**
1. Add shapes, open overlay.
2. Click ⊗ Clear in the overlay toolbar.
3. Expected: all bars cleared. Bake button disabled.

**T-14 — Stagger Re-apply**
1. Add 4 shapes and manually change some offsets.
2. Click ⟳ Stagger in the overlay (or change stagger value in taskpane).
3. Expected: offsets reset to 0, 0.18, 0.36, 0.54 (or current stagger value × index).

**T-15 — Overlay Close / Reopen**
1. Close overlay via ✕ button.
2. Re-open via ⊞ Overlay button in taskpane.
3. Expected: overlay reloads with tracks intact; no state loss.

**T-16 — Zoom in overlay**
1. Open overlay with tracks.
2. Click + zoom button.
3. Expected: bars and ruler expand, showing finer time resolution.

### Failure Cases

**F-01 — Bake with no shape bounds**: add a shape whose runtimeNodeId is stale (shape deleted from slide). Expected: log shows "Warning: shape … not found in scene" and skips that layer; remaining shapes still bake.

**F-02 — Bake with no tracks**: click ▶ Bake when the list is empty. Expected: button is disabled; no SDK call is made.

**F-03 — Overlay open before taskpane ready**: opening the overlay before the channel is established. Expected: overlay shows "Waiting for taskpane…" and renders correctly once the channel message arrives.

---

## Architecture Notes

- **Taskpane** is the authoritative state owner. It holds the `tracks[]` array, reads `slide.getContext()`, reads `scene.get()`, and calls `timeline.bake()`.
- **Overlay** is a display/interaction surface only. It mirrors track state from the taskpane via the runtime channel, lets users drag bars, and sends back `OFFSET_CHANGED` / `DURATION_CHANGED` / `PRESET_CHANGED` messages. It never calls `timeline.bake()` directly.
- **Runtime channel** (`shape-choreographer.v1`) is the single synchronisation point between both surfaces.
- **Keyframe generation** happens entirely in slide-point space. The `buildLayers(runtimeNodeId, { startX, startY, slideWidth, slideHeight, durationSeconds })` function in `choreographer-shared.js` computes offset and easing in slide points, which are then re-normalised into the full composed timeline duration in `taskpane.html`.
- **Empty overlay space** passes through to PowerPoint via the absence of `data-yoanime-interactive` on the `<html>`/`<body>` elements; only `#panel` and its children are interactive.
