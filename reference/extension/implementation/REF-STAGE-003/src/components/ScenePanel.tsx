import { useState, useCallback } from 'react';
import type { YoAnimeSdk } from '../../global';

export function ScenePanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: 'info' | 'warn' | 'error' | 'success', data?: unknown) => void }) {
  const [scene, setScene] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [newShape, setNewShape] = useState({
    id: 'scene-shape-1',
    type: 'rectangle',
    name: 'Scene Shape',
    bounds: { left: 100, top: 100, width: 120, height: 80 },
    fill: { color: '#3b82f6' },
  });

  const refreshScene = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sdk.scene.get({ includeGeometry: true, includeTags: true, includeShapeType: true });
      setScene(res);
      addLog('Scene.get() successful', 'success', res);
    } catch (err) {
      addLog('Scene.get() failed', 'error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBuild = useCallback(async () => {
    setBuilding(true);
    try {
      const res = await sdk.scene.build({
        clear: false,
        shapes: [newShape],
      });
      addLog('Scene.build() successful', 'success', res);
      refreshScene();
    } catch (err) {
      addLog('Scene.build() failed', 'error', err);
    } finally {
      setBuilding(false);
    }
  }, [refreshScene]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Scene</h2>
        <button
          onClick={refreshScene}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Scene Get */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Scene Snapshot</h3>
          <button onClick={refreshScene} disabled={loading} className="text-sm text-blue-600 hover:underline">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="p-4">
          {scene ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Root Nodes</h4>
                  <p className="text-sm text-gray-600">Count: {scene?.fullSnapshot?.rootNodes?.length || scene?.shapes?.length || 0}</p>
                  <pre className="mt-2 text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-64">
                    {JSON.stringify((scene?.fullSnapshot?.rootNodes || scene?.shapes || []).slice(0, 3), null, 2)}
                  </pre>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Slide Instance</h4>
                  <p className="font-mono text-sm text-gray-600">{scene?.slideInstanceId || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Delta Payload</h4>
                  <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-64">
                    {JSON.stringify(scene?.deltaPayload || null, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No scene data. Click Refresh to load.</p>
            </div>
          )}
        </div>
      </div>

      {/* Scene Build */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Build Shape (scene.build)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <input
              type="text"
              value={newShape.id}
              onChange={(e) => setNewShape({ ...newShape, id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={newShape.type}
              onChange={(e) => setNewShape({ ...newShape, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="rectangle">rectangle</option>
              <option value="roundedRectangle">roundedRectangle</option>
              <option value="circle">circle</option>
              <option value="triangle">triangle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newShape.name}
              onChange={(e) => setNewShape({ ...newShape, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-4 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Left</label>
              <input type="number" value={newShape.bounds.left} onChange={(e) => setNewShape({ ...newShape, bounds: { ...newShape.bounds, left: parseFloat(e.target.value) || 0 }})} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Top</label>
              <input type="number" value={newShape.bounds.top} onChange={(e) => setNewShape({ ...newShape, bounds: { ...newShape.bounds, top: parseFloat(e.target.value) || 0 }})} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
              <input type="number" value={newShape.bounds.width} onChange={(e) => setNewShape({ ...newShape, bounds: { ...newShape.bounds, width: parseFloat(e.target.value) || 0 }})} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <input type="number" value={newShape.bounds.height} onChange={(e) => setNewShape({ ...newShape, bounds: { ...newShape.bounds, height: parseFloat(e.target.value) || 0 }})} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fill Color</label>
              <input type="color" value={newShape.fill.color} onChange={(e) => setNewShape({ ...newShape, fill: { color: e.target.value } })} className="w-full h-10 border border-gray-300 rounded" />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBuild}
                disabled={building}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {building ? 'Building...' : 'Build Shape'}
              </button>
            </div>
          </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">Scene API Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Read (scene.read)</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>{'• scene.get({ includeGeometry, includeShapeType, includeTags })'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Write (scene.write)</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>{'• scene.build({ clear, shapes })'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Roles (scene.write/read)</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• roles.setParent(child, parent)</li>
                <li>• roles.getParent(child)</li>
                <li>• roles.getChildren(parent)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Permissions</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• scene.read (get)</li>
                <li>• scene.write (build, roles)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}