// Phase 97 sample: Runtime Channel API.
// Run in a yoAnime taskpane or overlay console.
// If only one surface is open, local delivery still verifies the channel contract.

(async () => {
  await yoanime.runtime.ready();

  const channel = await yoanime.channels.open("sample.phase97.runtime-channel", {
    label: "Phase 97 Runtime Channel",
    ownerExtensionId: "sample.phase97"
  });

  const unsubscribe = channel.subscribe("*", event => {
    console.log("Channel event received:", event);
  });

  const localResult = await channel.publish("self.ping", {
    message: "Local channel delivery works.",
    surface: yoanime.runtime.surface
  }, {
    target: "local"
  });

  console.log("Local publish result:", localResult);

  const peerResult = await channel.publish("peer.ping", {
    message: "If the opposite surface is open, it can receive this.",
    surface: yoanime.runtime.surface
  }, {
    target: "peer",
    local: true
  });

  console.log("Peer publish result:", peerResult);
  console.table(yoanime.channels.list());

  // Keep the subscription alive for manual peer tests.
  window.__yoanimePhase97Unsubscribe = unsubscribe;
  window.__yoanimePhase97Channel = channel;
})();
