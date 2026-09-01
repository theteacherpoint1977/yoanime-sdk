---
id: doc:architectureoverview
tags:
- architecture
domain: architecture
authority: reference
lifecycle: active
reading-priority: 1
ai-priority: 5
audience:
- all
---
# yoAnime SDK Architecture Overview

yoAnime Studio uses a native-first hybrid architecture.

```text
PowerPoint
  -> VSTO Add-in / PowerPoint COM authority
  -> WPF runtime host
  -> WebView2 taskpane and overlay surfaces
  -> JavaScript SDK extensions
```

## Runtime Authority

Extensions never mutate PowerPoint directly. They call the JavaScript SDK, and the host decides whether the requested action is allowed.

- Browser extension: sends intent.
- WPF runtime: validates permissions, owns timeline/cache/runtime coordination.
- VSTO/COM layer: applies safe mutations to PowerPoint.

## Surfaces

yoAnime supports two main browser surfaces:

- taskpane: normal PowerPoint side panel UI
- overlay: slide-aligned WebView2 UI for handles, previews, canvases, and visual editors

Taskpane and overlay pages communicate through SDK messaging or runtime channels.

## Motion And Timeline

Extensions author motion in slide-point coordinates. There are two complementary authoring levels:

* **Higher-level (preferred): `animation.*`** — a versioned, ordered, host-minted authoring model:
  ```text
  procedural / extension logic
          ↓
  animation.create({ label, durationSeconds, layers:[{runtimeNodeId, properties:{PositionX:{keyframes:[{normalizedTime, value:{number}}]}}}], metadata })
          ↓
  animation.preview({animationId})  →  ghost Generated Motion IR (no host mutation, no timelineVersion bump)
          ↓
  animation.commit({animationId})  →  Timeline Bake Request  →  PropertyTrackMutationService.BakePropertyTracksAsync  →  timelineVersion++
          ↓
  timeline.play({startTimeSeconds:0})  →  PowerPoint
  ```
  `animation.list/get/update/remove/reorder` manage an ordered scene list (host-minted `animationId`, `version`), `onChanged` notifies (`{sceneId, animationId, operation}`), and `save/load/undo/redo` provide slot persistence and history. Replay is **committed timeline playback** — it does not rerun procedural logic. Requires `animation.read` (list/get/preview/save/load/onChanged) and `timeline.write` (create/update/remove/reorder/commit).

* **Lower-level (direct): `timeline.bake()`** — sends a complete `TimelineBakeRequest` (`layers:[{runtimeNodeId, properties:{Kind:{keyframes}}}]`) directly to the host. Still `@stable` and fully supported for custom tracks; `animation.commit` internally calls this path.

Procedural engines can generate motion through providers before either authoring entry:

```text
Physics / Noise / Constraints / Paths / Lottie / AI / Data / IK / Expressions
  -> Generated Motion IR (diagnostics, seed, requirements, preview hints)
  -> Timeline Bake Request  (via motionProviders.generate→bake or animation layers)
  -> animation.commit  OR  timeline.bake
  -> PowerPoint Shapes (slide-point PositionX/Y, Rotation degrees, Scale ratio)
```

## Animation Runtime

`animation.*` does **not** replace the timeline runtime and does **not** automatically perform physics or IK. Physics/IK are provider helpers (`yoanime.physics.*`, `yoanime.ik.*`) that must be explicitly composed into `animation.layers[].motionProvider` or baked via `motionProviders`. See `YoAnimeSdkReference-0.5.0.md` → `animation`.

## Live Web Experiences

yoAnime can render live web experiences inside PowerPoint slides. Web content is sandboxed and does not receive the native SDK bridge. It may emit safe data-only events that extensions can observe through the SDK.

## Permissions

Extension manifests declare permissions such as `animation.read`, `animation.write`, `selection.read`, `scene.read`, `timeline.read`, `timeline.write`, `timeline.playback`, `scene.write`, `shapes.write`, `interaction.write`, and `surface.messaging`. `animation.*` reuses `timeline.write` for create/update/remove/reorder/commit (plus `animation.read` for list/get/preview). The host gateway enforces permissions at runtime.

---

## Platform References

This SDK documentation is part of the yoAnime Knowledge Management System. The authoritative platform documentation is maintained in the main repository:

- [ADR-000: Permanent Runtime Model](https://github.com/yoanime/yoanime/tree/main/docs/ADR-000-Permanent-Runtime-Model.md) — Platform architecture foundation
- [MASTER_PLAN](https://github.com/yoanime/yoanime/tree/main/docs/MASTER_PLAN.md) — Implementation roadmap
- [Architecture Source of Truth](https://github.com/yoanime/yoanime/tree/main/docs/Architecture%20Source%20of%20Truth.md) — Platform architecture authority
- [Reference Extension Domain](https://github.com/yoanime/yoanime/tree/main/docs/Reference%20Extension/_Overview.md) — Reference extension MOC
