# yoAnime SDK Architecture Overview

yoAnime Studio uses a native-first hybrid architecture.

```text
PowerPoint
  -> VSTO Add-in / PowerPoint COM authority
  -> WPF runtime host
  -> WebView2 taskpane and overlay surfaces
  -> JavaScript SDK extensions
```

## Runtime Authority

Extensions never mutate PowerPoint directly. They call the JavaScript SDK, and the host decides whether the requested action is allowed.

- Browser extension: sends intent.
- WPF runtime: validates permissions, owns timeline/cache/runtime coordination.
- VSTO/COM layer: applies safe mutations to PowerPoint.

## Surfaces

yoAnime supports two main browser surfaces:

- taskpane: normal PowerPoint side panel UI
- overlay: slide-aligned WebView2 UI for handles, previews, canvases, and visual editors

Taskpane and overlay pages communicate through SDK messaging or runtime channels.

## Motion And Timeline

Extensions author motion in slide-point coordinates. The recommended public mutation path is `timeline.bake()`, which sends a complete animation request to the host.

Procedural engines can generate motion through providers:

```text
Physics / Noise / Constraints / Paths / Lottie / AI
  -> Generated Motion IR
  -> Timeline Bake Request
  -> PowerPoint Shapes
```

## Live Web Experiences

yoAnime can render live web experiences inside PowerPoint slides. Web content is sandboxed and does not receive the native SDK bridge. It may emit safe data-only events that extensions can observe through the SDK.

## Permissions

Extension manifests declare permissions such as `selection.read`, `scene.read`, `timeline.write`, `interaction.write`, and `surface.messaging`. The host gateway enforces permissions at runtime.

