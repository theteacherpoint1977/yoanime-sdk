// yoAnime SDK 1.0.2 sample: runtime readiness and capability report.
// Run from a yoAnime extension WebView console.
(async () => {
  await yoanime.runtime.ready();

  const caps = await yoanime.runtime.getCapabilities();
  console.log("yoAnime SDK capabilities:", caps);

  console.table({
    sdkVersion: caps.sdkVersion,
    hostVersion: caps.hostVersion,
    surface: caps.surface,
    extensionId: caps.extensionId || "<none>",
    isExtensionSession: caps.isExtensionSession,
    stableApis: (caps.apiStability?.stable || []).join(", ")
  });
})();

