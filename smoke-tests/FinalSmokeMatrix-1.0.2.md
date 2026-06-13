# Final Smoke Matrix 1.0.2.0

Run this matrix before packaging and before Microsoft Store submission.

## Build And Package

| Area | Test | Expected |
| --- | --- | --- |
| WPF build | Build `CustomRotationPointApp/yoAnimeServer.csproj` Release x64 | Build succeeds with 0 errors |
| Package version | Inspect `Package.appxmanifest` | Identity version is `1.0.2.0` |
| App launch | Launch packaged app | Welcome Screen opens |
| WebView2 | Open any built-in extension | Taskpane/overlay WebView2 initializes |

## Product Startup

| Area | Test | Expected |
| --- | --- | --- |
| PowerPoint startup | Open PowerPoint and wait for yoAnime | No taskpane is created by default; structural host registration completes quietly |
| Lazy taskpane | Click Show TaskPane | Taskpane WebView2 initializes on demand and Launcher loads |
| Presentation lifecycle | Open/close multiple presentations | Active pane count remains accurate |
| Extension Manager | Open Welcome Screen -> Extensions | Built-ins and local installs are listed |
| Logs | Watch startup logs | No repeated fatal errors or pipe disconnects |

## Extension Platform

| Area | Test | Expected |
| --- | --- | --- |
| Built-ins | Run Hello World SDK | Extension loads and can bake/play a simple timeline |
| Two Surface Starter | Run built-in starter | Taskpane and overlay can communicate |
| Package template folder | Install `docs/SdkSamples/1.0.2/extension-package-template` | Installs with no errors |
| Package template zip | Zip template and install | Installs with no errors |
| Bad manifest | Remove required field and install | Validation error is shown |
| Permission warnings | Add advanced permission | Warning is shown |
| Catalog metadata | Install template with gallery/update metadata | Extension Manager displays catalog metadata |
| Safe mode | Trigger repeated local extension command failures | Extension auto-disables after repeated failures |
| Recovery | Clear Failures / Enable | Extension can be re-enabled |

## SDK Contract

| Area | Test | Expected |
| --- | --- | --- |
| Runtime | `runtime.ready()` | Resolves |
| Capabilities | `runtime.getCapabilities()` | SDK `0.3.0`, trust, permission risk, stability metadata |
| Selection | Select a shape and call `selection.get()` | Returns selected runtime identity |
| Scene | `scene.get({ includeGeometry: true, includeTags: true })` | Returns slide-point shape list |
| Identity diagnostics | Duplicate/delete/copy/paste shapes | No duplicated runtime ids remain after reconciliation |
| Slide context | `slide.getContext()` | Returns slide bounds, pasteboard, view, physics bounds |
| Timeline bake | Bake simple Position/Rotation | Track is created and playable |
| Timeline playback | `timeline.playFrom(0)` | Shape moves/rotates through COM path |
| Procedural motion provider | Register sample provider and call `motionProviders.bake(...)` | Provider appears in `list()`, generates bake-compatible tracks, and unregisters cleanly |
| Built-in physics providers | Call `motionProviders.bake("yoanime.physics.ramp-roll", { play: true })` | Physics provider generates through Phase 89 contract and bakes/plays |
| Built-in noise providers | Call `motionProviders.bake("yoanime.noise.wiggle-position", { play: true })` | Selected shape receives deterministic additive wiggle tracks |
| Built-in constraint providers | Select source shape and call `motionProviders.bake("yoanime.constraint.follow-target", { targetName: "Target", play: true })` | Source shape receives follow-target PositionX/Y tracks |
| Built-in path providers | Select source shape and call `motionProviders.bake("yoanime.path.follow-svg", { pathData, play: true })` | Source shape receives sampled path PositionX/Y tracks |
| Provider packs | Register sample pack and call `motionProviders.listPacks()` | Pack appears, pack-owned providers appear, and unregister removes them together |
| Generated Motion IR | Run `docs/SdkSamples/1.0.2/14-generated-motion-ir.js` with one shape selected | IR validates, diagnostics are preserved, bake succeeds, and playback starts |
| Scene Query DSL | Run `docs/SdkSamples/1.0.2/15-scene-query-dsl.js` with one shape selected | Query results return, empty-result diagnostics explain misses, provider `context.query` resolves selected shape and bakes |
| Runtime Channel API | Run `docs/SdkSamples/1.0.2/16-runtime-channel-api.js` in a taskpane or overlay console | Local publish delivers to subscriber, channel state lists, peer publish reports delivery/drop details |
| Web Surface Event Bridge | Run `docs/SdkSamples/1.0.2/17-websurface-event-bridge.js`, then insert or switch to Radar/Polar/Morphing/Teapot Web Surface | `surface.ready` event reaches `yoanime.webSurface.onEvent`, includes content id, slide id, source/trust metadata, and echoes through the runtime channel |
| Developer Diagnostics Toolkit | Run `docs/SdkSamples/1.0.2/18-developer-diagnostics-toolkit.js` | Runtime, providers, scene, Web Surfaces, channels, motion validation, recent events, and recent errors return JSON-safe diagnostic contracts |
| Data Source Provider SDK | Run `docs/SdkSamples/1.0.2/19-data-source-provider-sdk.js` with one shape selected | Data source registers, read/cache/refresh works, diagnostics list the source, provider reads `context.data`, and bake/play succeeds |
| Lottie transform extraction | Run `docs/SdkSamples/1.0.2/20-lottie-transform-provider.js` with one shape selected | Lottie layers list, Generated Motion IR validates, supported transform tracks bake/play, and unsupported features remain diagnostics/metadata |
| AI Motion Provider Contract | Run `docs/SdkSamples/1.0.2/21-ai-motion-provider-contract.js` with one shape selected | Prompt explanation returns, Generated Motion IR validates, prompt/seed/model/target metadata is preserved, and bake/play succeeds |
| Developer Sample Pack | Install each folder under `docs/SdkSamples/1.0.2/developer-sample-pack` | Each sample appears in Extension Manager, taskpane loads, smoke buttons run, and README failure cases are understandable |

