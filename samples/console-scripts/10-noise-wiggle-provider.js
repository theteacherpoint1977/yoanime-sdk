// yoAnime SDK 1.0.2 sample: run deterministic wiggle through the motion provider contract.
// Select one PowerPoint shape before running.

(async () => {
  await yoanime.runtime.ready();

  const providers = yoanime.motionProviders.list()
    .filter(provider => provider.kind === "noise");
  console.table(providers.map(provider => ({
    id: provider.id,
    label: provider.label,
    ownerKind: provider.ownerKind
  })));

  const generated = await yoanime.motionProviders.generate("yoanime.noise.wiggle-position", {
    amplitude: 28,
    frequency: 4,
    durationSeconds: 2,
    fps: 12,
    seed: "demo-wiggle"
  });

  console.log("Generated wiggle motion:", generated);

  const result = await yoanime.motionProviders.bake("yoanime.noise.wiggle-position", {
    amplitude: 28,
    frequency: 4,
    durationSeconds: 2,
    fps: 12,
    seed: "demo-wiggle",
    play: true
  });

  console.log("Noise provider bake result:", result);
})();
