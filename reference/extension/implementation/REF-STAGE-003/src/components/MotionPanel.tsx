import { useState, useCallback } from 'react';
import type { YoAnimeSdk } from '../../global';

export function MotionPanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: 'info' | 'warn' | 'error' | 'success', data?: unknown) => void }) {
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [genDuration, setGenDuration] = useState(0.8);

  const refreshProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sdk.motionProviders.list();
      setProviders(res);
      addLog('motionProviders.list() successful', 'success', res);
    } catch (err) {
      addLog('motionProviders.list() failed', 'error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = async () => {
    const currentProvider = selectedProvider;
    const currentDuration = genDuration;
    if (!currentProvider) {
      addLog('Please select a provider first', 'warn');
      return;
    }
    setGenerating(true);
    try {
      const res = await sdk.motionProviders.generate(currentProvider.id, { durationSeconds: currentDuration });
      setGenerated(res);
      addLog(`motionProviders.generate(${currentProvider.id})`, 'success', res);
    } catch (err) {
      addLog(`motionProviders.generate() failed`, 'error', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleBake = async () => {
    const currentProvider = selectedProvider;
    const currentDuration = genDuration;
    if (!currentProvider) { addLog('Select a provider first', 'warn'); return; }
    setGenerating(true);
    try {
      // One-line bake chain: generate + timeline.bake (delegates to timeline.write)
      const res = await (sdk.motionProviders as any).bake(currentProvider.id, { durationSeconds: currentDuration });
      addLog(`motionProviders.bake(${currentProvider.id}) → timeline`, 'success', res);
      // refresh timeline snapshot so Tracks show new provider-specific channels
      try { const snap = await sdk.timeline.get(); addLog('Timeline.get() after bake', 'success', snap); } catch {}
    } catch (err) { addLog('motionProviders.bake() failed', 'error', err); } finally { setGenerating(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Motion Providers</h2>
        <button
          onClick={refreshProviders}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Providers List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Available Providers ({providers.length})</h3>
          <button onClick={refreshProviders} disabled={loading} className="text-sm text-blue-600 hover:underline">
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Kind</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No providers found</td>
                </tr>
              ) : (
                providers.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${selectedProvider?.id === p.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{p.kind || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{p.name || p.label || p.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => setSelectedProvider(p)}
                        className={`px-2 py-1 text-xs rounded ${selectedProvider?.id === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {selectedProvider?.id === p.id ? 'Selected' : 'Select'}
                      </button>
                    </td>
</tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Motion */}
      {selectedProvider && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Generate Motion: {selectedProvider.name || selectedProvider.id}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="30"
                value={genDuration}
                onChange={(e) => setGenDuration(parseFloat(e.target.value) || 0.8)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={handleBake}
                disabled={generating}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                title="Bake generated motion to timeline (motionProviders.bake → timeline.write)"
              >
                Bake to Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Result */}
      {generated && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3">Generated Motion</h3>
          <div className="bg-white p-4 rounded border border-gray-200 overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(generated, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Motion Providers API</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Provider Management</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• list() → MotionProvider[] (20 built-ins, 8 families)</li>
              <li>• get(id) → MotionProvider | null</li>
              <li>{'• register(provider) → { success, provider }'}</li>
              <li>{'• unregister(id) → { success, providerId }'}</li>
              <li>{'• registerPack(pack) → { success, pack }'}</li>
              <li>{'• unregisterPack(id) → { success, packId }'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Generation & Bake</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• generate(id, request) → motion-provider-result.v1</li>
              <li>• bake(id, request) → motion-provider-bake.v1</li>
              <li>• createContext(request?) → MotionProviderContext</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Built-in Families (20 providers)</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Physics (4): ramp-roll, projectile-impact, falling-stack, multi-ball-cascade</li>
              <li>• Noise (3): wiggle-position, wiggle-rotation, float</li>
              <li>• Constraint (3): follow-target, look-at, maintain-distance</li>
              <li>• Path (2): follow-svg, orbit-target</li>
              <li>• IK (1): two-bone-chain</li>
              <li>• Expression (5): wiggle-x, wiggle-y, wiggle-rotation, breathe-scale, pendulum</li>
              <li>• Lottie (1): transform</li>
              <li>• AI (1): prompt-motion</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Generate Context</h4>
            <p className="text-sm text-gray-700">3 context reads: slide.getContext, scene.get, selection.get</p>
            <p className="text-sm text-gray-700">No motionProviders.* permission needed for generate</p>
            <p className="text-sm text-gray-700">bake() delegates to timeline.bake → timeline.write</p>
          </div>
        </div>
      </div>
    </div>
  );
}