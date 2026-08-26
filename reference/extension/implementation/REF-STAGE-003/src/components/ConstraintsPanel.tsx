import { useState, useCallback } from 'react';
import type { YoAnimeSdk } from '../../global';

export function ConstraintsPanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: 'info' | 'warn' | 'error' | 'success', data?: unknown) => void }) {
  const [constraints, setConstraints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newConstraint, setNewConstraint] = useState({
    type: 'MaintainOffset',
    sourceId: '',
    targetId: '',
    offsetX: 0,
    offsetY: 0,
    offsetRotation: 0,
    maintainRotation: false,
    distance: 100,
    enabled: true,
  });

  const refreshConstraints = useCallback(async () => {
    try {
      const res = await sdk.constraints.list();
      setConstraints(res.constraints || []);
      addLog('Constraints.list() successful', 'success', res);
    } catch (err) {
      addLog('Constraints.list() failed', 'error', err);
    }
  }, []);

  const handleCreate = async () => {
    const currentConstraint = newConstraint;
    if (!currentConstraint.sourceId || !currentConstraint.targetId) {
      addLog('Please enter both sourceId and targetId (runtimeNodeIds)', 'warn');
      return;
    }
    setCreating(true);
    try {
      const res = await sdk.constraints.create({
        type: currentConstraint.type as any,
        sourceId: currentConstraint.sourceId,
        targetId: currentConstraint.targetId,
        parameters: {
          offsetX: currentConstraint.offsetX,
          offsetY: currentConstraint.offsetY,
          offsetRotation: currentConstraint.offsetRotation,
          maintainRotation: currentConstraint.maintainRotation,
          distance: currentConstraint.distance,
        },
        enabled: currentConstraint.enabled,
      });
      addLog('Constraints.create() successful', 'success', res);
      refreshConstraints();
    } catch (err) {
      addLog('Constraints.create() failed', 'error', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (constraintId: string) => {
    if (!window.confirm('Delete this constraint?')) return;
    try {
      const res = await sdk.constraints.remove(constraintId);
      addLog('Constraints.remove() successful', 'success', res);
      refreshConstraints();
    } catch (err) {
      addLog('Constraints.remove() failed', 'error', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Constraints Graph</h2>
        <button
          onClick={refreshConstraints}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {/* Create Form */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Create Constraint</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={newConstraint.type}
              onChange={(e) => setNewConstraint({ ...newConstraint, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MaintainOffset">MaintainOffset</option>
              <option value="Follow">Follow</option>
              <option value="LookAt">LookAt</option>
              <option value="MaintainDistance">MaintainDistance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source ID (runtimeNodeId)</label>
            <input
              type="text"
              value={newConstraint.sourceId}
              onChange={(e) => setNewConstraint({ ...newConstraint, sourceId: e.target.value })}
              placeholder="Source runtimeNodeId"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target ID (runtimeNodeId)</label>
            <input
              type="text"
              value={newConstraint.targetId}
              onChange={(e) => setNewConstraint({ ...newConstraint, targetId: e.target.value })}
              placeholder="Target runtimeNodeId"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enabled</label>
            <select
              value={newConstraint.enabled.toString()}
              onChange={(e) => setNewConstraint({ ...newConstraint, enabled: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Offset X</label>
            <input
              type="number"
              value={newConstraint.offsetX}
              onChange={(e) => setNewConstraint({ ...newConstraint, offsetX: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Offset Y</label>
            <input
              type="number"
              value={newConstraint.offsetY}
              onChange={(e) => setNewConstraint({ ...newConstraint, offsetY: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Offset Rotation (deg)</label>
            <input
              type="number"
              value={newConstraint.offsetRotation}
              onChange={(e) => setNewConstraint({ ...newConstraint, offsetRotation: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintain Rotation</label>
            <select
              value={newConstraint.maintainRotation.toString()}
              onChange={(e) => setNewConstraint({ ...newConstraint, maintainRotation: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Distance (MaintainDistance)</label>
            <input
              type="number"
              value={newConstraint.distance}
              onChange={(e) => setNewConstraint({ ...newConstraint, distance: parseFloat(e.target.value) || 100 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end mt-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Constraint'}
            </button>
          </div>
        </div>

        {/* Constraints List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Constraints ({constraints.length})</h3>
            <button onClick={refreshConstraints} className="text-sm text-blue-600 hover:underline">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2">Target</th>
                  <th className="px-4 py-2">Params</th>
                  <th className="px-4 py-2">Enabled</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {constraints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No constraints yet. Create one using the form above.
                    </td>
                  </tr>
                ) : (
                  constraints.map((c) => (
                    <tr key={c.constraintId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">{c.type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{c.constraintId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{c.sourceId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{c.targetId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {c.type === 'MaintainDistance' ? `dist: ${c.parameters?.distance ?? 'N/A'}` : `off: ${c.parameters?.offsetX ?? 0}, ${c.parameters?.offsetY ?? 0}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" disabled checked={c.enabled} className="h-4 w-4" />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDelete(c.constraintId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">Constraints API Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Types (Closed V1)</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Follow</li>
                <li>• MaintainDistance</li>
                <li>• LookAt</li>
                <li>• MaintainOffset</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Read (constraint.read)</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• constraints.list() → ConstraintListResponse</li>
                <li>• constraints.get(id) → ConstraintGetResponse</li>
                <li>• constraints.onChanged(cb) → unsubscribe</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Write (constraint.write)</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• constraints.create(input) → ConstraintCreateResponse</li>
                <li>• constraints.update(id, patch) → ConstraintDto</li>
                <li>{'• constraints.remove(id) → { constraintId }'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Parameters by Type</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• MaintainOffset: offsetX, offsetY, offsetRotation?, maintainRotation?</li>
                <li>• MaintainDistance: distance</li>
                <li>• Follow: offsetX, offsetY, offsetRotation?, maintainRotation?</li>
                <li>• LookAt: offsetRotation?, maintainRotation?</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Permissions</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• constraint.read (list, get, onChanged)</li>
                <li>• constraint.write (create, update, remove)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Key Rules</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• sourceId ≠ targetId</li>
                <li>• Host-minted constraintId (compact N GUID)</li>
                <li>• Retired-not-reused identity policy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}