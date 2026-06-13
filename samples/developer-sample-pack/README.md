# yoAnime Developer Sample Pack

Phase 103 turns the loose SDK smoke scripts into installable extension examples.

Install a sample through:

```text
yoAnime Welcome Screen -> Extensions -> Install Extension Folder
```

Choose one of the folders below or its `manifest.json`.

## Samples

| Folder | Teaches | Smoke Test |
| --- | --- | --- |
| `procedural-provider-pack` | provider packs, input schema, Generated Motion IR, Scene Query DSL | Select a shape, open the taskpane, click `Register Pack`, then `Bake Selected` |
| `runtime-channel-websurface` | taskpane/overlay runtime channels and Web Surface event bridge | Open taskpane, click `Open Overlay`, insert/switch to a Web Surface, watch events |
| `data-source-motion` | data source provider plus data-driven motion provider | Select a shape, click `Register Source`, then `Bake Data Motion` |
| `lottie-ai-motion` | Lottie transform extraction and AI motion contract | Select a shape, click `Bake Lottie`, then `Bake AI Prompt` |

## Expected Logs

Each taskpane has an on-screen log. Successful runs should show:

- SDK ready.
- Registration result with `success: true`.
- Generated Motion IR or diagnostic contract.
- Bake result with `success: true`.

## Failure Cases To Try

- Run with no selected shape.
- Run before the SDK is ready.
- Register twice without replacing.
- Remove or rename target shapes used by query/constraint examples.
- Switch slides and run again.

These samples are intentionally small. They demonstrate safe SDK contracts and the extension package shape, not production UI polish.
