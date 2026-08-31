---
id: doc:readme-36
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
# Sample Lottie And AI Motion

Demonstrates:

- `yoanime.lottie.listLayers`
- `yoanime.lottie.transform`
- `yoanime.ai.explainPrompt`
- `yoanime.ai.prompt-motion`

## Smoke Test

1. Install this folder.
2. Select one PowerPoint shape.
3. Click `List Lottie Layers`.
4. Click `Bake Lottie`.
5. Click `Bake AI Prompt`.

Expected result: both providers produce Generated Motion IR and bake/play through the normal timeline path.

## Failure Cases

- No selected shape: provider reports a missing target.
- Unsupported Lottie layer fields: diagnostics/metadata explain what is unsupported.
- AI prompt is empty: provider rejects the request.
