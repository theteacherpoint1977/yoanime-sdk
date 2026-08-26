export function getSdk(): YoAnimeSdk {
  return (window as unknown as { yoanime: YoAnimeSdk }).yoanime;
}

export function getSdkCompat(): YoAnimeSdkCompat {
  return (window as unknown as { yoanime: YoAnimeSdkCompat }).yoanime;
}