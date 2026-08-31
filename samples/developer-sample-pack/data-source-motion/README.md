---
id: doc:readme-35
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
# Sample Data Source Motion

Demonstrates:

- `yoanime.data.registerSource`
- data source refresh/cache behavior
- provider `context.data.read(...)`
- data-driven Generated Motion IR

## Smoke Test

1. Install this folder.
2. Select a PowerPoint shape.
3. Click `Register Source`.
4. Click `Read Data`.
5. Click `Bake Data Motion`.

Expected result: selected shape rises by an amount based on the sample metric.

## Failure Cases

- Click `Read Data` before registering the source.
- Click `Bake Data Motion` with no selected shape.
- Refresh repeatedly and observe the metric value changing.
