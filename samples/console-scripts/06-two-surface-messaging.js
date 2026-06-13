// yoAnime SDK 1.0.2 sample: taskpane/overlay message bridge.
// Run the same file from either surface. It sends a ping to the paired surface.
(async () => {
  await yoanime.runtime.ready();

  const payload = {
    type: "sdk-sample.ping",
    sentAt: new Date().toISOString(),
    surface: yoanime.runtime.surface
  };

  const unsubscribeTaskpane = yoanime.taskpane.onMessage(event => {
    console.log("Message received from overlay/taskpane bridge:", event);
  });

  const unsubscribeOverlay = yoanime.overlay.onMessage(event => {
    console.log("Message received from overlay/taskpane bridge:", event);
  });

  if ((yoanime.runtime.surface || "").toLowerCase().includes("overlay")) {
    await yoanime.taskpane.postMessage(payload);
    console.log("Sent ping to taskpane.");
  } else {
    await yoanime.overlay.show();
    await yoanime.overlay.postMessage(payload);
    console.log("Sent ping to overlay.");
  }

  setTimeout(() => {
    unsubscribeTaskpane?.();
    unsubscribeOverlay?.();
  }, 10000);
})();

