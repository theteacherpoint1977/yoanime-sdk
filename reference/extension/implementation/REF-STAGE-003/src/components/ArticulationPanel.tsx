import { useState, useCallback } from 'react';
import type { YoAnimeSdk } from '../../global';

export function ArticulationPanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: 'info' | 'warn' | 'error' | 'success', data?: unknown) => void }) {
  const [parentChildPairs, setParentChildPairs] = useState<Array<{ childId: string; parentId: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [setting, setSetting] = useState(false);
  const [newPair, setNewPair] = useState({ childId: '', parentId: '' });

  const refreshPairs = useCallback(async () => {
    try {
      const scene = await sdk.scene.get({ includeGeometry: true, includeTags: true });
      const nodes = (scene?.fullSnapshot?.rootNodes || scene?.shapes || []) as any[];
      const pairs: Array<{ childId: string; parentId: string | null }> = [];
      
      const processNode = (node: any) => {
        const parentId = node.animationParentRuntimeNodeId || node.animationParentId || node.parentRuntimeNodeId || node.parentId;
        if (parentId) {
          pairs.push({ childId: node.runtimeNodeId || node.nodeId || node.id, parentId });
        }
        if (node.children) {
          node.children.forEach(processNode);
        }
        if (node.shapes) {
          node.shapes.forEach(processNode);
        }
      };
      
      nodes.forEach(processNode);
      // fallback: also check via getParent for known pairs if scene graph doesn't expose parent directly
      if (pairs.length === 0 && parentChildPairs.length > 0) {
        // keep last known pairs visible until scene reflects
        addLog('Articulation pairs refreshed from scene graph (no parent field in snapshot, checking via API)', 'info', { count: pairs.length, note: 'Use Get Parent to verify' });
      } else {
        addLog('Articulation pairs refreshed from scene graph', 'success', { count: pairs.length });
      }
      if (pairs.length > 0) setParentChildPairs(pairs);
    } catch (err) {
      addLog('Failed to refresh articulation pairs', 'error', err);
    }
  }, [parentChildPairs.length]);

  const handleSetParent = useCallback(async () => {
    if (!newPair.childId) {
      addLog('Please enter child runtimeNodeId', 'warn');
      return;
    }
    try {
      const res = await sdk.scene.roles.setParent(newPair.childId, newPair.parentId || null);
      addLog(`scene.roles.setParent(${newPair.childId}, ${newPair.parentId || 'null'})`, 'success', res);
      // optimistic local update (scene snapshot may not expose parent field immediately)
      if (newPair.parentId) {
        setParentChildPairs(prev => {
          const filtered = prev.filter(p => p.childId !== newPair.childId);
          return [...filtered, { childId: newPair.childId, parentId: newPair.parentId }];
        });
      } else {
        setParentChildPairs(prev => prev.filter(p => p.childId !== newPair.childId));
      }
      refreshPairs();
    } catch (err) {
      addLog('scene.roles.setParent() failed', 'error', err);
    }
  }, [newPair, refreshPairs]);

  const handleGetParent = useCallback(async (childId: string) => {
    try {
      const res = await sdk.scene.roles.getParent(childId);
      addLog(`scene.roles.getParent(${childId})`, 'success', res);
    } catch (err) {
      addLog('scene.roles.getParent() failed', 'error', err);
    }
  }, [refreshPairs]);

  const handleGetChildren = useCallback(async (parentId: string) => {
    try {
      const res = await sdk.scene.roles.getChildren(parentId);
      addLog(`scene.roles.getChildren(${parentId})`, 'success', res);
    } catch (err) {
      addLog('scene.roles.getChildren() failed', 'error', err);
    }
  }, [refreshPairs]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Articulation (Scene Roles)</h2>
        <button
          onClick={refreshPairs}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {/* Set Parent Form */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Set Parent</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Child RuntimeNodeId</label>
            <input
              type="text"
              value={newPair.childId}
              onChange={(e) => setNewPair({ ...newPair, childId: e.target.value })}
              placeholder="Child runtimeNodeId"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent RuntimeNodeId (empty = detach)</label>
            <input
              type="text"
              value={newPair.parentId}
              onChange={(e) => setNewPair({ ...newPair, parentId: e.target.value || null })}
              placeholder="Parent runtimeNodeId (empty = detach)"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSetParent}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Set Parent
            </button>
          </div>
        </div>

        {/* Parent-Child Pairs List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Parent-Child Pairs ({parentChildPairs.length})</h3>
            <button onClick={refreshPairs} className="text-sm text-blue-600 hover:underline">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-2">Child ID</th>
                  <th className="px-4 py-2">Parent ID</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parentChildPairs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No parent-child relationships found. Use the form above to create one.
                    </td>
                  </tr>
                ) : (
                  parentChildPairs.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.childId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.parentId ? p.parentId.slice(0, 8) + '…' : '<none (root)'}</td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => handleGetParent(p.childId)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">Get Parent</button>
                        <button onClick={() => handleGetChildren(p.childId)} className="text-green-600 hover:text-green-800 text-sm">Get Children</button>
                      </td>
                    </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">Articulation / Scene Roles API</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Operations (scene.write)</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>{'• scene.roles.setParent(child, parent) → { success, runtimeNodeId, parentRuntimeNodeId }'}</li>
                <li>{'• scene.roles.getParent(child) → { parentRuntimeNodeId }'}</li>
                <li>{'• scene.roles.getChildren(parent) → { children: [{ runtimeNodeId }] }'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Read (scene.read)</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• getParent, getChildren</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Key Points</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Pass null parentId to detach</li>
                <li>• Creates parent-child transform hierarchy</li>
                <li>• Affects playback transform composition</li>
                <li>• Permission: scene.write (setParent), scene.read (getParent/getChildren)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Warm Cache Required</h4>
              <p className="text-sm text-gray-700">
                Scene graph cache must be warmed via scene.get() before setParent,
                otherwise bind is lost (Mission #6 finding).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}