# Extension Package Contract 1.0.2

Phase 66 freezes the public extension package contract for yoAnime `1.0.2.0`.

The goal is simple: a developer should be able to build a web app, package it as a yoAnime extension, install it from the Welcome Screen Extension Manager, and create PowerPoint animations through the SDK without knowing C#, VSTO, COM, or the PowerPoint Object Model.

## Official Install Model

Users and developers install extensions through:

```text
yoAnime Welcome Screen
  Extensions
    Install Extension Folder
    Install From Zip
```

Manual copying into repo folders is not the public product workflow. It is only a first-party development fallback.

## Package Shapes

### Public Third-Party Package

A third-party extension should usually be a single self-contained folder or zip:

```text
MyExtension/
  manifest.json
  taskpane.html
  overlay.html
  js/
    yoAnimeBridge.js
  Runtime/
    yoAnimeOverlayInteraction.js
  assets/
  scripts/
  styles/
```

The installer accepts:

- a folder containing `manifest.json`
- a folder containing `yoanime-extension.json`
- a `.zip` containing an extension folder
- a built Vite/React/Svelte/Vue `dist` folder containing a manifest

If a zip has one wrapper folder, yoAnime detects the nested manifest and installs the real extension folder.

### First-Party Repo Layout

The yoAnime source repo uses two roots because VSTO taskpane assets and WPF overlay assets are built from different projects:

```text
yoAnimeShared/html/Extensions/MyExtension/
  manifest.json
  taskpane.html

CustomRotationPointApp/html/Extensions/MyExtension/
  manifest.json
  overlay.html
```

This split is for repo development only. Do not ask third-party developers to copy files into both roots as their normal workflow.

## Manifest v2

Use `manifestVersion: 2` and `sdkVersionMin: "0.3.0"` for yoAnime `1.0.2.0`.

```json
{
  "manifestVersion": 2,
  "id": "my-extension",
  "name": "My Extension",
  "version": "0.1.0",
  "author": "Your Name",
  "description": "A taskpane plus overlay extension for yoAnime.",
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
    "interaction.write"
  ],
  "capabilities": [
    "overlay.surface",
    "taskpane.surface",
    "surface.messaging"
  ]
}
```

### Required Fields

- `manifestVersion`
- `id`
- `name`
- `version`
- `surface`
- `entry` for overlay-capable extensions
- `taskPaneEntry` for taskpane-capable extensions
- `permissions`

`author`, `description`, and `capabilities` are strongly recommended.

### ID Rules

Use a stable lowercase id:

```text
my-extension
physics-lab-pro
shape-orbit-tools
```

Do not use spaces, user names, dates, or random build ids. The extension id is used for install location, virtual host mapping, and future update/catalog identity.

### Surface Values

Supported in `1.0.2.0`:

- `taskpane`: side-pane UI only
- `overlay`: slide overlay UI only
- `overlay-taskpane`: paired taskpane plus overlay

Future/reserved:

- `slideshow`: reserved for the slideshow runtime contract. Do not publish third-party slideshow-only extensions until the slideshow extension contract is frozen.

## Surface Responsibilities

### Taskpane

Use the taskpane for:

- compact controls
- settings
- active selection summary
- diagnostics
- preset buttons
- install/run guidance

The taskpane is narrow. Do not put a full editor or large timeline there.

### Overlay

Use the overlay for:

- large workspaces
- physics labs
- canvas/SVG previews
- timeline editors
- graph editors
- direct manipulation handles
- visual diagnostics

The overlay must preserve PowerPoint click-through on empty areas. Mark only real web controls or handles as interactive.

### Slideshow

For `1.0.2.0`, slideshow playback is a host/runtime concern. Extensions should author and persist animation through SDK/timeline APIs. A read-only lifecycle/status SDK is available for ordinary taskpane/overlay extensions that request `slideshow.read`.

The public slideshow SDK can report whether slideshow mode is active and notify extensions when slideshow starts, changes slide, or ends. It does not let extensions start, stop, advance, or directly control the native PowerPoint slideshow window.

Later slideshow phases will define how extension-authored compositor effects are loaded and rendered during slide show.

## Permission Contract

Runtime readiness does not require a permission:

- `runtime.ready`
- `runtime.getCapabilities`

Stable public permissions:

| Permission | Use |
| --- | --- |
| `selection.read` | Current selection and selection events |
| `scene.read` | `scene.get`, scene snapshots, scene change events |
| `scene.write` | Roles, tags, metadata through `scene.roles.set` |
| `geometry.read` | `slide.getContext`, point projection helpers |
| `timeline.read` | Timeline snapshot and playback/tick state |
| `timeline.write` | `timeline.bake` and safe timeline authoring |
| `timeline.playback` | Play, stop, scrub, playFrom |
| `slideshow.read` | Read-only slideshow lifecycle/status |
| `interaction.write` | Overlay interactivity, drag/click-through ownership |
| `extensions.read` | Installed extension listing |

Preview/internal permissions:

