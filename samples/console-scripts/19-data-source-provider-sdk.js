// Phase 100 sample: Data Source Provider SDK.
// Run from a yoAnime taskpane/extension console with one shape selected.

(async () => {
  await yoanime.runtime.ready();

  const sourceId = "sample.phase100.counter";
  let counter = 0;

  const unsubscribe = yoanime.data.onChanged(event => {
    console.log("Data source changed:", event);
  });

  await yoanime.data.registerSource({
    id: sourceId,
    label: "Sample Phase 100 Counter",
    refreshIntervalSeconds: 5,
    refresh: async context => {
      counter += 1;
      return {
        rows: [{
          label: "counter",
          value: counter,
          timestamp: context.timestamp
        }],
        metadata: {
          sample: "phase100",
          contextVersion: context.contractVersion
        }
      };
    }
  }, { replace: true, ownerExtensionId: "sample.phase100" });

  console.table(yoanime.data.listSources());

  const first = await yoanime.data.read(sourceId, { cacheTtlSeconds: 5 });
  const cached = await yoanime.data.read(sourceId, { cacheTtlSeconds: 5 });
  const refreshed = await yoanime.data.refresh(sourceId);

  console.log("First read:", first);
  console.log("Cached read:", cached);
  console.log("Forced refresh:", refreshed);
  console.log("Data diagnostics:", yoanime.dev.inspectDataSources?.());

  const selection = await yoanime.selection.get();
  const primary = selection?.primary || selection?.shape || selection;
  const runtimeNodeId = primary?.runtimeNodeId || primary?.id;
  if (!runtimeNodeId) {
    console.warn("Select one PowerPoint shape to test the data-driven motion provider.");
    unsubscribe();
    return;
  }

  const providerId = "sample.phase100.data-driven-x";
  try { yoanime.motionProviders.unregister(providerId); } catch (_) {}
  const providerRegistration = await yoanime.motionProviders.register({
    id: providerId,
    label: "Sample: Data Driven X",
    kind: "data",
    tags: ["phase100", "data-source", "generated-motion-ir"],
    inputs: {
      multiplier: { type: "number", label: "Multiplier", default: 24 },
      durationSeconds: { type: "duration", label: "Duration", default: 1.2 }
    },
    generate: async context => {
      const data = await context.data.read(sourceId, { cacheTtlSeconds: 5 });
      const value = Number(data.rows?.[0]?.value ?? 1);
      const multiplier = Number(context.options?.multiplier ?? 24);
      const durationSeconds = Number(context.options?.durationSeconds ?? 1.2);
      const scene = context.scene?.nodes || context.scene?.Nodes || [];
      const node = scene.find(item => item.runtimeNodeId === runtimeNodeId) || {};
      const startX = Number(node.x ?? node.left ?? node.bounds?.x ?? 0);
      const amount = value * multiplier;

      return {
        contractVersion: "generated-motion.v1",
        label: "Data Driven X",
        durationSeconds,
        seed: `phase100-counter-${value}`,
        deterministic: false,
        clear: ["PositionX"],
        layers: [{
          runtimeNodeId,
          properties: {
            PositionX: {
              durationSeconds,
              keyframes: [
                { normalizedTime: 0, value: { number: startX } },
                { normalizedTime: 0.5, value: { number: startX + amount } },
                { normalizedTime: 1, value: { number: startX } }
              ]
            }
          }
        }],
        diagnostics: [{
          level: "info",
          code: "phase100.data-driven",
          message: `Used ${sourceId} value ${value} to generate ${amount}px of X motion.`
        }],
        metadata: {
          sourceId,
          value,
          multiplier
        }
      };
    }
  }, { ownerExtensionId: "sample.phase100" });
  console.log("Provider registration:", providerRegistration);
  if (!providerRegistration.success) {
    console.error("Provider registration failed:", providerRegistration);
    unsubscribe();
    return;
  }

  const generated = await yoanime.motionProviders.generate(providerId, {
    multiplier: 24,
    durationSeconds: 1.2
  });
  console.log("Generated data-driven IR:", generated.ir);
  console.table(generated.diagnostics || []);

  const bake = await yoanime.motionProviders.bake(providerId, {
    multiplier: 24,
    durationSeconds: 1.2,
    play: true
  });
  console.log("Bake result:", bake);

  console.log("Call unsubscribe() to stop data change logging.");
  window.unsubscribePhase100DataSourceSample = unsubscribe;
})();
