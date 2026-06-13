# yoAnime SDK Reference 1.0.2

Status: SDK and extension platform preview.

This document is the public SDK surface for yoAnime `1.0.2.0`. It is intentionally smaller than the full internal runtime surface. The goal is to give developers enough power to build real taskpane and overlay extensions without exposing C#, VSTO, COM, or raw PowerPoint Object Model objects.

## Platform Laws

- Browser extensions send intent only.
- WPF owns runtime state, scene state, timeline state, projection, permission checks, and extension sessions.
- VSTO/COM is the only layer that mutates real PowerPoint shapes.
- JavaScript never receives COM objects, RCWs, or raw Office handles.
- Persistent shape identity is `runtimeNodeId`, backed by yoAnime metadata on the PowerPoint shape.
- Shape names are display labels, not stable identifiers.
- Procedural scripts should prefer `timeline.bake()` over many sequential direct property edits.

## Draft Contract Classification

`1.0.2.0` uses a conservative SDK draft freeze for trusted developers:

- `stable`: safe public APIs we expect developers to rely on in `1.0.2.0`.
- `preview`: powerful APIs available to trusted developers, but contract details may change.
- `internal`: host plumbing, first-party-only workflows, or APIs that can break user decks if misused.

| Namespace | Methods / Surface | Stability | Permission | Surface | Notes |
| --- | --- | --- | --- | --- | --- |
| `runtime` | `ready`, `getCapabilities`, `surface` | stable | none | both | Bridge readiness, version, permissions, and surface identity. |
| `events` | `on` | stable | depends on event | both | Notifications only; call getters before authoritative decisions. |
| `selection` | `get`, `onChanged`, `onCleared` | stable | `selection.read` | both | Shape selection flow normalized across taskpane and overlay. |
| `scene` | `get`, `roles.set`, `query`, `findOne`, `explainQuery` | stable | `scene.read`, `scene.write` for roles | both | Scene identity, slide-point geometry, semantic roles/tags, query DSL. |
| `scene` | `mutateShape`, `batchMutate`, `group`, `ungroup` | preview | `scene.write` / `shapes.write` | both | Direct mutations; prefer `timeline.bake` for public animation samples. |
| `slide` / `geometry` | `getContext`, `slideToScreen`, `screenToSlide` | stable | `geometry.read` | both | Projection and hit testing; persist animation values in slide points. |
| `timeline` | `get`, `bake`, `play`, `stop`, `scrub`, `scrubTo`, `playFrom`, `onUpdated`, `onTick` | stable | `timeline.read`, `timeline.write`, `timeline.playback` | both | Main public animation authoring and playback path. |
| `timeline` | property-track/keyframe/layer/preset/history/save/load APIs | preview | `timeline.write` | both | Direct editor APIs for advanced timeline tools. |
| `timeline` | raw `import`, `export` | internal | host only | both | Not a live public scripting path in `1.0.2.0`. |
| `playback` | `onStarted`, `onStopped` | stable | `timeline.playback` | both | Runtime playback lifecycle. |
| `slideshow` | `getStatus`, `onStarted`, `onSlideChanged`, `onEnded` | stable | `slideshow.read` | both | Read-only slideshow lifecycle/status. |
| `overlay` / `taskpane` | visibility, interactivity, `postMessage`, `onMessage` | stable | `interaction.write`, `surface.messaging` | both | Two-surface coordination; empty overlay space should pass through to PowerPoint. |
| `interaction` | `capturePointer`, `releasePointer`, `beginDrag`, `endDrag` | stable | `interaction.write` | overlay | Pointer ownership during web handle drags. |
| `channels` | `open`, `get`, `list`, `publish`, `subscribe`, `close`, `getState` | stable | `surface.messaging` | both | JSON-safe taskpane/overlay coordination. |
| `extensions` | `getInstalled` | stable | `extensions.read` | taskpane | Listing only. |
| `extensions` | `mount`, `unmount`, `toggle` | internal | `extensions.write` | host | Launcher lifecycle plumbing, not ordinary extension API. |
| `webSurface` | `list`, `refresh`, `onEvent` | stable | `websurface.read` | both | Read current Web Surfaces and sanitized iframe events. |
| `webSurface` | `create`, `update`, `remove` | preview | `websurface.write` | both | Authoring APIs remain VSTO-authoritative and may evolve. |
| `motionProviders` | `list`, `get`, `generate`, `bake` | stable | `timeline.write` for bake | both | Main procedural provider consumption path. |
| `motionProviders` | register/pack/validation/IR/context/change APIs | preview | none or `timeline.write` when baking | both | Trusted developer extension/provider authoring path. |
| built-in providers | physics, noise, constraint, path, Lottie, AI prompt-motion IDs | stable callable | varies by bake/read usage | both | Provider internals may evolve; IDs are callable through `generate`/`bake`. |
| `physics` | world, simulation, diagnostics, presets, primitives | stable | `scene.read`, `geometry.read`, `timeline.write` for bake | both | Public physics helper surface. |
| helpers | `noise`, `constraints`, `paths`, `lottie`, `ai` pure helpers | stable | none unless they call host APIs | both | Local helper contracts; Lottie/AI provider contracts are preview. |
| `data` | data source APIs | preview | `data.read`, `data.write` | both | Phase 100 data-driven motion provider support. |
| `dev` | diagnostics toolkit | preview | `diagnostics.read` | both | Trusted developer debugging only. |
| `trajectory` | all APIs | internal | `trajectory.read/write` | overlay | First-party motion path visualization/editing. |

