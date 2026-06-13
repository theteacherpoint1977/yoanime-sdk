# Manifest v2 and Permissions

Extensions declare `yoanime-extension.json` or `manifest.json` with `manifestVersion: 2`.

The authoritative package contract for yoAnime `1.0.2.0` is `docs/ExtensionPackageContract-1.0.2.md`.

```json
{
  "manifestVersion": 2,
  "id": "timeline-starter",
  "name": "Timeline Starter",
  "version": "0.1.0",
  "surface": "overlay-taskpane",
  "taskPaneEntry": "taskpane.html",
  "entry": "overlay.html",
  "sdkVersionMin": "0.3.0",
  "permissions": [
    "selection.read",
    "scene.read",
    "scene.write",
    "timeline.read",
    "timeline.write",
    "timeline.playback",
    "slideshow.read",
    "geometry.read",
    "interaction.write",
    "extensions.read"
  ]
}
```

## Permission Map

Runtime readiness and capability negotiation do not require a manifest permission. Extensions can always call `runtime.ready()` and `runtime.getCapabilities()`.

Non-mutating local helpers such as `yoanime.noise.*`, pure `yoanime.constraints.*` helpers, `yoanime.paths.*`, and local Lottie/AI normalization helpers do not require a permission until they call a host-backed API.

`selection.read`
- `selection.get`, selection events.

`scene.read`
- `scene.get`, `scene.query`, `scene.findOne`, `scene.explainQuery`, `scene.updated`, and `scene.changed`.

`scene.write`
- `scene.roles.set` in the stable `1.0.2.0` contract.
- Preview direct scene mutation, grouping, and transform writes.

`shapes.write`
- Preview direct shape mutation API. Prefer `timeline.bake()` for public procedural animation samples.

`timeline.read`
- `timeline.get`, `timeline.updated`, `timeline.tick`.

`timeline.write`
- `timeline.bake()` in the stable `1.0.2.0` contract.
- Preview property track and keyframe creation, deletion, persistence, and direct edits.
- Preview timeline save/load, embedded save/load, history, undo/redo, and preset registration APIs.

`timeline.playback`
- `timeline.play`, `timeline.stop`, and scrub streaming commands.

`geometry.read`
- `slide.getContext`, `geometry.screenToSlide`, and `geometry.slideToScreen`.

`slideshow.read`
- `slideshow.getStatus`, `slideshow.onStarted`, `slideshow.onSlideChanged`, and `slideshow.onEnded`.
- Read-only lifecycle/status access. It does not grant slideshow control.

`interaction.write`
- Overlay visibility, overlay interactivity, pointer capture, click-through, and interactive bounds.

`surface.messaging`
- `overlay.postMessage`, `overlay.onMessage`, `taskpane.postMessage`, `taskpane.onMessage`, and runtime channels.
- This permission lets extension surfaces coordinate with each other; it does not grant native bridge authority beyond the message envelope.

`websurface.read`
- `webSurface.list`, `webSurface.refresh`, and `webSurface.onEvent`.
- Web Surface events are sanitized data-only iframe events.

`websurface.write`
- Preview `webSurface.create`, `webSurface.update`, and `webSurface.remove`.
- Web Surface authoring remains VSTO-authoritative and may evolve during `1.0.2.0`.

`data.read`
- Data source listing, read, refresh, refresh-all, cache clear, and data change events.

`data.write`
- Preview data source registration and unregistration.

`extensions.read`
- Installed-extension listing.

`extensions.write`
- Mounting, unmounting, and toggling extensions. This is intentionally not granted to ordinary templates.

`trajectory.read` and `trajectory.write`
- Internal motion path visualization and editing. Do not request these for public `1.0.2.0` extensions.

`diagnostics.read`
- Developer diagnostics toolkit commands. Not needed by ordinary extensions.

## Surface Map

`taskpane`
- Requires `taskPaneEntry`.
- Use for compact controls, settings, status, and diagnostics.

`overlay`
- Requires `entry`.
- Use for large slide-aligned UI, previews, direct manipulation, and visual diagnostics.

`overlay-taskpane`
- Requires both `entry` and `taskPaneEntry`.
- Use for paired extensions where the taskpane controls a larger overlay workspace.

`slideshow`
- Reserved for future slideshow-only extension surfaces. Public `1.0.2.0` extensions may use the read-only `yoanime.slideshow.*` SDK APIs from ordinary taskpane/overlay surfaces when they declare `slideshow.read`.

## Recommended Permission Sets

Taskpane-only informational extension:

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
  "slideshow.read",
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
  "surface.messaging",
  "interaction.write",
  "extensions.read"
]
```

## Enforcement

Frontend checks are convenience only. `SdkCommandGateway` must enforce permissions for every command before forwarding it into runtime authority.
