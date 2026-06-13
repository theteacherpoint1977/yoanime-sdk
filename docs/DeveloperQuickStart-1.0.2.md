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

Use `manifestVersion: 2` and `sdkVersionMin: "0.3.0"`.

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
  "sdkVersionMin": "0.3.0",
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

## 4. Use The Stable SDK Path

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
