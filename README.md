---
id: doc:readme-28
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
# yoAnime SDK

Build JavaScript/HTML extensions for PowerPoint motion, timelines, physics, procedural animation, and live web experiences.

yoAnime Studio is a PowerPoint add-in that turns PowerPoint into a programmable creative platform. This repository contains the public SDK documentation, TypeScript definitions, extension package template, and sample extensions for the yoAnime **Platform v0.5.0** (SDK contract **v0.4.0**).

> The yoAnime Studio application/runtime is proprietary. This repository contains public developer documentation, examples, and templates only. The canonical contract is `types/yoanime-sdk.d.ts` — **34 namespaces / 213 callable members / 111 DTO types** (see `docs/YoAnimeSdkReference-0.5.0.md`). `v0.5.0` certifies the `animation.*` preview surface on the `0.4.0` contract; see Versioning below.

## Product Status

- **Public SDK / extension-platform release:** `v0.5.0` (GitHub release published 2026-08-31); the public SDK contract remains `v0.4.0`. `v0.4.0-rc1/rc2` are historical prereleases.
- **Microsoft Store channel:** the yoAnime Studio listing is public and the app has been distributed through the Store. The exact package version currently served by the Store has **not been independently verified in this repository**. Do not infer the Store version from the SDK tag, local package manifests, or archived release notes; verify it in Partner Center or from a clean Store installation before publishing a version claim.
- **Public SDK contract:** `0.4.0` (header in `types/yoanime-sdk.d.ts`). The SDK platform/release tag is `v0.5.0`; platform and contract versions are intentionally distinct.

### Versioning

* **Platform / SDK documentation release:** `v0.5.0` — includes the `animation.create → preview → commit → timeline` authoring model as a preview API surface.
* **SDK contract:** `v0.4.0` — `types/yoanime-sdk.d.ts`. Use `yoanime.runtime.getCapabilities()` at runtime to inspect the SDK and host versions reported by the running application.

