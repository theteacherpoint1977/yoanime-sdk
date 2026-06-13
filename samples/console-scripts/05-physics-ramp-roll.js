// yoAnime SDK 1.0.2 sample: run the built-in Ramp Roll physics preset.
// Draw/name shapes: Ball 1, Ramp 1, Floor 1. Then run this from Two Surface Starter or another extension.
(async () => {
  await yoanime.runtime.ready();

  const scene = await yoanime.scene.get({
    includeGeometry: true,
    includeShapeType: true,
    includeTags: true
  });
  console.log("Scene identity diagnostics:", scene.identityDiagnostics);

  const result = await yoanime.physics.presets.rampRoll({
    durationSeconds: 5,
    fps: 30,
    play: true,
    worldOptions: {
      inferFromNames: true,
      rampPadding: 6,
      floorPadding: 6,
      rampThicknessMultiplier: 1.45,
      floorThicknessMultiplier: 1.25,
      ballRadiusScale: 0.96,
      ignoreInitialBallRotation: true
    }
  });

  console.log("Ramp Roll result:", result);
  const summary = yoanime.physics.diagnostics.summarizeBake(result);
  console.table(summary.pathRows);
  console.table(summary.contactRows);
})();

