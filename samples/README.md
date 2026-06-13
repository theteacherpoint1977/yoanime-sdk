# yoAnime SDK Samples

This folder contains public yoAnime `1.0.2.0` SDK samples.

## Folders

- `console-scripts/`: copy-paste JavaScript samples for a yoAnime taskpane or overlay developer console.
- `extension-package-template/`: minimal installable extension package shape.
- `developer-sample-pack/`: installable sample extensions that demonstrate larger SDK features.

## Recommended Order

1. Run `console-scripts/01-runtime-capabilities.js`.
2. Run `console-scripts/02-scene-geometry-identity.js`.
3. Select a shape in PowerPoint and run `console-scripts/03-bake-selection-spin.js`.
4. Try one installable package from `developer-sample-pack/`.

## Stability Notes

Samples using core runtime, selection, scene, geometry, timeline bake, channels, and web-surface events use the stable public path.

Samples using provider registration, data sources, Lottie provider contracts, AI provider contracts, or direct editor APIs may use preview APIs. Preview APIs work in the developer preview but may change before a future stable SDK release.