Product link:
[yoAnime Studio on Microsoft Store](https://apps.microsoft.com/detail/9PP5T5LHG1JL?hl=en-us&gl=IN)

## What Developers Can Build

Developers can build installable PowerPoint extensions using ordinary web technologies:

- taskpane tools
- slide-aligned overlay UIs
- timeline and animation generators
- physics/procedural motion tools
- data-driven animation
- Lottie/AI motion experiments
- live web-experience integrations
- teaching widgets and interactive presentation tools

Extensions do not receive raw PowerPoint COM objects, native handles, or direct Office internals. They send intent through the SDK. yoAnime validates, coordinates, and applies changes through its native runtime.

## Quick Example

Higher-level (preview) — `animation.*`:

```js
await yoanime.runtime.ready();
const scene = await yoanime.scene.get({ includeGeometry: true });
const first = scene.shapes[0];

const { animation } = await yoanime.animation.create({
  label: "My Animation",
  durationSeconds: 2,
  layers: [{ runtimeNodeId: first.runtimeNodeId, properties: { Rotation: { keyframes: [{ normalizedTime: 0, value: { number: 0 } }, { normalizedTime: 1, value: { number: 360 } }] } } }]
});
await yoanime.animation.preview({ animationId: animation.animationId }); // ghost IR — no host mutation
await yoanime.animation.commit({ animationId: animation.animationId }); // bakes to timeline
yoanime.timeline.play({ startTimeSeconds: 0 });
```

Lower-level — `timeline.bake`:

```js
await yoanime.runtime.ready();

const selection = await yoanime.selection.get();
if (!selection) {
  console.log("Select a PowerPoint shape first.");
  throw new Error("No PowerPoint shape is selected.");
}

await yoanime.motionProviders.bake("yoanime.noise.wiggle-position", {
  amplitude: 20,
  frequency: 3,
  durationSeconds: 1,
  play: true
});
```

> **For overlay extensions:** Follow the [Overlay Bootstrap Standard](https://github.com/theteacherpoint1977/yoanime-sdk/blob/main/reference/extension/docs/runtime/OverlayBootstrapStandard.md) — load `yoAnimeBridge.js`, wait for `window.yoanime`, then call `runtime.ready()`.

## Start Here

- [Developer Quick Start](docs/DeveloperQuickStart-1.0.2.md) — includes `animation.create → preview → commit → timeline.play`
- [SDK Reference 0.5.0](docs/YoAnimeSdkReference-0.5.0.md) — current public reference (34 namespaces / 213 callable members / 111 DTOs); `animation.*` is preview
- [Release Notes 0.5.0](docs/ReleaseNotes-0.5.0.md) — platform changes and known exceptions
- [Extension Package Contract](docs/ExtensionPackageContract-1.0.2.md) — historical contract document; check the SDK reference and installed host capabilities for current API status
- [Manifest Permissions](docs/SdkManifestV2Permissions.md) — 1.0.2-era permission baseline; cross-check v0.5.0 API stability in the current SDK reference
- [Packaging Workflow](docs/ExtensionPackagingWorkflow.md)
- [Architecture Overview](docs/ArchitectureOverview.md)
- [Known Limitations](docs/KnownLimitations-1.0.2.md) — historical 1.0.2 document; not a complete v0.5.0 release matrix
- [Final Smoke Matrix 0.5.0](smoke-tests/FinalSmokeMatrix-0.5.0.md) — published release-gate checklist; it is a checklist, not proof that every row has passed on the current build
- [Reference Extension Certification Suite](reference/extension/certification/README.md)

## Repository Layout

```text
docs/                         public SDK and extension docs
samples/console-scripts/      copy-paste SDK samples
samples/extension-package-template/
samples/developer-sample-pack/
types/yoanime-sdk.d.ts        TypeScript SDK declarations
smoke-tests/                  smoke test docs/scripts
media/                        screenshots and demo links
```

## SDK Stability

yoAnime **Platform v0.5.0** (contract `0.4.0`) classifies APIs as:

- `stable`: APIs designated stable for this SDK release (for example `runtime`, `selection`, `scene.get`, `timeline.get/bake/play`, `motionProviders.list/get/generate/bake`, `constraints`, `behavior`, `relationship`, `physics`, `paths`, and `noise`)
- `preview`: APIs available to trusted developers but subject to change (for example `animation.*`, `scene.build/mutateShape`, timeline editor APIs, `data`, `transforms`, `commands`, `dev`, `ik.solveChain`, and `expressions.evaluate`)
- `internal`: host/runtime plumbing not intended for ordinary public extensions (for example `trajectory`, `debug`, `expressions._parse/_eval`, and `extensions.mount`)

Use `yoanime.runtime.getCapabilities()` to inspect the API stability groups and versions reported by the **running host**. Documentation classification does not substitute for runtime capability checks or the published smoke matrix.

## Core Platform Laws

- Browser extensions send intent only.
- WPF owns runtime authority.
- VSTO/COM owns mutation of real PowerPoint objects.
- No raw PowerPoint COM objects are exposed to extensions.
- Extensions should use stable `runtimeNodeId` identities, not display names, for authored animation.
- Permissions are enforced by the host gateway.

## Release evidence and limitations

The `v0.5.0` release notes document certification coverage for the named SDK/extension scenarios and disclose **44 pre-existing failures in preview/internal motion-provider areas** as an exception outside the stable surface. These statements refer to the documented certification run; they do not certify a later host build, every extension, arbitrary PowerPoint decks, or untested grouped-instance workflows.

The current Store-delivered package version, Store package inclusion of every SDK feature, and compatibility across all Windows/PowerPoint configurations must be verified separately.

## License

Samples, templates, and documentation are MIT licensed unless noted otherwise.

The yoAnime Studio application/runtime is proprietary and is not included in this repository.

## External AI Developer Validation

The project records an external-AI validation exercise in which an agent, without private yoAnime source code, generated extensions using the public manifest and JavaScript SDK. Treat this as a reported scoped validation, not an independent certification of all SDK methods or supported PowerPoint configurations.