## Stable APIs

### Runtime

```js
await yoanime.runtime.ready();
const capabilities = await yoanime.runtime.getCapabilities();
```

`runtime.ready()` waits for the SDK bridge to be available. `runtime.getCapabilities()` reports SDK version, permissions, session identity, platform laws, and API stability.

For extension sessions, `runtime.getCapabilities()` also reports `trust` and `permissionRisk` so an extension can expose a useful diagnostics panel:

```js
const caps = await yoanime.runtime.getCapabilities();
console.log(caps.trust, caps.permissionRisk);
```

### Events

```js
const unsubscribe = yoanime.events.on("scene.updated", event => {
  console.log(event.payload);
});
```

Events are notifications only. Call the relevant getter before making authoritative decisions.

### Selection

```js
const selected = await yoanime.selection.get();
yoanime.selection.onChanged(shape => console.log(shape.runtimeNodeId));
yoanime.selection.onCleared(() => console.log("nothing selected"));
```

### Scene

```js
const scene = await yoanime.scene.get({
  includeGeometry: true,
  includeShapeType: true,
  includeTags: true
});
```

`scene.get()` returns slide-point geometry. These values are not screen pixels and are not overlay coordinates.

`scene.get()` also returns identity/lifecycle diagnostics:

```js
console.log(scene.identityDiagnostics);
console.log(scene.lifecycleDiagnostics);
```

Use `scene.changed` to react to insert/delete/duplicate/cut/paste and then request an authoritative scene snapshot:

```js
yoanime.events.on("scene.changed", async event => {
  console.log(event.payload.lifecycleDiagnostics);
  const freshScene = await yoanime.scene.get({ includeGeometry: true, includeTags: true });
});
```

Use roles to attach semantic intent:

```js
await yoanime.scene.roles.set(shape.runtimeNodeId, {
  roles: ["ball"],
  tags: ["physics", "dynamic"],
  metadata: {
    restitution: "0.8",
    friction: "0.04"
  }
});
```

### Slide Geometry

```js
const ctx = await yoanime.slide.getContext();
console.log(ctx.slide.widthPoints, ctx.slide.heightPoints);
```

Slide context describes the animation world:

