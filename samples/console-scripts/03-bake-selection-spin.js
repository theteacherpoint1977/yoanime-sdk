// yoAnime SDK 1.0.2 sample: bake a simple animation on the selected shape.
// Uses the stable timeline.bake path.
(async () => {
  await yoanime.runtime.ready();

  const shape = await yoanime.selection.get();
  if (!shape?.runtimeNodeId) {
    throw new Error("Select a PowerPoint shape with a stable runtimeNodeId first.");
  }

  const result = await yoanime.timeline.bake({
    label: "SDK Sample: Selection Spin",
    clear: ["Rotation"],
    durationSeconds: 2,
    layers: [{
      runtimeNodeId: shape.runtimeNodeId,
      properties: {
        Rotation: {
          durationSeconds: 2,
          keyframes: [
            { normalizedTime: 0, value: { number: 0 } },
            { normalizedTime: 0.5, value: { number: 180 } },
            { normalizedTime: 1, value: { number: 360 } }
          ]
        }
      }
    }]
  });

  console.log("Bake result:", result);
  yoanime.timeline.playFrom(0);
})();

