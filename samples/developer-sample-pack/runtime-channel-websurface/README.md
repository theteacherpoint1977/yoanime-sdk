---
id: doc:readme-39
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
# Sample Runtime Channel And Web Surface Events

Demonstrates:

- `yoanime.channels.open`
- taskpane-to-overlay messaging
- overlay interaction/click-through setup
- `yoanime.webSurface.onEvent`

## Smoke Test

1. Install this folder.
2. Open the sample taskpane.
3. Click `Open Overlay`.
4. Click `Send Channel Ping`.
5. Insert or switch to a built-in Web Surface such as Radar.

Expected result: taskpane and overlay exchange channel events, and Web Surface events appear when trusted surfaces emit them.

## Failure Cases

- Overlay not open: peer messages may report dropped/no peer.
- No Web Surface on the slide: `Check Web Surfaces` returns zero surfaces.
- Untrusted iframe content: no native SDK bridge is exposed.
