# Contributing

Thanks for your interest in yoAnime SDK.

This repository is for public SDK documentation, samples, templates, and developer feedback. The yoAnime Studio runtime is proprietary and is not developed in this repository.

## Good Contributions

- documentation fixes
- sample improvements
- extension template improvements
- TypeScript declaration feedback
- bug reports for SDK samples
- ideas for future extension APIs

## Before Opening A Pull Request

- Keep examples small and readable.
- Declare required permissions in sample manifests.
- Prefer stable SDK APIs for public samples.
- Clearly label preview API usage.
- Do not include private keys, binaries, logs, local paths, or product runtime source.

## Development Model

Extensions should use the SDK instead of raw PowerPoint/COM concepts. The browser layer sends intent; yoAnime validates and applies changes through the native host.

