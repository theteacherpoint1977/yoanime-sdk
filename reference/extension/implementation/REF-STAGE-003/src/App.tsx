import { useState, useEffect } from 'react';
import { CapabilitiesPanel } from './components/CapabilitiesPanel';
import { SelectionPanel } from './components/SelectionPanel';
import { BehaviorPanel } from './components/BehaviorPanel';
import { RelationshipPanel } from './components/RelationshipPanel';
import { ConstraintsPanel } from './components/ConstraintsPanel';
import { ArticulationPanel } from './components/ArticulationPanel';
import { MotionPanel } from './components/MotionPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { PlaybackPanel } from './components/PlaybackPanel';
import { ScenePanel } from './components/ScenePanel';
import { AnimationPanel } from './components/AnimationPanel';
import { SDKStatusBar } from './components/SDKStatusBar';
import { LogPanel } from './components/LogPanel';
import { useLog } from './hooks/useLog';
import type { YoAnimeSdk, YoAnimeCapabilities } from './global';

interface AppProps {
  capabilities: YoAnimeCapabilities | null;
  sdk?: YoAnimeSdk | null;
}

export function App({ capabilities, sdk }: AppProps) {
  const { logs, addLog, clearLogs } = useLog();
  const [activeTab, setActiveTab] = useState<'capabilities' | 'selection' | 'behavior' | 'relationship' | 'constraints' | 'articulation' | 'motion' | 'timeline' | 'playback' | 'scene'>('capabilities');
  const [sdkReady, setSdkReady] = useState(false);
  const [overlayMinimized, setOverlayMinimized] = useState(false);
  const isOverlay = (capabilities?.surface || '').toLowerCase().includes('overlay');

  useEffect(() => {
    if (capabilities) {
      setSdkReady(true);
    }
  }, [capabilities]);

const tabs = [
    { id: 'capabilities', label: 'Capabilities', icon: '📋' },
    { id: 'selection', label: 'Selection', icon: '🔍' },
    { id: 'behavior', label: 'Behavior', icon: '🎯' },
    { id: 'relationship', label: 'Relationship', icon: '🔗' },
    { id: 'constraints', label: 'Constraints', icon: '⚖️' },
    { id: 'articulation', label: 'Articulation', icon: '🦾' },
    { id: 'scene', label: 'Scene', icon: '🎬' },
    { id: 'animation', label: 'Animation', icon: '🎞️' },
    { id: 'motion', label: 'Motion', icon: '🌀' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' },
    { id: 'playback', label: 'Playback', icon: '▶️' },
  ];

const renderPanel = () => {
    if (!sdk && activeTab !== 'capabilities') {
      return <div className="p-6 text-center text-gray-500">SDK not ready — check console.</div>;
    }
    switch (activeTab) {
      case 'capabilities':
        return <CapabilitiesPanel capabilities={capabilities} />;
      case 'selection':
        return <SelectionPanel sdk={sdk!} addLog={addLog} />;
      case 'behavior':
        return <BehaviorPanel sdk={sdk!} addLog={addLog} />;
      case 'relationship':
        return <RelationshipPanel sdk={sdk!} addLog={addLog} />;
      case 'constraints':
        return <ConstraintsPanel sdk={sdk!} addLog={addLog} />;
      case 'articulation':
        return <ArticulationPanel sdk={sdk!} addLog={addLog} />;
      case 'scene':
        return <ScenePanel sdk={sdk!} addLog={addLog} />;
      case 'animation':
        return <AnimationPanel sdk={sdk!} addLog={addLog} />;
      case 'motion':
        return <MotionPanel sdk={sdk!} addLog={addLog} />;
      case 'timeline':
        return <TimelinePanel sdk={sdk!} addLog={addLog} />;
      case 'playback':
        return <PlaybackPanel sdk={sdk!} addLog={addLog} />;
      default:
        return null;
    }
  };

  if (isOverlay) {
    if (overlayMinimized) {
      return (
        <div className="fixed top-2 right-2 z-50">
          <button
            onClick={() => setOverlayMinimized(false)}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-full shadow-lg text-sm hover:bg-gray-800"
            title="Restore overlay"
          >
            ◆ yoAnime Overlay
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-transparent flex flex-col p-2">
        <div className="w-[420px] ml-auto bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
          <header className="bg-gray-900 text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">yoAnime Overlay</span>
              <span className="text-xs px-1.5 py-0.5 bg-blue-600 rounded">{capabilities?.sdkVersion || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${sdkReady ? 'text-green-400' : 'text-yellow-400'}`}>{sdkReady ? '● Ready' : '● Not Ready'}</span>
              <button onClick={() => setOverlayMinimized(true)} className="px-2 py-0.5 bg-gray-700 text-white rounded text-xs hover:bg-gray-600" title="Minimize to see slide">— Minimize</button>
            </div>
          </header>
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-2 py-1 rounded text-xs font-medium ${activeTab === tab.id ? 'bg-white text-gray-900 shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{tab.icon} {tab.label}</button>
            ))}
          </div>
          <div className="flex-1 overflow-auto bg-white">{renderPanel()}</div>
          <div className="max-h-32 overflow-auto border-t border-gray-200"><LogPanel logs={logs} onClear={clearLogs} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-900 text-white p-4 shadow-lg">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">yoAnime SDK Reference v1.0</h1>
            <SDKStatusBar capabilities={capabilities} />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className={sdkReady ? 'text-green-400' : 'text-yellow-400'}>
              {sdkReady ? '● SDK Ready' : '● SDK Not Ready'}
            </span>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-full mx-auto w-full p-4 flex flex-col gap-4">
        <section className="flex-1 min-h-0 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
          {renderPanel()}
        </section>

        <LogPanel logs={logs} onClear={clearLogs} />
      </main>
    </div>
  );
}

