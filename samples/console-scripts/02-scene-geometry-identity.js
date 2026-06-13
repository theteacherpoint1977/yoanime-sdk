// yoAnime SDK 1.0.2 sample: scene geometry and runtime identity diagnostics.
// This is the first script to run when debugging extension geometry.
(async () => {
  await yoanime.runtime.ready();

  yoanime.events.on("scene.changed", event => {
    console.log("scene.changed:", event.payload.lifecycleDiagnostics);
  });

  const ctx = await yoanime.slide.getContext();
  const scene = await yoanime.scene.get({
    includeGeometry: true,
    includeShapeType: true,
    includeTags: true
  });

  console.log("Slide world:", {
    slideIndex: ctx.slideIndex,
    widthPoints: ctx.slide.widthPoints,
    heightPoints: ctx.slide.heightPoints,
    authoritative: ctx.isAuthoritative,
    confidence: ctx.geometryConfidence
  });

  console.table((scene.shapes || []).map(shape => ({
    name: shape.name,
    runtimeNodeId: shape.runtimeNodeId,
    pptShapeId: shape.powerPointShapeId,
    type: shape.type,
    x: Number(shape.bounds?.left ?? 0).toFixed(2),
    y: Number(shape.bounds?.top ?? 0).toFixed(2),
    w: Number(shape.bounds?.width ?? 0).toFixed(2),
    h: Number(shape.bounds?.height ?? 0).toFixed(2),
    rot: Number(shape.bounds?.rotation ?? 0).toFixed(2),
    roles: (shape.roles || []).join(",")
  })));

  console.log("Identity diagnostics:", scene.identityDiagnostics);
  console.log("Lifecycle diagnostics:", scene.lifecycleDiagnostics);
})();