- slide bounds in PowerPoint points
- off-slide pasteboard helper bounds
- editor viewport/projection data
- geometry confidence
- physics-friendly walls and floor

### Geometry Projection

```js
const screen = await yoanime.geometry.slideToScreen(120, 80);
const slide = await yoanime.geometry.screenToSlide(screen.x, screen.y);
```

Use projection for overlay guides, hit testing, and diagnostics. Persist animation values in slide points.

### Timeline Bake And Playback

```js
await yoanime.timeline.bake({
  label: "Spin",
  layers: [{
    runtimeNodeId,
    properties: {
      Rotation: {
        keyframes: [
          { normalizedTime: 0, value: { number: 0 } },
          { normalizedTime: 1, value: { number: 360 } }
        ]
      }
    }
  }]
});

yoanime.timeline.playFrom(0);
```

Stable timeline APIs:

- `timeline.get()`
- `timeline.bake(request)`
- `timeline.play(options?)`
- `timeline.stop()`
- `timeline.scrub(timeSeconds)`
- `timeline.scrubTo(timeSeconds?)`
- `timeline.playFrom(timeSeconds?)`
- `timeline.onUpdated(callback)`
- `timeline.onTick(callback)`
- `playback.onStarted(callback)`
- `playback.onStopped(callback)`

### Procedural Motion Providers

`yoanime.motionProviders` is the shared contract for procedural animation engines. Providers can be physics engines, noise/wiggle generators, expressions, constraints, SVG/path tools, particle systems, layout engines, IK solvers, Lottie importers, AI motion generators, or custom extension logic.

```js
await yoanime.motionProviders.register({
  id: "sample.wiggle-lite",
  label: "Wiggle Lite",
  kind: "noise",
  generate: async context => ({
    label: "Wiggle Lite",
    durationSeconds: context.durationSeconds,
    layers: []
  })
});

const providers = yoanime.motionProviders.list();
const generated = await yoanime.motionProviders.generate("sample.wiggle-lite", {
  durationSeconds: 2
});
await yoanime.motionProviders.bake("sample.wiggle-lite", { play: true });
```

Stable provider consumption APIs:

- `motionProviders.list()`
- `motionProviders.get(providerId)`
- `motionProviders.generate(providerId, request?)`
- `motionProviders.bake(providerId, request?)`

Preview provider authoring APIs:

- `motionProviders.validate(provider)`
- `motionProviders.validateInputs(inputs)`
- `motionProviders.validatePack(pack)`
- `motionProviders.ir.normalize(output, fallback?)`
- `motionProviders.ir.validate(ir)`
- `motionProviders.ir.toBakeRequest(ir, overrides?)`
- `motionProviders.register(provider, options?)`
- `motionProviders.unregister(providerId)`
- `motionProviders.registerPack(pack, options?)`
- `motionProviders.unregisterPack(packId)`
- `motionProviders.listPacks()`
- `motionProviders.getPack(packId)`
- `motionProviders.createContext(request?)`
- `motionProviders.onChanged(callback)`

Phase 94 provider packs:

```js
await yoanime.motionProviders.registerPack({
  id: "sample.motion-pack",
  label: "Sample Motion Pack",
  version: "1.0.0",
  sharedInputs: {
    durationSeconds: { type: "duration", default: 1.5 }
  },
  providers: [
    {
      id: "sample.motion-pack.soft-wiggle",
      label: "Soft Wiggle",
      kind: "noise",
      inputs: {
        amplitude: { type: "range", min: 0, max: 80, default: 24 }
      },
      generate: async context => ({ layers: [] })
    }
  ]
});

console.table(yoanime.motionProviders.listPacks());
```

Input schema type `string` is accepted as a legacy alias for `text`.

Phase 95 Generated Motion IR:

