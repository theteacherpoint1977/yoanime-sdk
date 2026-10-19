---
id: doc:developerquickstart-1.0.2-2
tags:
- engineering
domain: engineering
authority: reference
lifecycle: active
reading-priority: 5
ai-priority: 5
audience:
- all
---
# Developer Quick Start 1.0.2

This is the shortest path for building and testing a yoAnime extension.

## 1. Start From The Product UI

Use the platform UI:

```text
yoAnime Welcome Screen -> Extensions
```

From there you can:

- run built-in starters
- install a local extension folder
- install an extension zip
- reload an extension during development
- view validation warnings and errors

Manual copying is only for yoAnime repo development.

## 2. Pick The Right Starter

- **Hello World SDK**: simplest stable bake/playback example.
- **Two Surface Starter**: taskpane plus overlay, messaging, roles, physics, diagnostics, and presets.
- **Timeline Starter**: preview editor APIs for advanced internal experiments.

For public third-party work, model your extension after Hello World SDK or Two Surface Starter.

## 3. Build The Manifest

For the general 1.0.2-era package template, `sdkVersionMin: "0.3.0"` remains the documented baseline. **This guide's `animation.*` example is for Platform v0.5.0 / SDK contract v0.4.0, so its manifest must require `sdkVersionMin: "0.4.0"` or later.**

The full public package contract is `docs/ExtensionPackageContract-1.0.2.md`. For a copyable package shape, start from `docs/SdkSamples/1.0.2/extension-package-template`.

```json
{
  "manifestVersion": 2,
  "id": "my-extension",
  "name": "My Extension",
  "version": "0.1.0",
  "surface": "overlay-taskpane",
  "entry": "overlay.html",
  "taskPaneEntry": "taskpane.html",
  "sdkVersionMin": "0.4.0",
  "permissions": [
    "selection.read",
    "scene.read",
    "geometry.read",
    "timeline.read",
    "timeline.write",
    "timeline.playback",
    "surface.messaging",
    "interaction.write"
  ],
  "capabilities": [
    "overlay.surface",
    "taskpane.surface",
    "surface.messaging"
  ]
}
```

## 4. Higher-Level Authoring — animation.* (Preview in Platform v0.5.0)

Preferred authoring for v0.5: `animation.create → preview → commit → timeline.play`.

```js
await yoanime.runtime.ready();

const scene = await yoanime.scene.get({ includeGeometry: true });
const first = scene.shapes[0];

// 1) create  (host-minted animationId, ordered, versioned)
const { animation } = await yoanime.animation.create({
  label: "My Animation",
  durationSeconds: 2,
  layers: [
    {
      runtimeNodeId: first.runtimeNodeId,
      properties: {
        Rotation: {
          keyframes: [
            { normalizedTime: 0, value: { number: 0 } },
            { normalizedTime: 1, value: { number: 360 } }
          ]
        }
      }
    }
  ]
});

// Optional: inspect ordered list / single definition
await yoanime.animation.list();                // → { animations: [{animationId, label, durationSeconds}] }
await yoanime.animation.get(animation.animationId);

// 2) preview  (ghost IR — no host mutation, no timelineVersion bump)
const preview = await yoanime.animation.preview({ animationId: animation.animationId });
console.log(preview.ir.layers.length);

// 3) commit  (bake → timeline + history, bumps timelineVersion)
await yoanime.animation.commit({ animationId: animation.animationId });

// 4) play  (committed timeline — replay does NOT rerun procedural logic)
yoanime.timeline.play({ startTimeSeconds: 0 });

// Events: notification only — call getters for truth
yoanime.animation.onChanged(e => console.log(e.sceneId, e.animationId, e.operation));

// Undo / persistence (slot)
await yoanime.animation.undo();
await yoanime.animation.redo();
await yoanime.animation.save({ animationId: animation.animationId, slot: "my-slot" });
await yoanime.animation.load({ slot: "my-slot" });
```

Permissions: `animation.read` (list/get/preview/save/load/onChanged) and `timeline.write` (create/update/remove/reorder/commit). `animation.commit` internally calls `timeline.bake`.

## 4b. Lower-level alternative — timeline.bake()

Direct timeline authoring remains `@stable` for custom tracks:

```js
await yoanime.runtime.ready();

const ctx = await yoanime.slide.getContext();
const scene = await yoanime.scene.get({ includeGeometry: true, includeTags: true });

await yoanime.timeline.bake({
  label: "My Generated Animation",
  layers: scene.shapes.map(shape => ({
    runtimeNodeId: shape.runtimeNodeId,
    properties: {
      Rotation: {
        keyframes: [
          { normalizedTime: 0, value: { number: 0 } },
          { normalizedTime: 1, value: { number: 360 } }
        ]
      }
    }
  }))
});

yoanime.timeline.playFrom(0);
```

> **For overlay extensions:** The code above works in the taskpane surface (top-level WebView2 with host-injected SDK). Overlay iframes require the [Overlay Bootstrap Standard](https://github.com/yoanime/yoanime-sdk/blob/main/reference/extension/docs/runtime/OverlayBootstrapStandard.md): load `yoAnimeBridge.js`, wait for `window.yoanime` via polling, then call `runtime.ready()`.

> **Console scripts are developer samples/stress tests,** not the final end-user authoring UI. They live in `samples/console-scripts/` and validate the contracts; product extensions use taskpane/overlay UI that calls `animation.*` or `timeline.bake`.

## 5. Verify Before Sharing

Run:

- `docs/SdkSamples/1.0.2/01-runtime-capabilities.js`
- `docs/SdkSamples/1.0.2/02-scene-geometry-identity.js`
- `docs/SdkSamples/1.0.2/07-platform-smoke-suite.js`

Then test install through:

```text
Extensions -> Install Extension Folder
Extensions -> Run
Extensions -> Reload
```

Also verify:

- Install from zip works.
- Overlay empty space passes through to PowerPoint.
- Reload does not require restarting PowerPoint.
- The extension does not request preview/internal permissions unless it clearly explains why.

## 6. Coordinate Rules

- Scene bounds are PowerPoint slide points.
- Timeline properties use PowerPoint slide points.
- Overlay visuals use CSS pixels / overlay-local coordinates.
- Use `geometry.slideToScreen()` and `geometry.screenToSlide()` only for projection and hit testing.

Never write screen pixels into `PositionX` or `PositionY`.

---

## Platform References

This SDK documentation is part of the yoAnime Knowledge Management System. The authoritative platform documentation is maintained in the main repository:

- [ADR-000: Permanent Runtime Model](https://github.com/yoanime/yoanime/tree/main/docs/ADR-000-Permanent-Runtime-Model.md) — Platform architecture foundation
- [MASTER_PLAN](https://github.com/yoanime/yoanime/tree/main/docs/MASTER_PLAN.md) — Implementation roadmap
- [Architecture Source of Truth](https://github.com/yoanime/yoanime/tree/main/docs/Architecture%20Source%20of%20Truth.md) — Platform architecture authority
- [Reference Extension Domain](https://github.com/yoanime/yoanime/tree/main/docs/Reference%20Extension/_Overview.md) — Reference extension MOC
