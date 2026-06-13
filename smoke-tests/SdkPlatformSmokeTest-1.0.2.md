# SDK Platform Smoke Test 1.0.2

Run this checklist before publishing the SDK/extension platform preview.

For copy-paste test scripts, also use `docs/SdkSamples/1.0.2`.

For extension install/package validation, use `docs/ExtensionPackageContract-1.0.2.md` and `docs/SdkSamples/1.0.2/extension-package-template`.

## Setup

1. Start PowerPoint with the yoAnime add-in loaded.
2. Open a blank 16:9 presentation.
3. Insert at least three shapes:
   - `Ball 1`: oval/circle near the upper-left area.
   - `Ramp 1`: thin rotated rectangle.
   - `Floor 1`: thin horizontal rectangle near the bottom.
4. Open the extension list after the taskpane reports that panes are connected.

## Runtime And Capabilities

Open Two Surface Starter and run this in the overlay console:

```js
await yoanime.runtime.ready();
console.log(await yoanime.runtime.getCapabilities());
```

Expected:

- `sdkVersion` is `0.3.0`.
- `platformLaws` includes `browser-intent-only`, `wpf-runtime-authority`, `vsto-com-authority`, and `runtime-node-id-authority`.
- `apiStability.stable` includes `timeline.bake`, `slide`, `geometry`, and `physics`.
- `apiStability.internal` includes `trajectory` and extension lifecycle controls.

## Scene And Slide Geometry

```js
const ctx = await yoanime.slide.getContext();
const scene = await yoanime.scene.get({
  includeGeometry: true,
  includeShapeType: true,
  includeTags: true
});
console.log(ctx.slide.widthPoints, ctx.slide.heightPoints);
console.table(scene.shapes.map(s => ({
  name: s.name,
  id: s.runtimeNodeId,
  x: s.bounds?.left,
  y: s.bounds?.top,
  w: s.bounds?.width,
  h: s.bounds?.height,
  rot: s.bounds?.rotation
})));
console.log(scene.identityDiagnostics);
console.log(scene.lifecycleDiagnostics);
```

Expected:

- Scene geometry is in slide points.
- No shape requires selection to appear in `scene.shapes`.
- Off-slide shapes preserve negative or beyond-slide coordinates.
- `identityDiagnostics.isHealthy` is `true` on normal slides.
- `lifecycleDiagnostics.contractVersion` is `scene-lifecycle-diagnostics.v1`.

## Runtime Identity Lifecycle

Duplicate/copy-paste should never leave two live shapes with the same `runtimeNodeId`.

```js
yoanime.events.on("scene.changed", event => {
  console.log("scene.changed", event.payload.lifecycleDiagnostics);
});

const scene = await yoanime.scene.get({
  includeGeometry: true,
  includeShapeType: true,
  includeTags: true
});

console.table(scene.shapes.map(s => ({
  name: s.name,
  runtimeNodeId: s.runtimeNodeId,
  pptShapeId: s.powerPointShapeId
})));

console.log(scene.identityDiagnostics);
console.log(scene.lifecycleDiagnostics);
```

Expected after duplicate/copy-paste:

- original and duplicate have different `runtimeNodeId` values
- `duplicateRuntimeNodeIdCount` is `0`
- `isHealthy` is `true`

Expected after insert/delete/cut/paste refresh:

- `scene.changed` fires after the authoritative scene update
- `lifecycleDiagnostics.addedCount`, `removedCount`, `reboundCount`, or `updatedCount` reflects the edit
- deleted selected layers do not remain active in the timeline

## Role Metadata

```js
const scene = await yoanime.scene.get({ includeGeometry: true });
for (const shape of scene.shapes) {
  const name = (shape.name || "").toLowerCase();
  if (name.includes("ball")) {
    await yoanime.scene.roles.set(shape.runtimeNodeId, { roles: ["ball"], tags: ["physics", "dynamic"] });
  }
  if (name.includes("ramp")) {
    await yoanime.scene.roles.set(shape.runtimeNodeId, { roles: ["ramp"], tags: ["physics", "static"] });
  }
  if (name.includes("floor")) {
    await yoanime.scene.roles.set(shape.runtimeNodeId, { roles: ["floor"], tags: ["physics", "static"] });
  }
}
console.table((await yoanime.scene.get({ includeGeometry: true, includeTags: true })).shapes.map(s => ({
  name: s.name,
  roles: (s.roles || []).join(",")
})));
```

Expected:

- Roles return through `scene.get({ includeTags: true })`.
- No C#, COM, or PowerPoint Object Model knowledge is required.

## Timeline Bake

```js
const scene = await yoanime.scene.get({ includeGeometry: true });
const shape = scene.shapes[0];

await yoanime.timeline.bake({
  label: "SDK Smoke Spin",
  clear: ["Rotation"],
  layers: [{
    runtimeNodeId: shape.runtimeNodeId,
    properties: {
      Rotation: {
        keyframes: [
          { normalizedTime: 0, value: { number: 0 } },
          { normalizedTime: 1, value: { number: 180 } }
        ]
      }
    }
  }]
});

yoanime.timeline.playFrom(0);
```

Expected:

- The real PowerPoint shape rotates through COM playback.
- WPF does not flood the named pipe with repeated full timeline updates.

## Physics Preset

```js
const result = await yoanime.physics.presets.rampRoll({
  durationSeconds: 5,
  play: true
});
console.log(result);
console.table(yoanime.physics.diagnostics.summarizeBake(result).contactRows);
```

Expected:

- The preset bakes and plays.
- Diagnostics report contact samples.
- Collider diagnostics use slide points and do not report pane-DIP leakage for normal shapes.

## Surface Messaging

From overlay:

```js
await yoanime.taskpane.postMessage({ type: "smoke-test", from: "overlay" });
```

From taskpane:

```js
await yoanime.overlay.postMessage({ type: "smoke-test", from: "taskpane" });
```

Expected:

- Both surfaces receive messages through SDK events or their local UI wiring.
- Empty overlay area still passes through to PowerPoint after interaction ends.

## Extension Package Template

Install `docs/SdkSamples/1.0.2/extension-package-template` through:

```text
yoAnime Welcome Screen -> Extensions -> Install Extension Folder
```

Then zip the same folder and install it through:

```text
yoAnime Welcome Screen -> Extensions -> Install From Zip
```

Expected:

- The folder install succeeds.
- The zip install succeeds.
- Run/Reload works without copying files into repo extension folders.
- The taskpane can show the overlay.
- The overlay can scan scene geometry.
- Empty overlay space remains click-through friendly.

## Multi-Presentation Sanity

1. Close the current presentation.
2. Open a second presentation.
3. Open Two Surface Starter again.
4. Run `runtime.getCapabilities()` and `scene.get()`.

Expected:

- Active pane counts do not accumulate closed presentations.
- Runtime target IDs match the current presentation window.
- New scene data does not leak old shapes.
