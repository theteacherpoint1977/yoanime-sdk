// Phase 101 sample: Lottie transform extraction.
// Run from a yoAnime taskpane/extension console with one shape selected.

(async () => {
  await yoanime.runtime.ready();

  const selection = await yoanime.selection.get();
  const primary = selection?.primary || selection?.shape || selection;
  const runtimeNodeId = primary?.runtimeNodeId || primary?.id;
  if (!runtimeNodeId) {
    console.warn("Select one PowerPoint shape first.");
    return;
  }

  const lottieJson = {
    v: "5.12.0",
    fr: 30,
    ip: 0,
    op: 60,
    w: 640,
    h: 360,
    nm: "Phase 101 Tiny Transform Demo",
    layers: [{
      ind: 1,
      ty: 4,
      nm: "Mover",
      ks: {
        p: {
          k: [
            { t: 0, s: [120, 120, 0] },
            { t: 30, s: [280, 70, 0] },
            { t: 60, s: [420, 160, 0] }
          ]
        },
        s: {
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 30, s: [130, 130, 100] },
            { t: 60, s: [100, 100, 100] }
          ]
        },
        r: {
          k: [
            { t: 0, s: [0] },
            { t: 30, s: [25] },
            { t: 60, s: [-15] }
          ]
        },
        o: {
          k: [
            { t: 0, s: [100] },
            { t: 45, s: [70] },
            { t: 60, s: [100] }
          ]
        }
      }
    }]
  };

  console.table(yoanime.lottie.listLayers(lottieJson));

  const generated = await yoanime.motionProviders.generate("yoanime.lottie.transform", {
    lottieJson,
    layerIndex: 0,
    positionMode: "relative",
    scale: 0.5
  });

  console.log("Generated Lottie IR:", generated.ir);
  console.table(generated.diagnostics || generated.ir?.diagnostics || []);

  const validation = yoanime.motionProviders.ir.validate(generated.ir);
  console.log("IR validation:", validation);

  const bake = await yoanime.motionProviders.bake("yoanime.lottie.transform", {
    lottieJson,
    layerIndex: 0,
    positionMode: "relative",
    scale: 0.5,
    play: true
  });

  console.log("Bake result:", bake);
})();
