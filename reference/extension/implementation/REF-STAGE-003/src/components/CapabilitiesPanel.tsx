import { useState, useEffect, useCallback } from 'react';
import type { YoAnimeSdk } from '../global';

export function CapabilitiesPanel({ capabilities }: { capabilities: any }) {
  if (!capabilities) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-4xl mb-2">🔧</div>
        <p>Waiting for SDK capabilities...</p>
      </div>
    );
  }

  const permissionGroups = [
    { category: 'Graph APIs (New)', perms: ['behavior.read', 'behavior.write', 'relationship.write', 'constraint.read', 'constraint.write'] },
    { category: 'Scene & Timeline', perms: ['scene.read', 'scene.write', 'timeline.read', 'timeline.write', 'timeline.playback'] },
    { category: 'Core', perms: ['selection.read', 'geometry.read'] },
    { category: 'Extended', perms: ['interaction.write', 'extensions.read', 'diagnostics.read'] },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">SDK Version</h3>
          <p className="font-mono text-blue-800">{capabilities.sdkVersion}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">Host Version</h3>
          <p className="font-mono text-green-800">{capabilities.hostVersion}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">Surface</h3>
          <p className="font-mono text-purple-800">{capabilities.surface}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-2">Extension ID</h3>
          <p className="font-mono text-orange-800">{capabilities.extensionId || 'N/A'}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Permissions ({capabilities.permissions?.length || 0})</h3>
        <div className="space-y-4">
          {[
            { category: 'Graph APIs (New)', perms: ['behavior.read', 'behavior.write', 'relationship.write', 'constraint.read', 'constraint.write'] },
            { category: 'Scene & Timeline', perms: ['scene.read', 'scene.write', 'timeline.read', 'timeline.write', 'timeline.playback'] },
            { category: 'Core', perms: ['selection.read', 'geometry.read'] },
            { category: 'Extended', perms: ['interaction.write', 'extensions.read', 'diagnostics.read'] },
          ].map((group) => (
            <div key={group.category} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2">{group.category}</h4>
              <div className="flex flex-wrap gap-2">
                {group.perms.map((perm) => (
                  <span key={perm} className="px-2 py-1 text-xs font-medium rounded-full bg-white border border-gray-300 text-gray-700">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">API Stability</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(capabilities.apiStability || {}).map(([key, value]) => (
            <div key={key} className="p-3 bg-white rounded border border-gray-200">
              <div className="font-semibold text-gray-700 capitalize">{key}</div>
              <div className="text-sm text-gray-600 mt-1">{(value as string[]).length} APIs</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}