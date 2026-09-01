(async () => {
  await yoanime.runtime.ready();

  await yoanime.motionProviders.register({
    id: "sample.spiral-motion",
    label: "Sample: Spiral Motion",
    kind: "noise",
    category: "Procedural",
    tags: ["spiral", "noise", "parametric"],
    inputs: {
      startRadius: { type: "number", label: "Start Radius", default: 20 },
      endRadius: { type: "number", label: "End Radius", default: 180 },
      frequency: { type: "number", label: "Frequency (Hz)", default: 0.75 },
      durationSeconds: { type: "duration", label: "Duration", default: 4 }
    },
    generate: async context => {
      const target = context.selection?.primary || context.selection?.shape || context.selection?.shapes?.[0];
      if (!target?.runtimeNodeId) {
        throw new Error("Select one PowerPoint shape first.");
      }

      const startRadius = Number(context.options?.startRadius ?? 20);
      const endRadius = Number(context.options?.endRadius ?? 180);
      const frequency = Number(context.options?.frequency ?? 0.75);
      const duration = Number(context.options?.durationSeconds ?? context.durationSeconds ?? 4);
      const rate = (endRadius - startRadius) / duration;
      const steps = Math.max(16, Math.round(duration * 30));
      const centerX = Number(target.x ?? target.left ?? 0);
      const centerY = Number(target.y ?? target.top ?? 0);

      const posXKeyframes = [];
      const posYKeyframes = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const r = startRadius + rate * t * duration;
        const angle = frequency * t * duration * 2 * Math.PI;
        posXKeyframes.push({
          normalizedTime: t,
          value: { number: centerX + r * Math.cos(angle) }
        });
        posYKeyframes.push({
          normalizedTime: t,
          value: { number: centerY + r * Math.sin(angle) }
        });
      }

      return {
        label: "Spiral Motion",
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
  if (!registered.find(p => p.id === "sample.spiral-motion")) {
    throw new Error("Registration failed — provider not found in registry after register().");
  }

  const result = await yoanime.motionProviders.bake("sample.spiral-motion", {
    durationSeconds: 4,
    startRadius: 20,
    endRadius: 180,
    frequency: 0.75,
    play: true
  });

  console.log("Spiral motion baked:", result);
})();
