import React, { useState } from 'react';
import {
    Building2, Shield, Lock, Mail, MapPin, User, CheckCircle2,
    Navigation, Sparkles, X, HeartPulse, GraduationCap, AlertCircle,
    ArrowRight, Loader2
} from 'lucide-react';
import axios from 'axios';
import { searchCityCoordinates, detectBrowserGeolocation } from '../services/geoService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AuthModal({ isOpen = true, onClose, onLoginSuccess, currentOrg, canClose = true, defaultMode = 'login' }) {
    const [authMode, setAuthMode] = useState(defaultMode); // 'login' | 'register'
    const [loginForm, setLoginForm] = useState({
        email: 'dean.admin@bput.ac.in',
        password: 'demo123',
        role: 'admin'
    });
    
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
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    if (!isOpen) return null;

    // Quick demo 1-click accounts
    const demoAccounts = [
        {
            id: 'bput_college',
            name: 'BPUT National Engineering College',
            type: 'college',
            typeName: 'Higher Education / College',
            icon: GraduationCap,
            iconColor: 'text-emerald-400',
            bgBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
            city: 'Rourkela',
            state: 'Odisha',
            adminName: 'Prof. S. K. Nayak (Dean)',
            adminEmail: 'dean.admin@bput.ac.in',
            role: 'admin',
            lat: 22.2585,
            lon: 84.8480,
            summary: '6 Buildings · 13 Power/Water meters · Hostels, Academic, Mess & Pumping'
        },
        {
            id: 'city_hospital',
            name: 'Apollo & AIIMS Super-Specialty Hospital',
            type: 'hospital',
            typeName: 'Healthcare / Hospital',
            icon: HeartPulse,
            iconColor: 'text-rose-400',
            bgBadge: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
            city: 'Bhubaneswar',
            state: 'Odisha',
            adminName: 'Dr. A. K. Mohapatra (Medical Director)',
            adminEmail: 'director.med@cityhospital.org',
            role: 'admin',
            lat: 20.2961,
            lon: 85.8245,
            summary: '6 Specialized Blocks · ICU, Emergency Trauma, OPD Clinics, Inpatient & Medical Gases'
        },
        {
            id: 'municipal_hq',
            name: 'Smart City Civic & Administrative Center',
            type: 'municipal',
            typeName: 'Municipal & Governance',
            icon: Building2,
            iconColor: 'text-cyan-400',
            bgBadge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
            city: 'Rourkela',
            state: 'Odisha',
            adminName: 'Er. R. R. Panda (Chief Municipal Engineer)',
            adminEmail: 'commissioner@smartcity.gov.in',
            role: 'admin',
            lat: 22.2492,
            lon: 84.8828,
            summary: 'Secretariat, Command & Control Centre, City Revenue & Utilities'
        }
    ];

    const handleSelectDemo = async (acc) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            // Attempt to login with demo credentials to get real token
            const res = await axios.post(`${API_BASE}/auth/login`, {
                email: acc.adminEmail,
                password: 'demo123'
            }).catch(() => null);

            if (res && res.data && res.data.token) {
                onLoginSuccess(res.data);
            } else {
                // Fallback to client profile if server offline
                onLoginSuccess(acc);
            }
            onClose();
        } catch (e) {
            onLoginSuccess(acc);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, {
                email: loginForm.email,
                password: loginForm.password
            });

            if (res.data) {
                setSuccessMsg(`✓ Logged in as ${res.data.name}`);
                setTimeout(() => {
                    onLoginSuccess(res.data);
                    onClose();
                }, 400);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Login failed. Check your email and password.');
        } finally {
            setLoading(false);
        }
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
            setCitySuggestions(results || []);
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
        setErrorMsg(null);
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
            setSuccessMsg(`✓ GPS Coordinates Locked: ${pos.lat}°N, ${pos.lon}°E`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setErrorMsg('GPS prompt dismissed or unavailable; using defaults.');
            setTimeout(() => setErrorMsg(null), 3500);
        } finally {
            setDetectingGps(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!regForm.name || !regForm.adminName || !regForm.adminEmail || !regForm.password) {
            setErrorMsg('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await axios.post(`${API_BASE}/auth/register-org`, {
                orgName: regForm.name,
                orgType: regForm.type,
                adminName: regForm.adminName,
                email: regForm.adminEmail,
                password: regForm.password,
                city: regForm.city || 'Rourkela',
                state: regForm.state || 'Odisha',
                lat: regForm.lat,
                lon: regForm.lon,
                role: regForm.role
            });

            if (res.data) {
                setSuccessMsg('✓ Organization registered successfully! Launching telemetry...');
                setTimeout(() => {
                    onLoginSuccess(res.data, true);
                    onClose();
                }, 600);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-tight">Organization Identity & Authentication</h3>
                            <p className="text-xs text-slate-400 font-mono">Multi-Organization Facility SCADA Intelligence</p>
                        </div>
                    </div>
                    {canClose && onClose && (
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* 2-Way Tab Switcher */}
                <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold">
                    <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                        className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            authMode === 'login' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Lock className="w-3.5 h-3.5" />
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
                        className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            authMode === 'register' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        + Register Facility
                    </button>
                </div>

                {/* Alert Banners */}
                {errorMsg && (
                    <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-xl text-xs font-mono flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* VIEW: SIGN IN WITH EMAIL & PASSWORD */}
                {authMode === 'login' && (
                    <form onSubmit={handleEmailLoginSubmit} className="space-y-4 text-xs">
                        {/* Quick Autofill Cards for Demo accounts */}
                        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                            <span className="text-[11px] font-mono text-slate-400 font-semibold block">
                                Quick Autofill Demo Credentials (Click to fill):
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginForm({ email: 'director.med@cityhospital.org', password: 'demo123', role: 'admin' });
                                        setErrorMsg(null);
                                    }}
                                    className={`p-2.5 rounded-lg border text-left transition-all font-mono cursor-pointer ${
                                        loginForm.email.includes('hospital')
                                            ? 'bg-rose-950/50 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-300 mb-0.5">
                                        <HeartPulse className="w-3.5 h-3.5" />
                                        Hospital
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">director.med@cityhospital.org</div>
                                    <div className="text-[10px] text-slate-500">Pass: demo123</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginForm({ email: 'dean.admin@bput.ac.in', password: 'demo123', role: 'admin' });
                                        setErrorMsg(null);
                                    }}
                                    className={`p-2.5 rounded-lg border text-left transition-all font-mono cursor-pointer ${
                                        loginForm.email.includes('bput')
                                            ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 mb-0.5">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        BPUT College
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">dean.admin@bput.ac.in</div>
                                    <div className="text-[10px] text-slate-500">Pass: demo123</div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1 font-mono">Institutional Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                <input
                                    type="email"
                                    required
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                    placeholder="e.g. dean.admin@bput.ac.in or director.med@cityhospital.org"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white font-mono placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1 font-mono">Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                <input
                                    type="password"
                                    required
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white font-mono placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1 font-mono">Operational Role Perspective</label>
                            <select
                                value={loginForm.role}
                                onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="admin">🏛️ Facility Administrator / Executive Dean / Medical Director</option>
                                <option value="warden">⚡ Operations Manager / Warden / Hospital Superintendent</option>
                                <option value="sustainability_officer">🌿 Sustainability & Environmental Compliance Officer</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-3 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md font-mono flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            {loading ? 'Authenticating...' : 'Sign In & Open FacilityOS'}
                        </button>
                    </form>
                )}

                {/* VIEW 3: REGISTER NEW ORGANIZATION */}
                {authMode === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                        <div>
                            <label className="block text-slate-400 mb-1 font-mono">Organization / Facility Name *</label>
                            <input
                                type="text"
                                required
                                value={regForm.name}
                                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                placeholder="e.g. AIIMS District Hospital or National Institute of Technology"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 mb-1 font-mono">Facility Sector *</label>
                                <select
                                    value={regForm.type}
                                    onChange={(e) => setRegForm({ ...regForm, type: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="college">🎓 Engineering / Higher Ed Campus</option>
                                    <option value="hospital">🏥 Super-Specialty Hospital & Healthcare</option>
                                    <option value="municipal">🏢 Municipal & Civic Government</option>
                                    <option value="industry">🏭 Industrial Estate / Tech Park</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-mono">Admin Role *</label>
                                <select
                                    value={regForm.role}
                                    onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="admin">Facility Administrator</option>
                                    <option value="warden">Operations Warden</option>
                                    <option value="sustainability_officer">Sustainability Officer</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 mb-1 font-mono">Admin Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={regForm.adminName}
                                    onChange={(e) => setRegForm({ ...regForm, adminName: e.target.value })}
                                    placeholder="e.g. Dr. A. Sharma"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-mono">Institutional Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={regForm.adminEmail}
                                    onChange={(e) => setRegForm({ ...regForm, adminEmail: e.target.value })}
                                    placeholder="admin@facility.org"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1 font-mono">Admin Password * (min 6 characters)</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={regForm.password}
                                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        {/* City & Geolocation */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-slate-400 font-mono">Campus Location (City / GPS)</label>
                                <button
                                    type="button"
                                    onClick={handleDetectGps}
                                    disabled={detectingGps}
                                    className="text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 text-[11px]"
                                >
                                    <Navigation className="w-3 h-3" />
                                    {detectingGps ? 'Detecting...' : 'Auto-detect GPS'}
                                </button>
                            </div>
                            <div className="relative">
                                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={cityQuery}
                                    onChange={(e) => handleCitySearch(e.target.value)}
                                    placeholder="Search Indian city / campus..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                                />
                                {citySuggestions.length > 0 && (
                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl max-h-40 overflow-y-auto shadow-xl">
                                        {citySuggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                onClick={() => handlePickCity(s)}
                                                className="px-3 py-2 hover:bg-slate-800 cursor-pointer font-mono text-slate-300 hover:text-white flex justify-between"
                                            >
                                                <span>{s.city}, {s.state}</span>
                                                <span className="text-[10px] text-slate-500">{s.lat.toFixed(2)}°N, {s.lon.toFixed(2)}°E</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md font-mono flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                            {loading ? 'Provisioning Campus SCADA...' : 'Create Facility & Auto-Provision SCADA'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
