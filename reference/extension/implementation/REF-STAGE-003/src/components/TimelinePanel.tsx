import { useState, useCallback } from 'react';

export function TimelinePanel({ sdk, addLog }: { sdk: any; addLog: (msg: string, level?: string, data?: unknown) => void }) {
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [baking, setBaking] = useState(false);
  const [bakeResult, setBakeResult] = useState<any>(null);

  const refreshTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sdk.timeline.get();
      setTimeline(res);
      addLog('Timeline.get() successful', 'success', res);
    } catch (err) {
      addLog('Timeline.get() failed', 'error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBake = useCallback(async () => {
    const sel = await sdk.selection.get();
    const rid = (sel as any)?.primary?.runtimeNodeId || (sel as any)?.shapes?.[0]?.runtimeNodeId;
    if (!rid) { addLog('No shape selected', 'warn'); return; }
    setBaking(true);
    try {
      // Include follower identity tracks if relationships exist (Mission 5C: followers must be in frameStates)
      let layers: any[] = [{ runtimeNodeId: rid, properties: { PositionX: { startTimeSeconds: 0, durationSeconds: 2, keyframes: [{ normalizedTime: 0, value: { number: 0 } }, { normalizedTime: 1, value: { number: 100 } }] } } as any }];
      try {
        const rel = await sdk.relationship.list();
        const followerIds = (rel?.relationships || []).filter((r: any) => r.leaderId === rid).map((r: any) => r.followerId);
        for (const fid of followerIds) {
          // static identity track keeps follower in frameStates so relationship engine can drive it
          layers.push({ runtimeNodeId: fid, properties: { PositionX: { startTimeSeconds: 0, durationSeconds: 2, keyframes: [{ normalizedTime: 0, value: { number: 0 } }] } as any, PositionY: { startTimeSeconds: 0, durationSeconds: 2, keyframes: [{ normalizedTime: 0, value: { number: 0 } }] } as any } });
        }
        if (followerIds.length) addLog(`Baking leader ${rid.slice(0,8)} + ${followerIds.length} follower identity track(s)`, 'info', followerIds);
      } catch {}
      const res = await sdk.timeline.bake({ label: 'Ref Bake', layers });
      setBakeResult(res);
      addLog('Timeline.bake() successful', 'success', res);
      refreshTimeline();
    } catch (err) { addLog('Timeline.bake() failed', 'error', err); } finally { setBaking(false); }
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Timeline</h2>
        <button onClick={refreshTimeline} disabled={loading} className="px-3 py-1.5 text-sm bg-gray-200 rounded">Refresh</button>
      </div>
      <div className="bg-blue-50 rounded-lg p-4 border">
        <h3 className="font-semibold mb-3">Bake Motion</h3>
        <p className="text-sm mb-3">Bakes PositionX for selected shape.</p>
        <button onClick={handleBake} disabled={baking} className="px-4 py-2 bg-blue-600 text-white rounded">{baking ? 'Baking...' : 'Bake'}</button>
        {bakeResult && <pre className="mt-3 text-xs bg-white p-3 rounded border overflow-auto">{JSON.stringify(bakeResult, null, 2)}</pre>}
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Snapshot</h3>
          <button onClick={refreshTimeline} className="text-sm text-blue-600">Refresh</button>
        </div>
        <div className="p-4">{timeline ? <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(timeline, null, 2).slice(0, 2000)}</pre> : <p className="text-gray-500">No data.</p>}</div>
      </div>
    </div>
  );
}