## Physics Lab

| Area | Test | Expected |
| --- | --- | --- |
| Role assignment | Assign ball/ramp/floor roles | Roles persist on shapes |
| Collider metadata | Edit padding/thickness/radius/material | Metadata saves and refreshes |
| Diagnostics | Inspect world and compare scene to slide | Rows use slide-points with no domain warnings |
| Collider preview | Toggle outlines | Lines align with shape positions closely enough for diagnostics |
| Ramp Roll | Bake and play | Ball rolls down ramp and lands on floor |
| Projectile Impact | Bake and play | Projectile moves to right boundary and falls |
| Reset Bodies | After playback, reset | Moving bodies return to captured start positions |
| Refresh World | Move shapes manually and refresh | World rebuilds from current slide state |
| Rebake | Rebake after metadata change | New simulation uses current/captured setup |

## Slideshow Runtime

| Area | Test | Expected |
| --- | --- | --- |
| No yoAnime timeline | Start slideshow | Native PowerPoint slideshow is not disturbed |
| Cached timeline | Bake timeline, start slideshow | `[SlideshowRuntime] START` appears and playback begins |
| Persisted Physics Lab timeline | Bake Physics Lab preset, save PPTX, close/reopen, start slideshow | `[TimelinePersistence] Loaded embedded timeline`, `[SlideshowRuntime] Embedded timeline loaded for slideshow`, and native playback begins |
| First-run Web Surface render | Insert a slideshow-capable Web Surface and start slideshow immediately | Web Surface renders on the first slideshow attempt, without requiring a second run |
| Web Surface slideshow interaction | Click inside the visible Web Surface during slideshow | Only the Web Surface rectangle captures interaction; empty slide area still advances/clicks native PowerPoint |
| End blank screen | Advance past the final slide | yoAnime slideshow overlay clears/hides and does not leave the last Web Surface over PowerPoint's end screen |
| Focus safety | Start slideshow and use click/arrow navigation | PowerPoint keeps focus; no first-click focus recovery is required |
| End slideshow | Exit slideshow | `[SlideshowRuntime] STOP reason=slideshow-ended` appears |
| Return to edit | After slideshow | Taskpane/overlay still works |

## Web Surfaces

