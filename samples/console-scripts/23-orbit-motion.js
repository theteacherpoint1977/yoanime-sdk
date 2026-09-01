(async () => {
  await yoanime.runtime.ready();

  await yoanime.motionProviders.register({
    id: "sample.orbit-motion",
    label: "Sample: Orbit Motion",
    kind: "noise",
    category: "Procedural",
    tags: ["orbit", "noise", "parametric"],
    inputs: {
      radiusX: { type: "number", label: "Radius X", default: 120 },
      radiusY: { type: "number", label: "Radius Y", default: 80 },
      frequency: { type: "number", label: "Frequency (Hz)", default: 0.5 }
    },
    generate: async context => {
      const target = context.selection?.primary || context.selection?.shape || context.selection?.shapes?.[0];
      if (!target?.runtimeNodeId) {
        throw new Error("Select one PowerPoint shape first.");
      }

      const radiusX = Number(context.options?.radiusX ?? 120);
      const radiusY = Number(context.options?.radiusY ?? 80);
      const frequency = Number(context.options?.frequency ?? 0.5);
      const duration = Number(context.durationSeconds || 4);
      const steps = Math.max(16, Math.round(duration * 30));
      const posXKeyframes = [];
      const posYKeyframes = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = frequency * t * duration * 2 * Math.PI;
        posXKeyframes.push({
          normalizedTime: t,
          value: { number: radiusX * Math.cos(angle) }
        });
        posYKeyframes.push({
          normalizedTime: t,
          value: { number: radiusY * Math.sin(angle) }
        });
      }

      return {
        label: "Orbit Motion",
        durationSeconds: duration,
        layers: [
          {
            runtimeNodeId: target.runtimeNodeId,
            properties: [
              {
                propertyKind: "PositionX",
                additive: true,
                durationSeconds: duration,
                keyframes: posXKeyframes
              },
              {
                propertyKind: "PositionY",
                additive: true,
                durationSeconds: duration,
                keyframes: posYKeyframes
              }
            ]
          }
        ]
      };
    }
  });

  const registered = yoanime.motionProviders.list();
  if (!registered.find(p => p.id === "sample.orbit-motion")) {
    throw new Error("Registration failed — provider not found in registry after register().");
  }

  const result = await yoanime.motionProviders.bake("sample.orbit-motion", {
    durationSeconds: 4,
    radiusX: 150,
    radiusY: 100,
    frequency: 0.75,
    play: true
  });

  console.log("Orbit motion baked:", result);
})();
