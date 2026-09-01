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

> The yoAnime Studio application/runtime is proprietary. This repository contains public developer documentation, examples, and templates only. The canonical contract is `types/yoanime-sdk.d.ts` — **34 namespaces / 213 callable members / 111 DTO types** (see `docs/YoAnimeSdkReference-0.5.0.md`). `v0.5.0` certifies `animation.*` preview on the `0.4.0` contract; see Versioning below.

## Product Status

- yoAnime Studio `v0.5.0` is the current SDK/Extension Platform (GitHub tag `v0.5.0`). `v0.4.0-rc1/rc2` remain immutable history.
- yoAnime Studio `1.0.1.0` is available on the Microsoft Store (store channel lags SDK).
- Public SDK contract version: `0.4.0` (header in `types/yoanime-sdk.d.ts`). Platform release is `v0.5.0`.

### Versioning

* **Platform / Release:** `v0.5.0` — `animation.create → preview → commit → timeline` authoring model (see `MISSION-11P`).
* **SDK contract:** `v0.4.0` — `types/yoanime-sdk.d.ts` (2,396 lines, additive `animation.*` preview). Use `yoanime.runtime.getCapabilities().sdkVersion` at runtime.

Product link:
[Microsoft Store](https://apps.microsoft.com/detail/9PP5T5LHG1JL?hl=en-us&gl=IN&ocid=pdpshare)

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

Higher-level (preferred) — `animation.*`:

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
await yoanime.animation.commit({ animationId: animation.animationId }); // bakes to timeline (timelineVersion++)
yoanime.timeline.play({ startTimeSeconds: 0 });
```

Lower-level — `timeline.bake` (still stable):

```js
await yoanime.runtime.ready();

const selection = await yoanime.selection.get();
if (!selection) {
  console.log("Select a PowerPoint shape first.");
}

await yoanime.motionProviders.bake("yoanime.noise.wiggle-position", {
  amplitude: 20,
  frequency: 3,
  durationSeconds: 1,
  play: true
});
```

> **For overlay extensions:** Follow the [Overlay Bootstrap Standard](https://github.com/yoanime/yoanime-sdk/blob/main/reference/extension/docs/runtime/OverlayBootstrapStandard.md) — load `yoAnimeBridge.js`, wait for `window.yoanime`, then call `runtime.ready()`. Every shipped overlay extension follows this sequence.

## Start Here

- [Developer Quick Start](docs/DeveloperQuickStart-1.0.2.md) — now includes `animation.create → preview → commit → timeline.play`
- [SDK Reference 0.5.0](docs/YoAnimeSdkReference-0.5.0.md) — current (supersedes `1.0.2`; 34 namespaces / 213 members / 111 DTOs, `animation.*` preview)
- [Release Notes 0.5.0](docs/ReleaseNotes-0.5.0.md) — what is new in v0.5.0
- [Extension Package Contract](docs/ExtensionPackageContract-1.0.2.md)
- [Manifest Permissions](docs/SdkManifestV2Permissions.md)
- [Packaging Workflow](docs/ExtensionPackagingWorkflow.md)
- [Architecture Overview](docs/ArchitectureOverview.md) — now with `animation.*` diagram
- [Known Limitations](docs/KnownLimitations-1.0.2.md)
- [Reference Extension Certification Suite](reference/extension/certification/README.md) — Release gate for all Reference Extension stages

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

- `stable`: safe public APIs for this release (e.g., `runtime`, `selection`, `scene.get`, `timeline.get/bake/play`, `motionProviders.list/get/generate/bake`, `constraints`, `behavior`, `relationship`, `physics`, `paths`, `noise`)
- `preview`: powerful APIs available to trusted developers but subject to change (e.g., `animation.*` 13 methods, `scene.build/mutateShape`, `timeline` editor APIs, `data`, `transforms`, `commands`, `dev`, `ik.solveChain`, `expressions.evaluate`)
- `internal`: host/runtime plumbing not intended for public extensions (e.g., `trajectory`, `debug`, `expressions._parse/_eval`, `extensions.mount`)

Use `yoanime.runtime.getCapabilities()` at runtime to inspect the current SDK version, permissions, and API stability groups. See `docs/YoAnimeSdkReference-0.5.0.md` for the full table.

## Core Platform Laws

- Browser extensions send intent only.
- WPF owns runtime authority.
- VSTO/COM owns PowerPoint mutation.
- No raw PowerPoint COM objects are exposed to extensions.
- Extensions use stable `runtimeNodeId` identities, not display names, for authored animation.
- Permissions are enforced by the host gateway.

## License

Samples, templates, and documentation in this repository are MIT licensed unless noted otherwise.

The yoAnime Studio application/runtime is proprietary and is not included in this repository.

## External AI Developer Validation

We tested this public SDK repository by giving it to an external AI coding agent without private yoAnime source code. The agent generated installable yoAnime extensions that used the public manifest contract and JavaScript SDK to read PowerPoint selection and scene data and bake animations. The extensions installed through the yoAnime Extension Manager and worked through the public SDK.
