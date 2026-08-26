import { useState, useCallback, useEffect } from 'react';
import type { YoAnimeSdk, SelectionResult } from '../global';

export function SelectionPanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: 'info' | 'warn' | 'error' | 'success', data?: unknown) => void }) {
  const [selection, setSelection] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refreshSelection = useCallback(async () => {
    setLoading(true);
    try {
      const sel = await sdk.selection.get();
      setSelection(sel);
      addLog('Selection.get() successful', 'success', sel);
    } catch (err) {
      addLog('Selection.get() failed', 'error', err);
    } finally {
      setLoading(false);
    }
  }, [sdk, addLog]);

  useEffect(() => {
    refreshSelection();
  }, [refreshSelection]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Selection</h2>
        <button
          onClick={refreshSelection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Selection'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">Primary Shape</h3>
          <pre className="text-sm bg-white p-3 rounded border border-gray-200 overflow-auto max-h-64">
            {JSON.stringify(selection?.primary || null, null, 2)}
          </pre>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">All Shapes ({selection?.count || 0})</h3>
          <pre className="text-sm bg-white p-3 rounded border border-gray-200 overflow-auto max-h-64">
            {JSON.stringify(selection?.shapes || [], null, 2)}
          </pre>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">Raw Response</h3>
          <pre className="text-sm bg-white p-3 rounded border border-gray-200 overflow-auto max-h-64">
            {JSON.stringify(selection || null, null, 2)}
          </pre>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">RuntimeNodeId Chain</h3>
        <p className="text-sm text-blue-800 mb-2">
          The runtimeNodeId from selection is the authoritative identity that flows through
          Scene → Motion → Timeline → Playback.
        </p>
        <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm">
          Primary: <span className="text-blue-700">{selection?.primary?.runtimeNodeId || '—'}</span>
          {selection?.shapes?.[0]?.runtimeNodeId && (
            <> | First Shape: <span className="text-blue-700">{selection.shapes[0].runtimeNodeId}</span></>
          )}
        </div>
      </div>
    </div>
  );
}