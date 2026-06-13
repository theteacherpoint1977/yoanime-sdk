// Phase 98 sample: Web Surface Event Bridge.
// Run from a yoAnime taskpane/extension console, then insert or switch to a built-in Web Surface.

(async () => {
  await yoanime.runtime.ready();

  const channel = await yoanime.channels.open("sample.phase98.websurface-events", {
    label: "Phase 98 Web Surface Events",
    ownerExtensionId: "sample.phase98"
  });

  const unsubscribeSurface = yoanime.webSurface.onEvent(async event => {
    console.log("Web Surface event received:");
    console.log(event);

    await channel.publish("websurface.event", event, {
      target: "local",
      ownerExtensionId: "sample.phase98"
    });
  });

  const unsubscribeChannel = channel.subscribe("websurface.event", event => {
    console.log("Runtime channel echo:");
    console.log(event.payload);
  });

  console.log("Listening for Web Surface events. Built-in surfaces emit one surface.ready event when loaded.");
  console.log("Call unsubscribeSurface() and unsubscribeChannel() to stop this sample.");

  window.phase98WebSurfaceEventSample = {
    channel,
    unsubscribeSurface,
    unsubscribeChannel
  };
})();

