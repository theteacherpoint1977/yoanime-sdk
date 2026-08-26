import { useState } from 'react';

export function SDKStatusBar({ capabilities }: { capabilities: any }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
        v{capabilities?.sdkVersion || '—'}
      </span>
      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
        {capabilities?.surface || '—'}
      </span>
    </div>
  );
}