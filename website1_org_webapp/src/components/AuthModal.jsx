import React, { useState } from 'react';
import { Building2, Shield, Lock, Mail, MapPin, User, CheckCircle2, Navigation, Sparkles, X } from 'lucide-react';
import { searchCityCoordinates, detectBrowserGeolocation, PRESET_HUBS } from '../services/geoService';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, currentOrg }) {
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [loginForm, setLoginForm] = useState({ email: 'dean.admin@bput.ac.in', password: '••••••••' });
    
    // Registration state
    const [regForm, setRegForm] = useState({
        name: '',
        type: 'college',
        city: 'Rourkela',
        state: 'Odisha',
        lat: 22.2585,
        lon: 84.8480,
        adminName: '',
        adminEmail: '',
        password: '',
        role: 'admin'
    });

    const [cityQuery, setCityQuery] = useState('Rourkela');
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [detectingGps, setDetectingGps] = useState(false);
    const [msg, setMsg] = useState(null);

    if (!isOpen) return null;

    // Quick demo 1-click account
    const demoAccounts = [
        {
            id: 'bput_college',
            name: 'BPUT National Engineering College',
            type: 'college',
            typeName: '🎓 Engineering College',
            city: 'Rourkela',
            adminName: 'Prof. S. K. Nayak',
            adminEmail: 'dean.admin@bput.ac.in',
            role: 'admin',
            lat: 22.2585,
            lon: 84.8480
        }
    ];

    const handleSelectDemo = (acc) => {
        onLoginSuccess(acc);
        onClose();
    };

    const handleCitySearch = async (val) => {
        setCityQuery(val);
        if (val.length < 2) {
            setCitySuggestions([]);
            return;
        }
        setIsSearchingCity(true);
        try {
            const results = await searchCityCoordinates(val);
            setCitySuggestions(results);
        } catch (e) {
            setCitySuggestions([]);
        } finally {
            setIsSearchingCity(false);
        }
    };

    const handlePickCity = (item) => {
        setCityQuery(item.city);
        setRegForm({
            ...regForm,
            city: item.city,
            state: item.state,
            lat: item.lat,
            lon: item.lon
        });
        setCitySuggestions([]);
    };

    const handleDetectGps = async () => {
        setDetectingGps(true);
        setMsg('Accessing device GPS telemetry...');
        try {
            const pos = await detectBrowserGeolocation();
            setCityQuery(`${pos.lat}°N, ${pos.lon}°E`);
            setRegForm({
                ...regForm,
                city: pos.city,
                state: pos.state,
                lat: pos.lat,
                lon: pos.lon
            });
            setMsg(`✓ GPS Coordinates Locked: ${pos.lat}°N, ${pos.lon}°E`);
        } catch (err) {
            setMsg('GPS prompt dismissed or unavailable; selected default coordinates.');
        } finally {
            setDetectingGps(false);
            setTimeout(() => setMsg(null), 3500);
        }
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        if (!regForm.name || !regForm.adminName) {
            setMsg('Please fill in organization name and administrator name');
            return;
        }

        const newOrgId = `org_${Date.now()}`;
        const newOrgProfile = {
            id: newOrgId,
            name: regForm.name,
            type: regForm.type,
            typeName: regForm.type === 'college' ? 'Engineering College' :
                      regForm.type === 'hospital' ? 'General Hospital' :
                      regForm.type === 'industry' ? 'Industrial Estate' : 'Senior School',
            city: regForm.city || 'Custom Location',
            state: regForm.state || 'India',
            lat: regForm.lat || 22.2585,
            lon: regForm.lon || 84.8480,
            adminName: regForm.adminName,
            adminEmail: regForm.adminEmail || `${newOrgId}@facilityos.in`,
            role: regForm.role
        };

        onLoginSuccess(newOrgProfile, true); // true = newly registered
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-tight">Organization Identity & Authentication</h3>
                            <p className="text-xs text-slate-400 font-mono">Role-Based Access for Facility Estate Intelligence</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold">
                    <button
                        onClick={() => setAuthMode('login')}
                        className={`flex-1 py-2 rounded-lg transition-all ${
                            authMode === 'login' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Sign In / Select Facility
                    </button>
                    <button
                        onClick={() => setAuthMode('register')}
                        className={`flex-1 py-2 rounded-lg transition-all ${
                            authMode === 'register' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        + Register New Organization
                    </button>
                </div>

                {msg && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-xs font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{msg}</span>
                    </div>
                )}

                {/* VIEW 1: SIGN IN & 1-CLICK DEMO PROFILES */}
                {authMode === 'login' && (
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-mono text-slate-400 uppercase font-semibold">1-Click Institutional Demo Login:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                                {demoAccounts.map(acc => (
                                    <div
                                        key={acc.id}
                                        onClick={() => handleSelectDemo(acc)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-1 ${
                                            currentOrg === acc.id
                                                ? 'bg-emerald-500/15 border-emerald-500 text-white'
                                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-white">{acc.typeName}</span>
                                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-400">{acc.city}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-sans truncate">{acc.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">User: {acc.adminName}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-slate-800/80 pt-3 space-y-3">
                            <span className="text-xs font-mono text-slate-400 uppercase font-semibold">Or Sign In with Corporate Email:</span>
                            <div className="space-y-2 text-xs">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-mono">Institutional Email</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                        <input
                                            type="email"
                                            value={loginForm.email}
                                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-mono">Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                        <input
                                            type="password"
                                            value={loginForm.password}
                                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white font-mono"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSelectDemo(demoAccounts[0])}
                                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md font-mono"
                                >
                                    Authorize & Open FacilityOS Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 2: REGISTER NEW ORGANIZATION */}
                {authMode === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                        <div>
                            <label className="block text-slate-400 mb-1 font-mono">Organization / Facility Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. AIIMS Bhubaneswar or Jindal Steel Plant"
                                value={regForm.name}
                                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 mb-1 font-mono">Facility Category</label>
                                <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs">
                                    🎓 Engineering College
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-mono">Default Authorization Role</label>
                                <select
                                    value={regForm.role}
                                    onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                                >
                                    <option value="admin">🏛️ Facility Administrator</option>
                                    <option value="operations">⚡ Operations & SCADA Team</option>
                                    <option value="sustainability">🌿 Sustainability Officer</option>
                                </select>
                            </div>
                        </div>

                        {/* Location / Dynamic Geocoding */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-slate-400 font-mono">Facility City / Location (GPS Geocoded)</label>
                                <button
                                    type="button"
                                    onClick={handleDetectGps}
                                    disabled={detectingGps}
                                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                                >
                                    <Navigation className="w-3 h-3" />
                                    <span>{detectingGps ? 'Detecting...' : '📍 Auto-Detect Device GPS'}</span>
                                </button>
                            </div>
                            <div className="relative">
                                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Type any Indian city (e.g. Bhubaneswar, Jharsuguda, Kolkata, Delhi)"
                                    value={cityQuery}
                                    onChange={(e) => handleCitySearch(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white font-mono"
                                />
                            </div>

                            {/* City Suggestions dropdown */}
                            {citySuggestions.length > 0 && (
                                <div className="mt-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl max-h-36 overflow-y-auto z-10 relative">
                                    {citySuggestions.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handlePickCity(item)}
                                            className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center text-xs font-mono border-b border-slate-900"
                                        >
                                            <span className="text-white font-bold">{item.city}, {item.state}</span>
                                            <span className="text-[10px] text-emerald-400">{item.lat}°N, {item.lon}°E</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="text-[11px] text-slate-500 font-mono mt-1">
                                Locked GPS: <strong className="text-slate-300">{regForm.lat}°N, {regForm.lon}°E</strong> (real-time weather & AQI telemetry will fetch for these coordinates)
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="block text-slate-400 mb-1 font-mono">Administrator Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Dr. Rajesh Mohanty"
                                    value={regForm.adminName}
                                    onChange={(e) => setRegForm({ ...regForm, adminName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1 font-mono">Corporate Email</label>
                                <input
                                    type="email"
                                    placeholder="admin@facility.org"
                                    value={regForm.adminEmail}
                                    onChange={(e) => setRegForm({ ...regForm, adminEmail: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md font-mono"
                            >
                                Register & Initialize SQLite Offline Telemetry
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
