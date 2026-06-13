# Sample Procedural Provider Pack

Demonstrates:

- provider pack registration
- input schema
- Scene Query DSL via `context.query("selected")`
- `generated-motion.v1`
- bake/play through `yoanime.motionProviders.bake(...)`

## Smoke Test

1. Install this folder through the Extension Manager.
2. Select one PowerPoint shape.
3. Click `Register Pack`.
4. Click `Query Scene`.
5. Click `Bake Selected`.

Expected result: the selected shape hops upward and returns.

## Failure Cases

- No selected shape: provider reports selection requirement failure.
- Pack not registered: bake reports provider not registered.
- Duplicate registration: sample uses `{ replace: true }` intentionally.
