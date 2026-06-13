// Phase 96 sample: Scene Query DSL.
// Run from a yoAnime taskpane/extension console.

(async () => {
  await yoanime.runtime.ready();

  const selected = await yoanime.scene.query("selected");
  console.log("Selected shapes:", selected);

  const visibleShapes = await yoanime.scene.query("visible:true", { includeGeometry: true, includeShapeType: true, includeTags: true });
  console.table(visibleShapes.map(shape => ({
    name: shape.name || shape.shapeName,
    runtimeNodeId: shape.runtimeNodeId || shape.nodeId,
    type: shape.type || shape.shapeType,
    roles: (shape.roles || []).join(","),
    x: Number(shape.bounds?.left ?? 0).toFixed(1),
    y: Number(shape.bounds?.top ?? 0).toFixed(1)
  })));

  const titleLike = await yoanime.scene.query("name:*title*");
  console.log("Title-like shapes:", titleLike);

  const nearestToSelected = selected[0]
    ? await yoanime.scene.query({ visible: true, nearestTo: selected[0].runtimeNodeId, limit: 3 })
    : [];
  console.log("Nearest to selected:", nearestToSelected);

  const explainMissing = await yoanime.scene.explainQuery("role:this-role-does-not-exist");
  console.log("Explain empty query:", explainMissing);

  if (!selected[0]?.runtimeNodeId) {
    console.warn("Select one shape to test provider context.query.");
    return;
  }

  const providerId = "sample.scene-query-dsl.nudge-selected";
  await yoanime.motionProviders.register({
    id: providerId,
    label: "Sample: Scene Query DSL Nudge Selected",
    kind: "custom",
    tags: ["phase96", "scene-query"],
    generate: async (context) => {
      const selectedFromContext = await context.query("selected");
      const target = selectedFromContext[0];
      if (!target?.runtimeNodeId) throw new Error("Select one shape first.");
      const x = Number(target.bounds?.left ?? target.x ?? 0);

      return {
        contractVersion: "generated-motion.v1",
        label: "Scene Query DSL Nudge",
        durationSeconds: 0.8,
        clear: ["PositionX"],
        layers: [{
          runtimeNodeId: target.runtimeNodeId,
          properties: {
            PositionX: {
              keyframes: [
                { normalizedTime: 0, value: { number: x } },
                { normalizedTime: 0.5, value: { number: x + 36 } },
                { normalizedTime: 1, value: { number: x } }
              ]
            }
          }
        }],
        diagnostics: [{
          level: "info",
          code: "scene-query.target",
          message: `Provider resolved selected shape: ${target.name || target.shapeName || target.runtimeNodeId}`
        }]
      };
    }
  }, { ownerExtensionId: "sample.phase96" });

  const bake = await yoanime.motionProviders.bake(providerId, { play: true });
  console.log("Scene Query provider bake:", bake);
})();
