---
id: doc:releasenotes-0.5.0
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
# yoAnime SDK 0.5.0 Release Notes — Platform v0.5.0

Release: `v0.5.0` tag `f49ff5a1cf908f3d80c158573fb5957a099aa212` (2026-08-31) — SDK contract `v0.4.0` (`types/yoanime-sdk.d.ts` 2,396 lines).

## Versioning

* **Platform / Release:** `v0.5.0`
* **SDK contract:** `v0.4.0` (header in `types/yoanime-sdk.d.ts`). The contract is additive within `0.4.0` — no breaking change. `v0.5.0` certifies the new `animation.*` preview surface that composes the existing `0.4.0` contract. Use `yoanime.runtime.getCapabilities().sdkVersion` at runtime.

## What Is New in 0.5.0

### 1. Animation Authoring Model (`animation.*` — @preview, 13 methods)

Higher-level authoring that composes `timeline` tracks + `motionProviders` + `transforms`/`commands`:

* `animation.create/list/get/update/remove/reorder` — ordered, host-minted `animationId`, versioned.
* `animation.preview` — ghost `GeneratedMotionIr` (no mutation, no `timelineVersion` bump).
* `animation.commit` — bakes to `timeline` (`TimelineBakeRequest` → `PropertyTrackMutationService`, bumps `timelineVersion`, history transaction).
* `animation.save/load/undo/redo` — slot persistence + session history.
* `animation.onChanged` — notification `{sceneId, animationId?, operation}` (call `animation.get`/`timeline.get` for truth).
* Permissions: `animation.read` (list/get/preview/save/load/onChanged), `timeline.write` (create/update/remove/reorder/commit).

Pipeline:

```
animation.create → preview → commit → timeline.runtime → PowerPoint
```

Replay is committed timeline (`timeline.play`), not procedural regeneration. `timeline.bake` remains the lower-level direct path.

### 2. SDK Reference 0.5.0

* `docs/YoAnimeSdkReference-0.5.0.md` — recalculated **34 namespaces / 213 callable members / 111 DTO types** (corrects old “130+” figure).
* `docs/ArchitectureOverview.md` — added `animation.*` diagram; clarified `timeline.bake` vs `animation.commit`.

### 3. Developer Experience

* `docs/DeveloperQuickStart-1.0.2.md` now shows `animation.create → preview → commit → timeline.play` as the first-class example (4), keeping `timeline.bake` as 4b.
* `README.md` updated from `1.0.2.0 / 0.3.0` to `v0.5.0 / 0.4.0`.
* `samples/console-scripts/README.md` indexed the five local samples (particle-system, orbit, spiral, noise, spring) and reconciled the two GOLIATH demo scripts.

### 4. Samples

* **Published locally → GitHub:** `22-particle-system.js`, `23-orbit-motion.js`, `24-spiral-motion.js`, `25-noise-motion.js`, `26-spring-motion.js` (5 additional motion-provider consumption paths; now coherent catalog).
* **Reconciled GitHub → local:** `Project GOLIATH vs. CYBER-DRONE` + `Transparent` `.txt` (2 demo cinematic scripts, 623 + 790 additions, commit `588ec97`) — now included locally after sync.

### 5. Smoke Tests

* `smoke-tests/` retains `FinalSmokeMatrix-1.0.2.md` + `SdkPlatformSmokeTest-1.0.2.md` as the published matrix; local harnesses `AnimationHarness.js`, `AnimationRuntimeIntegrationHarness.js`, `AnnotationsEventsHarness.js`, `TranslateScaleGatewayHarness.js` remain **internal** (not published) and are documented as internal verification for `animation.*`/`translateScale`.

## Included Surfaces (summary)

**Stable / Verified:** `runtime`, `events`, `selection`, `scene` (get/roles/query), `slide`/`geometry`, `timeline` (get/bake/play/stop/scrub/onUpdated/onTick), `playback`, `slideshow`, `overlay/taskpane`, `interaction`, `channels`, `webSurface` (list/refresh/onEvent), `motionProviders` (list/get/generate/bake), `noise`, `constraints`, `behavior`, `relationship` (Follow), `paths`, `physics`, `ik.solveTwoBone/generateTwoBone`, `expressions.generateFromExpression`, `lottie/ai` helpers.

**Preview:** `animation.*` (13), `relationship` docs (reference now added), `scene.build/mutateShape/batchMutate/group`, `timeline` editor APIs (`propertytrack.*`, presets, history), `motionProviders` registration, `data`, `dev`, `ik.solveChain`, `expressions.evaluate`, `transforms`, `commands`.

**Internal:** `trajectory`, `debug`, `extensions.mount/toggle`, `expressions._parse/_eval`.

## Known Limitations (carry from 1.0.2)

* Motion Studio remains experimental / preview.
* Direct property-track editing is preview; prefer `animation.*` or `timeline.bake`.
* Slideshow playback is native timeline mutations (compositor playback deferred).
* Custom Web Surfaces depend on iframe embedding allowlists.
* Publisher signing/marketplace review not implemented.

## Certification

* `MISSION-11K-FINAL-V0.5-CERTIFICATION-REPORT.md` — Platform v0.5.0 certified (Animation E2E, Behavior, Constraints, Timeline/Scene/Selection, Extensions). Documented exception: 44 `motionProviders` preview/internal pre-existing failures (not v0.5 stable) — tracked in `MISSION-11J/11M`.

## Links

* `docs/YoAnimeSdkReference-0.5.0.md`
* `docs/DeveloperQuickStart-1.0.2.md` (now with animation path)
* `docs/ArchitectureOverview.md`
* `reference/extension/certification/README.md`
