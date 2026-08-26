import { useState, useCallback } from 'react';
import type { YoAnimeSdk } from '../../global';

export function BehaviorPanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: 'info' | 'warn' | 'error' | 'success', data?: unknown) => void }) {
  const [behaviors, setBehaviors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBehavior, setNewBehavior] = useState({
    behaviorType: 'Patrol',
    attachedEntityId: '',
    enabled: true,
    patrolPoints: '',
    targetEntityId: '',
    radius: 100,
  });
  const [selectedBehavior, setSelectedBehavior] = useState<any>(null);

  const refreshBehaviors = useCallback(async () => {
    try {
      const res = await sdk.behavior.list();
      setBehaviors(res.behaviors || []);
      addLog('Behavior.list() successful', 'success', res);
    } catch (err) {
      addLog('Behavior.list() failed', 'error', err);
    }
  }, []);

const handleCreate = async () => {
    const currentNewBehavior = newBehavior;
    if (!currentNewBehavior.attachedEntityId) {
      addLog('Please enter an attachedEntityId (runtimeNodeId)', 'warn');
      return;
    }
    
    // Validate type-specific required parameters
    if (currentNewBehavior.behaviorType === 'Patrol' && !currentNewBehavior.patrolPoints.trim()) {
      addLog('Patrol requires at least one waypoint (patrolPoints)', 'warn');
      return;
    }
    if ((currentNewBehavior.behaviorType === 'Wander') && (!currentNewBehavior.radius || currentNewBehavior.radius <= 0)) {
      addLog('Wander requires a positive radius', 'warn');
      return;
    }
    if (['FollowTarget', 'Guard', 'Evade'].includes(currentNewBehavior.behaviorType)) {
      if (!currentNewBehavior.targetEntityId) {
        addLog(`${currentNewBehavior.behaviorType} requires a targetEntityId`, 'warn');
        return;
      }
      if (!currentNewBehavior.radius || currentNewBehavior.radius <= 0) {
        addLog(`${currentNewBehavior.behaviorType} requires a positive radius`, 'warn');
        return;
      }
    }
    
    setCreating(true);
    try {
      const params: any = {};
      if (currentNewBehavior.behaviorType === 'Patrol') {
        params.patrolPoints = currentNewBehavior.patrolPoints.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (currentNewBehavior.behaviorType === 'Wander') {
        params.radius = currentNewBehavior.radius;
      }
      if (['FollowTarget', 'Guard', 'Evade'].includes(currentNewBehavior.behaviorType)) {
        params.targetEntityId = currentNewBehavior.targetEntityId;
        params.radius = currentNewBehavior.radius;
      }
      
      const res = await sdk.behavior.create({
        behaviorType: currentNewBehavior.behaviorType as any,
        attachedEntityId: currentNewBehavior.attachedEntityId,
        enabled: currentNewBehavior.enabled,
        parameters: Object.keys(params).length > 0 ? params : undefined,
      });
      addLog('Behavior.create() successful', 'success', res);
      setNewBehavior({ ...currentNewBehavior, attachedEntityId: '', patrolPoints: '', targetEntityId: '' });
      refreshBehaviors();
    } catch (err) {
      addLog('Behavior.create() failed', 'error', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSetEnabled = async (behaviorId: string, enabled: boolean) => {
    try {
      const res = await sdk.behavior.setEnabled(behaviorId, enabled);
      addLog(`Behavior.setEnabled(${enabled})`, 'success', res);
      refreshBehaviors();
    } catch (err) {
      addLog('Behavior.setEnabled() failed', 'error', err);
    }
  };

  const handleRemove = async (behaviorId: string) => {
    if (!window.confirm('Remove this behavior?')) return;
    try {
      const res = await sdk.behavior.remove(behaviorId);
      addLog('Behavior.remove() successful', 'success', res);
      refreshBehaviors();
    } catch (err) {
      addLog('Behavior.remove() failed', 'error', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Behavior Graph</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {/* Create Form */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Create Behavior</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={newBehavior.behaviorType}
              onChange={(e) => setNewBehavior({ ...newBehavior, behaviorType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Patrol">Patrol</option>
              <option value="FollowTarget">FollowTarget</option>
              <option value="Wander">Wander</option>
              <option value="Guard">Guard</option>
              <option value="Evade">Evade</option>
              <option value="Idle">Idle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attached Entity ID (runtimeNodeId)</label>
            <input
              type="text"
              value={newBehavior.attachedEntityId}
              onChange={(e) => setNewBehavior({ ...newBehavior, attachedEntityId: e.target.value })}
              placeholder="runtimeNodeId from selection"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enabled</label>
            <select
              value={newBehavior.enabled.toString()}
              onChange={(e) => setNewBehavior({ ...newBehavior, enabled: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
          </div>
          
          {/* Type-specific parameters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            {newBehavior.behaviorType === 'Patrol' && (
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patrol Points (comma-separated runtimeNodeIds)</label>
                <input
                  type="text"
                  value={newBehavior.patrolPoints}
                  onChange={(e) => setNewBehavior({ ...newBehavior, patrolPoints: e.target.value })}
                  placeholder="e.g. id1,id2,id3"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            {(newBehavior.behaviorType === 'Wander') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius</label>
                <input
                  type="number"
                  value={newBehavior.radius}
                  onChange={(e) => setNewBehavior({ ...newBehavior, radius: parseFloat(e.target.value) || 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            {(newBehavior.behaviorType === 'FollowTarget' || newBehavior.behaviorType === 'Guard' || newBehavior.behaviorType === 'Evade') && (
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Entity ID (runtimeNodeId)</label>
                  <input
                    type="text"
                    value={newBehavior.targetEntityId}
                    onChange={(e) => setNewBehavior({ ...newBehavior, targetEntityId: e.target.value })}
                    placeholder="Target runtimeNodeId"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Radius</label>
                  <input
                    type="number"
                    value={newBehavior.radius}
                    onChange={(e) => setNewBehavior({ ...newBehavior, radius: parseFloat(e.target.value) || 100 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Behavior'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">Behavior Parameters Guide</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Patrol:</strong> patrolPoints (string[])</div>
            <div><strong>FollowTarget:</strong> targetEntityId, radius</div>
            <div><strong>Wander:</strong> radius</div>
            <div><strong>Guard:</strong> targetEntityId, radius</div>
            <div><strong>Evade:</strong> targetEntityId, radius</div>
            <div><strong>Idle:</strong> (no additional params)</div>
          </div>
        </div>

      {/* Behaviors List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Behaviors ({behaviors.length})</h3>
          <button onClick={refreshBehaviors} className="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Attached Entity</th>
                <th className="px-4 py-2">Enabled</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {behaviors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No behaviors yet. Create one using the form above.
                  </td>
                </tr>
              ) : (
                behaviors.map((b) => (
                  <tr key={b.behaviorId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{b.behaviorType}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{b.behaviorId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{b.attachedEntityId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={b.enabled}
                          onChange={(e) => handleSetEnabled(b.behaviorId, e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleRemove(b.behaviorId)}
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
        <h3 className="font-semibold text-gray-700 mb-2">Behavior Graph API Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Read Operations (behavior.read)</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• behavior.list() → BehaviorListResponse</li>
              <li>• behavior.get(behaviorId) → BehaviorDefinitionDto</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Write Operations (behavior.write)</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• behavior.create(input) → BehaviorCreateResponse</li>
              <li>• behavior.update(id, patch) → BehaviorDefinitionDto</li>
              <li>{'• behavior.remove(id) → { behaviorId }'}</li>
              <li>• behavior.reorder(id, index) → BehaviorDefinitionDto</li>
              <li>• behavior.setEnabled(id, enabled) → BehaviorDefinitionDto</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Events (behavior.read)</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• behavior.onChanged(cb) → unsubscribe</li>
              <li>{'• Event: { sceneId, behaviorId? }'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Behavior Types</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Patrol (patrolPoints: string[])</li>
              <li>• FollowTarget (targetEntityId, radius)</li>
              <li>• Wander (radius)</li>
              <li>• Guard (targetEntityId, radius)</li>
              <li>• Evade (targetEntityId, radius)</li>
              <li>• Idle (no params)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}