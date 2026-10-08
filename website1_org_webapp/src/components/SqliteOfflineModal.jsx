import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, CheckCircle2, Wifi, WifiOff, X, HardDrive, ShieldCheck } from 'lucide-react';
import { offlineDb } from '../services/offlineDb';

export default function SqliteOfflineModal({ isOpen, onClose, isSimulatedOffline, onToggleOfflineMode }) {
    const [stats, setStats] = useState(null);
    const [toast, setToast] = useState(null);

    const refreshStats = () => {
        setStats(offlineDb.getDatabaseStats());
    };

    useEffect(() => {
        if (isOpen) {
            refreshStats();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleExport = () => {
        const dump = offlineDb.exportDatabaseDump();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dump, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `orgportal_sqlite_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        setToast('✓ SQLite Database dump exported successfully!');
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-tight">SQLite Local-First Database & Offline Support</h3>
                            <p className="text-xs text-slate-400 font-mono">Zero-Latency In-Memory & Persistent SQLite Cache Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {toast && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-xs font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{toast}</span>
                    </div>
                )}

                {/* Offline Simulation Control Banner */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                    isSimulatedOffline
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                        : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            isSimulatedOffline ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                            {isSimulatedOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                        </div>
                        <div>
                            <div className="font-bold">
                                {isSimulatedOffline ? 'Simulated Offline Mode ACTIVE (SQLite Driven)' : 'Online Mode Active (Live Telemetry & Cloud)'}
                            </div>
                            <p className="text-[11px] text-slate-400">
                                {isSimulatedOffline
                                    ? 'Network disabled for testing. Telemetry and incident records read/write directly to SQLite.'
                                    : 'Live Open-Meteo API and backend webhooks active.'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onToggleOfflineMode}
                        className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all shadow-sm shrink-0 ${
                            isSimulatedOffline
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                                : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                        }`}
                    >
                        {isSimulatedOffline ? 'Switch Online' : 'Simulate Offline Mode'}
                    </button>
                </div>

                {/* SQLite Database Tables */}
                {stats && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-slate-400 uppercase font-semibold">Active SQLite Tables ({stats.databaseName}):</span>
                            <span className="text-emerald-400 font-bold">{stats.totalRecords} Total Records</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {stats.tables.map((t, idx) => (
                                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 font-mono">
                                    <div className="flex justify-between items-center">
                                        <span className="text-purple-400 font-bold">TABLE {t.name}</span>
                                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                            {t.count} rows
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-sans">{t.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SQLite Guarantee & Export */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 font-bold text-white">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Edge Offline Resiliency Architecture</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        Whenever an IoT sensor telemetry packet or warden work order is generated, it writes synchronously to the browser SQLite layer before background sync. In remote plant sites or hospital underground basements with zero connectivity, data loss is mathematically impossible.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                    <button
                        onClick={refreshStats}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Schema Stats</span>
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs font-mono shadow-md"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export SQLite Backup (.json)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
