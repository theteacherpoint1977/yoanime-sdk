import { useState, useCallback } from 'react';
import type { YoAnimeSdk } from '../../global';

export function PlaybackPanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: 'info' | 'warn' | 'error' | 'success', data?: unknown) => void }) {
  const [playing, setPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlay = useCallback(async () => {
    try {
      await sdk.timeline.play({ startTimeSeconds: playTime });
      setPlaying(true);
      addLog('Timeline.play() dispatched', 'success');
    } catch (err) {
      addLog('Timeline.play() failed', 'error', err);
    }
  }, [playTime]);

  const handleStop = useCallback(async () => {
    try {
      await sdk.timeline.stop();
      setPlaying(false);
      addLog('Timeline.stop() dispatched', 'success');
    } catch (err) {
      addLog('Timeline.stop() failed', 'error', err);
    }
  }, []);

  const handleScrub = useCallback(async () => {
    try {
      await sdk.timeline.scrubTo(playTime);
      addLog(`Timeline.scrubTo(${playTime})`, 'success');
    } catch (err) {
      addLog('Timeline.scrubTo() failed', 'error', err);
    }
  }, [playTime]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Playback</h2>
      </div>

      {/* Transport Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Transport Controls</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              disabled={playing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              ▶ Play
            </button>
            <button
              onClick={handleStop}
              disabled={!playing}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              ■ Stop
            </button>
          </div>
          <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
            <label className="text-sm text-gray-700">Start Time:</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={playTime}
              onChange={(e) => setPlayTime(parseFloat(e.target.value) || 0)}
              className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500 text-sm">seconds</span>
            <button
              onClick={handleScrub}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Scrub
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <span className={`px-2 py-1 rounded-full font-medium ${
              playing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
            }`}>
              {playing ? '▶ Playing' : '⏹ Stopped'}
            </span>
            <span className="text-gray-600">Position: {playTime.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Playback API</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Controls (timeline.playback)</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>{'• timeline.play({ startTimeSeconds }) \u2192 void'}</li>
              <li>{'• timeline.stop() \u2192 void'}</li>
              <li>{'• timeline.scrubTo(time) \u2192 Promise<void>'}</li>
              <li>{'• timeline.scrubBegin(time)'}</li>
              <li>{'• timeline.scrubUpdate(time)'}</li>
              <li>{'• timeline.scrubEnd(time)'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Events</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>\u2022 timeline.onTick(cb) \u2192 unsubscribe</li>
              <li>\u2022 playback.onStarted(cb) \u2192 unsubscribe</li>
              <li>\u2022 playback.onStopped(cb) \u2192 unsubscribe</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Playback Model</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>\u2022 Fire-and-forget (void return)</li>
              <li>\u2022 Bounded pipeline (Window=2)</li>
              <li>\u2022 Acked frames via RuntimeMutationCoordinator</li>
              <li>\u2022 timeline.tick events during playback</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Permissions</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>\u2022 timeline.playback (all operations)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}