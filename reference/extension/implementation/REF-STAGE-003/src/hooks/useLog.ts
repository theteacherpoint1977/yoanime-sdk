import { useState, useCallback } from 'react';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: unknown;
}

export function useLog() {
  const [logs, setLogs] = useState<Array<{ timestamp: Date; level: 'info' | 'warn' | 'error' | 'success'; message: string; data?: unknown }>>([]);

  const addLog = useCallback((message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info', data?: unknown) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        level,
        message,
        data,
      },
    ].slice(-500));
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    if (data !== undefined) {
      console.log(`${prefix} [${new Date().toLocaleTimeString()}] ${message}`, data);
    } else {
      console.log(`${prefix} [${new Date().toLocaleTimeString()}] ${message}`);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}