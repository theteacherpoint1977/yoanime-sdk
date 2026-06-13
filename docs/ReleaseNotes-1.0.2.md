# yoAnime Studio 1.0.2.0 Release Notes

Release type: SDK and Extension Platform Preview

yoAnime Studio `1.0.2.0` focuses on the public extension platform, the JavaScript SDK, PowerPoint scene geometry, physics-powered timeline baking, and safer local extension installation.

## Highlights

- Welcome Screen Extension Manager is now the official install/run path for built-in and local extensions.
- Public extension package contract is documented for folders and zip packages.
- Manifest v2 permissions, surfaces, SDK versioning, and catalog metadata are documented.
- JavaScript SDK `0.3.0` exposes stable public APIs for runtime, selection, scene, slide geometry, timeline bake/playback, physics helpers, overlay/taskpane messaging, and extension listing.
- A preview procedural motion provider contract is available through `yoanime.motionProviders.*`, giving extensions one shared model for physics, noise, expressions, constraints, SVG/path systems, particles, layout engines, IK, Lottie, and AI motion generators to produce timeline-bake-compatible tracks.
- Physics is the first provider family on that contract: `yoanime.physics.generateSimulation(...)`, `yoanime.physics.primitives.*`, and built-in `yoanime.physics.*` motion providers let developers generate physics timeline layers before baking.
- Deterministic noise/wiggle helpers and built-in `yoanime.noise.*` motion providers provide AE-style wiggle/float tracks for selected PowerPoint shapes.
- Constraint helpers and built-in `yoanime.constraint.*` motion providers generate relationship-based follow, look-at, and maintain-distance transform tracks from slide geometry.
- SVG/polyline/orbit path helpers and built-in `yoanime.path.*` motion providers generate path-follow PositionX/Y tracks from sampled paths.
- Provider packs and input schema validation let extension authors register families of procedural providers with shared metadata, examples, docs, and UI-ready input definitions.
- Generated Motion IR v1 lets providers return diagnostics, preview hints, requirements, deterministic seed/source metadata, and bake instructions while preserving compatibility with legacy bake payloads.
- Scene Query DSL lets providers and extensions query cached scene DTOs by role, tag, name wildcard, shape type, visibility, selection, bounds, nearest target, and z-order without touching COM.
- Runtime Channel API lets taskpane and overlay surfaces coordinate through scoped JSON-safe channels without exposing native bridge authority.
- Web Surface Event Bridge lets sandboxed Web Surface iframes emit sanitized data-only events to opted-in SDK subscribers through `yoanime.webSurface.onEvent(...)`.
- Developer Diagnostics Toolkit exposes read-only `yoanime.dev.*` inspection, validation, bake explanation, and recent event/error APIs for extension authors.
- Data Source Provider SDK exposes browser-side `yoanime.data.*` sources with read/refresh/cache behavior, diagnostics, and provider-context access so extension authors can drive generated motion from JSON-safe data.
- Lottie transform extraction introduces a conservative `yoanime.lottie.*` helper family and built-in `yoanime.lottie.transform` provider that maps supported Lottie transform fields into Generated Motion IR for selected PowerPoint shapes.
- AI Motion Provider Contract introduces `yoanime.ai.*` helpers and a deterministic built-in `yoanime.ai.prompt-motion` provider that preserves prompt, seed, target, model, explanation, and diagnostics metadata while still baking through Generated Motion IR.
- Developer Sample Pack adds installable example extension folders for provider packs, runtime channels plus Web Surface events, data source driven motion, and Lottie/AI motion.
- Two Surface Starter includes a Physics Lab for assigning roles, tuning colliders, previewing diagnostics, baking Matter.js-style simulations, and playing the result in PowerPoint.
- Scene geometry is exposed in PowerPoint slide points so developers can build accurate procedural animations.
- Runtime identity diagnostics help detect duplicate/missing shape identities after insert/delete/duplicate/cut/copy/paste workflows.
- Local installed extensions show trust, permission risk, safe-mode status, and catalog metadata in the Extension Manager.
- Repeated failing local extensions are auto-disabled by safe mode with user recovery controls.
- Conservative slideshow runtime bridge can start cached yoAnime timeline playback during slideshow and stop cleanly when slideshow ends.
- Session-aware slideshow runtime diagnostics now track slideshow session identity, slide changes, cached timeline candidates, and active playback target through the host-managed bridge.
- Read-only slideshow SDK lifecycle/status APIs are available through `yoanime.slideshow.getStatus()`, `onStarted`, `onSlideChanged`, and `onEnded`.
- Physics Lab bakes can now be saved into the active PowerPoint presentation and auto-loaded during slideshow, so Matter.js-style physics animations can travel with the `.pptx` and play through yoAnime's native shape playback bridge.
- Web Surface placeholders can render built-in presets, HTTPS URLs, and packaged local HTML through the overlay renderer. Web Surface iframe content is sandboxed, does not receive the native SDK bridge, and respects browser embedding restrictions. Iframe content may emit data-only `yoanime.surface.event` messages; the trusted renderer shell annotates them with content, slide, origin, and trust metadata before SDK subscribers receive them.
- Web Surface Custom URLs now include allowlisted provider profiles for YouTube and Vimeo, converting normal watch/page URLs into official embed URLs while keeping unknown HTTPS sites under the strict generic profile.
- Web Surface placeholders now have a compact TaskPane properties panel with source/provider/shareability status and a safe fallback-preview capture action for selected placeholders.
- Web Surface Gallery provides a visual TaskPane insertion flow with built-in preset cards, Custom URL insertion, Local HTML insertion, and optional post-insert properties editing.
- Web Surface Properties now includes deck-level share readiness checks and a copyable readiness report for built-in presets, Custom URLs, Local HTML packages, hidden placeholders, and fallback previews.

