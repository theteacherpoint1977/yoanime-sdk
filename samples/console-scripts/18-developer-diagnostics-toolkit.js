// Phase 99 sample: Developer Diagnostics Toolkit.
// Run from a yoAnime taskpane/extension console.

(async () => {
  await yoanime.runtime.ready();

  const runtime = await yoanime.dev.inspectRuntime();
  console.log("Runtime diagnostics:");
  console.log(runtime);

  const providers = yoanime.dev.inspectProviders();
  console.log("Provider diagnostics:");
  console.table(providers.providers.map(provider => ({
    id: provider.id,
    label: provider.label,
    kind: provider.kind,
    ownerKind: provider.ownerKind,
    valid: provider.valid
  })));

  const scene = await yoanime.dev.inspectScene();
  console.log("Scene diagnostics:");
  console.log(scene);

  const webSurfaces = await yoanime.dev.inspectWebSurfaces();
  console.log("Web Surface diagnostics:");
  console.table((webSurfaces.surfaces || []).map(surface => ({
    contentId: surface.contentId,
    shapeName: surface.shapeName,
    slideIndex: surface.slideIndex,
    slideId: surface.slideId,
    sourceType: surface.sourceType
  })));

  const channels = yoanime.dev.inspectChannels();
  console.log("Channel diagnostics:");
  console.table(channels.channels);

  const sampleValidation = yoanime.dev.validateMotion({
    contractVersion: "generated-motion.v1",
    label: "Diagnostics sample",
    durationSeconds: 1,
    layers: []
  });
  console.log("Motion validation sample:");
  console.log(sampleValidation);

  console.log("Recent Web Surface events:");
  console.table(yoanime.dev.getRecentEvents({ type: "webSurface.event", limit: 10 }).events);

  console.log("Recent SDK errors:");
  console.table(yoanime.dev.getRecentErrors({ limit: 10 }).errors);
})();