```js
const result = await yoanime.motionProviders.generate("sample.generated-motion-ir.pulse-x", {});
console.log(result.ir);
console.table(result.diagnostics);

const validation = yoanime.motionProviders.ir.validate(result.ir);
const bakeRequest = yoanime.motionProviders.ir.toBakeRequest(result.ir);
await yoanime.timeline.bake(bakeRequest);
```

### Scene Query DSL

```js
const selected = await yoanime.scene.query("selected");
const balls = await yoanime.scene.query("role:ball visible:true");
const target = await yoanime.scene.findOne({ name: "*target*", visible: true });
const explain = await yoanime.scene.explainQuery("role:missing");
```

Providers can use `context.query(...)` inside `generate(...)` to resolve selected shapes, roles, nearest targets, and wildcard names without duplicating scene parsing.

### Runtime Channels

```js
const channel = await yoanime.channels.open("blackhole-demo");
const unsubscribe = channel.subscribe("gravity.changed", event => {
  console.log(event.payload);
});

await channel.publish("gravity.changed", { strength: 2.5 });
```

Channels are JSON-safe and scoped to the current runtime/extension session. They coordinate taskpane and overlay surfaces without granting native bridge authority.

### Noise / Wiggle Providers

Phase 91 adds deterministic noise helpers and built-in wiggle providers:

```js
const keyframes = yoanime.noise.generateKeyframes({
  amplitude: 30,
  frequency: 4,
  durationSeconds: 2,
  seed: "repeatable"
});

await yoanime.motionProviders.bake("yoanime.noise.wiggle-position", {
  amplitude: 30,
  frequency: 4,
  durationSeconds: 2,
  seed: "title-wiggle",
  play: true
});
```

Built-in noise providers:

- `yoanime.noise.wiggle-position`
- `yoanime.noise.wiggle-rotation`
- `yoanime.noise.float`

### Constraint Providers

Phase 92 adds relationship-based constraint helpers and providers:

```js
await yoanime.motionProviders.bake("yoanime.constraint.follow-target", {
  targetName: "Target",
  durationSeconds: 1,
  play: true
});

await yoanime.motionProviders.bake("yoanime.constraint.look-at", {
  targetRole: "target",
  angleOffset: 0,
  play: true
});
```

Built-in constraint providers:

- `yoanime.constraint.follow-target`
- `yoanime.constraint.look-at`
- `yoanime.constraint.maintain-distance`

### SVG Path / Morph Providers

Phase 93 adds path sampling helpers and path-follow providers:

```js
await yoanime.motionProviders.bake("yoanime.path.follow-svg", {
  pathData: "M 120 220 C 240 80 420 360 620 180",
  durationSeconds: 3,
  sampleCount: 90,
  play: true
});

await yoanime.motionProviders.bake("yoanime.path.orbit-target", {
  targetName: "Target",
  radiusX: 160,
  radiusY: 90,
  durationSeconds: 4,
  play: true
});
```

Built-in path providers:

- `yoanime.path.follow-svg`
- `yoanime.path.orbit-target`

True shape morphing remains future work; Phase 93 is path-follow motion through normal timeline transform tracks.

### Physics Helpers

```js
const world = await yoanime.physics.createWorldFromScene({
  inferFromNames: true,
  rampPadding: 6,
  ignoreInitialBallRotation: true
});

console.table(yoanime.physics.inspectWorld(world));
console.table(yoanime.physics.compareSceneToSlide(world).rows);

await yoanime.physics.presets.rampRoll({
  durationSeconds: 5,
  play: true
});
```

Stable physics APIs:

- `physics.createWorldFromScene(options?)`
- `physics.generateSimulation(request?)`
- `physics.inspectWorld(world, options?)`
- `physics.compareSceneToSlide(sceneOrWorld, slideContext?, options?)`
- `physics.bakeSimulation(request?)`
- `physics.diagnostics.analyzeWorld(world, options?)`
- `physics.diagnostics.summarizeBake(result, options?)`
- `physics.presets.rampRoll(options?)`
- `physics.presets.projectileImpact(options?)`
- `physics.presets.fallingStack(options?)`
- `physics.presets.multiBallCascade(options?)`

