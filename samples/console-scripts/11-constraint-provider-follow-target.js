// yoAnime SDK 1.0.2 sample: relationship-based motion through constraint providers.
// Create two shapes. Select the source shape. Name the target shape "Target"
// or assign it the role "target" through scene.roles.set.

(async () => {
  await yoanime.runtime.ready();

  const providers = yoanime.motionProviders.list()
    .filter(provider => provider.kind === "constraint");
  console.table(providers.map(provider => ({
    id: provider.id,
    label: provider.label,
    ownerKind: provider.ownerKind
  })));

  const generated = await yoanime.motionProviders.generate("yoanime.constraint.follow-target", {
    targetName: "Target",
    durationSeconds: 1
  });

  console.log("Generated constraint motion:", generated);

  const result = await yoanime.motionProviders.bake("yoanime.constraint.follow-target", {
    targetName: "Target",
    durationSeconds: 1,
    play: true
  });

  console.log("Constraint provider bake result:", result);
})();
