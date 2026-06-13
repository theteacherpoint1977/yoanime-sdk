// yoAnime SDK 1.0.2 sample: register a provider pack with input schema.
// Select one PowerPoint shape before running.

(async () => {
  await yoanime.runtime.ready();

  const pack = {
    id: "sample.developer-wow-pack",
    label: "Sample Developer Wow Pack",
    version: "1.0.0",
    description: "Demonstrates Phase 94 provider packs and input schemas.",
    icon: "sparkles",
    sharedInputs: {
      durationSeconds: {
        type: "duration",
        label: "Duration",
        default: 1.5
      },
      seed: {
        type: "seed",
        label: "Seed",
        default: "sample-pack"
      }
    },
    providers: [
      {
        id: "sample.developer-wow-pack.soft-wiggle",
        label: "Soft Wiggle",
        kind: "noise",
        inputs: {
          amplitude: {
            type: "range",
            label: "Strength",
            min: 0,
            max: 80,
            default: 24
          }
        },
        generate: async context => {
          const target = context.selection?.primary || context.selection?.shape || context.selection?.shapes?.[0];
          if (!target?.runtimeNodeId) throw new Error("Select one PowerPoint shape first.");
          return yoanime.noise.generateWiggle({
            runtimeNodeId: target.runtimeNodeId,
            axis: "xy",
            amplitude: Number(context.options?.amplitude ?? 24),
            frequency: 3,
            durationSeconds: Number(context.options?.durationSeconds ?? 1.5),
            seed: context.options?.seed || "sample-pack",
            label: "Sample Pack: Soft Wiggle"
          });
        }
      },
      {
        id: "sample.developer-wow-pack.float-up",
        label: "Float Up",
        kind: "path",
        inputs: {
          distance: {
            type: "range",
            label: "Distance",
            min: 10,
            max: 220,
            default: 90
          }
        },
        generate: async context => {
          const target = context.selection?.primary || context.selection?.shape || context.selection?.shapes?.[0];
          if (!target?.runtimeNodeId) throw new Error("Select one PowerPoint shape first.");
          const b = yoanime.constraints.boundsOf(target);
          const distance = Number(context.options?.distance ?? 90);
          return yoanime.paths.generateFollowPath({
            runtimeNodeId: target.runtimeNodeId,
            source: target,
            points: [
              [b.centerX, b.centerY],
              [b.centerX, b.centerY - distance]
            ],
            durationSeconds: Number(context.options?.durationSeconds ?? 1.5),
            sampleCount: 24,
            label: "Sample Pack: Float Up"
          });
        }
      }
    ]
  };

  const validation = yoanime.motionProviders.validatePack(pack);
  console.log("Pack validation:", validation);
  if (!validation.success) return;

  const registration = await yoanime.motionProviders.registerPack(pack, { replace: true });
  console.log("Pack registration:", registration);
  console.table(yoanime.motionProviders.listPacks());

  const result = await yoanime.motionProviders.bake("sample.developer-wow-pack.soft-wiggle", {
    amplitude: 28,
    durationSeconds: 1.5,
    seed: "demo-pack",
    play: true
  });

  console.log("Pack provider bake result:", result);
})();