Matter.js may be loaded by the extension page or passed as `options.Matter`.

Phase 90 physics primitives:

```js
const gravity = yoanime.physics.primitives.gravity(0, 1, 0.001);
const impulse = yoanime.physics.primitives.impulse({
  role: "ball",
  velocityX: 3,
  angularVelocity: 0.08
});

const generated = await yoanime.physics.generateSimulation({
  gravity,
  beforeSimulate: impulse,
  durationSeconds: 4
});
```

Built-in physics motion providers are discoverable through the provider contract:

```js
const physicsProviders = yoanime.motionProviders.list()
  .filter(provider => provider.kind === "physics");

await yoanime.motionProviders.bake("yoanime.physics.ramp-roll", {
  durationSeconds: 4.5,
  play: true
});
```

### Surfaces

Taskpane and overlay pages are separate WebView2 instances. Communicate through the SDK bridge:

```js
await yoanime.overlay.show();
await yoanime.overlay.setInteractive(true);
await yoanime.overlay.postMessage({ type: "hello" });

yoanime.taskpane.onMessage(event => console.log(event.message));
```

Stable surface APIs:

- `overlay.show/hide/toggle/getState/setInteractive/postMessage/onMessage`
- `taskpane.postMessage/onMessage`
- `interaction.capturePointer/releasePointer/beginDrag/endDrag`

Empty overlay regions should pass through to PowerPoint. Mark web controls with `data-yoanime-interactive="true"`.

### Extensions

```js
const installed = await yoanime.extensions.getInstalled();
```

`getInstalled()` is stable. Extension mount/unmount/toggle is host lifecycle plumbing and not a public extension API in `1.0.2.0`.

## Preview APIs

These APIs exist, but their contract can change:

- direct `yoanime.shapes.*` mutation
- `scene.mutateShape`, `scene.batchMutate`, `scene.group`, `scene.ungroup`
- direct timeline keyframe/property-track editing
- timeline layer APIs
- timeline persistence APIs
- preset pack registration APIs
- motion provider registration, provider packs, and Generated Motion IR helpers
- `yoanime.data.*`
- `webSurface.create`, `webSurface.update`, `webSurface.remove`
- developer diagnostics toolkit APIs
- Lottie and AI provider contracts

Use them for first-party experiments only unless you are comfortable updating your extension later.

## Internal APIs

Do not use these from public extensions:

- `yoanime.trajectory.*`
- `yoanime.commands.*`
- `yoanime.transforms.*`
- `yoanime.extensions.mount/unmount/toggle`
- raw `timeline.import/export` as a live scripting path
- direct COM concepts, raw PowerPoint handles, host lifecycle controls, compositor ownership, raw IPC, or WPF/VSTO internals

## Installing An Extension

The official product path is the WPF Extension Manager:

```text
yoAnime Welcome Screen -> Extensions -> Install Extension Folder / Install From Zip
```

The Extension Manager validates the manifest, installs the extension into the user extension library, and runs it against the active PowerPoint task pane. Manual copying is only a development/debug fallback.

The frozen `1.0.2.0` package contract is documented in `docs/ExtensionPackageContract-1.0.2.md`.

## Required Files For An Extension

Public third-party package:

```txt
MyExtension/
  manifest.json
  taskpane.html
  overlay.html
  assets/
```

Taskpane-only packages can omit `overlay.html`. Overlay-only packages can omit `taskpane.html`. The repo's split `yoAnimeShared` / `CustomRotationPointApp` layout is for first-party source organization.

## Manifest Example

