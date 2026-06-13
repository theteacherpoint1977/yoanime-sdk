// yoAnime SDK 1.0.2 sample: classify selected shapes, then bake a fly-in from the pasteboard.
// Select one or more shapes first, or run after assigning roles from a custom UI.
(async () => {
  await yoanime.runtime.ready();

  const ctx = await yoanime.slide.getContext();
  const scene = await yoanime.scene.get({
    includeGeometry: true,
    includeShapeType: true,
    includeTags: true
  });

  const targets = (scene.shapes || []).filter(shape =>
    shape.runtimeNodeId &&
    shape.isVisible !== false &&
    !((shape.roles || []).includes("floor") || (shape.roles || []).includes("ramp"))
  );

  if (targets.length === 0) {
    throw new Error("No visible scene shapes found to animate.");
  }

  const leftZone = ctx.pasteboard.entranceZones.left;
  const layers = targets.map((shape, index) => {
    const b = shape.bounds;
    const startX = leftZone.x - b.width - index * 20;
    return {
      runtimeNodeId: shape.runtimeNodeId,
      properties: {
        PositionX: {
          durationSeconds: 1.8,
          keyframes: [
            { normalizedTime: 0, value: { number: startX } },
            { normalizedTime: 0.72, value: { number: b.left + 18 } },
            { normalizedTime: 1, value: { number: b.left } }
          ]
        },
        PositionY: {
          durationSeconds: 1.8,
          keyframes: [
            { normalizedTime: 0, value: { number: b.top } },
            { normalizedTime: 1, value: { number: b.top } }
          ]
        },
        Opacity: {
          durationSeconds: 1.8,
          keyframes: [
            { normalizedTime: 0, value: { number: 0 } },
            { normalizedTime: 0.25, value: { number: 1 } },
            { normalizedTime: 1, value: { number: 1 } }
          ]
        }
      }
    };
  });

  const result = await yoanime.timeline.bake({
    label: "SDK Sample: Pasteboard Fly In",
    clear: ["PositionX", "PositionY", "Opacity"],
    durationSeconds: 1.8,
    layers
  });

  console.log("Bake result:", result);
  yoanime.timeline.playFrom(0);
})();

