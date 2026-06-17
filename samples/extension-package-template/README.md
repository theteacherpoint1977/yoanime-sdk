# yoAnime Extension Package Template

This folder is a minimal public `1.0.2.0` extension package shape.

Install it through:

```text
yoAnime Welcome Screen -> Extensions -> Install Extension Folder
```

Then choose this folder or its `manifest.json`.

The template demonstrates:

- one manifest
- taskpane plus overlay pages
- self-contained SDK bridge helper files
- `runtime.ready()`
- taskpane/overlay messaging
- overlay click-through setup
- scene geometry scan in PowerPoint slide points

Rename the manifest `id`, `name`, and UI text before publishing.

## Keep These Files

The pages reference these helper files and they should stay inside the package:

```text
js/yoAnimeBridge.js
Runtime/yoAnimeOverlayInteraction.js
```

Do not omit them when generating or zipping a two-surface extension. They provide the public window.yoanime SDK facade and overlay click-through/focus behavior used by the sample pages.
