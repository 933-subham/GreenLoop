import React from 'react';
import { Activity, Clock, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';

export default function RealtimeLogs({ logs }) {
  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-green-600 shadow-md space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-600 animate-pulse" />
          <h2 className="text-lg font-bold text-gray-900">Per-Second Live Analytics Log</h2>
        </div>
        <span className="text-xs font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-400">
          Streaming Live Events
        </span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              log.alert 
                ? 'bg-red-50 border-red-400 text-red-900 font-bold' 
                : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-green-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              {log.alert ? (
                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              )}
              <span>{log.event}</span>
            </div>

            <div className="flex items-center space-x-1 text-gray-500 font-mono text-[11px]">
              <Clock className="w-3 h-3" />
              <span>{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
