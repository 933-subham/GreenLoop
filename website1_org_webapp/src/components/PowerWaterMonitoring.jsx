import React, { useState, useEffect, useCallback } from 'react';
import {
    Zap, Droplet, AlertTriangle, CheckCircle2, ChevronRight,
    ArrowLeft, ShieldAlert, Clock, RefreshCw, BarChart3,
    Activity, Info, Sparkles, Filter, Check, Eye, PieChart as PieChartIcon
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceArea, ReferenceLine,
    PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import { offlineDb } from '../services/offlineDb';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOOLTIP_STYLE = {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: '10px',
    fontSize: 12,
    color: '#e2e8f0'
};

const AXIS_STYLE = { fontSize: 11, fill: '#64748b' };

export default function PowerWaterMonitoring({ orgId = 'bput_college', userRole = 'admin' }) {
    // ── State ─────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('power'); // 'power' | 'water'
    
    // Drill-down hierarchy state
    // Level 1 = Campus, Level 2 = Building, Level 3 = Floor
    const [level, setLevel] = useState('campus'); // 'campus' | 'building' | 'floor'
    const [selectedBuilding, setSelectedBuilding] = useState(null); // { id, code, label }
    const [selectedFloor, setSelectedFloor] = useState(null); // number (e.g. 4)
    
    // Metric toggles
    const [powerMetric, setPowerMetric] = useState('kwh'); // 'kwh' | 'kw' | 'rs' | 'co2e'
    const [waterMetric, setWaterMetric] = useState('tank_level'); // 'tank_level' | 'night_flow' | 'kl'

    // Data state
    const [overviewBars, setOverviewBars] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState(new Date());
    const [isOffline, setIsOffline] = useState(false);
    const [latestSource, setLatestSource] = useState('live');

    // Donut Mix state
    const [mixPeriod, setMixPeriod] = useState('24hr'); // '3hr' | '24hr' | '3d'
    const [mixData, setMixData] = useState([]);

    // Campus 24-hr telemetry view mode: aggregate (actual vs baseline +/-15% envelope) vs breakdown
    const [campusViewMode, setCampusViewMode] = useState('aggregate'); // 'aggregate' | 'breakdown'

    // ── Fetch Overview Data ───────────────────────────────────────────────────
    const fetchOverview = useCallback(async () => {
        try {
            if (activeTab === 'power') {
                const params = {
                    level,
                    metric: powerMetric,
                    orgId
                };
                if (level === 'building' && selectedBuilding) {
                    params.buildingId = selectedBuilding.code || selectedBuilding.id;
                } else if (level === 'floor' && selectedBuilding && selectedFloor != null) {
                    params.buildingId = selectedBuilding.code || selectedBuilding.id;
                    params.floor = selectedFloor;
                }

                const res = await axios.get(`${API_BASE}/power/overview`, { params, timeout: 15000 });
                if (Array.isArray(res.data)) {
                    setOverviewBars(res.data);
                    setIsOffline(false);
                }
            } else {
                // Water overview
                const params = {
                    level: level === 'floor' ? 'building' : level,
                    metric: waterMetric,
                    orgId
                };
                if (selectedBuilding) {
                    params.buildingId = selectedBuilding.code || selectedBuilding.id;
                }

                const res = await axios.get(`${API_BASE}/water/overview`, { params, timeout: 15000 });
                if (Array.isArray(res.data)) {
                    setOverviewBars(res.data);
                    setIsOffline(false);
                }
            }
        } catch (err) {
            console.warn('Overview fetch error:', err.message);
            if (!err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'))) {
                setIsOffline(true);
            }
        }
    }, [activeTab, level, selectedBuilding, selectedFloor, powerMetric, waterMetric, orgId]);

    // ── Fetch 24-Hour Profile Data ───────────────────────────────────────────
    const fetchProfile = useCallback(async () => {
        try {
            if (activeTab === 'power') {
                const params = {
                    level,
                    orgId
                };
                if (selectedBuilding) {
                    params.buildingId = selectedBuilding.code || selectedBuilding.id;
                }
                if (selectedFloor != null) {
                    params.floor = selectedFloor;
                }

                const res = await axios.get(`${API_BASE}/power/profile`, { params, timeout: 15000 });
                setProfileData(res.data);
                if (res.data?.series?.length > 0) {
                    const lastPoint = res.data.series[res.data.series.length - 1];
                    if (lastPoint.source) setLatestSource(lastPoint.source);
                }
            } else {
                const params = {
                    orgId
                };
                if (selectedBuilding) {
                    params.buildingId = selectedBuilding.code || selectedBuilding.id;
                }

                const res = await axios.get(`${API_BASE}/water/profile`, { params, timeout: 15000 });
                setProfileData(res.data);
                if (res.data?.series?.length > 0) {
                    const lastPoint = res.data.series[res.data.series.length - 1];
                    if (lastPoint.source) setLatestSource(lastPoint.source);
                }
            }
        } catch (err) {
            console.warn('Profile fetch error:', err.message);
        }
    }, [activeTab, level, selectedBuilding, selectedFloor, orgId]);

    // ── Fetch Open Alerts ─────────────────────────────────────────────────────
    const fetchAlerts = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/alerts`, { params: { orgId, status: 'open' }, timeout: 15000 });
            if (Array.isArray(res.data)) {
                setAlerts(res.data);
            }
        } catch (err) {
            // non-blocking
        }
    }, [orgId]);

    // ── Fetch Mix Data ───────────────────────────────────────────────────────
    const fetchMix = useCallback(async () => {
        try {
            const endpoint = activeTab === 'power' ? `${API_BASE}/power/mix` : `${API_BASE}/water/mix`;
            const params = { orgId, period: mixPeriod };
            if (level === 'building' && selectedBuilding) {
                params.buildingId = selectedBuilding.code || selectedBuilding.id;
            }
            const res = await axios.get(endpoint, { params, timeout: 15000 });
            if (Array.isArray(res.data)) {
                setMixData(res.data);
            }
        } catch (err) {
            console.warn('Mix fetch error:', err.message);
        }
    }, [activeTab, orgId, mixPeriod, level, selectedBuilding]);

    // ── Polling & Lifecycle ───────────────────────────────────────────────────
    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const loadAll = async () => {
            await Promise.all([fetchOverview(), fetchProfile(), fetchAlerts(), fetchMix()]);
            if (isMounted) {
                setLoading(false);
                setLastSync(new Date());
            }
        };

        loadAll();

        // 5-second live polling interval
        const interval = setInterval(() => {
            fetchOverview();
            fetchProfile();
            fetchAlerts();
            fetchMix();
            setLastSync(new Date());
        }, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [fetchOverview, fetchProfile, fetchAlerts, fetchMix]);

    // ── Drill-Down Handlers ───────────────────────────────────────────────────
    const handleBarClick = (item) => {
        if (level === 'campus') {
            setSelectedBuilding(item);
            setLevel('building');
        } else if (level === 'building') {
            setSelectedFloor(item.floor || item.id);
            setLevel('floor');
        }
    };

    const handleBackClick = () => {
        if (level === 'floor') {
            setSelectedFloor(null);
            setLevel('building');
        } else if (level === 'building') {
            setSelectedBuilding(null);
            setLevel('campus');
        }
    };

    const handleAcknowledgeAlert = async (alertId) => {
        try {
            await axios.patch(`${API_BASE}/alerts/${alertId}/ack`, {
                status: 'acknowledged',
                note: `Acknowledged by ${userRole} from SCADA dashboard`
            });
            fetchAlerts();
            fetchOverview();
            setSelectedAlert(null);
        } catch (err) {
            alert('Failed to acknowledge alert: ' + err.message);
        }
    };

    // ── Status Helpers ────────────────────────────────────────────────────────
    const getStatusBadge = (status, percentAbove = 0, openAlerts = 0) => {
        if (status === 'red' || openAlerts > 0) {
            return {
                bg: 'bg-red-500/20 text-red-400 border-red-500/30',
                label: `⚠️ Fault (+${percentAbove > 0 ? percentAbove : 40}%)`,
                color: '#ef4444'
            };
        }
        if (status === 'amber') {
            return {
                bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                label: `▲ Elevated (+${percentAbove}%)`,
                color: '#f59e0b'
            };
        }
        return {
            bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            label: '✓ Normal',
            color: '#10b981'
        };
    };

    return (
        <div className="space-y-6">
            {/* ── Top Header & Tab Switcher ──────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {activeTab === 'power' ? <Zap className="w-5 h-5 text-amber-400" /> : <Droplet className="w-5 h-5 text-cyan-400" />}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            Power & Water SCADA
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                Real-Time Telemetry
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 font-mono">
                            Multi-Level Drill-Down · Baseline Expected vs Actual · Anomaly AI
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sub-tab switcher */}
                    <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
                        <button
                            onClick={() => { setActiveTab('power'); setLevel('campus'); setSelectedBuilding(null); setSelectedFloor(null); }}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'power'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            Power SCADA
                        </button>
                        <button
                            onClick={() => { setActiveTab('water'); setLevel('campus'); setSelectedBuilding(null); setSelectedFloor(null); }}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'water'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Droplet className="w-3.5 h-3.5" />
                            Water SCADA
                        </button>
                    </div>

                    {/* Sync Indicator */}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                        <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                        <span>{isOffline ? 'Offline Cache' : 'Live Stream'}</span>
                    </div>
                </div>
            </div>

            {/* ── Breadcrumb & Navigation Controls ──────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Hierarchy:</span>
                    <button
                        onClick={() => { setLevel('campus'); setSelectedBuilding(null); setSelectedFloor(null); }}
                        className={`hover:underline font-bold ${level === 'campus' ? 'text-emerald-400' : 'text-slate-300'}`}
                    >
                        Campus
                    </button>
                    {selectedBuilding && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                            <button
                                onClick={() => { setLevel('building'); setSelectedFloor(null); }}
                                className={`hover:underline font-bold ${level === 'building' ? 'text-emerald-400' : 'text-slate-300'}`}
                            >
                                {selectedBuilding.label || selectedBuilding.name}
                            </button>
                        </>
                    )}
                    {selectedFloor != null && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-emerald-400 font-bold">Floor {selectedFloor}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {level !== 'campus' && (
                        <button
                            onClick={handleBackClick}
                            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold transition-all"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back Up
                        </button>
                    )}

                    {/* Metric Toggle Buttons */}
                    {activeTab === 'power' ? (
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                            {['kwh', 'kw', 'rs', 'co2e'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setPowerMetric(m)}
                                    className={`px-2.5 py-1 rounded font-bold uppercase transition-all ${
                                        powerMetric === m
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {m === 'rs' ? '₹ INR' : m === 'co2e' ? 'CO₂e' : m}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                            {[
                                { id: 'tank_level', label: 'Tank Level %' },
                                { id: 'night_flow', label: 'Night Flow' },
                                { id: 'kl', label: 'kL' }
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setWaterMetric(m.id)}
                                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                                        waterMetric === m.id
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Drill-Down Bars & Donut Mix Grid (Side-by-Side) ─────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Drill-Down Bar Chart / Cards */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-emerald-400" />
                                {level === 'campus' && 'Campus Comparison (Click building to drill down)'}
                                {level === 'building' && `${selectedBuilding?.label || 'Building'} – Floors Overview (Click floor for 24h detail)`}
                                {level === 'floor' && `${selectedBuilding?.label || 'Building'} – Floor ${selectedFloor} Detail`}
                            </h2>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                Sorted high to low · Color and text label indicate threshold status
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                Source: {latestSource}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                                Demo uses simulated sensor data
                            </span>
                        </div>
                    </div>

                    {/* Bars Grid / Drill-down cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {overviewBars.map((bar, i) => {
                            const statusBadge = getStatusBadge(bar.status, bar.percentAbove, bar.openAlerts);
                            const isWater = activeTab === 'water';

                            return (
                                <div
                                    key={bar.id || i}
                                    onClick={() => handleBarClick(bar)}
                                    className={`bg-slate-950 border rounded-xl p-3.5 transition-all duration-150 cursor-pointer relative overflow-hidden group hover:border-slate-600 hover:bg-slate-900/80 ${
                                        bar.status === 'red' || bar.openAlerts > 0
                                            ? 'border-red-500/50 bg-red-950/10'
                                            : bar.status === 'amber'
                                            ? 'border-amber-500/50 bg-amber-950/10'
                                            : 'border-slate-800'
                                    }`}
                                >
                                    {/* Top info */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                                            {bar.label}
                                        </span>
                                        {bar.deviceId && (
                                            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                                                {bar.deviceId}
                                            </span>
                                        )}
                                    </div>

                                    {/* Value & metric */}
                                    <div className="flex items-baseline justify-between mt-1">
                                        <div className="text-xl font-bold font-mono text-white">
                                            {isWater && waterMetric === 'tank_level' ? `${bar.tankLevelPct || bar.value}%` : bar.value}
                                            <span className="text-xs text-slate-400 ml-1 font-sans">
                                                {activeTab === 'power'
                                                    ? (powerMetric === 'rs' ? '₹' : powerMetric === 'co2e' ? 'kg' : powerMetric.toUpperCase())
                                                    : (waterMetric === 'tank_level' ? '' : waterMetric === 'night_flow' ? 'L/min' : 'kL')}
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-mono text-slate-400">
                                            exp: {bar.expected}
                                        </div>
                                    </div>

                                    {/* Power Consumption Progress Bar */}
                                    {!isWater && (
                                        <div className="mt-2.5">
                                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700 relative">
                                                <div
                                                    className={`h-full transition-all duration-300 ${
                                                        bar.status === 'red' || bar.openAlerts > 0
                                                            ? 'bg-red-500'
                                                            : bar.status === 'amber'
                                                            ? 'bg-amber-400'
                                                            : 'bg-emerald-400'
                                                    }`}
                                                    style={{
                                                        width: `${Math.min(100, bar.expected > 0 ? Math.round((bar.value / (bar.expected * 1.35)) * 100) : 50)}%`
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                                                <span>Load: {bar.value} kW</span>
                                                <span className={bar.percentAbove > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                                    {bar.percentAbove > 0 ? `+${bar.percentAbove}% above baseline` : 'Within baseline'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Water tank liquid gauge bar */}
                                    {isWater && bar.tankLevelPct != null && (
                                        <div className="mt-2.5">
                                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                                                <div
                                                    className={`h-full transition-all duration-500 ${
                                                        bar.tankLevelPct < 20
                                                            ? 'bg-red-500'
                                                            : bar.tankLevelPct < 35
                                                            ? 'bg-amber-400'
                                                            : 'bg-cyan-400'
                                                    }`}
                                                    style={{ width: `${Math.min(100, bar.tankLevelPct)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                                                <span>Level: {bar.tankLevelPct}%</span>
                                                <span>Night flow: {bar.nightFlowLpm != null ? `${bar.nightFlowLpm} L/min` : 'Nominal'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status & Open alerts badge */}
                                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80">
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                                            {statusBadge.label}
                                        </span>
                                        {bar.openAlerts > 0 && (
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                                                ⚠️ {bar.openAlerts} Alert{bar.openAlerts > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Donut Mix Chart */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <PieChartIcon className="w-4 h-4 text-emerald-400" />
                                {activeTab === 'power' ? 'Power Consumption Mix' : 'Water Distribution Mix'}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {level === 'building' ? `${selectedBuilding?.label} by Floor` : 'Campus-wide Distribution'}
                            </p>
                        </div>

                        {/* Period Switcher [ 3hr | 24hr | 3d ] */}
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
                            {['3hr', '24hr', '3d'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setMixPeriod(p)}
                                    className={`px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                        mixPeriod === p
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Donut Chart with Center Total */}
                    <div className="relative h-56 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(val, name, entry) => [`${val} (${entry.payload.percent}%)`, name]}
                                />
                                <Pie
                                    data={mixData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    onClick={(entry) => {
                                        const matched = overviewBars.find(b => b.label === entry.name || entry.name?.includes(b.label) || b.label?.includes(entry.name));
                                        if (matched) handleBarClick(matched);
                                    }}
                                >
                                    {mixData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color || '#10b981'}
                                            stroke="#0f172a"
                                            strokeWidth={1}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Metric Display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold font-mono text-white">
                                {Math.round(mixData.reduce((acc, it) => acc + (it.value || 0), 0) * 10) / 10}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                                {activeTab === 'power' ? 'Total kW' : 'Total Flow'}
                            </span>
                        </div>
                    </div>

                    {/* Legend Below with Percentages (Sum = 100%) */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                        {mixData.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    const matched = overviewBars.find(b => b.label === item.name || item.name?.includes(b.label) || b.label?.includes(item.name));
                                    if (matched) handleBarClick(matched);
                                }}
                                className="flex items-center justify-between text-[11px] font-mono p-1 rounded cursor-pointer transition-colors text-slate-300 hover:bg-slate-800/60"
                            >
                                <div className="flex items-center gap-1.5 truncate mr-2">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="truncate">{item.name}</span>
                                </div>
                                <span className="font-bold text-white shrink-0">{item.percent}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 24-Hour Telemetry Line Chart ─────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            24-Hour Continuous Telemetry (
                            {level === 'campus' && (campusViewMode === 'aggregate' ? 'Campus Aggregate' : 'Campus Building Breakdown')}
                            {level === 'building' && `${selectedBuilding?.label || 'Building'} – Multi-Floor Loads`}
                            {level === 'floor' && `${selectedBuilding?.label || 'Building'} Floor ${selectedFloor} Actual vs Expected Band`}
                            )
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {activeTab === 'power'
                                ? (level === 'campus' && campusViewMode === 'aggregate'
                                    ? '5-minute resolution · Expected baseline ±15% envelope · Outlier anomaly spikes'
                                    : '5-minute continuous series · Individual sub-meter load curves')
                                : 'Tank level % and continuous flow L/min · Shaded 01:00-04:00 night window'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Campus view mode toggle: Aggregate vs Building Breakdown */}
                        {level === 'campus' && activeTab === 'power' && (
                            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                                <button
                                    onClick={() => setCampusViewMode('aggregate')}
                                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                                        campusViewMode === 'aggregate'
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Campus Aggregate (±15% Envelope)
                                </button>
                                <button
                                    onClick={() => setCampusViewMode('breakdown')}
                                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                                        campusViewMode === 'breakdown'
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Building Breakdown
                                </button>
                            </div>
                        )}

                        {profileData?.deviceId && (
                            <div className="text-xs font-mono bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-emerald-400 font-bold">
                                Sensor ID: {profileData.deviceId}
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {activeTab === 'power' ? (
                            <AreaChart data={profileData?.series || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="time" tick={AXIS_STYLE} stroke="#1e293b" />
                                <YAxis tick={AXIS_STYLE} stroke="#1e293b" unit=" kW" />
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(v, n) => [`${typeof v === 'number' ? v.toFixed(1) : v} kW`, n]}
                                    labelFormatter={(label) => `Time: ${label}`}
                                />
                                <Legend wrapperStyle={{ fontSize: 11 }} />

                                {/* 1. Floor Level: Actual vs Expected Baseline & ±15% Envelope */}
                                {level === 'floor' && (
                                    <>
                                        <Area
                                            type="monotone"
                                            dataKey="actual"
                                            name="Actual Load (kW)"
                                            stroke="#ef4444"
                                            strokeWidth={2.5}
                                            fill="#ef4444"
                                            fillOpacity={0.15}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expected"
                                            name="Expected Baseline (kW)"
                                            stroke="#10b981"
                                            strokeWidth={1.8}
                                            strokeDasharray="4 4"
                                            fillOpacity={0}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expectedMax"
                                            name="Upper Threshold (+15%)"
                                            stroke="#f59e0b"
                                            strokeWidth={1.2}
                                            strokeDasharray="2 2"
                                            fillOpacity={0}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expectedMin"
                                            name="Lower Threshold (-15%)"
                                            stroke="#64748b"
                                            strokeWidth={1}
                                            strokeDasharray="2 2"
                                            fillOpacity={0}
                                        />
                                    </>
                                )}

                                {/* 2. Building Level: Building Total vs Floors F1-F4 */}
                                {level === 'building' && (
                                    <>
                                        <Area type="monotone" dataKey="total" name="Building Actual (kW)" stroke="#38bdf8" strokeWidth={2.2} fill="#38bdf8" fillOpacity={0.08} />
                                        <Area type="monotone" dataKey="baseline" name="Expected Baseline (kW)" stroke="#10b981" strokeWidth={1.8} strokeDasharray="4 4" fillOpacity={0} />
                                        <Area type="monotone" dataKey="F1" name="Floor 1 (kW)" stroke="#34d399" strokeWidth={1.5} fillOpacity={0} />
                                        <Area type="monotone" dataKey="F2" name="Floor 2 (kW)" stroke="#a78bfa" strokeWidth={1.5} fillOpacity={0} />
                                        <Area type="monotone" dataKey="F3" name="Floor 3 (kW)" stroke="#fbbf24" strokeWidth={1.5} fillOpacity={0} />
                                        <Area type="monotone" dataKey="F4" name="Floor 4 (kW)" stroke="#f87171" strokeWidth={1.8} fillOpacity={0} />
                                    </>
                                )}

                                {/* 3. Campus Level: Aggregate Mode (Actual vs Expected ±15% Envelope) */}
                                {level === 'campus' && campusViewMode === 'aggregate' && (
                                    <>
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            name="Actual Campus Load (kW)"
                                            stroke="#38bdf8"
                                            strokeWidth={2.5}
                                            fill="#38bdf8"
                                            fillOpacity={0.12}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="baseline"
                                            name="Expected Baseline (kW)"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            strokeDasharray="4 4"
                                            fillOpacity={0}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expectedMax"
                                            name="Upper Envelope (+15%)"
                                            stroke="#f59e0b"
                                            strokeWidth={1.2}
                                            strokeDasharray="3 3"
                                            fillOpacity={0}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expectedMin"
                                            name="Lower Envelope (-15%)"
                                            stroke="#64748b"
                                            strokeWidth={1}
                                            strokeDasharray="3 3"
                                            fillOpacity={0}
                                        />
                                    </>
                                )}

                                {/* 4. Campus Level: Building Breakdown Mode (NO total, NO duplicate labels) */}
                                {level === 'campus' && campusViewMode === 'breakdown' && (
                                    <>
                                        <Area type="monotone" dataKey="HA" name="Hostel Block A (kW)" stroke="#38bdf8" strokeWidth={1.8} fillOpacity={0.05} />
                                        <Area type="monotone" dataKey="HB" name="Hostel Block B (kW)" stroke="#a78bfa" strokeWidth={1.8} fillOpacity={0.05} />
                                        <Area type="monotone" dataKey="AB" name="Academic Block (kW)" stroke="#fbbf24" strokeWidth={1.8} fillOpacity={0.05} />
                                        <Area type="monotone" dataKey="CANT" name="Canteen & Mess (kW)" stroke="#f472b6" strokeWidth={1.5} fillOpacity={0.05} />
                                        <Area type="monotone" dataKey="PH" name="Pump House (kW)" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={0.05} />
                                        <Area type="monotone" dataKey="SL" name="Street Lighting (kW)" stroke="#84cc16" strokeWidth={1.5} fillOpacity={0.05} />
                                    </>
                                )}
                            </AreaChart>
                        ) : (
                            <AreaChart data={profileData?.series || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="time" tick={AXIS_STYLE} stroke="#1e293b" />
                                <YAxis tick={AXIS_STYLE} stroke="#1e293b" unit="%" />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />

                                {/* Night window 01:00-04:00 shading */}
                                <ReferenceArea x1="01:00" x2="04:00" strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.1} label={{ value: '01:00-04:00 Night Window', fill: '#60a5fa', fontSize: 10 }} />

                                <Area
                                    type="monotone"
                                    dataKey="tank_level_pct"
                                    name="Tank Level (%)"
                                    stroke="#06b6d4"
                                    strokeWidth={2.5}
                                    fill="#06b6d4"
                                    fillOpacity={0.15}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="flow_lpm"
                                    name="Flow (L/min)"
                                    stroke="#34d399"
                                    strokeWidth={1.8}
                                    fillOpacity={0}
                                />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Active Incident & Alerts Panel ───────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        <div>
                            <h3 className="text-sm font-bold text-white">Active Anomalies & Fault Alarms</h3>
                            <p className="text-xs text-slate-400 font-mono">
                                {alerts.length} open alert{alerts.length !== 1 ? 's' : ''} requiring investigation
                            </p>
                        </div>
                    </div>
                </div>

                {alerts.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-emerald-400 text-xs font-mono">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>All floors and water reservoirs are operating within normal baseline envelope. Zero open faults.</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert._id}
                                className="bg-slate-950 border border-red-500/30 hover:border-red-500/60 rounded-xl p-4 transition-all"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-red-600 text-white">
                                            {alert.severity || 'CRITICAL'}
                                        </span>
                                        <span className="text-xs font-bold text-white">
                                            {alert.title || alert.zone}
                                        </span>
                                        <span className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                            Sensor: {alert.deviceId}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400">
                                        {new Date(alert.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-300 font-sans mb-3 leading-relaxed">
                                    {alert.whyText || alert.description}
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                                    <div className="text-slate-400">
                                        <span className="text-amber-400 font-bold">Action:</span> {alert.suggestedAction || 'Inspect equipment on-site'}
                                    </div>

                                    <button
                                        onClick={() => handleAcknowledgeAlert(alert._id)}
                                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 shadow"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Acknowledge & Resolve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
