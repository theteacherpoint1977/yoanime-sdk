---
id: doc:yoanimesdkreference-0.5.0
tags:
- reference-extension
domain: reference-extension
authority: reference
lifecycle: active
reading-priority: 5
ai-priority: 5
audience:
- all
---
# yoAnime SDK Reference 0.5.0

Status: Platform **v0.5.0** — SDK contract **v0.4.0** (see Versioning).

This document is the public SDK surface for yoAnime **Platform v0.5.0**. The canonical contract is `types/yoanime-sdk.d.ts` (`/* yoAnime Studio Runtime SDK v0.4.0 */`, 2,396 lines, 34 top-level namespaces, 213 callable members, 111 DTO types). The version distinction is intentional (see below).

## Versioning

* **Platform / Release:** `v0.5.0` (GitHub tag `v0.5.0` → commit `f49ff5a`, release 2026-08-31)
* **SDK contract:** `v0.4.0` (header in `types/yoanime-sdk.d.ts`)
* **Bridge / facade:** shipped with Platform v0.5.0; contract is additive within `0.4.0` — no breaking change. Developers should use `yoanime.runtime.getCapabilities()` to read the live `sdkVersion`/`hostVersion` at runtime. Public docs version `0.5.0` supersedes `1.0.2`.

## Platform Laws

- Browser extensions send intent only.
- WPF owns runtime state, scene state, timeline state, projection, permission checks, and extension sessions.
- VSTO/COM is the only layer that mutates real PowerPoint shapes.
- JavaScript never receives COM objects, RCWs, or raw Office handles.
- Persistent shape identity is `runtimeNodeId`, backed by yoAnime metadata on the PowerPoint shape.
- Shape names are display labels, not stable identifiers.
- Procedural scripts should prefer `animation.create → preview → commit` (higher-level) or `timeline.bake` (lower-level) over many sequential direct property edits.
- Permissions are enforced by the host gateway.

## Draft Contract Classification

`0.5.0` uses:

- `stable`: safe public APIs for this release.
- `preview`: powerful APIs available to trusted developers, but contract may change.
- `internal`: host plumbing, first-party-only workflows.

