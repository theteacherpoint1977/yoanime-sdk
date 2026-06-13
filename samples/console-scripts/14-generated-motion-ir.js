// Phase 95 sample: Generated Motion IR v1.
// Run from a yoAnime taskpane/extension console with one shape selected.

(async () => {
  await yoanime.runtime.ready();

  const selection = await yoanime.selection.get();
  const primary = selection?.primary || selection?.shape || selection;
  const runtimeNodeId = primary?.runtimeNodeId || primary?.id;
  if (!runtimeNodeId) {
    console.warn("Select one PowerPoint shape first.");
    return;
  }

  const providerId = "sample.generated-motion-ir.pulse-x";

  await yoanime.motionProviders.register({
    id: providerId,
    label: "Sample: Generated Motion IR Pulse X",
    kind: "noise",
    tags: ["phase95", "generated-motion-ir"],
    inputs: {
      amount: { type: "range", label: "Amount", min: 5, max: 120, default: 40 },
      durationSeconds: { type: "duration", label: "Duration", default: 1.25 }
    },
    generate: async (context) => {
      const amount = Number(context.options?.amount ?? 40);
      const durationSeconds = Number(context.options?.durationSeconds ?? context.durationSeconds ?? 1.25);
      const scene = context.scene?.nodes || context.scene?.Nodes || [];
      const node = scene.find(item => item.runtimeNodeId === runtimeNodeId) || {};
      const startX = Number(node.x ?? node.left ?? node.bounds?.x ?? 0);

      return {
        contractVersion: "generated-motion.v1",
        label: "Generated Motion IR Pulse X",
        durationSeconds,
        seed: "phase95-demo",
        deterministic: true,
        clear: ["PositionX"],
        layers: [{
          runtimeNodeId,
          properties: {
            PositionX: {
              durationSeconds,
              keyframes: [
                { normalizedTime: 0, value: { number: startX } },
                { normalizedTime: 0.5, value: { number: startX + amount } },
                { normalizedTime: 1, value: { number: startX } }
              ]
            }
          }
        }],
        preview: {
          mode: "timeline",
          hints: [{ kind: "axis", axis: "x", amount }]
        },
        requirements: {
          selectionRequired: true,
          minSelectedShapes: 1
        },
        diagnostics: [{
          level: "info",
          code: "phase95.sample",
          message: `Generated X pulse for ${runtimeNodeId}.`
        }],
        metadata: {
          sample: "14-generated-motion-ir"
        }
      };
    }
  }, { ownerExtensionId: "sample.phase95" });

  const generated = await yoanime.motionProviders.generate(providerId, {
    amount: 48,
    durationSeconds: 1.4
  });

  console.log("Generated IR:");
  console.log(generated.ir);
  console.table(generated.diagnostics || []);

  const validation = yoanime.motionProviders.ir.validate(generated.ir);
  console.log("IR validation:", validation);

  const bakeRequest = yoanime.motionProviders.ir.toBakeRequest(generated.ir);
  console.log("Bake request:", bakeRequest);

  const bake = await yoanime.motionProviders.bake(providerId, {
    amount: 48,
    durationSeconds: 1.4,
    play: true
  });

  console.log("Bake result:");
  console.log(bake);
})();