| Area | Test | Expected |
| --- | --- | --- |
| Built-in preset | Insert Radar or Morphing Particles | Styled placeholder appears and live surface aligns inside it |
| Slide switch | Put different Web Surfaces on two slides and switch repeatedly | Only active-slide surfaces render; no stale leakage |
| Geometry changes | Zoom, resize pane/window, collapse ribbon | Active surfaces remain aligned without selecting the placeholder |
| Move/resize placeholder | Move and resize a Web Surface shape | Live surface follows the placeholder |
| Multi-presentation | Use Web Surfaces in two presentations | Surfaces stay isolated by presentation/window |
| Startup/reopen | Save, close, reopen a deck with Web Surfaces | Active-slide surfaces render automatically |
| Custom URL | Insert an allowed HTTPS/embed URL | Renders when the site allows iframe embedding, otherwise shows expected blocked/blank behavior |
| Local HTML | Insert Local HTML | Source is copied to managed asset cache and renders through virtual-host path |
| Properties | Open Web Surface Properties | Selected-surface details, package status, and controls update correctly |
| Fallback snapshot | Capture fallback preview | Placeholder receives a visible fallback image |
| Local repair/reselect | Repair or choose new Local HTML | Package metadata updates and renderer refreshes |
| Share readiness | Check Deck and Copy Report | Deck-level readiness summary appears and report copies to clipboard |

## Extension Regression

| Area | Test | Expected |
| --- | --- | --- |
| Hello World SDK | Run, select/unselect shapes, bake sample motion | Selection events update live, bake/play works, no event flood |
| Rotation Transform Web | Run taskpane/overlay and drag pivot/handles | Overlay visuals load, handles stay interactive, PowerPoint click-through still works |
| Shape Tracker | Run overlay and select/clear shapes | Overlay shows selected-shape details and hides when no shape is selected |
| Timeline Starter | Send taskpane/overlay messages | Ping/notify messages show fresh state on both surfaces |
| Two Surface Starter / Physics Lab | Assign roles, preview paths, bake/play | UI controls are interactive, paths render, bake result has layers |
| React Preset Gallery | Select a shape and apply a preset | Overlay/taskpane receive selection, applied preset updates state |
| Runtime Channel + Web Surface Events | Open overlay, send Ping/Pong, insert Web Surface | Taskpane/overlay messaging works, Web Surface events arrive, focus/click-through remains stable |
| Data Source Motion | Register/read data source and bake | Data source cache/refresh works and generated motion bakes |
| Lottie AI Motion | Run Lottie and AI prompt flows | IR validates and bake/play succeeds |
| Procedural Provider Pack | Install/run pack and bake provider | Provider pack registers, provider appears in list, bake/play succeeds |

## Stability

| Area | Test | Expected |
| --- | --- | --- |
| Delete shape | Delete animated/role-tagged shape | Scene and timeline active selection clear stale identity |
| Duplicate shape | Duplicate tagged shape | New shape receives unique runtime id |
| Cut/paste slide | Cut shape and paste to another slide | No WPF disconnect or long hang |
| Multi-presentation | Open/close presentations repeatedly | Pane status remains correct |
| Multiple Web Surface decks | Open 2-3 presentations with different Web Surfaces | Surfaces stay isolated by presentation/window and active slide |
| Mixed extensions | Run different extensions in multiple presentations | Taskpane/overlay state does not leak across presentations |
| Close order | Close presentations one by one | No PowerPoint hang, no stale overlay, no stuck recovery/loading shell |
| Reopen | Reopen a deck with Web Surfaces/extensions after close | Active-slide state loads without manual slide switching |
| Large slide | 50 shapes with scene scan | UI remains responsive |
| Extension reload | Reload extension repeatedly | No zombie overlay/taskpane session |

## Documentation Gate

| Area | Test | Expected |
| --- | --- | --- |
| SDK reference | Read public API list | Matches runtime capabilities |
| Quick start | Follow package template path | Developer can install/run without manual repo copy |
| Package contract | Check permissions/surfaces | Public and internal surfaces are separated |
| Release notes | Read limitations | Motion Studio, marketplace, and slideshow extension limitations are explicit |
| Store checklist | Confirm assets/copy | Store text matches current product scope |

## Pass Criteria

Release candidate is acceptable when:

- All critical build/package/product startup tests pass.
- Extension Manager can install/run/reload local extensions.
- Two Surface Starter Physics Lab can bake and play at least one physics preset.
- Web Surfaces pass insert/render/slide-switch/properties/fallback/share-readiness checks.
- SDK smoke suite passes against an active PowerPoint taskpane.
- Slideshow bridge does not disturb native slideshow when no cached yoAnime timeline exists.
- Slideshow Web Surfaces render on first run, interact only inside their own rectangle, and clear on PowerPoint's end screen.
- Included/recommended extensions pass the regression rows above.
- Multi-presentation switching and closing does not leak state or hang PowerPoint.
- Known limitations are documented instead of hidden.
