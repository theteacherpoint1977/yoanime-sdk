// yoAnime SDK 1.0.2 sample: register and run a simple procedural motion provider.
// Paste into an extension page console after selecting one PowerPoint shape.

(async () => {
  await yoanime.runtime.ready();

  await yoanime.motionProviders.register({
    id: "sample.wiggle-lite",
    label: "Sample Wiggle Lite",
    kind: "noise",
    category: "Procedural",
    tags: ["noise", "wiggle", "timeline"],
    inputs: {
      amplitude: { type: "number", default: 32 },
      cycles: { type: "number", default: 4 }
    },
    generate: async context => {
      const target = context.selection?.primary || context.selection?.shape || context.selection?.shapes?.[0];
      if (!target?.runtimeNodeId) {
        throw new Error("Select one PowerPoint shape first.");
      }

      const amplitude = Number(context.options?.amplitude ?? 32);
      const cycles = Math.max(1, Math.round(Number(context.options?.cycles ?? 4)));
      const keyframes = [];
      for (let i = 0; i <= cycles; i++) {
        const t = i / cycles;
        const direction = i % 2 === 0 ? -1 : 1;
        keyframes.push({
          normalizedTime: t,
          value: { number: direction * amplitude }
        });
      }

      return {
        label: "Sample Wiggle Lite",
        durationSeconds: Number(context.durationSeconds || 2),
        layers: [
          {
            runtimeNodeId: target.runtimeNodeId,
            properties: [
              {
                propertyKind: "PositionX",
                additive: true,
                durationSeconds: Number(context.durationSeconds || 2),
                keyframes
              }
            ]
          }
        ]
      };
    }
  });

  const result = await yoanime.motionProviders.bake("sample.wiggle-lite", {
    durationSeconds: 2,
    amplitude: 30,
    cycles: 6,
    play: true
  });

  console.log("Motion provider bake result:", result);
})();
