(async () => {
  await yoanime.runtime.ready();
  await yoanime.timeline.stop();

  await yoanime.motionProviders.register({
    id: "sample.spring-motion",
    label: "Sample: Spring Motion",
    kind: "noise",
    category: "Analytical Dynamics",
    tags: ["spring", "dynamics", "analytical"],
    inputs: {
      amplitude: { type: "number", label: "Amplitude", default: 100 },
      stiffness: { type: "number", label: "Stiffness", default: 4 },
      damping: { type: "number", label: "Damping (0–1)", default: 0.15 }
    },
    generate: async context => {
      const target = context.selection?.primary || context.selection?.shape || context.selection?.shapes?.[0];
      if (!target?.runtimeNodeId) {
        throw new Error("Select one PowerPoint shape first.");
      }

      const amplitude = Number(context.options?.amplitude ?? 100);
      const stiffness = Number(context.options?.stiffness ?? 4);
      const damping = Math.max(0, Math.min(Number(context.options?.damping ?? 0.15), 0.999));
      const duration = Number(context.durationSeconds || 5);
      const steps = Math.max(16, Math.round(duration * 30));
      const centerY = Number(target.y ?? target.top ?? 0);
      const omega0 = Math.sqrt(stiffness);
      const zeta = damping;
      const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);

      const posXKeyframes = [];
      const posYKeyframes = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const time = t * duration;
        const displacement = amplitude * Math.exp(-zeta * omega0 * time) * Math.cos(omegaD * time);
        posXKeyframes.push({
          normalizedTime: t,
          value: { number: displacement }
        });
        posYKeyframes.push({
          normalizedTime: t,
          value: { number: centerY }
        });
      }

      return {
        label: "Spring Motion",
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
  if (!registered.find(p => p.id === "sample.spring-motion")) {
    throw new Error("Registration failed — provider not found in registry after register().");
  }

  const generated = await yoanime.motionProviders.generate("sample.spring-motion", {
    durationSeconds: 5,
    amplitude: 100,
    stiffness: 4,
    damping: 0.15
  });

  const bakeRequest = yoanime.motionProviders.ir.toBakeRequest(generated.ir);
  const bakeResult = await yoanime.timeline.bake(bakeRequest);

  await yoanime.timeline.stop();
  await yoanime.timeline.playFrom(0);

  console.log("Spring motion baked:", bakeResult);
})();
