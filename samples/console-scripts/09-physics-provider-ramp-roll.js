// yoAnime SDK 1.0.2 sample: run physics through the Phase 89/90 motion provider contract.
// Create or open a slide with shapes named/role-tagged as Ball, Ramp, and Floor first.

(async () => {
  await yoanime.runtime.ready();

  const providers = yoanime.motionProviders.list()
    .filter(provider => provider.kind === "physics");
  console.table(providers.map(provider => ({
    id: provider.id,
    label: provider.label,
    ownerKind: provider.ownerKind
  })));

  const generated = await yoanime.motionProviders.generate("yoanime.physics.ramp-roll", {
    durationSeconds: 4.5,
    fps: 30,
    logDiagnostics: true
  });

  console.log("Generated physics motion:", generated);

  const result = await yoanime.motionProviders.bake("yoanime.physics.ramp-roll", {
    durationSeconds: 4.5,
    fps: 30,
    play: true
  });

  console.log("Physics provider bake result:", result);
})();
