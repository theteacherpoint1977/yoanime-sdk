(async () => {
  await yoanime.runtime.ready();

  await yoanime.motionProviders.register({
    id: "sample.noise-motion",
    label: "Sample: Noise Motion",
    kind: "noise",
    category: "Procedural",
    tags: ["noise", "procedural", "parametric"],
    inputs: {
      amplitude: { type: "number", label: "Amplitude", default: 30 },
      frequency: { type: "number", label: "Frequency", default: 2 },
      seed: { type: "number", label: "Seed", default: 42 }
    },
    generate: async context => {
      const target = context.selection?.primary || context.selection?.shape || context.selection?.shapes?.[0];
      if (!target?.runtimeNodeId) {
        throw new Error("Select one PowerPoint shape first.");
      }

      const amplitude = Number(context.options?.amplitude ?? 30);
      const frequency = Number(context.options?.frequency ?? 2);
      const seed = Number(context.options?.seed ?? 42);
      const duration = Number(context.durationSeconds || 4);
      const steps = Math.max(16, Math.round(duration * 30));
      const centerX = Number(target.x ?? target.left ?? 0);
      const centerY = Number(target.y ?? target.top ?? 0);

      function valueNoise(t, axis) {
        const h = seed ^ (axis * 31337);
        const i = Math.floor(t);
        let f = t - i;
        f = f * f * (3 - 2 * f);

        function evalHash(idx) {
          let v = ((h ^ idx) >>> 0);
          v = Math.imul(v, 0x9e3779b9); v ^= v >>> 16;
          v = Math.imul(v, 0x85ebca6b); v ^= v >>> 13;
          v = Math.imul(v, 0xc2b2ae35); v ^= v >>> 16;
          return (v / 4294967296) * 2 - 1;
        }

        return evalHash(i) * (1 - f) + evalHash(i + 1) * f;
      }

      const posXKeyframes = [];
      const posYKeyframes = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const noiseT = frequency * t * duration;
        posXKeyframes.push({
          normalizedTime: t,
          value: { number: centerX + amplitude * valueNoise(noiseT, 0) }
        });
        posYKeyframes.push({
          normalizedTime: t,
          value: { number: centerY + amplitude * valueNoise(noiseT, 1) }
        });
      }

      return {
        label: "Noise Motion",
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
  if (!registered.find(p => p.id === "sample.noise-motion")) {
    throw new Error("Registration failed — provider not found in registry after register().");
  }

  const result = await yoanime.motionProviders.bake("sample.noise-motion", {
    durationSeconds: 4,
    amplitude: 30,
    frequency: 2,
    seed: 42,
    play: true
  });

  console.log("Noise motion baked:", result);
})();
