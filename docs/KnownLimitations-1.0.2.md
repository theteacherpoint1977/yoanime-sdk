# Known Limitations 1.0.2

yoAnime `1.0.2.0` is an SDK and Extension Platform Preview.

## Platform Limits

- The yoAnime Studio runtime is proprietary and not included in this repository.
- There is no public online extension marketplace yet.
- Installed local extensions are treated as local/unreviewed packages.
- Publisher signing and online update verification are future work.

## SDK Limits

- Extensions do not receive raw PowerPoint COM objects or native HWNDs.
- Direct timeline/keyframe editing APIs are preview.
- Provider registration, data sources, Lottie provider contracts, and AI provider contracts are preview.
- Slideshow SDK is read-only in this release.
- Public slideshow control and third-party slideshow overlay surfaces are future work.

## Web Experience Limits

- Remote websites may block iframe embedding using browser security headers.
- Local HTML packages are machine-local for live rendering unless packaged/shared through future workflows.
- Web content is sandboxed and cannot call native SDK commands directly.