## Developer-Facing SDK

Stable public extension path:

- `yoanime.runtime.ready`
- `yoanime.runtime.getCapabilities`
- `yoanime.selection.get`
- selection events
- `yoanime.scene.get`
- `yoanime.scene.roles.set`
- scene change events
- `yoanime.slide.getContext`
- `yoanime.geometry.slideToScreen`
- `yoanime.geometry.screenToSlide`
- `yoanime.timeline.get`
- `yoanime.timeline.bake`
- `yoanime.timeline.play`
- `yoanime.timeline.stop`
- `yoanime.timeline.scrub`
- `yoanime.timeline.scrubTo`
- `yoanime.timeline.playFrom`
- `yoanime.timeline.saveToPresentation`
- `yoanime.timeline.loadFromPresentation`
- `yoanime.slideshow.getStatus`
- `yoanime.slideshow.onStarted`
- `yoanime.slideshow.onSlideChanged`
- `yoanime.slideshow.onEnded`
- `yoanime.physics.*`
- `yoanime.physics.generateSimulation`
- `yoanime.physics.primitives.*`
- `yoanime.noise.*`
- `yoanime.constraints.*`
- `yoanime.paths.*`
- `yoanime.motionProviders.*`
- `yoanime.motionProviders.registerPack/listPacks/getPack/unregisterPack/validatePack/validateInputs`
- `yoanime.motionProviders.ir.normalize/validate/toBakeRequest`
- `yoanime.scene.query/findOne/explainQuery`
- `yoanime.channels.open/get/list/close/publish/subscribe/onMessage`
- `yoanime.overlay.*`
- `yoanime.taskpane.*`
- `yoanime.interaction.*`
- `yoanime.extensions.getInstalled`

## Included Proof Extensions

- Hello World SDK
- Rotation Transform Web
- Shape Tracker
- Timeline Starter for preview/internal timeline experiments
- Two Surface Starter with Physics Lab
- React Preset Gallery
- Motion Studio experimental workspace
- Developer sample pack: Procedural Provider Pack, Runtime Channel + Web Surface Events, Data Source Motion, and Lottie AI Motion

## Known Limitations

- Motion Studio is experimental and is not the main public promise of `1.0.2.0`.
- Direct property-track editing remains preview; public procedural extensions should prefer `timeline.bake`.
- Two Surface Starter / Physics Lab is a preview proof extension for the SDK and physics contracts, not a final full-featured physics authoring product.
- Extension gallery/update metadata is parsed and displayed, but online catalog install and automatic update checks are not active yet.
- Slideshow extension control APIs are reserved for future work; `1.0.2.0` exposes read-only slideshow status/lifecycle APIs and host-managed embedded timeline playback for native timeline data.
- Slideshow playback currently runs native timeline mutations. Advanced compositor/effect graph playback during slideshow is deferred.
- Custom URL Web Surfaces depend on the target website allowing iframe embedding. Sites that set `X-Frame-Options` or `frame-ancestors` may display a blocked/blank-page notice instead of rendering.
- Local HTML Web Surfaces are copied into the managed yoAnime asset cache. Full PPTX-embedded local asset portability and true same-origin renderer snapshots are planned follow-up work.
- Publisher signing, marketplace review, and remote trust elevation are not implemented in this release.

## Important Docs

- `docs/DeveloperQuickStart-1.0.2.md`
- `docs/YoAnimeSdkReference-1.0.2.md`
- `docs/ExtensionPackageContract-1.0.2.md`
- `docs/WebSurfaceShareabilityFallbacks-Phase81.md`
- `docs/WebSurfaceGalleryUX-Phase83.md`
- `docs/WebSurfaceLocalHtmlPortability-Phase84.md`
- `docs/WebSurfaceLocalHtmlReselect-Phase85.md`
- `docs/WebSurfaceRenderedFallbackSnapshots-Phase86.md`
- `docs/WebSurfaceShareReadiness-Phase87.md`
- `docs/WebSurfaceCompletion-Phase88.md`
- `docs/ProceduralMotionProviderContract-Phase89.md`
- `docs/PhysicsSdkPrimitivesExpansion-Phase90.md`
- `docs/NoiseWiggleProvider-Phase91.md`
- `docs/ConstraintProvider-Phase92.md`
- `docs/SvgPathMorphProvider-Phase93.md`
- `docs/ProviderPackInputSchema-Phase94.md`
- `docs/GeneratedMotionIR-Phase95.md`
- `docs/SceneQueryDsl-Phase96.md`
- `docs/RuntimeChannelApi-Phase97.md`
- `docs/ExtensionPackagingWorkflow.md`
- `docs/ReleaseHardeningPlan-1.0.2.md`
- `docs/SdkPlatformSmokeTest-1.0.2.md`
- `docs/SdkReleaseChecklist-1.0.2.md`
- `docs/MicrosoftStoreSubmission-1.0.2.md`
- `docs/FinalSmokeMatrix-1.0.2.md`
- `docs/SlideshowRuntime-Phase71.md`
- `docs/SlideshowSdkLifecycle-Phase72.md`
- `docs/SlideshowPersistence-Phase73-74.md`
- `docs/WebSurfacePortabilitySecurity-Phase79.md`
- `docs/WebSurfaceProviderProfiles-Phase80.md`
