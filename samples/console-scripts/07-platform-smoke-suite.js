// yoAnime SDK 1.0.2 sample: compact platform smoke suite.
// Use before handing an extension build to testers.
(async () => {
  await yoanime.runtime.ready();

  const caps = await yoanime.runtime.getCapabilities();
  const ctx = await yoanime.slide.getContext();
  const scene = await yoanime.scene.get({
    includeGeometry: true,
    includeShapeType: true,
    includeTags: true
  });
  const timeline = await yoanime.timeline.get();

  const failures = [];
  if (!caps.sdkVersion) failures.push("Missing sdkVersion.");
  if (!ctx?.slide?.widthPoints || !ctx?.slide?.heightPoints) failures.push("Missing slide size.");
  if (scene.identityDiagnostics && !scene.identityDiagnostics.isHealthy) {
    failures.push("Scene identity diagnostics are unhealthy.");
  }
  if (!Array.isArray(scene.shapes)) failures.push("scene.shapes is not an array.");

  console.table({
    sdkVersion: caps.sdkVersion,
    stableApis: (caps.apiStability?.stable || []).length,
    slide: `${ctx.slide.widthPoints} x ${ctx.slide.heightPoints}`,
    shapeCount: scene.shapeCount ?? (scene.shapes || []).length,
    timelineVersion: timeline.timelineVersion || timeline.TimelineVersion || "<none>",
    failures: failures.length
  });

  console.log("Capabilities:", caps);
  console.log("Scene identity diagnostics:", scene.identityDiagnostics);
  console.log("Smoke suite result:", failures.length ? failures : "PASS");
})();

