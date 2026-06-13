# Extension Platform Workflow

This is the official yoAnime `1.0.2.0` extension onboarding path.

Developers and users should install and run extensions through the WPF Extension Manager opened from the yoAnime welcome screen. Manual copying into repo folders is only a development fallback for first-party templates and debugging.

For the frozen public package contract, manifest schema, surface rules, permission guidance, and template package, see:

- `docs/ExtensionPackageContract-1.0.2.md`
- `docs/SdkSamples/1.0.2/extension-package-template`

## Official Product Path

1. Open the yoAnime welcome screen.
2. Click **Extensions**.
3. Review built-in starter extensions:
   - Hello World SDK
   - Two Surface Starter
   - Timeline Starter
4. Click **Install Extension Folder** or **Install From Zip** for a third-party extension.
5. Select the built extension folder, its `manifest.json`, or a packaged `.zip`.
6. Review validation errors/warnings in the status area.
7. Click **Run** with PowerPoint open and a yoAnime task pane active.

The Extension Manager discovers built-in starters and installed local extensions in one place. Built-in starters can be run/reloaded, while installed local extensions can also be enabled, disabled, updated, or uninstalled.

## What The Installer Accepts

The installer accepts:

- a folder containing `manifest.json`
- a folder containing `yoanime-extension.json`
- a `.zip` containing an extension folder
- a Vite/React style project folder only after it has a built `dist` folder with a manifest

If a zip or folder contains a wrapper directory, yoAnime will look for a nested manifest and install the real extension folder.

## Manifest v2 Minimum

```json
{
  "manifestVersion": 2,
  "id": "my-extension",
  "name": "My Extension",
  "version": "0.1.0",
  "surface": "overlay-taskpane",
  "entry": "overlay.html",
  "taskPaneEntry": "taskpane.html",
  "sdkVersionMin": "0.3.0",
  "permissions": [
    "selection.read",
    "scene.read",
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

Validation checks:

- required fields: `id`, `name`, `version`, `surface`
- valid surface: `taskpane`, `overlay`, or `overlay-taskpane`
- taskpane entry file exists when taskpane is requested
- overlay entry file exists when overlay is requested
- unknown permissions are rejected
- advanced/internal permissions produce warnings
- missing `sdkVersionMin` produces a warning

The public `1.0.2.0` host does not require gallery metadata yet. Catalog/update fields may be present, and yoAnime parses, persists, and displays them in the Extension Manager. They remain informational only: no automatic online update, publisher verification, or gallery download behavior is active in `1.0.2.0`.

## Permission Guidance

Use the smallest permission set that fits the extension.

Informational extension:

```json
[
  "selection.read",
  "scene.read",
  "geometry.read"
]
```

Procedural animation extension:

```json
[
  "selection.read",
  "scene.read",
  "geometry.read",
  "timeline.read",
  "timeline.write",
  "timeline.playback"
]
```

Two-surface overlay extension:

```json
[
  "selection.read",
  "scene.read",
  "scene.write",
  "geometry.read",
  "timeline.read",
  "timeline.write",
  "timeline.playback",
  "interaction.write",
  "extensions.read"
]
```

Avoid `extensions.write`, `trajectory.*`, `all`, and direct `shapes.write` unless the extension is first-party or experimental.

## Built-In Starter Role

The built-in starters are not files a developer must copy by hand. They are product-level onboarding examples:

- **Hello World SDK** demonstrates the stable bake-first SDK path.
- **Two Surface Starter** demonstrates taskpane plus overlay, messaging, roles, physics, diagnostics, and presets.
- **Timeline Starter** demonstrates preview timeline editor APIs and is useful for advanced experiments.

Use the Extension Manager to launch them.

## Development Fallback

The repo still contains a staging helper for first-party development:

```powershell
tools\extensions\Stage-YoAnimeExtensionTemplate.ps1
```

Example:

```powershell
powershell -ExecutionPolicy Bypass -File tools\extensions\Stage-YoAnimeExtensionTemplate.ps1 `
  -Template vanilla-two-surface `
  -Target both
```

This copies template files into:

- `yoAnimeShared\html\Extensions`
- `CustomRotationPointApp\html\Extensions`

Use this only when developing inside the yoAnime repo. For shipped extensions, use the Extension Manager install path.

## Coordinate Reminder

Timeline transform tracks use PowerPoint slide points. Overlay rendering uses screen DIPs/CSS pixels. Do not author `PositionX` or `PositionY` tracks from overlay coordinates.