| Namespace | Methods / Surface | Stability | Permission | Surface | Notes |
| --- | --- | --- | --- | --- | --- |
| `runtime` | `ready`, `getCapabilities`, `surface`, `onWarning`, `onSessionEnded` | stable | none | both | Bridge readiness, version, permissions, surface identity. |
| `events` | `on` | stable | depends on event | both | Notifications only; call getters before authoritative decisions. |
| `selection` | `get`, `onChanged`, `onCleared` | stable | `selection.read` | both | Shape selection flow normalized across taskpane and overlay. |
| `scene` | `get`, `roles.set`, `query`, `findOne`, `explainQuery`, `onUpdated` | stable | `scene.read`, `scene.write` for roles | both | Scene identity, slide-point geometry, semantic roles/tags, query DSL. |
| `scene` | `build`, `mutateShape`, `batchMutate`, `group`, `ungroup` | preview | `scene.write` / `shapes.write` | both | Direct mutations; prefer `animation.*` or `timeline.bake` for animation. |
| `shapes` | `get`, `setPosition`, `setRotation`, `setSize`, `setScale`, `batchMutate` | preview | `shapes.write` | both | Direct shape mutation helpers. |
| `slide` / `geometry` | `getContext`, `slideToScreen`, `screenToSlide` | stable | `geometry.read` | both | Projection and hit testing; persist animation values in slide points. |
| `timeline` | `get`, `bake`, `play`, `stop`, `scrub`, `scrubTo`, `scrubBegin`, `scrubUpdate`, `scrubEnd`, `playFrom`, `onUpdated`, `onTick` | stable | `timeline.read`, `timeline.write`, `timeline.playback` | both | Deterministic execution/playback layer. `bake` is lower-level authoring; `animation.commit` calls it internally. |
| `timeline` | `propertytrack.*`, `layers.*`, `history.*`, `save/load`, `saveToPresentation/loadFromPresentation`, `presets.*`, `rebaseTrack`, `setLayerState`, `getLayers`, etc. | preview | `timeline.write` | both | Direct editor APIs for advanced timeline tools. |
| `timeline` | `import`, `export` | internal | host only | both | Not a live public scripting path. |
| `playback` | `onStarted`, `onStopped` | stable | `timeline.playback` | both | Runtime playback lifecycle. |
| `slideshow` | `getStatus`, `onStarted`, `onSlideChanged`, `onEnded` | stable | `slideshow.read` | both | Read-only slideshow lifecycle/status. |
| `overlay` / `taskpane` | `show`/`hide`/`toggle`/`getState`/`setInteractive`/`postMessage`/`onMessage` | stable | `interaction.write`, `surface.messaging` | both | Two-surface coordination; empty overlay space should pass through. |
| `interaction` | `capturePointer`, `releasePointer`, `beginDrag`, `endDrag` | stable | `interaction.write` | overlay | Pointer ownership during web handle drags. |
| `channels` | `open`, `get`, `list`, `publish`, `subscribe`, `close`, `getState`, `onMessage` | stable | `surface.messaging` | both | JSON-safe taskpane/overlay coordination. |
| `extensions` | `getInstalled` | stable | `extensions.read` | taskpane | Listing only. |
| `extensions` | `mount`, `unmount`, `toggle` | internal | `extensions.write` | host | Launcher lifecycle plumbing, not ordinary extension API. |
| `webSurface` | `list`, `refresh`, `onEvent` | stable | `websurface.read` | both | Read current Web Surfaces and sanitized iframe events. |
| `webSurface` | `create`, `update`, `remove` | preview | `websurface.write` | both | Authoring APIs remain VSTO-authoritative and may evolve. |
| `motionProviders` | `list`, `get`, `generate`, `bake` | stable | `timeline.write` for bake | both | Main procedural provider consumption path. |
| `motionProviders` | `ir.normalize/validate/toBakeRequest`, `validate/validateInputs/validatePack`, `register/unregister/registerPack/unregisterPack/listPacks/getPack/createContext/onChanged` | preview | none or `timeline.write` when baking | both | Trusted developer extension/provider authoring path. |
| built-in providers | `yoanime.physics.*`, `yoanime.noise.*`, `yoanime.constraint.*`, `yoanime.path.*`, `yoanime.lottie.transform`, `yoanime.ai.prompt-motion`, `yoanime.ik.two-bone-chain`, `yoanime.expression.*` (20 ids) | stable callable | varies by bake/read usage | both | Provider internals may evolve; IDs are callable through `generate`/`bake`. |
| `physics` | `createWorldFromScene`, `generateSimulation`, `bakeSimulation`, `inspectWorld`, `compareSceneToSlide`, `diagnostics.*`, `primitives.*`, `presets.*` | stable | `scene.read`, `geometry.read`, `timeline.write` for bake | both | Public physics helper surface. |
| `noise` | `hashSeed`, `random`, `smoothstep`, `value1D`, `generateKeyframes`, `generateWiggle` | stable | none | both | Pure deterministic noise helpers. |
| `constraints` | `boundsOf`, `findShape`, `resolvePair`, `generateFollow/LookAt/MaintainDistance` + `list/get/create/update/remove/onChanged` | stable | `constraint.read` / `constraint.write` | both | Pure helpers + closed V1 taxonomy `Follow/MaintainDistance/LookAt/MaintainOffset`. |
| `behavior` | `list/get/create/update/remove/reorder/setEnabled/onChanged` | stable | `behavior.read` / `behavior.write` | both | Closed V1 taxonomy `Patrol/FollowTarget/Wander/Guard/Evade/Idle`. |
| `relationship` | `create/update/delete/list/setAll/select/getPositions` | stable | `relationship.write` (all 7 routes) | both | Closed V1 `Follow` — all routes require `relationship.write`. |
| `paths` | `parsePolyline/samplePolyline/sampleSvgPath/ellipsePoints/generateFollowPath/generateOrbitTarget` | stable | none (helpers) + `timeline.write` via generate | both | Pure SVG/path sampling helpers and path motion generation. |
| `lottie` | `parse/getDurationSeconds/listLayers/selectLayer/normalizeAnimatedValues` | stable | none | both | Local parsing/helpers. |
| `lottie` | `generateTransform` | preview | `timeline.write` when baking | both | Full Lottie import semantics may evolve. |
| `ai` | `normalizeRequest`, `explainPrompt` | stable | none | both | Pure deterministic helpers, no host cost. |
| `ai` | `generatePromptMotion` | preview | `timeline.write` when baking | both | AI provider contract — fidelity may evolve. |
| `data` | `validateSource/registerSource/unregisterSource/listSources/getSource/read/refresh/refreshAll/clearCache/onChanged` | preview | `data.read`, `data.write` | both | Phase 100 data-driven motion provider support. |
| `dev` | `inspectRuntime/inspectProviders/inspectScene/inspectWebSurfaces/inspectChannels/inspectDataSources/validateMotion/explainBake/getRecentEvents/getRecentErrors` | preview | `diagnostics.read` | both | Trusted developer debugging only. |
| `trajectory` | all APIs | internal | `trajectory.read/write` | overlay | First-party motion path visualization/editing. |
| `ik` | `solveTwoBone`, `generateTwoBone` | stable | none (pure math) / `timeline.write` for generate | both | Two-bone IK: pure deterministic math; `generateTwoBone` transitively certified. |
| `ik` | `solveChain` | preview | none | both | FABRIK chain solver — presence-only, no built-in consumer yet. |
| `expressions` | `generateFromExpression` | stable | `timeline.write` when baking | both | Direct dependency of five `yoanime.expression.*` providers. |
| `expressions` | `evaluate` | preview | none | both | Synchronously evaluates an expression against a context. |
| `expressions` | `_parse`, `_eval` | internal | none | both | Implementation detail for `evaluate`/`generateFromExpression`. |
| `transforms` | `previewRotation`, `commitRotation`, `onChanged` | preview | `shapes.write` | both | Fire-and-forget rotation preview/commit (void). |
| `commands` | `rotate`, `translate`, `scale`, `setPivot`, `onChanged` | preview | `shapes.write` | both | Fire-and-forget imperative shape commands (void). |
| `animation` | `create`, `list`, `get`, `update`, `remove`, `reorder`, `onChanged`, `preview`, `commit`, `save`, `load`, `undo`, `redo` | preview (v0.5) | `animation.read` (list/get/preview/save/load/onChanged) and `timeline.write` (create/update/remove/reorder/commit) | taskpane; framed overlay proxy incomplete | Higher-level animation authoring model: `create→preview→commit→timeline`. Host-minted `animationId`, ordered, versioned. `commit` bakes to `timeline` (`timelineVersion++`). The public package-template `js/yoAnimeBridge.js` iframe proxy currently does not expose an `animation` namespace; overlay support requires a bridge/host path that provides these methods and a passing surface-specific smoke test. |

