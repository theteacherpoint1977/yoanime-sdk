// yoAnime SDK 1.0.2 sample: move a selected shape along an SVG path.
// Select one PowerPoint shape before running.

(async () => {
  await yoanime.runtime.ready();

  const providers = yoanime.motionProviders.list()
    .filter(provider => provider.kind === "path");
  console.table(providers.map(provider => ({
    id: provider.id,
    label: provider.label,
    ownerKind: provider.ownerKind
  })));

  const pathData = "M 120 220 C 240 80 420 360 620 180";

  const generated = await yoanime.motionProviders.generate("yoanime.path.follow-svg", {
    pathData,
    durationSeconds: 3,
    sampleCount: 90
  });

  console.log("Generated path motion:", generated);

  const result = await yoanime.motionProviders.bake("yoanime.path.follow-svg", {
    pathData,
    durationSeconds: 3,
    sampleCount: 90,
    play: true
  });

  console.log("Path provider bake result:", result);
})();
