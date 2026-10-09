import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2, Plus, Trash2, CheckCircle2,
    Cpu, Copy, Check, AlertCircle, Download, Zap, Droplet
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FacilitySetupTab({ orgId = 'bput_college', userRole = 'admin' }) {
    const isAdmin = userRole === 'admin';

    const [buildings, setBuildings] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Step 1: Add building form
    const [buildingName, setBuildingName] = useState('');
    const [buildingCode, setBuildingCode] = useState('');
    const [userEditedCode, setUserEditedCode] = useState(false);
    const [buildingType, setBuildingType] = useState('hostel');
    const [buildingFloors, setBuildingFloors] = useState(3);

    // Step 2: Add single sensor form
    const [sensorBuildingId, setSensorBuildingId] = useState('');
    const [sensorFloor, setSensorFloor] = useState('1');
    const [sensorType, setSensorType] = useState('power');
    const [sensorLabel, setSensorLabel] = useState('');

    // Postman sample modal/card
    const [newDeviceSample, setNewDeviceSample] = useState(null);
    const [copied, setCopied] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [bRes, dRes] = await Promise.all([
                axios.get(`${API_BASE}/buildings`, { params: { orgId } }),
                axios.get(`${API_BASE}/devices`, { params: { orgId } })
            ]);
            if (Array.isArray(bRes.data)) setBuildings(bRes.data);
            if (Array.isArray(dRes.data)) setDevices(dRes.data);
            if (bRes.data?.length > 0 && !sensorBuildingId) {
                setSensorBuildingId(bRes.data[0]._id);
            }
        } catch (err) {
            console.warn('Facility setup load error:', err.message);
        } finally {
            setLoading(false);
        }
    }, [orgId, sensorBuildingId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    // Auto-derive uppercase initials for building code
    const handleNameChange = (val) => {
        setBuildingName(val);
        if (!userEditedCode) {
            const words = val.trim().split(/\s+/);
            let derived = '';
            if (words.length > 1) {
                derived = words.map(w => w.charAt(0)).join('').toUpperCase().slice(0, 6);
            } else {
                derived = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
            }
            setBuildingCode(derived);
        }
    };

    // ── Step 1: Add Building ──────────────────────────────────────────────────
    const handleAddBuilding = async (e) => {
        e.preventDefault();
        if (!isAdmin || !buildingName.trim()) return;

        try {
            const res = await axios.post(`${API_BASE}/buildings`, {
                orgId,
                name: buildingName.trim(),
                code: buildingCode.trim().toUpperCase(),
                type: buildingType,
                floors: Math.max(1, Math.min(30, Number(buildingFloors) || 1))
            });
            showToast(`Building ${res.data.name} (Code: ${res.data.code}) created.`);
            setBuildingName('');
            setBuildingCode('');
            setUserEditedCode(false);
            loadData();
        } catch (err) {
            alert('Failed to add building: ' + (err.response?.data?.error || err.message));
        }
    };

    // ── Step 2: Auto-Create One Power Meter Per Floor ─────────────────────────
    const handleAutoCreateMeters = async (bId, bName) => {
        if (!isAdmin) return;
        try {
            const res = await axios.post(`${API_BASE}/buildings/${bId}/auto-meters`, { orgId });
            showToast(`Auto-created ${res.data.count} power meters for ${bName}.`);
            loadData();
        } catch (err) {
            alert('Failed to auto-create meters: ' + (err.response?.data?.error || err.message));
        }
    };

    // ── Step 2: Add Single Sensor ─────────────────────────────────────────────
    const handleAddSensor = async (e) => {
        e.preventDefault();
        if (!isAdmin || !sensorBuildingId) return;

        try {
            const res = await axios.post(`${API_BASE}/devices`, {
                orgId,
                buildingId: sensorBuildingId,
                floor: sensorFloor === 'campus' ? 'campus' : Number(sensorFloor),
                type: sensorType,
                label: sensorLabel.trim() || undefined
            });
            setNewDeviceSample(res.data);
            showToast(`Sensor ${res.data.deviceId} created with baseline profile.`);
            setSensorLabel('');
            loadData();
        } catch (err) {
            alert('Failed to add sensor: ' + (err.response?.data?.error || err.message));
        }
    };

    // ── Delete / Archive (Soft Delete) ────────────────────────────────────────
    const handleDeleteBuilding = async (id, name) => {
        if (!isAdmin || !window.confirm(`Archive building "${name}"? Historical telemetry is preserved.`)) return;
        try {
            await axios.delete(`${API_BASE}/buildings/${id}`);
            showToast(`Building ${name} archived (soft-deleted).`);
            loadData();
        } catch (err) {
            alert('Failed to delete building: ' + err.message);
        }
    };

    const handleDeleteDevice = async (id, deviceId) => {
        if (!isAdmin || !window.confirm(`Archive sensor "${deviceId}"?`)) return;
        try {
            await axios.delete(`${API_BASE}/devices/${id}`);
            showToast(`Sensor ${deviceId} archived (soft-deleted).`);
            loadData();
        } catch (err) {
            alert('Failed to delete sensor: ' + err.message);
        }
    };

    const copyPostman = () => {
        if (!newDeviceSample) return;
        navigator.clipboard.writeText(JSON.stringify(newDeviceSample.samplePostman, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {toastMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header with CSV Download Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                        Facility & Infrastructure Setup
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Manage Buildings, Floors, IoT Power Meters, and Water Reservoirs
                    </p>
                </div>

                <a
                    href={`${API_BASE}/logs/download?orgId=${orgId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
                >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Export Telemetry CSV
                </a>
            </div>

            {/* Role Banner */}
            {!isAdmin && (
                <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl text-amber-300 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Read-Only View: Facility configuration is restricted to Org Administrator.</span>
                </div>
            )}

            {/* Forms Grid: Step 1 (Add Building) & Step 2 (Add Single Sensor) */}
            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1: Add Building Form */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold text-white">Step 1: Add New Building</h3>
                        </div>

                        <form onSubmit={handleAddBuilding} className="space-y-3 text-xs font-mono">
                            <div>
                                <label className="text-slate-400 block mb-1">Building Name *</label>
                                <input
                                    type="text"
                                    value={buildingName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="e.g. Science & Tech Wing"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1">Unique Code *</label>
                                    <input
                                        type="text"
                                        value={buildingCode}
                                        onChange={(e) => {
                                            setBuildingCode(e.target.value.toUpperCase());
                                            setUserEditedCode(true);
                                        }}
                                        placeholder="e.g. STW"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white uppercase focus:outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1">Floors (1 - 30)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={buildingFloors}
                                        onChange={(e) => setBuildingFloors(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">Building Type *</label>
                                <select
                                    value={buildingType}
                                    onChange={(e) => setBuildingType(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="hostel">Hostel Block</option>
                                    <option value="academic">Academic Wing</option>
                                    <option value="canteen">Canteen / Mess</option>
                                    <option value="library">Library</option>
                                    <option value="administrative">Administrative Block</option>
                                    <option value="sports">Sports Complex</option>
                                    <option value="pump_house">Pump House</option>
                                    <option value="street_lighting">Street Lighting</option>
                                    <option value="other">Other Facility</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow"
                            >
                                <Plus className="w-4 h-4" />
                                Create Building
                            </button>
                        </form>
                    </div>

                    {/* Step 2: Add Single Sensor Form */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-cyan-400" />
                            <h3 className="text-sm font-bold text-white">Step 2: Add Single IoT Sensor</h3>
                        </div>

                        <form onSubmit={handleAddSensor} className="space-y-3 text-xs font-mono">
                            <div>
                                <label className="text-slate-400 block mb-1">Select Building *</label>
                                <select
                                    value={sensorBuildingId}
                                    onChange={(e) => setSensorBuildingId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    required
                                >
                                    {buildings.map(b => (
                                        <option key={b._id} value={b._id}>
                                            {b.name} ({b.code}) – {b.floors} floors
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1">Sensor Type</label>
                                    <select
                                        value={sensorType}
                                        onChange={(e) => setSensorType(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="power">Power Meter (kW)</option>
                                        <option value="water_tank">Water Tank (Level & Flow)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1">Floor (Number or campus)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 1 or campus"
                                        value={sensorFloor}
                                        onChange={(e) => setSensorFloor(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">Sensor Label (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Science Wing Floor 1 Sub-Panel"
                                    value={sensorLabel}
                                    onChange={(e) => setSensorLabel(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow"
                            >
                                <Plus className="w-4 h-4" />
                                Register Sensor
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Postman Sample Card */}
            {newDeviceSample && (
                <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            <h4 className="text-xs font-bold text-white font-mono">
                                New Sensor Active: {newDeviceSample.deviceId}
                            </h4>
                        </div>
                        <button
                            onClick={copyPostman}
                            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-mono transition-all"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied Postman JSON' : 'Copy Sample Body'}
                        </button>
                    </div>

                    <pre className="p-3 bg-slate-900 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto border border-slate-800">
                        {JSON.stringify(newDeviceSample.samplePostman, null, 2)}
                    </pre>
                </div>
            )}

            {/* Existing Buildings & Devices Inventory */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Active Buildings & Sensors Inventory</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {buildings.length} buildings · {devices.length} sensors configured
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {buildings.map((b) => {
                        const buildingDevices = devices.filter(d => (d.buildingId?._id || d.buildingId) === b._id);

                        return (
                            <div key={b._id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-white">{b.name}</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                                            {b.code}
                                        </span>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 mb-2">
                                        Type: {b.type} · {b.floors} floors · {b.active ? '● Active' : '○ Archived'}
                                    </div>

                                    {/* Quick Auto-Create Power Meters Button */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleAutoCreateMeters(b._id, b.name)}
                                            className="w-full py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors mb-3"
                                        >
                                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                                            Auto-create 1 meter per floor
                                        </button>
                                    )}

                                    {/* Sensors list for this building */}
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                        {buildingDevices.map(d => (
                                            <div key={d._id} className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-slate-800/80 text-[10px] font-mono">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    {d.type === 'power' ? <Zap className="w-3 h-3 text-amber-400 shrink-0" /> : <Droplet className="w-3 h-3 text-cyan-400 shrink-0" />}
                                                    <span className="text-slate-200 font-bold truncate">{d.deviceId}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-500">{d.active ? 'active' : 'archived'}</span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteDevice(d._id, d.deviceId)}
                                                            className="text-red-400 hover:text-red-300 p-0.5"
                                                            title="Archive Sensor"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-slate-500">
                                            {buildingDevices.length} sensor{buildingDevices.length !== 1 ? 's' : ''}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteBuilding(b._id, b.name)}
                                            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-mono transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" /> Archive Building
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
