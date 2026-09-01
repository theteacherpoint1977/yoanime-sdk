// yoAnime SDK 1.0.2 sample: particle system console script.
// Demonstrates yoanime.scene.batchMutate, timeline bake, and runtime channels.
// Run from a yoAnime taskpane console with shapes on the slide.
(async () => {
  await yoanime.runtime.ready();

  const scene = await yoanime.scene.get({
    includeGeometry: true,
    includeShapeType: true,
    includeTags: true
  });
  const shapes = scene.shapes || [];
  if (shapes.length === 0) {
    console.warn("No shapes found. Add shapes to the slide first.");
    return;
  }
  console.log("Found " + shapes.length + " shapes.");

  // 1. Initialise particle positions using the first three shapes (or fewer)
  const count = Math.min(3, shapes.length);
  const particles = [];
  for (let i = 0; i < count; i++) {
    const s = shapes[i];
    particles.push({
      shapeId: s.runtimeNodeId || s.id,
      x: s.bounds?.left || s.x || 0,
      y: s.bounds?.top || s.y || 0,
      vx: (Math.random() - 0.5) * 3,
      vy: -1 - Math.random() * 2,
      bounce: 0.5
    });
  }

  // 2. Simulate particles for 3 seconds using requestAnimationFrame,
  //    sending batched COM mutations via yoanime.scene.batchMutate.
  const slideW = 960;
  const slideH = 540;
  const gravity = 0.5;
  const dt = 1 / 30; // 30fps simulation step
  const steps = 90;  // 3 seconds

  for (let step = 0; step < steps; step++) {
    const mutations = [];
    for (const p of particles) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) { p.x = 0; p.vx = -p.vx * p.bounce; }
      if (p.x > slideW) { p.x = slideW; p.vx = -p.vx * p.bounce; }
      if (p.y < 0) { p.y = 0; p.vy = -p.vy * p.bounce; }
      if (p.y > slideH) { p.y = slideH; p.vy = -p.vy * p.bounce; }
      mutations.push({
        shapeId: p.shapeId,
        source: "SdkCommand",
        operations: [
          { operationType: "SetX", value: +p.x.toFixed(2) },
          { operationType: "SetY", value: +p.y.toFixed(2) }
        ]
      });
    }

    try {
      const result = await yoanime.scene.batchMutate({ mutations });
      console.log("Step " + (step + 1) + "/" + steps + " batch result:", result);
    } catch (err) {
      console.warn("Step " + (step + 1) + " batch failed:", err.message);
    }
  }

  // 3. Bake the final positions to the timeline for slideshow persistence.
  const layers = particles.map(p => {
    const endX = +p.x.toFixed(2);
    const endY = +p.y.toFixed(2);
    return {
      runtimeNodeId: p.shapeId,
      properties: {
        PositionX: {
          durationSeconds: 3,
          keyframes: [
            { normalizedTime: 0, value: { number: endX } },
            { normalizedTime: 1, value: { number: endX } }
          ]
        },
        PositionY: {
          durationSeconds: 3,
          keyframes: [
            { normalizedTime: 0, value: { number: endY } },
            { normalizedTime: 1, value: { number: endY } }
          ]
        }
      }
    };
  });

  const bake = await yoanime.timeline.bake({
    label: "Particle System Console Sample",
    durationSeconds: 3,
    layers
  });
  console.log("Bake result:", bake);

  await yoanime.timeline.playFrom(0);
  console.log("Playing back particle animation.");
})();
