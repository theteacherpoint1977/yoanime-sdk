import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { getSdk } from './sdk/yoanime';
import type { YoAnimeSdk, YoAnimeCapabilities } from './global';

function waitForYoAnime(timeoutMs = 30000): Promise<YoAnimeSdk> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tick() {
      const sdk = getSdk();
      if (sdk) {
        resolve(sdk);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('yoAnime SDK not available'));
        return;
      }
      requestAnimationFrame(tick);
    })();
  });
}

async function bootstrap() {
  let sdk: YoAnimeSdk;
  let capabilities: YoAnimeCapabilities | null = null;

  try {
    sdk = await waitForYoAnime();
  } catch (_err) {
    console.error('[bootstrap] window.yoanime not available');
    const rootElement = document.getElementById('root');
    if (rootElement) {
      ReactDOM.createRoot(rootElement).render(<App capabilities={null} />);
    }
    return;
  }

  console.log('[bootstrap] yoanime keys:', Object.keys(sdk));

  try {
    await Promise.race([
      sdk.runtime.ready(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('SDK ready timeout')), 10000)
      ),
    ]);
    capabilities = await sdk.runtime.getCapabilities();
    console.log('[bootstrap] surface:', capabilities.surface);
    console.log('[bootstrap] sdkVersion:', capabilities.sdkVersion);
    console.log('[bootstrap] capabilities:', capabilities);
  } catch (err) {
    console.error('[bootstrap] SDK bootstrap failed:', err);
    const rootElement = document.getElementById('root');
    if (rootElement) {
      ReactDOM.createRoot(rootElement).render(<App capabilities={null} />);
    }
    return;
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');

  ReactDOM.createRoot(rootElement).render(<App capabilities={capabilities} sdk={sdk} />);

  // Overlay: init ghost-mode hotzone reporting (R-OVERLAY-005, R-EXT-003c)
  // Must be after render so DOM exists; bridge loads synchronously before module
  if (capabilities.surface?.toLowerCase().includes('overlay')) {
    const initOverlayInteraction = () => {
      const interaction = (window as any).yoAnimeOverlayInteraction;
      if (interaction?.init) {
        interaction.init({ containerId: 'root', interactiveSelectors: ['button', 'input', 'select', 'textarea', '[data-yoanime-interactive]'] });
        console.log('[overlay] yoAnimeOverlayInteraction.init() called');
      }
    };
    // report after next frame + settling reports [0,50,150,350,800ms] handled by interaction.js
    requestAnimationFrame(initOverlayInteraction);
    setTimeout(initOverlayInteraction, 100);
  }

  if (sdk?.runtime?.onSessionEnded) {
    sdk.runtime.onSessionEnded(() => {
      ReactDOM.createRoot(rootElement).unmount();
    });
  }
}

bootstrap();