| Permission | Guidance |
| --- | --- |
| `shapes.write` | Preview direct shape mutation. Prefer `timeline.bake` for public procedural animation. |
| `extensions.write` | Host lifecycle control. Do not request for ordinary third-party extensions. |
| `trajectory.read` / `trajectory.write` | Internal trajectory tooling. Not public for `1.0.2.0`. |
| `diagnostics.read` | Host diagnostics. Use only for diagnostic extensions. |
| `all` | Internal only. |

The installer rejects unknown permissions and warns on advanced/internal permissions.

## Trust And Safe Mode

For `1.0.2.0`, installed third-party packages are treated as local unreviewed extensions. Built-in starters are trusted because they ship with yoAnime.

The Extension Manager shows trust level, permission risk, and runtime safety state. If a local installed extension repeatedly triggers host-side SDK command failures, yoAnime records the failures and auto-disables that extension after three failures. The user can review the last failure reason, clear failures, and re-enable the extension from the Extension Manager.

This is a local safety mechanism, not a digital signature or marketplace trust system. Publisher verification, signing, and online update trust are future gallery/platform work.

## Stable SDK Surface For 1.0.2.0

Public extensions should build around:

- `yoanime.runtime.ready`
- `yoanime.runtime.getCapabilities`
- `yoanime.selection.get`
- selection events
- `yoanime.scene.get`
- `yoanime.scene.roles.set`
- `scene.changed` / `scene.updated` events
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
- `yoanime.physics.*`
- `yoanime.overlay.*`
- `yoanime.taskpane.*`
- `yoanime.interaction.*`
- `yoanime.extensions.getInstalled`

Do not build public `1.0.2.0` extensions around:

- direct `propertytrack.upsert` loops
- raw live `timeline.import/export`
- `yoanime.trajectory.*`
- `yoanime.commands.*`
- `yoanime.transforms.*`
- `yoanime.extensions.mount/unmount/toggle`

## Developer Rules

- Always wait for `yoanime.runtime.ready()`.
- Use `runtimeNodeId` for identity.
- Use PowerPoint slide points for timeline values.
- Use `scene.get({ includeGeometry: true, includeTags: true })` for shape positions and metadata.
- Use `slide.getContext()` for slide size, pasteboard, physics bounds, and projection anchors.
- Use `timeline.bake()` for generated animation.
- Use local preview during drag and commit one SDK operation on pointer-up.
- Do not call COM, VSTO, Office.js, or PowerPoint APIs directly.
- Keep taskpane and overlay communication namespaced.
- Keep empty overlay areas click-through friendly.

## Package Validation Checklist

Before sharing an extension:

- [ ] Install from folder works.
- [ ] Install from zip works.
- [ ] Manifest has `manifestVersion: 2`.
- [ ] Manifest has `sdkVersionMin: "0.3.0"`.
- [ ] Entry files exist inside the package.
- [ ] Unknown permissions are not requested.
- [ ] Advanced permissions are justified or removed.
- [ ] `runtime.ready()` is awaited on every page.
- [ ] Errors are shown in the UI and logged to console.
- [ ] Scene/timeline values are in slide points.
- [ ] Overlay empty space passes through to PowerPoint.
- [ ] Reload works without restarting PowerPoint.

## Gallery And Update Metadata

The `1.0.2.0` host parses, persists, and displays optional gallery/update metadata in the Extension Manager. These fields make a package catalog-ready and help users understand what they installed.

`1.0.2.0` does not perform automatic online update checks, publisher verification, or gallery downloads. Treat URLs as informational metadata until the hosted catalog service is introduced.

```json
{
  "gallery": {
    "category": "physics",
    "tags": ["physics", "timeline", "procedural"],
    "website": "https://example.com",
    "supportUrl": "https://example.com/support",
    "license": "MIT",
    "publisherId": "your-stable-publisher-id",
    "icon": "assets/icon.png",
    "previewImage": "assets/preview.png",
    "screenshots": [
      "assets/screenshot-1.png"
    ],
    "changelog": "Initial public release.",
    "channel": "stable"
  },
  "update": {
    "channel": "stable",
    "updateUrl": "https://example.com/yoanime/my-extension/latest.json",
    "catalogUrl": "https://example.com/yoanime/catalog.json",
    "releaseNotesUrl": "https://example.com/yoanime/my-extension/releases",
    "allowPrerelease": false
  }
}
```

Do not rely on gallery or update fields for runtime behavior in `1.0.2.0`. Runtime permissions, SDK access, and safe-mode behavior are still controlled by the manifest permission list and host services.

## Sample Template

Use this starter package as the reference package shape:

```text
docs/SdkSamples/1.0.2/extension-package-template/
```

It is intentionally simple: one manifest, one taskpane, one overlay, and no build step.

For two-surface packages, include the SDK bridge helper files from the public template unless your page is intentionally using a host-injected bridge. The template files provide window.yoanime plus overlay click-through/focus behavior and keep the package self-contained for local installation.
