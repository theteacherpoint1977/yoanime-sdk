# yoAnime SDK Samples 1.0.2

These scripts are copy-paste samples for extension consoles and starter pages. They use the stable `1.0.2.0` SDK path wherever possible.

Run from a yoAnime WebView2 extension surface after the SDK is injected.

## Samples

Legend: `[stable]` uses the conservative public `1.0.2.0` SDK path. `[preview]` exercises trusted-developer APIs whose contracts may still change.

- `[stable]` `01-runtime-capabilities.js`: checks runtime readiness and capability/stability reporting.
- `[stable]` `02-scene-geometry-identity.js`: lists scene geometry and `scene-identity-diagnostics.v1`.
- `[stable]` `03-bake-selection-spin.js`: bakes a simple rotation on the selected shape.
- `[stable]` `04-role-based-fly-in.js`: bakes a pasteboard fly-in for visible scene shapes.
- `[stable]` `05-physics-ramp-roll.js`: runs the built-in Matter.js Ramp Roll physics preset.
- `[stable]` `06-two-surface-messaging.js`: tests taskpane/overlay messaging.
- `[stable]` `07-platform-smoke-suite.js`: compact SDK platform smoke suite.
- `[preview]` `08-motion-provider-wiggle.js`: registers a simple procedural motion provider and bakes it through `timeline.bake()`.
- `[stable]` `09-physics-provider-ramp-roll.js`: uses the built-in Phase 90 physics provider through `yoanime.motionProviders`.
- `[stable]` `10-noise-wiggle-provider.js`: uses the built-in Phase 91 deterministic noise/wiggle provider.
- `[stable]` `11-constraint-provider-follow-target.js`: uses the built-in Phase 92 constraint provider to move a selected shape toward a target.
- `[stable]` `12-path-provider-follow-svg.js`: uses the built-in Phase 93 path provider to move a selected shape along an SVG path.
- `[preview]` `13-provider-pack-input-schema.js`: registers a Phase 94 provider pack with shared input schema.
- `[preview]` `14-generated-motion-ir.js`: registers a Phase 95 provider that returns `generated-motion.v1`, validates it, and bakes it.
- `[stable]` `15-scene-query-dsl.js`: exercises Phase 96 `scene.query`, `scene.findOne`, `scene.explainQuery`, and provider `context.query`.
- `[stable]` `16-runtime-channel-api.js`: opens a Phase 97 runtime channel and verifies local/peer message delivery.
- `[stable]` `17-websurface-event-bridge.js`: subscribes to Phase 98 Web Surface iframe events and echoes them through a runtime channel.
- `[preview]` `18-developer-diagnostics-toolkit.js`: runs Phase 99 runtime, provider, scene, Web Surface, channel, motion, and recent-error diagnostics.
- `[preview]` `19-data-source-provider-sdk.js`: registers a Phase 100 data source, verifies cache/refresh behavior, and uses it inside a data-driven motion provider.
- `[preview]` `20-lottie-transform-provider.js`: uses the built-in Phase 101 Lottie transform extractor to generate and bake motion from tiny inline Lottie JSON.
- `[preview]` `21-ai-motion-provider-contract.js`: exercises the Phase 102 vendor-neutral AI motion contract with deterministic local prompt motion.
- `[preview]` `developer-sample-pack/`: Phase 103 installable extension examples for provider packs, runtime channels, Web Surface events, data sources, Lottie, and AI motion.
- `[stable]` `extension-package-template/`: minimal installable taskpane plus overlay package.

## Package Contract

Use `docs/ExtensionPackageContract-1.0.2.md` as the public manifest and packaging authority for yoAnime `1.0.2.0`.

## Stable Rule

Prefer:

```js
yoanime.scene.get()
yoanime.slide.getContext()
yoanime.timeline.bake()
yoanime.motionProviders.*
yoanime.physics.*
```

Avoid building public examples around direct `propertytrack.upsert`, raw timeline import/export, or trajectory internals.
