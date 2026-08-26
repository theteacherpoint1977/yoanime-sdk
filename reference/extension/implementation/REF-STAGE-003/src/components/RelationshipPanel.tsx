import { useState, useCallback } from 'react';
import type { YoAnimeSdk } from '../../global';

export function RelationshipPanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: 'info' | 'warn' | 'error' | 'success', data?: unknown) => void }) {
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRel, setNewRel] = useState({
    leaderId: '',
    followerId: '',
    offsetX: 0,
    offsetY: 0,
    offsetRotation: 0,
    maintainRotation: false,
  });
  const [selectedRel, setSelectedRel] = useState<any>(null);

  const refreshRelationships = useCallback(async () => {
    try {
      const res = await sdk.relationship.list();
      setRelationships(res.relationships || []);
      addLog('Relationship.list() successful', 'success', res);
    } catch (err) {
      addLog('Relationship.list() failed', 'error', err);
    }
  }, []);

  const handleCreate = async () => {
    const currentNewRel = newRel;
    if (!currentNewRel.leaderId || !currentNewRel.followerId) {
      addLog('Please enter both leaderId and followerId (runtimeNodeIds)', 'warn');
      return;
    }
    setCreating(true);
    try {
      const res = await sdk.relationship.create({
        leaderId: currentNewRel.leaderId,
        followerId: currentNewRel.followerId,
        offsetX: currentNewRel.offsetX,
        offsetY: currentNewRel.offsetY,
        offsetRotation: currentNewRel.offsetRotation,
        maintainRotation: currentNewRel.maintainRotation,
      });
      addLog('Relationship.create() successful', 'success', res);
      setNewRel({ ...currentNewRel, leaderId: '', followerId: '' });
      refreshRelationships();
    } catch (err) {
      addLog('Relationship.create() failed', 'error', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (relationshipId: string) => {
    if (!window.confirm('Delete this relationship?')) return;
    try {
      const res = await sdk.relationship.delete({ relationshipId });
      addLog('Relationship.delete() successful', 'success', res);
      refreshRelationships();
    } catch (err) {
      addLog('Relationship.delete() failed', 'error', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Relationship Graph</h2>
        <button
          onClick={refreshRelationships}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {/* Create Form */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Create Follow Relationship</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leader ID (runtimeNodeId)</label>
            <input
              type="text"
              value={newRel.leaderId}
              onChange={(e) => setNewRel({ ...newRel, leaderId: e.target.value })}
              placeholder="Leader runtimeNodeId"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follower ID (runtimeNodeId)</label>
            <input
              type="text"
              value={newRel.followerId}
              onChange={(e) => setNewRel({ ...newRel, followerId: e.target.value })}
              placeholder="Follower runtimeNodeId"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offset X</label>
            <input
              type="number"
              value={newRel.offsetX}
              onChange={(e) => setNewRel({ ...newRel, offsetX: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offset Y</label>
            <input
              type="number"
              value={newRel.offsetY}
              onChange={(e) => setNewRel({ ...newRel, offsetY: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Offset Rotation (degrees)</label>
            <input
              type="number"
              value={newRel.offsetRotation}
              onChange={(e) => setNewRel({ ...newRel, offsetRotation: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={newRel.maintainRotation}
                onChange={(e) => setNewRel({ ...newRel, maintainRotation: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Maintain Follower Rotation</span>
            </label>
          </div>
          <div className="flex items-end mt-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Relationship'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">Relationship Parameters</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Type:</strong> Follow (only type supported)</div>
            <div><strong>Offset X/Y:</strong> World-space offset applied to leader position</div>
            <div><strong>Offset Rotation:</strong> Degrees added to leader rotation (if maintainRotation=false)</div>
            <div><strong>maintainRotation:</strong> true = follower keeps own rotation; false = inherits leader rotation + offset</div>
            <div className="text-blue-800 mt-1">Permission required: <strong>relationship.write</strong> (all 7 routes)</div>
          </div>
        </div>
      </div>

      {/* Relationships List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Follow Relationships ({relationships.length})</h3>
          <button onClick={refreshRelationships} className="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Leader</th>
                <th className="px-4 py-2">Follower</th>
                <th className="px-4 py-2">Offset</th>
                <th className="px-4 py-2">Rotation</th>
                <th className="px-4 py-2">Maintain Rot</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {relationships.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No relationships yet. Create one using the form above.
                  </td>
                </tr>
              ) : (
                relationships.map((r) => (
                  <tr key={r.relationshipId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.relationshipId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.leaderId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.followerId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.offsetX}, {r.offsetY}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.offsetRotation ?? 0}°</td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" disabled checked={r.maintainRotation} className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDelete(r.relationshipId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
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
        <h3 className="font-semibold text-gray-700 mb-2">Relationship API Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">All Routes (relationship.write)</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>{'• relationship.create(input) \u2192 { relationshipId, success }'}</li>
              <li>{'• relationship.update(input) \u2192 { relationshipId, success }'}</li>
              <li>{'• relationship.delete(input) \u2192 { relationshipId, removed, success }'}</li>
              <li>{'• relationship.list() \u2192 { relationships, success }'}</li>
              <li>{'• relationship.setAll(input) \u2192 { count, success }'}</li>
              <li>{'• relationship.select(input) \u2192 { relationshipId, success }'}</li>
              <li>{'• relationship.getPositions() \u2192 { relationships, positions }'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Parameters</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• leaderId (runtimeNodeId)</li>
              <li>• followerId (runtimeNodeId)</li>
              <li>• offsetX, offsetY (world space)</li>
              <li>• offsetRotation? (degrees)</li>
              <li>• maintainRotation (boolean)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Type</h4>
            <p className="text-sm text-gray-700">Follow (only type)</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Permission</h4>
            <p className="text-sm text-red-600 font-medium">relationship.write (all 7 routes)</p>
          </div>
        </div>
      </div>
    </div>
  );
}