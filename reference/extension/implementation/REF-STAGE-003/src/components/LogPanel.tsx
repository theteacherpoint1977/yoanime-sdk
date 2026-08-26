import { useLog } from '../hooks/useLog';

export function LogPanel({ logs, onClear }: { logs: any[]; onClear: () => void }) {
  if (logs.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
        <h3 className="text-white font-medium">Console Log ({logs.length})</h3>
        <button
          onClick={onClear}
          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
        >
          Clear
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto p-3 font-mono text-xs">
        {logs.map((entry, idx) => (
          <div key={idx} className={`py-1 border-b border-gray-800 ${entry.level === 'error' ? 'text-red-400' : entry.level === 'warn' ? 'text-yellow-400' : entry.level === 'success' ? 'text-green-400' : 'text-gray-300'}`}>
            <span className="text-gray-500 mr-2">{entry.timestamp.toLocaleTimeString()}</span>
            <span className={`font-medium mr-2 ${entry.level === 'error' ? 'text-red-400' : entry.level === 'warn' ? 'text-yellow-400' : entry.level === 'success' ? 'text-green-400' : ''}`}>
              {entry.level.toUpperCase()}
            </span>
            <span>{entry.message}</span>
            {entry.data && (
              <pre className="mt-1 text-xs text-gray-500 bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}