### Inventory

* **34 top-level namespaces** (`YoAnimeSdk` properties) — see table.
* **213 callable members** counted from the canonical d.ts (every `()` member, distinct).
* **111 DTO/type definitions** (e.g., `AnimationDto`, `TimelineSnapshot`, `GeneratedMotionIr`, `ConstraintDto`).

Do not use the old “130+ APIs” figure — it undercounted `timeline`/`physics`/`motionProviders` sub-APIs.

## Animation Authoring Model

`animation.*` is a higher-level authoring graph that composes `timeline` property-tracks, `motionProviders` output, and imperative `transforms`/`commands`. It does **not** replace the deterministic timeline runtime.

```text
procedural / extension logic
        ↓
animation.create({ label, durationSeconds, layers:[{runtimeNodeId, properties:{PositionX:{keyframes:[{normalizedTime, value:{number}}]}}}], metadata })
        ↓
animation.list() / get(animationId)  — ordered, versioned, host-minted animationId
        ↓
animation.preview({animationId})  →  ghost GeneratedMotionIr (no host mutation, no timelineVersion bump)
        ↓
animation.commit({animationId})  →  Timeline Bake Request  →  timelineVersion++  →  history transaction
        ↓
timeline.play({startTimeSeconds:0})  — PowerPoint playback (replay is committed timeline, does NOT rerun procedural logic)
```

**Identity / versioning:** `animationId` is host-minted (like `constraintId`/`behaviorId`), never client-minted. Each mutation bumps `version`; `list` returns ordered membership.

**Preview vs commit:** `preview` is ghost IR for validation/diagnostics (no COM); `commit` applies to `TimelineCacheService`/`TimelineSnapshot` and is undoable via `timeline.history` or `animation.undo/redo`.

**Persistence:** `save({animationId, slot})` / `load({slot})` persist through presentation slot; `undo`/`redo` are session history.

**Events:** `animation.changed` (`{sceneId, animationId?, operation}`) is notification only — call `animation.get`/`timeline.get` for truth.

**Permissions:** `animation.read` for list/get/preview/save/load/onChanged; `timeline.write` for create/update/remove/reorder/commit (reuses timeline gate).

**Not automatic:** `animation.*` does not automatically perform physics or IK. Compose providers explicitly via `animation.layers[].motionProvider`.

## Other Surfaces (summary)

See `ArchitectureOverview.md` for the full runtime diagram. Key points:

- `timeline.*` remains the deterministic execution layer; `timeline.bake` is the lower-level direct path.
- `motionProviders.generate→bake`, `physics`, `noise`, `paths`, `constraints`, `ik`, `expressions`, `transforms`/`commands` feed either `animation.layers` or `timeline.bake`.
- `scene`/`selection`/`geometry`/`slide` provide slide-point identity and projection; `runtimeNodeId` is the stable identity.
- `overlay`/`taskpane`/`channels`/`webSurface`/`interaction`/`extensions` are verified stable for extension UI coordination.
- `data`/`lottie`/`ai`/`dev`/`trajectory` are preview/internal as marked.

