// Phase 102 sample: AI Motion Provider Contract.
// Run from a yoAnime taskpane/extension console with one shape selected.
// This sample is deterministic and local; it does not call an AI service.

(async () => {
  await yoanime.runtime.ready();

  const selection = await yoanime.selection.get();
  const primary = selection?.primary || selection?.shape || selection;
  const runtimeNodeId = primary?.runtimeNodeId || primary?.id;
  if (!runtimeNodeId) {
    console.warn("Select one PowerPoint shape first.");
    return;
  }

  const request = {
    prompt: "Make this title bounce, spin, and pulse like a playful product launch",
    style: "clean",
    seed: "phase102-repeatable-demo",
    durationSeconds: 1.25,
    amplitude: 42,
    model: {
      provider: "yoAnime",
      id: "local-rule-prototype",
      version: "phase102"
    }
  };

  const normalized = yoanime.ai.normalizeRequest(request);
  const explanation = yoanime.ai.explainPrompt(normalized);

  console.log("Normalized AI request:", normalized);
  console.log("AI motion explanation:", explanation);

  const generated = await yoanime.motionProviders.generate("yoanime.ai.prompt-motion", request);
  console.log("Generated AI Motion IR:", generated.ir);
  console.table(generated.diagnostics || generated.ir?.diagnostics || []);

  const validation = yoanime.motionProviders.ir.validate(generated.ir);
  console.log("IR validation:", validation);

  const metadata = generated.ir?.metadata || {};
  console.log("Persisted prompt metadata:", {
    prompt: metadata.prompt,
    style: metadata.style,
    seed: metadata.seed,
    targetRuntimeNodeIds: metadata.targetRuntimeNodeIds,
    model: metadata.model,
    explanation: metadata.explanation,
    reproducible: metadata.reproducible,
    authority: metadata.authority
  });

  const bake = await yoanime.motionProviders.bake("yoanime.ai.prompt-motion", {
    ...request,
    play: true
  });

  console.log("Bake result:", bake);
})();