```json
{
  "manifestVersion": 2,
  "id": "my-physics-extension",
  "name": "My Physics Extension",
  "version": "0.1.0",
  "surface": "overlay-taskpane",
  "entry": "overlay.html",
  "taskPaneEntry": "taskpane.html",
  "sdkVersionMin": "0.3.0",
  "permissions": [
    "selection.read",
    "scene.read",
    "scene.write",
    "geometry.read",
    "timeline.read",
    "timeline.write",
    "timeline.playback",
    "slideshow.read",
    "interaction.write"
  ],
  "capabilities": [
    "overlay.surface",
    "taskpane.surface",
    "surface.messaging",
    "physics.helpers"
  ]
}
```

## Recommended Developer Flow

1. Wait for `runtime.ready()`.
2. Read `runtime.getCapabilities()` and verify permissions.
3. Read `slide.getContext()` for the world.
4. Read `scene.get({ includeGeometry: true, includeTags: true })` for objects.
5. Use roles/tags to classify objects.
6. Generate keyframes in slide points.
7. Commit with `timeline.bake()`.
8. Play or scrub through the stable playback APIs.

## Slideshow Runtime V1

For `1.0.2.0`, slideshow playback is host-managed.

Extensions should author animations with stable timeline APIs such as `timeline.bake()`. When PowerPoint slideshow starts, yoAnime can use the cached authored timeline and run it through the existing native playback path.

Read-only lifecycle/status APIs are available:

```js
const status = await yoanime.slideshow.getStatus();

yoanime.slideshow.onStarted((event) => {});
yoanime.slideshow.onSlideChanged((event) => {});
yoanime.slideshow.onEnded((event) => {});
```

These APIs require `slideshow.read`. They do not allow extensions to start, stop, advance, or directly control the native PowerPoint slideshow window.

The slideshow bridge is documented in `docs/SlideshowRuntime-Phase71.md` and the public lifecycle surface is documented in `docs/SlideshowSdkLifecycle-Phase72.md`.

## Samples And Smoke Tests

Use these files as the public sample pack:

- `docs/DeveloperQuickStart-1.0.2.md`
- `docs/SdkSamples/1.0.2/README.md`
- `docs/SdkSamples/1.0.2/01-runtime-capabilities.js`
- `docs/SdkSamples/1.0.2/02-scene-geometry-identity.js`
- `docs/SdkSamples/1.0.2/03-bake-selection-spin.js`
- `docs/SdkSamples/1.0.2/04-role-based-fly-in.js`
- `docs/SdkSamples/1.0.2/05-physics-ramp-roll.js`
- `docs/SdkSamples/1.0.2/06-two-surface-messaging.js`
- `docs/SdkSamples/1.0.2/07-platform-smoke-suite.js`
- `docs/SdkSamples/1.0.2/08-motion-provider-wiggle.js`
- `docs/SdkSamples/1.0.2/09-physics-provider-ramp-roll.js`
- `docs/SdkSamples/1.0.2/10-noise-wiggle-provider.js`
- `docs/SdkSamples/1.0.2/11-constraint-provider-follow-target.js`
- `docs/SdkSamples/1.0.2/12-path-provider-follow-svg.js`
- `docs/SdkSamples/1.0.2/13-provider-pack-input-schema.js`
- `docs/SdkSamples/1.0.2/14-generated-motion-ir.js`
- `docs/SdkSamples/1.0.2/15-scene-query-dsl.js`
- `docs/SdkSamples/1.0.2/16-runtime-channel-api.js`
- `docs/SdkSamples/1.0.2/17-websurface-event-bridge.js`
- `docs/SdkSamples/1.0.2/18-developer-diagnostics-toolkit.js`
- `docs/SdkSamples/1.0.2/19-data-source-provider-sdk.js`
- `docs/SdkSamples/1.0.2/20-lottie-transform-provider.js`
- `docs/SdkSamples/1.0.2/21-ai-motion-provider-contract.js`
- `docs/SdkSamples/1.0.2/developer-sample-pack/`
- `docs/SdkPlatformSmokeTest-1.0.2.md`
- `docs/SdkReleaseChecklist-1.0.2.md`
