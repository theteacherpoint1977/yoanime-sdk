# yoAnime SDK

Build JavaScript/HTML extensions for PowerPoint motion, timelines, physics, procedural animation, and live web experiences.

yoAnime Studio is a PowerPoint add-in that turns PowerPoint into a programmable creative platform. This repository contains the public SDK documentation, TypeScript definitions, extension package template, and sample extensions for the yoAnime `1.0.2.0` SDK/Extension Platform Preview.

> The yoAnime Studio application/runtime is proprietary. This repository contains public developer documentation, examples, and templates only.

## Product Status

- yoAnime Studio `1.0.1.0` is available on the Microsoft Store.
- yoAnime Studio `1.0.2.0` is in release hardening and introduces the SDK/Extension Platform Preview.
- Public SDK bridge version: `0.3.0`.

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

## Start Here

- [Developer Quick Start](docs/DeveloperQuickStart-1.0.2.md)
- [SDK Reference](docs/YoAnimeSdkReference-1.0.2.md)
- [Extension Package Contract](docs/ExtensionPackageContract-1.0.2.md)
- [Manifest Permissions](docs/SdkManifestV2Permissions.md)
- [Packaging Workflow](docs/ExtensionPackagingWorkflow.md)
- [Architecture Overview](docs/ArchitectureOverview.md)
- [Known Limitations](docs/KnownLimitations-1.0.2.md)

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

yoAnime `1.0.2.0` classifies APIs as:

- `stable`: safe public APIs for this preview release
- `preview`: powerful APIs available to trusted developers but subject to change
- `internal`: host/runtime plumbing not intended for public extensions

Use `yoanime.runtime.getCapabilities()` at runtime to inspect the current SDK version, permissions, and API stability groups.

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
