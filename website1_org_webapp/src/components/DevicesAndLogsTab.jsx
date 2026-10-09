import React, { useState, useEffect, useCallback } from 'react';
import { Database, Download, Radio, RefreshCw, CheckCircle2, AlertCircle, FileSpreadsheet, Search, X } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DevicesAndLogsTab({ orgId = 'bput_college' }) {
    const [devices, setDevices] = useState([]);
    const [logStatus, setLogStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'power' | 'water'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'offline'

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [devRes, logRes] = await Promise.all([
                axios.get(`${API_BASE}/devices`, { params: { orgId } }),
                axios.get(`${API_BASE}/logs/status`, { params: { orgId } })
            ]);
            if (Array.isArray(devRes.data)) setDevices(devRes.data);
            setLogStatus(logRes.data);
        } catch (err) {
            console.warn('Devices tab fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleDownload = (type) => {
        window.open(`${API_BASE}/logs/download?type=${type}&orgId=${orgId}`, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* ── Data Log Strip ───────────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center">
                        <Database className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                            Sensor Data Log Buffer
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                                3-Day Circular Buffer
                            </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {logStatus ? (
                                <span>
                                    <strong>{logStatus.count.toLocaleString()}</strong> total rows logged (
                                    {logStatus.powerCount.toLocaleString()} power · {logStatus.waterCount.toLocaleString()} water)
                                </span>
                            ) : (
                                'Calculating log buffer status...'
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleDownload('power')}
                        className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download Power CSV
                    </button>
                    <button
                        onClick={() => handleDownload('water')}
                        className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download Water CSV
                    </button>
                </div>
            </div>

            {/* ── Device Registry Table ────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Radio className="w-4 h-4 text-emerald-400" />
                            Registered IoT Telemetry Sensors ({devices.length})
                        </h2>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                            Online indicates a live reading received within the last 2 minutes
                        </p>
                    </div>

                    <button
                        onClick={loadData}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Sensor Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by ID, label, or zone..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Type Filter */}
                        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'power', label: '⚡ Power' },
                                { id: 'water', label: '💧 Water' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTypeFilter(t.id)}
                                    className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                                        typeFilter === t.id
                                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter */}
                        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'online', label: '● Online' },
                                { id: 'offline', label: '○ Offline' }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStatusFilter(s.id)}
                                    className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                                        statusFilter === s.id
                                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                            <button
                                onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-red-400 text-[11px] font-mono rounded-lg transition-all"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-3">Device ID</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Location / Label</th>
                                <th className="p-3">Floor</th>
                                <th className="p-3">Last Seen</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {(() => {
                                const filtered = devices.filter((d) => {
                                    if (typeFilter !== 'all') {
                                        const isWater = d.type?.includes('water');
                                        if (typeFilter === 'power' && d.type !== 'power') return false;
                                        if (typeFilter === 'water' && !isWater) return false;
                                    }
                                    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
                                    if (searchQuery.trim()) {
                                        const q = searchQuery.toLowerCase();
                                        const mId = d.deviceId?.toLowerCase().includes(q);
                                        const mLabel = d.label?.toLowerCase().includes(q);
                                        const mZone = d.zone?.toLowerCase().includes(q);
                                        if (!mId && !mLabel && !mZone) return false;
                                    }
                                    return true;
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-slate-500">
                                                No telemetry sensors found matching filter criteria.
                                            </td>
                                        </tr>
                                    );
                                }

                                return filtered.map((d) => {
                                    const isOnline = d.status === 'online';

                                    return (
                                        <tr key={d._id || d.deviceId} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3 font-bold text-white flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                {d.deviceId}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                                    d.type === 'power'
                                                        ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                                                        : 'bg-cyan-950/40 text-cyan-400 border-cyan-800/40'
                                                }`}>
                                                    {d.type}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-300">{d.label || d.zone || 'Campus'}</td>
                                            <td className="p-3 text-slate-400">{d.floor != null ? `Floor ${d.floor}` : 'Campus'}</td>
                                            <td className="p-3 text-slate-400">
                                                {d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString() : 'Never'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    isOnline
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                                                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
