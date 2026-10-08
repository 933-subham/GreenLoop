import React, { useState, useEffect } from 'react';
import {
    Building2, Zap, Droplet, Camera, Trash2, ShieldAlert, CheckCircle2,
    AlertTriangle, RefreshCw, Plus, Bell, Wrench, Truck, ExternalLink,
    Activity, Sliders, Award, Download, Eye, Send, MapPin, Wind, Thermometer,
    Gauge, Clock, ArrowUpRight, TrendingDown, Check, UserCheck, Flame,
    Sparkles, BookOpen, Info, Shield, Database, Wifi, WifiOff, User, Lock, Navigation
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceArea, ReferenceLine,
    PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import AuthModal from '../components/AuthModal';
import SqliteOfflineModal from '../components/SqliteOfflineModal';
import { offlineDb } from '../services/offlineDb';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function OrgPortalApp() {
    // Authenticated Organization Profile & Identity State
    const [authOrg, setAuthOrg] = useState(() => {
        return offlineDb.getAllOrgs()[0] || {
            id: 'bput_college',
            name: 'BPUT National Engineering College',
            type: 'college',
            typeName: 'Engineering College',
            city: 'Rourkela',
            state: 'Odisha',
            lat: 22.2585,
            lon: 84.8480,
            adminName: 'Prof. S. K. Nayak',
            adminEmail: 'dean.admin@bput.ac.in',
            role: 'admin'
        };
    });

    const [currentOrg, setCurrentOrg] = useState('bput_college');
    const [userRole, setUserRole] = useState('admin'); // 'admin', 'operations', 'sustainability'
    const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showSqliteModal, setShowSqliteModal] = useState(false);
    const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
    const [dbRecordCount, setDbRecordCount] = useState(() => offlineDb.getDatabaseStats().totalRecords);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [mainCategory, setMainCategory] = useState('scada'); // scada, waste, warden, sustainability
    const [currentTab, setCurrentTab] = useState('overview'); // overview, power, water, waste, scenarios, scorecard, warden
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    // Live SCADA clock state
    const [streamVolts, setStreamVolts] = useState('231.4');
    const [streamFreq, setStreamFreq] = useState('50.02');

    // Real-Time Ambient Weather & Air Quality from Free Open-Meteo API
    const [ambientData, setAmbientData] = useState({
        temperature: 24.5,
        humidity: 78,
        pressure: 992.4,
        windSpeed: 2.1,
        pm25: 58.0,
        pm10: 79.5,
        aqiBand: 'Moderate',
        aqiColor: '#f59e0b',
        lastUpdated: 'Fetching live stations...',
        isLive: false
    });

    // Power SCADA state
    const [floor4Power, setFloor4Power] = useState(29.8);
    const [isWardenResolved, setIsWardenResolved] = useState(false);
    const [wardenAlertStatus, setWardenAlertStatus] = useState('Open (Action Required)');
    const [wardenNotes, setWardenNotes] = useState('Inspected rooms 402-418. Disconnected 3 room coolers and 1 immersion heater left running by students.');

    // Water SCADA state
    const [tankALevel, setTankALevel] = useState(68.2);
    const [isPlumberDispatched, setIsPlumberDispatched] = useState(false);

    // Hourly Camera Dump AI state
    const [cameraSnapshot, setCameraSnapshot] = useState({
        fillPct: 88,
        isHeavy: true,
        img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
        time: '11:00 AM'
    });

    // Campus Exterior Dump Bin state
    const [exteriorBinFill, setExteriorBinFill] = useState(88);
    const [exteriorBinStatus, setExteriorBinStatus] = useState('DISPATCHED TO MUNICIPALITY');

    // Internal Student Reports state
    const [internalReports, setInternalReports] = useState([
        {
            _id: 'RPT-101',
            reporterName: 'Aniket Verma (Student, Year 3)',
            locationName: 'Hostel Block A Courtyard Benches',
            wasteType: 'Dry / Plastic Waste',
            status: 'pending',
            assignedJanitorName: ''
        },
        {
            _id: 'RPT-102',
            reporterName: 'Dr. Debabrata Roy (Faculty)',
            locationName: 'Behind Mechanical Workshop Block',
            wasteType: 'Dry / Plastic Waste',
            status: 'assigned_to_janitor',
            assignedJanitorName: 'Janitor Raghu Behera'
        }
    ]);

    // Student Report Modal
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({
        reporterName: 'Aniket Verma (Student, Year 3)',
        locationName: 'Hostel Block A Courtyard Benches',
        wasteType: 'Dry / Plastic Waste',
        description: 'Plastic beverage bottles and snack packaging left after evening study group.'
    });

    // Scenario simulator state
    const [simPowerCut, setSimPowerCut] = useState(15);
    const [simFixLeaks, setSimFixLeaks] = useState(true);
    const [simOptimizeWaste, setSimOptimizeWaste] = useState(true);

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 4500);
    };

    const handleResynthesizeAi = () => {
        setIsGeneratingAi(true);
        setTimeout(() => {
            setIsGeneratingAi(false);
            showToast('✨ GenAI Facility Copilot re-synthesized insights across live telemetry!');
        }, 1200);
    };

    const handleSelectCategory = (cat) => {
        setMainCategory(cat);
        if (cat === 'scada') {
            if (!['overview', 'power', 'water'].includes(currentTab)) setCurrentTab('overview');
        } else if (cat === 'waste') {
            setCurrentTab('waste');
        } else if (cat === 'warden') {
            setCurrentTab('warden');
        } else if (cat === 'sustainability') {
            if (!['scenarios', 'scorecard'].includes(currentTab)) setCurrentTab('scenarios');
        }
    };

    const handleSelectSubTab = (sub) => {
        setCurrentTab(sub);
        if (['overview', 'power', 'water'].includes(sub)) setMainCategory('scada');
        else if (['waste', 'camera'].includes(sub)) setMainCategory('waste');
        else if (sub === 'warden') setMainCategory('warden');
        else if (['scenarios', 'scorecard'].includes(sub)) setMainCategory('sustainability');
    };

    // 1. Fetch Real-Time Ambient Weather & AQI for Dynamic Facility GPS Coordinates
    const fetchOpenMeteoRealTimeData = async (lat = authOrg.lat, lon = authOrg.lon) => {
        if (isSimulatedOffline) {
            // Read from SQLite Local Offline Database Engine
            const cached = offlineDb.getRecentTelemetry(authOrg.id);
            if (cached && cached.length > 0) {
                setAmbientData(prev => ({
                    ...prev,
                    ...cached[0].ambient,
                    lastUpdated: `${cached[0].timestamp.substring(11, 19)} (SQLite Offline)`,
                    isLive: false
                }));
            }
            return;
        }

        try {
            // Dynamic GPS Coordinates from Registered Organization Profile
            const [weatherRes, airRes] = await Promise.all([
                axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m`),
                axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,ozone`)
            ]);

            const currentW = weatherRes.data?.current || {};
            const currentA = airRes.data?.current || {};

            const pm25Val = currentA.pm2_5 || 42.0;
            const pm10Val = currentA.pm10 || 68.5;

            // CPCB AQI bands
            let band = 'Good';
            let color = '#10b981';
            if (pm25Val > 120 || pm10Val > 250) {
                band = 'Very Poor';
                color = '#ef4444';
            } else if (pm25Val > 60 || pm10Val > 100) {
                band = 'Moderate';
                color = '#f59e0b';
            } else if (pm25Val > 30 || pm10Val > 50) {
                band = 'Satisfactory';
                color = '#38bdf8';
            }

            const newAmbient = {
                temperature: currentW.temperature_2m || 25.8,
                humidity: currentW.relative_humidity_2m || 72,
                pressure: currentW.surface_pressure || 1002.0,
                windSpeed: currentW.wind_speed_10m || 2.4,
                pm25: pm25Val,
                pm10: pm10Val,
                aqiBand: band,
                aqiColor: color,
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                isLive: true
            };

            setAmbientData(newAmbient);

            // Record into SQLite Local Storage Engine
            offlineDb.recordTelemetry({
                facilityId: authOrg.id,
                city: authOrg.city,
                lat,
                lon,
                ambient: newAmbient,
                powerKw: floor4Power,
                waterLevelPct: tankALevel
            });
            setDbRecordCount(offlineDb.getDatabaseStats().totalRecords);
        } catch (err) {
            console.log('Open-Meteo local SQLite cache active:', err.message);
            setAmbientData(prev => ({
                ...prev,
                lastUpdated: 'SQLite Cached Offline Station',
                isLive: false
            }));
        }
    };

    // Live SCADA stream ticker
    useEffect(() => {
        fetchOpenMeteoRealTimeData(authOrg.lat, authOrg.lon);
        const apiInterval = setInterval(() => fetchOpenMeteoRealTimeData(authOrg.lat, authOrg.lon), 60000); // refresh every 60s

        const scadaTimer = setInterval(() => {
            const v = (230 + Math.random() * 2.5).toFixed(1);
            setStreamVolts(v);
            if (!isWardenResolved) {
                const fl4 = (29.5 + Math.random() * 0.7).toFixed(1);
                setFloor4Power(parseFloat(fl4));
            }
        }, 2500);

        return () => {
            clearInterval(apiInterval);
            clearInterval(scadaTimer);
        };
    }, [isWardenResolved, authOrg, isSimulatedOffline]);

    // Handle authentication / organization registration success
    const handleLoginSuccess = (profile, isNew = false) => {
        setAuthOrg(profile);
        setCurrentOrg(profile.id);
        setUserRole(profile.role || 'admin');
        if (isNew) {
            offlineDb.insertOrg(profile);
            showToast(`🎉 Organization Registered: ${profile.name} (${profile.city})`);
        } else {
            showToast(`✓ Session Authorized: ${profile.adminName} (${profile.name})`);
        }
        fetchOpenMeteoRealTimeData(profile.lat, profile.lon);
        setDbRecordCount(offlineDb.getDatabaseStats().totalRecords);
    };

    // Toggle Simulated Offline Mode for offline SQLite testing
    const handleToggleOfflineMode = () => {
        const next = !isSimulatedOffline;
        setIsSimulatedOffline(next);
        if (next) {
            showToast('🟠 OFFLINE MODE: Network disabled. Reading/writing SQLite local store.');
        } else {
            showToast('🟢 ONLINE MODE: Telemetry re-connected to live APIs.');
        }
    };

    // Fetch live backend data
    const fetchBackendData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/facility/internal-reports?facilityId=${currentOrg}`).catch(() => null);
            if (res && res.data && res.data.length > 0) {
                setInternalReports(res.data);
            }
            const binRes = await axios.get(`${API_BASE}/bins?facilityId=${currentOrg}`).catch(() => null);
            if (binRes && binRes.data && binRes.data.length > 0) {
                const extBin = binRes.data.find(b => b.name?.includes('Exterior') || b.binCode === 'BIN-04');
                if (extBin) {
                    setExteriorBinFill(extBin.currentFillPct);
                    setExteriorBinStatus(extBin.currentFillPct <= 10 ? 'CLEAN & EMPTIED' : 'DISPATCHED TO MUNICIPALITY');
                }
            }
        } catch (e) {
            // Local simulation fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackendData();
    }, [currentOrg]);

    // 1-Click Alert Warden
    const handleAlertWarden = async () => {
        setWardenAlertStatus('Escalated to Warden (Push Notification Sent)');
        showToast('⚡ Push alert dispatched to Hostel Warden! Alert logged for on-ground inspection.');
        try {
            await axios.post(`${API_BASE}/facility/alert-warden`, {
                facilityId: currentOrg,
                floor: 'Floor-4',
                message: 'Hostel Floor-4 class-hour surge detected (29.8 kW). Inspect rooms immediately.'
            });
        } catch (e) {}
    };

    // Warden Resolves Alert
    const handleResolveWardenAlert = async () => {
        setIsWardenResolved(true);
        setFloor4Power(12.8);
        setWardenAlertStatus('Resolved by Warden');
        showToast('✅ Incident Resolved! Floor 4 draw normalized from 29.8 kW to 12.8 kW baseline.');
        try {
            await axios.put(`${API_BASE}/actions/alerts/6704b1e5a1b2c3d4e5f67890`, {
                status: 'resolved',
                wardenNotes
            }).catch(() => null);
        } catch (e) {}
    };

    // Trigger Hourly Camera Cycle
    const handleTriggerCameraCycle = async () => {
        setCameraSnapshot({
            fillPct: 88,
            isHeavy: true,
            img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        showToast('📸 Hourly Camera Cycle Complete! YOLOv8 CV detected heavy scrap overflow and alerted management.');
        try {
            await axios.post(`${API_BASE}/facility/camera/snapshot`, {
                facilityId: currentOrg,
                forceHeavyWaste: true
            }).catch(() => null);
        } catch (e) {}
    };

    // Internal Student Report Submission
    const handleReportSubmit = async (e) => {
        e.preventDefault();
        const newRpt = {
            _id: `RPT-${Math.floor(100 + Math.random() * 900)}`,
            ...reportForm,
            status: 'pending'
        };
        setInternalReports([newRpt, ...internalReports]);
        setShowReportModal(false);
        showToast('✅ Campus waste report submitted! Routed to Facility Management.');
        try {
            await axios.post(`${API_BASE}/facility/internal-reports`, {
                facilityId: currentOrg,
                ...reportForm
            }).catch(() => null);
        } catch (e) {}
    };

    // Assign Janitor to Internal Report
    const handleAssignJanitor = async (id) => {
        setInternalReports(internalReports.map(r => r._id === id ? { ...r, status: 'assigned_to_janitor', assignedJanitorName: 'Janitor Raghu Behera' } : r));
        showToast('🧹 Janitor Raghu Behera assigned to collect campus waste.');
        try {
            await axios.put(`${API_BASE}/facility/internal-reports/${id}/status`, {
                status: 'assigned_to_janitor',
                assignedJanitorName: 'Janitor Raghu Behera'
            }).catch(() => null);
        } catch (e) {}
    };

    // Janitor Dumps Campus Waste into Main Exterior Dump Bin
    const handleDumpToExteriorBin = async (id) => {
        setInternalReports(internalReports.map(r => r._id === id ? { ...r, status: 'collected_to_main_bin' } : r));
        const newFill = Math.min(100, exteriorBinFill + 6);
        setExteriorBinFill(newFill);
        if (newFill >= 80) {
            setExteriorBinStatus('DISPATCHED TO MUNICIPALITY');
        }
        showToast(`✅ Waste cleaned and dumped into Exterior Container (now ${newFill}% full)!`);
        try {
            await axios.put(`${API_BASE}/facility/internal-reports/${id}/status`, {
                status: 'collected_to_main_bin'
            }).catch(() => null);
        } catch (e) {}
    };

    // 24h Multi-Floor Power Load Series (Class Hours Surge vs Normal)
    const powerHourlySeries = [
        { hour: '00:00', floor1: 14.2, floor2: 12.1, floor3: 15.0, floor4: 12.0 },
        { hour: '02:00', floor1: 12.0, floor2: 10.5, floor3: 13.2, floor4: 11.2 },
        { hour: '04:00', floor1: 11.8, floor2: 10.0, floor3: 12.8, floor4: 10.8 },
        { hour: '06:00', floor1: 16.5, floor2: 14.8, floor3: 17.0, floor4: 14.5 },
        { hour: '08:00', floor1: 22.4, floor2: 19.5, floor3: 21.8, floor4: 18.2 },
        { hour: '10:00', floor1: 15.0, floor2: 13.5, floor3: 16.0, floor4: isWardenResolved ? 12.4 : 29.8 },
        { hour: '12:00', floor1: 15.5, floor2: 14.0, floor3: 16.2, floor4: isWardenResolved ? 12.8 : 30.4 },
        { hour: '14:00', floor1: 14.8, floor2: 13.2, floor3: 15.8, floor4: isWardenResolved ? 12.2 : 29.5 },
        { hour: '16:00', floor1: 15.2, floor2: 13.8, floor3: 16.4, floor4: isWardenResolved ? 12.9 : 28.9 },
        { hour: '18:00', floor1: 24.1, floor2: 21.4, floor3: 25.0, floor4: 21.0 },
        { hour: '20:00', floor1: 26.8, floor2: 23.2, floor3: 27.4, floor4: 22.8 },
        { hour: '22:00', floor1: 18.5, floor2: 16.0, floor3: 19.2, floor4: 16.4 }
    ];

    // 24h Overhead Water Tank A Telemetry Series (01:00-04:00 Night Leak)
    const waterHourlySeries = [
        { hour: '00:00', tankLevel: 72.0, flowLpm: 0.05 },
        { hour: '01:00', tankLevel: 70.8, flowLpm: 1.25 }, // Leak starts
        { hour: '02:00', tankLevel: 69.5, flowLpm: 1.28 },
        { hour: '03:00', tankLevel: 68.2, flowLpm: 1.25 }, // Ongoing leak
        { hour: '04:00', tankLevel: 67.0, flowLpm: 1.24 },
        { hour: '05:00', tankLevel: 66.0, flowLpm: 0.10 },
        { hour: '06:00', tankLevel: 64.0, flowLpm: 3.80 }, // Morning rush
        { hour: '08:00', tankLevel: 58.0, flowLpm: 4.20 },
        { hour: '10:00', tankLevel: 75.0, flowLpm: 0.20 }, // Pump refilled
        { hour: '12:00', tankLevel: 72.0, flowLpm: 1.10 },
        { hour: '16:00', tankLevel: 68.0, flowLpm: 0.80 },
        { hour: '20:00', tankLevel: 74.0, flowLpm: 2.90 }
    ];

    // Campus Energy Breakdown Mix
    const campusEnergyMix = [
        { name: 'Hostel Rooms (Lighting & Coolers)', value: 38, color: '#f59e0b' },
        { name: 'Labs & Computing Workshops', value: 24, color: '#38bdf8' },
        { name: 'Mess & Commercial Kitchen', value: 16, color: '#10b981' },
        { name: 'Water Pumping & Utilities', value: 12, color: '#ec4899' },
        { name: 'Common Street & Perimeter Lighting', value: 10, color: '#8b5cf6' }
    ];

    // Scenario Calculations
    const simEnergyKwh = Math.round(45000 * 0.40 * (simPowerCut / 100));
    const simPowerRupees = Math.round(simEnergyKwh * 7.50);
    const simWaterKl = simFixLeaks ? 54 : 0;
    const simWaterRupees = simWaterKl * 18;
    const simWasteRupees = simOptimizeWaste ? 6500 : 0;
    const simTotalMonthlyRupees = simPowerRupees + simWaterRupees + simWasteRupees;
    const simCo2Kg = Math.round(simEnergyKwh * 0.71 + (simOptimizeWaste ? 85 : 0));

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            {/* 1. TOP APEX HEADER */}
            <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
                <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
                    {/* Brand & Authenticated Organization Profile */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-base sm:text-lg text-white tracking-tight">{authOrg.name}</span>
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                                    {authOrg.typeName || 'FacilityOS'}
                                </span>
                                {isSimulatedOffline ? (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold animate-pulse">
                                        💽 SQLite Offline
                                    </span>
                                ) : (
                                    <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full hidden sm:inline-block">
                                        Live Sensors Synced
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                                Institutional FacilityOS • Identity: <strong className="text-slate-300">{authOrg.adminName}</strong> ({authOrg.adminEmail})
                            </p>
                        </div>
                    </div>

                    {/* Dynamic Geocoded Location & Live Sensors Telemetry */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Dynamic Location Badge (Click to Change City / GPS) */}
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="flex items-center gap-1.5 bg-slate-950/90 hover:bg-slate-850 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-mono transition-all text-slate-200 shadow-sm"
                            title="Click to change registered city or auto-detect device GPS"
                        >
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-bold">{authOrg.city}, {authOrg.state}</span>
                            <span className="text-[10px] text-slate-400 hidden xl:inline">({authOrg.lat.toFixed(2)}°N, {authOrg.lon.toFixed(2)}°E)</span>
                        </button>

                        {/* Real-Time Ambient Sensors Widget */}
                        <div className="hidden md:flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
                            <div className="flex items-center gap-1 text-slate-200">
                                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                                <span>{ambientData.temperature}°C</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-300">
                                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{ambientData.windSpeed} km/h</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400">AQI:</span>
                                <span className="font-bold px-1.5 py-0.2 rounded" style={{ backgroundColor: `${ambientData.aqiColor}22`, color: ambientData.aqiColor }}>
                                    {ambientData.pm25} µg/m³ ({ambientData.aqiBand})
                                </span>
                            </div>
                        </div>

                        {/* SQLite Local Storage Monitor Button */}
                        <button
                            onClick={() => setShowSqliteModal(true)}
                            className={`flex items-center gap-1.5 border rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition-all shadow-sm ${
                                isSimulatedOffline
                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                    : 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25'
                            }`}
                            title="Open SQLite Local-First Database & Offline Controls"
                        >
                            <Database className="w-3.5 h-3.5 text-purple-400" />
                            <span className="hidden sm:inline">SQLite: {dbRecordCount} rows</span>
                            <span className="sm:hidden">DB</span>
                            <span className={`w-2 h-2 rounded-full ${isSimulatedOffline ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                        </button>

                        {/* Identity & Session Button */}
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition-all shadow-sm"
                            title="Institutional Identity & Authorization"
                        >
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Switch Org / Auth</span>
                            <span className="sm:hidden">Auth</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. PRIMARY NAVIGATION & SUB-CATEGORY BAR */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 sticky top-[65px] z-40 backdrop-blur-md space-y-2">
                <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
                    {/* Primary Categories Adapted to Facility Type */}
                    <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold pb-1 sm:pb-0">
                        {[
                            {
                                id: 'scada',
                                label: authOrg.type === 'hospital' ? '⚡ ICU & Medical Substation SCADA' :
                                       authOrg.type === 'industry' ? '⚡ Smelter & Heavy Induction SCADA' :
                                       authOrg.type === 'school' ? '⚡ Classrooms & Labs SCADA' :
                                       '⚡ Resource SCADA (Power & Water)',
                                icon: Zap
                            },
                            {
                                id: 'waste',
                                label: authOrg.type === 'hospital' ? '🗑️ Biomedical Waste & Infection Protocol' :
                                       authOrg.type === 'industry' ? '🗑️ Hazardous Scrap & ETP Protocol' :
                                       authOrg.type === 'school' ? '🗑️ Cafeteria Food & Paper Recycling' :
                                       '🗑️ Campus Waste & Camera AI',
                                icon: Trash2
                            },
                            {
                                id: 'warden',
                                label: authOrg.type === 'hospital' ? '🩺 Hospital Superintendent Cockpit (390px)' :
                                       authOrg.type === 'industry' ? '👷‍♂️ Safety Officer Cockpit (390px)' :
                                       authOrg.type === 'school' ? '🏫 Principal Incident Cockpit (390px)' :
                                       '👮‍♂️ Hostel Warden Cockpit (390px)',
                                icon: ShieldAlert,
                                badge: isWardenResolved ? 'Resolved' : '1 Surge Alert'
                            },
                            { id: 'sustainability', label: '🌱 Sustainability & Analytics', icon: Award }
                        ].map((cat) => {
                            const Icon = cat.icon;
                            const active = mainCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => handleSelectCategory(cat.id)}
                                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm ${
                                        active
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-emerald-500/10'
                                            : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-slate-950/60'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{cat.label}</span>
                                    {cat.badge && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isWardenResolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'}`}>
                                            {cat.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Action: Internal Campus Waste Report */}
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition-all shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>📸 Submit Campus Report</span>
                    </button>
                </div>

                {/* Sub-Category Pills for SCADA */}
                {mainCategory === 'scada' && (
                    <div className="max-w-[1600px] mx-auto flex items-center gap-2 pt-1 border-t border-slate-800/80 overflow-x-auto">
                        <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase shrink-0">SCADA Modules:</span>
                        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
                            {[
                                { id: 'overview', label: '📌 Facility Operations Overview' },
                                { id: 'power', label: '⚡ Hostel Multi-Floor Power SCADA (Floors 1-4)' },
                                { id: 'water', label: '💧 Water Tanks SCADA (Night Leaks)' }
                            ].map((sub) => {
                                const active = currentTab === sub.id;
                                return (
                                    <button
                                        key={sub.id}
                                        onClick={() => handleSelectSubTab(sub.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                            active
                                                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {sub.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Sub-Category Pills for Sustainability */}
                {mainCategory === 'sustainability' && (
                    <div className="max-w-[1600px] mx-auto flex items-center gap-2 pt-1 border-t border-slate-800/80 overflow-x-auto">
                        <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase shrink-0">Analytics Modules:</span>
                        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
                            {[
                                { id: 'scenarios', label: '🎛️ What-If Scenario Simulator' },
                                { id: 'scorecard', label: '🏆 Sustainability & ESG Scorecard' }
                            ].map((sub) => {
                                const active = currentTab === sub.id;
                                return (
                                    <button
                                        key={sub.id}
                                        onClick={() => handleSelectSubTab(sub.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                            active
                                                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {sub.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* TOAST ALERT */}
            {toastMsg && (
                <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono flex items-center gap-2 animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{toastMsg}</span>
                </div>
            )}

            {/* 3. MAIN CONTENT CONTAINER */}
            <main className="flex-grow max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* AUTOMATED MUNICIPAL CLEARANCE GATEWAY BANNER */}
                <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                Automated Municipal Clearance Gateway Active
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">API Webhook Synced</span>
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Internal campus waste is consolidated into the <span className="underline cursor-pointer text-amber-400 font-semibold" onClick={() => handleSelectSubTab('waste')}>Campus Exterior Dump Bin (Gate 1)</span>. When volume reaches &ge;80%, an automated pickup dispatch webhook is triggered directly with the Municipal Clearance Network.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAlertWarden}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Bell className="w-3.5 h-3.5" />
                            <span>⚡ Simulate Floor 4 Surge Alert</span>
                        </button>
                    </div>
                </div>

                {/* 3.1. POWER BI-STYLE ROLE SLICER & REGULATORY TOOLBAR */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                            <Sliders className="w-4 h-4 text-emerald-400" />
                            Role Perspective:
                        </span>
                        <button
                            onClick={() => { setUserRole('admin'); showToast('Switched to Facility Administrator Perspective'); }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                userRole === 'admin'
                                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                        >
                            <span>🏛️ Facility Administrator</span>
                        </button>
                        <button
                            onClick={() => { setUserRole('operations'); showToast('Switched to Operations & SCADA Perspective'); }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                userRole === 'operations'
                                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                        >
                            <span>⚡ Operations & SCADA Team</span>
                        </button>
                        <button
                            onClick={() => { setUserRole('sustainability'); showToast('Switched to Sustainability Officer Perspective'); }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                userRole === 'sustainability'
                                    ? 'bg-teal-500 text-slate-950 shadow-teal-500/20'
                                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                        >
                            <span>🌿 Sustainability Officer</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-300">
                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ML Backtest: <strong className="text-emerald-400">MAPE 4.82%</strong> (vs Naive 15.34%)</span>
                        </div>
                        <button
                            onClick={() => setShowAssumptionsModal(true)}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>📘 Model Assumptions & Tariffs</span>
                        </button>
                    </div>
                </div>

                {/* 3.2. GENAI EXECUTIVE FACILITY COPILOT (DECISION SUPPORT SYNTHESIS) */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                                <Sparkles className={`w-5 h-5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-white tracking-tight">GenAI Facility Copilot (Decision Support Synthesis)</h3>
                                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                                        NLP Insight Engine
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-mono">
                                    Plain-language decision recommendations synthesized for: <strong className="text-emerald-400 capitalize">{userRole.replace('_', ' ')}</strong>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleResynthesizeAi}
                            disabled={isGeneratingAi}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin text-emerald-400' : ''}`} />
                            <span>{isGeneratingAi ? 'Synthesizing...' : '⚡ Re-Synthesize Insights'}</span>
                        </button>
                    </div>

                    {/* 4 Categorized Synthesis Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* Energy Advisory */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition-all">
                            <div className="flex items-center justify-between text-amber-400 font-mono font-bold">
                                <span className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" /> Energy Optimization
                                </span>
                                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">
                                    {isWardenResolved ? 'NORMAL' : 'SURGE'}
                                </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-sans">
                                {userRole === 'admin' && (
                                    <>Hostel Floor-4 draw ({floor4Power} kW) during mandatory class hours incurs ₹7,200/mo avoidable tariff. Escalation logged to Warden.</>
                                )}
                                {userRole === 'operations' && (
                                    <>Live bus {streamVolts}V, 50.02 Hz. Floor-4 load is +140% above class median. Recommend timer shutoff on sub-breakers 09:30-16:30.</>
                                )}
                                {userRole === 'sustainability' && (
                                    <>Eliminating daytime hostel surge curtails 4,170 kWh/mo, averting 2.96 Tons Scope 2 CO₂e (CEA factor: 0.71 kg CO₂e/kWh).</>
                                )}
                            </p>
                        </div>

                        {/* Water Advisory */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-cyan-500/40 transition-all">
                            <div className="flex items-center justify-between text-cyan-400 font-mono font-bold">
                                <span className="flex items-center gap-1.5">
                                    <Droplet className="w-3.5 h-3.5" /> Hydraulic Integrity
                                </span>
                                <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded">
                                    {isPlumberDispatched ? 'INSPECTION' : 'NIGHT LEAK'}
                                </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-sans">
                                {userRole === 'admin' && (
                                    <>Tank A continuous 1.25 L/min drop (01:00-04:00 AM) represents 54 kL/mo potable water loss (₹972/mo tariff). Plumber dispatched.</>
                                )}
                                {userRole === 'operations' && (
                                    <>Constant 1.25 L/min outflow during zero occupancy indicates float valve weepage in Hostel Block A ground level toilets.</>
                                )}
                                {userRole === 'sustainability' && (
                                    <>Repairing 54 kL monthly leakage conserves groundwater pumping energy and raises facility water circularity rating by +3.2%.</>
                                )}
                            </p>
                        </div>

                        {/* Waste Advisory */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-emerald-500/40 transition-all">
                            <div className="flex items-center justify-between text-emerald-400 font-mono font-bold">
                                <span className="flex items-center gap-1.5">
                                    <Truck className="w-3.5 h-3.5" /> Solid Waste Logistics
                                </span>
                                <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                    {exteriorBinFill >= 80 ? 'DISPATCHED' : 'NORMAL'}
                                </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-sans">
                                {userRole === 'admin' && (
                                    <>Exterior Gate 1 container is at {exteriorBinFill}%. Auto-assigned to Municipal Collection Service via automated webhook; expected pickup ~25 mins.</>
                                )}
                                {userRole === 'operations' && (
                                    <>YOLOv8 vision camera cycle ({cameraSnapshot.time}) flagged heavy scrap build-up. Janitor Raghu Behera assigned to consolidate to Gate 1.</>
                                )}
                                {userRole === 'sustainability' && (
                                    <>Campus waste achieves 84% landfill diversion. Organic cafeteria fraction diverted to aerobic on-campus composting pit.</>
                                )}
                            </p>
                        </div>

                        {/* Ambient Safety Advisory */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-purple-500/40 transition-all">
                            <div className="flex items-center justify-between text-purple-400 font-mono font-bold">
                                <span className="flex items-center gap-1.5">
                                    <Wind className="w-3.5 h-3.5" /> Ambient & Safety
                                </span>
                                <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded">
                                    {ambientData.aqiBand}
                                </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-sans">
                                {userRole === 'admin' && (
                                    <>Open-Meteo ambient PM2.5 is {ambientData.pm25} µg/m³ ({ambientData.aqiBand}). Campus air safety within permissible limits; classes normal.</>
                                )}
                                {userRole === 'operations' && (
                                    <>Ambient conditions: {ambientData.temperature}°C, {ambientData.humidity}% RH, wind {ambientData.windSpeed} km/h. Fresh air damper set to 40% intake.</>
                                )}
                                {userRole === 'sustainability' && (
                                    <>Campus tree perimeter provides natural buffer, reducing particulate concentration by 18% compared to highway baseline.</>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Prominent Statutory & Decision-Support Notice */}
                    <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2 text-[11px] text-slate-400 font-mono">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>
                            <strong className="text-slate-300">Decision-Support Notice:</strong> All forecasts, anomaly scores, and recommendations are decision aids based on open telemetry feeds, Robust-Z MAD statistics, and scikit-learn models. Presented as operational guidance, not official regulatory measurements.
                        </span>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* VIEW: OVERVIEW                                                 */}
                {/* ============================================================== */}
                {currentTab === 'overview' && (
                    <div className="space-y-6">
                        {/* 4 TOP KPI CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Power KPI */}
                            <div onClick={() => handleSelectSubTab('power')} className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl cursor-pointer transition-all shadow-md">
                                <div className="flex justify-between text-slate-400 text-xs font-mono uppercase mb-2">
                                    <span>⚡ Multi-Floor Power Load</span>
                                    <Zap className="w-4 h-4 text-amber-400" />
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-bold font-mono text-white">{isWardenResolved ? '57.2' : '74.2'} <small className="text-xs text-slate-400">kW</small></span>
                                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${isWardenResolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>
                                        {isWardenResolved ? 'NORMALIZED' : '+38% SURGE'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-amber-300/80 mt-2 font-mono">
                                    Floor 4 draw: {floor4Power} kW ({isWardenResolved ? 'Resolved by Warden' : 'Class-Hour Surge'})
                                </p>
                            </div>

                            {/* Water KPI */}
                            <div onClick={() => handleSelectSubTab('water')} className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-4 rounded-xl cursor-pointer transition-all shadow-md">
                                <div className="flex justify-between text-slate-400 text-xs font-mono uppercase mb-2">
                                    <span>💧 Overhead Water Tank A</span>
                                    <Droplet className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-bold font-mono text-white">{tankALevel}% <small className="text-xs text-slate-400">(6,820 L)</small></span>
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                        NIGHT LEAK ACTIVE
                                    </span>
                                </div>
                                <p className="text-[11px] text-cyan-300/80 mt-2 font-mono">
                                    -1.25 L/min continuous drop (01:00-04:00 AM)
                                </p>
                            </div>

                            {/* Live Ambient Weather KPI */}
                            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                                <div className="flex justify-between text-slate-400 text-xs font-mono uppercase mb-2">
                                    <span>🌤️ Live Ambient Station (Free API)</span>
                                    <Wind className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-bold font-mono text-white">{ambientData.temperature}°C <small className="text-xs text-slate-400">({ambientData.humidity}% RH)</small></span>
                                    <span className="text-xs font-mono px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${ambientData.aqiColor}22`, color: ambientData.aqiColor }}>
                                        AQI {ambientData.pm25}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                                    Open-Meteo Real-Time: Rourkela ({ambientData.lastUpdated})
                                </p>
                            </div>

                            {/* Exterior Dump Bin KPI */}
                            <div onClick={() => handleSelectSubTab('waste')} className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-xl cursor-pointer transition-all shadow-md">
                                <div className="flex justify-between text-slate-400 text-xs font-mono uppercase mb-2">
                                    <span>🚛 Campus Exterior Dump Bin</span>
                                    <Truck className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-bold font-mono text-white">{exteriorBinFill}% <small className="text-xs text-slate-400">Full</small></span>
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                                        {exteriorBinFill >= 80 ? 'DISPATCHED' : 'NORMAL'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-emerald-300/80 mt-2 font-mono">
                                    Municipal Clearance: Auto-Scheduled at ≥80%
                                </p>
                            </div>
                        </div>

                        {/* PRIORITY INCIDENT CARD: FLOOR 4 SURGE -> ALERT WARDEN */}
                        <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 p-5 rounded-2xl space-y-3 shadow-xl">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs px-2 py-0.5 rounded font-mono font-bold">P1 CRITICAL ANOMALY</span>
                                        <h3 className="text-base font-bold text-white">Hostel Block A — Floor 4 High Power Surge during Class Hours</h3>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        Sensor draw is <strong>{floor4Power} kW</strong> during mandatory lecture schedule (09:30–16:30) vs <strong>12.4 kW</strong> baseline. Rooms 402–418 detected with unattended high-wattage loads.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                                        <span>💸 Financial Loss: <strong className="text-red-400">₹288 / afternoon (₹7,200/mo)</strong></span>
                                        <span>•</span>
                                        <span>🌱 Carbon Waste: <strong className="text-amber-400">27.2 kg CO₂e</strong></span>
                                        <span>•</span>
                                        <span>📊 Statistical Z-Score: <strong className="text-purple-400">+4.1 (MAD Outlier)</strong></span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full lg:w-auto">
                                    <button
                                        onClick={handleAlertWarden}
                                        className="flex-1 lg:flex-initial bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                                    >
                                        <Bell className="w-4 h-4" />
                                        <span>⚡ 1-Click Alert Warden</span>
                                    </button>
                                    <button
                                        onClick={() => handleSelectSubTab('warden')}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>Open Warden View</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* VISUALIZATION SECTION: 24H POWER SCADA CURVE + ENERGY MIX DONUT */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* 24H Power Curve Chart (2 Cols) */}
                            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-400" /> 24-Hour Multi-Floor Power SCADA Load Profile
                                        </h4>
                                        <p className="text-xs text-slate-400 font-mono">Class Hours Shading (09:30 - 16:30) highlighting Floor 4 Anomaly Spike</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-mono">
                                        <span className="flex items-center gap-1.5 text-red-400">
                                            <span className="w-3 h-3 rounded-full bg-red-500"></span> Floor 4 (Surge)
                                        </span>
                                        <span className="flex items-center gap-1.5 text-amber-400">
                                            <span className="w-3 h-3 rounded-full bg-amber-500"></span> Floor 3
                                        </span>
                                        <span className="flex items-center gap-1.5 text-cyan-400">
                                            <span className="w-3 h-3 rounded-full bg-cyan-400"></span> Floor 1 & 2
                                        </span>
                                    </div>
                                </div>

                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={powerHourlySeries}>
                                            <defs>
                                                <linearGradient id="floor4Grad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                                                </linearGradient>
                                                <linearGradient id="floor1Grad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                                            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" kW" />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                                            <Area type="monotone" dataKey="floor4" name="Floor 4 (Surge Meter)" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#floor4Grad)" />
                                            <Area type="monotone" dataKey="floor3" name="Floor 3 (Standard)" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
                                            <Area type="monotone" dataKey="floor1" name="Floor 1 (Mess Baseline)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#floor1Grad)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Campus Energy Breakdown Donut (1 Col) */}
                            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-emerald-400" /> Campus Energy End-Use Distribution
                                    </h4>
                                    <p className="text-xs text-slate-400 font-mono">Peak consumption breakdown across facilities</p>
                                </div>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={campusEnergyMix} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                                {campusEnergyMix.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-1.5 text-[11px] font-mono">
                                    {campusEnergyMix.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-slate-300">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                                {item.name}
                                            </span>
                                            <strong className="text-white">{item.value}%</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* TWO-COLUMN GRID: HOURLY CAMERA AI + CAMPUS EXTERIOR DUMP BIN */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Hourly Camera Dump Monitor */}
                            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Hourly Central Dump Camera (YOLOv8 AI)</h4>
                                            <p className="text-[11px] text-slate-400 font-mono">Simulated 1-Hour Automatic Snapshot Cycle</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleTriggerCameraCycle}
                                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Run 1-Hr Snapshot Cycle</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video">
                                        <img src={cameraSnapshot.img} alt="Camera Snapshot" className="w-full h-full object-cover" />
                                        <span className="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                                            {cameraSnapshot.fillPct}% OVERFLOW DETECTED
                                        </span>
                                        <span className="absolute bottom-2 left-2 bg-slate-950/80 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                                            CAM-01 | {cameraSnapshot.time}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-xs font-mono">
                                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                                            <div className="flex justify-between"><span className="text-slate-400">CV Fill Estimate:</span> <strong className="text-red-400">{cameraSnapshot.fillPct}% Full</strong></div>
                                            <div className="flex justify-between"><span className="text-slate-400">Heavy Scrap Flag:</span> <strong className="text-amber-400">POSITIVE</strong></div>
                                            <div className="flex justify-between"><span className="text-slate-400">Confidence:</span> <strong className="text-emerald-400">93.4%</strong></div>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-sans">
                                            Heavy corrugated scrap & organic bags detected. Notified campus janitorial staff to consolidate into exterior container.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Campus Main Exterior Dump Bin & Municipal Bridge */}
                            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Campus Main Exterior Dump Bin (Gate 1)</h4>
                                            <p className="text-[11px] text-slate-400 font-mono">Consolidated Waste Ready for Municipal Pickup</p>
                                        </div>
                                    </div>
                                    <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                                        {exteriorBinFill}% CRITICAL OVERFLOW
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs font-mono mb-1">
                                            <span className="text-slate-400">Exterior Container Level:</span>
                                            <strong className="text-red-400 font-bold">{exteriorBinFill}% (2.2 Tons)</strong>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${exteriorBinFill}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Auto-Dispatch Alert Card */}
                                    <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/30 space-y-1.5 text-xs font-mono">
                                        <div className="flex justify-between text-blue-300 font-bold">
                                            <span>🚛 Auto-Dispatched to Municipal Fleet Network</span>
                                            <span className="text-[10px]">REQ-BPUT-04</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                                            <div>Driver: <strong className="text-emerald-400">Ramesh Kumar</strong></div>
                                            <div>Vehicle: <strong>Tata Ace (1.4 km away)</strong></div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-sans pt-1">
                                            When municipal driver clears this container with geo-tagged verification, bin telemetry automatically resets to 6% (Clean).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* VIEW: POWER SCADA                                              */}
                {/* ============================================================== */}
                {currentTab === 'power' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-400" /> Multi-Floor Smart Energy SCADA (Hostel Meters)
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono">Real-time floor-level metering with Class-Hour Schedule Intelligence</p>
                                </div>
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded font-mono">
                                    Class Hours: 09:30 - 16:30 (Low Expected Draw)
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                                    <div className="flex justify-between text-slate-400"><span>FLOOR 1 (MESS & LOBBY)</span><span className="text-emerald-400">NORMAL</span></div>
                                    <h4 className="text-xl font-bold text-white">14.2 kW</h4>
                                    <span className="text-slate-500 block">Baseline: 15.0 kW • ₹106/hr</span>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                                    <div className="flex justify-between text-slate-400"><span>FLOOR 2 (ROOMS 101-130)</span><span className="text-emerald-400">NORMAL</span></div>
                                    <h4 className="text-xl font-bold text-white">13.8 kW</h4>
                                    <span className="text-slate-500 block">Baseline: 13.0 kW • ₹103/hr</span>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                                    <div className="flex justify-between text-slate-400"><span>FLOOR 3 (ROOMS 201-230)</span><span className="text-emerald-400">NORMAL</span></div>
                                    <h4 className="text-xl font-bold text-white">16.4 kW</h4>
                                    <span className="text-slate-500 block">Baseline: 14.5 kW • ₹123/hr</span>
                                </div>
                                <div className={`p-4 rounded-xl border space-y-1 text-xs font-mono ${isWardenResolved ? 'bg-slate-950 border-slate-800' : 'bg-red-950/20 border-red-500/50'}`}>
                                    <div className="flex justify-between text-red-400">
                                        <span>FLOOR 4 (ROOMS 301-330)</span>
                                        <span className="font-bold">{isWardenResolved ? 'RESOLVED' : 'SURGE ANOMALY'}</span>
                                    </div>
                                    <h4 className={`text-xl font-bold ${isWardenResolved ? 'text-white' : 'text-red-400'}`}>{floor4Power} kW</h4>
                                    <span className={isWardenResolved ? 'text-slate-500 block' : 'text-red-300 block'}>
                                        {isWardenResolved ? 'Draw returned to normal' : 'Expected: 12.4 kW (+₹130 wasted/hr)'}
                                    </span>
                                </div>
                            </div>

                            {/* Detailed Power Chart */}
                            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <h4 className="text-xs font-mono text-slate-300 font-bold mb-3">24-Hour Load Telemetry & Surge Detection Profile</h4>
                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={powerHourlySeries}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                                            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" kW" />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                                            <Area type="monotone" dataKey="floor4" name="Floor 4 Surge" stroke="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.2} />
                                            <Area type="monotone" dataKey="floor3" name="Floor 3 Load" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
                                            <Area type="monotone" dataKey="floor1" name="Floor 1 Baseline" stroke="#06b6d4" strokeWidth={2} fillOpacity={0} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                <div className="text-xs">
                                    <strong className="text-white block">Action: Send Instant Mobile Alert to Hostel Warden</strong>
                                    <span className="text-slate-400">Alerts Mr. Manoj Dash for on-ground inspection of Floor 4 rooms.</span>
                                </div>
                                <button
                                    onClick={handleAlertWarden}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                                >
                                    <Bell className="w-4 h-4" /> 1-Click Alert Warden
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* VIEW: WATER SCADA                                              */}
                {/* ============================================================== */}
                {currentTab === 'water' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Tank A with night leak */}
                            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Droplet className="w-4 h-4 text-cyan-400" /> Overhead Hostel Tank A (10,000 Liters)
                                        </h4>
                                        <p className="text-xs text-slate-400 font-mono">Ultrasonic Level Sensor + SCADA Flow Meter</p>
                                    </div>
                                    <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs px-2.5 py-0.5 rounded font-mono">
                                        NIGHT LEAK DETECTED
                                    </span>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-40 bg-slate-950 rounded-2xl border-2 border-slate-700 relative overflow-hidden flex flex-col justify-end p-1">
                                        <div
                                            className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-xl transition-all duration-700"
                                            style={{ height: `${tankALevel}%` }}
                                        ></div>
                                        <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm text-white drop-shadow">
                                            {tankALevel}%
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs font-mono flex-1">
                                        <div className="flex justify-between border-b border-slate-800 pb-1">
                                            <span className="text-slate-400">Current Volume:</span>
                                            <strong className="text-white">6,820 / 10,000 L</strong>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-1">
                                            <span className="text-slate-400">Leak Flow Rate:</span>
                                            <strong className="text-red-400 font-bold">-1.25 L/min</strong>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-1">
                                            <span className="text-slate-400">Night Waste (01:00-04:00 AM):</span>
                                            <strong className="text-amber-400">1,800 Liters / night</strong>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span className="text-slate-400">Financial Impact:</span>
                                            <strong className="text-red-400">₹972 / month</strong>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsPlumberDispatched(true);
                                        showToast('🔧 Work Order Dispatched! Campus Maintenance Plumber notified to repair Tank A float valve.');
                                    }}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                                >
                                    <Wrench className="w-4 h-4" />
                                    <span>{isPlumberDispatched ? '✓ Maintenance Team En Route' : 'Dispatch Plumber to Inspect Float Valve'}</span>
                                </button>
                            </div>

                            {/* Tank B Normal Operations */}
                            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Droplet className="w-4 h-4 text-emerald-400" /> Academic Block Tank B (15,000 Liters)
                                        </h4>
                                        <p className="text-xs text-slate-400 font-mono">Ultrasonic Level Sensor + Clean Supply</p>
                                    </div>
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded font-mono">
                                        NORMAL OPERATIONS
                                    </span>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-40 bg-slate-950 rounded-2xl border-2 border-slate-700 relative overflow-hidden flex flex-col justify-end p-1">
                                        <div className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-xl transition-all duration-700" style={{ height: '82%' }}></div>
                                        <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm text-white drop-shadow">82%</span>
                                    </div>

                                    <div className="space-y-2 text-xs font-mono flex-1">
                                        <div className="flex justify-between border-b border-slate-800 pb-1">
                                            <span className="text-slate-400">Current Volume:</span>
                                            <strong className="text-white">12,300 / 15,000 L</strong>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-1">
                                            <span className="text-slate-400">Flow Rate:</span>
                                            <strong className="text-emerald-400 font-bold">0.05 L/min (Nominal)</strong>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-1">
                                            <span className="text-slate-400">Water TDS Quality:</span>
                                            <strong className="text-slate-200">182 ppm (Safe Drinking)</strong>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span className="text-slate-400">Sensor Status:</span>
                                            <strong className="text-emerald-400">✓ Healthy</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                                    <div className="flex justify-between"><span className="text-slate-400">Night Flow Rate (1-4 AM):</span> <strong className="text-emerald-400">0.02 L/min (Normal)</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Water Quality (TDS):</span> <strong className="text-slate-300">184 ppm (Safe)</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Overflow Threshold:</span> <strong className="text-slate-300">95% (Safe)</strong></div>
                                </div>
                            </div>
                        </div>

                        {/* 24h Water Telemetry Trend AreaChart */}
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                            <h4 className="text-xs font-mono text-slate-300 font-bold mb-3">24-Hour Tank A Level & Flow Anomaly Telemetry</h4>
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={waterHourlySeries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                                        <Area type="monotone" dataKey="tankLevel" name="Tank Level (%)" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* VIEW: CAMPUS WASTE & INTERNAL STUDENT REPORTS                  */}
                {/* ============================================================== */}
                {currentTab === 'waste' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Trash2 className="w-5 h-5 text-emerald-400" /> Internal Campus Waste Reports (Students & Employees)
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono">Inside campus boundary &rarr; Assigned to internal janitors &rarr; Cleaned into main exterior bin</p>
                                </div>
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Submit Report Inside Campus
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <tr>
                                            <th className="p-3">REPORTER</th>
                                            <th className="p-3">LOCATION</th>
                                            <th className="p-3">TYPE</th>
                                            <th className="p-3">STATUS</th>
                                            <th className="p-3 text-right">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {internalReports.map((r) => (
                                            <tr key={r._id} className="hover:bg-slate-950/40">
                                                <td className="p-3 text-slate-200">{r.reporterName}</td>
                                                <td className="p-3 text-slate-300">{r.locationName}</td>
                                                <td className="p-3 text-slate-400">{r.wasteType}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                                                        r.status === 'collected_to_main_bin' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        r.status === 'assigned_to_janitor' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                                                    }`}>
                                                        {r.status === 'collected_to_main_bin' ? 'Cleaned to Exterior Bin' :
                                                         r.status === 'assigned_to_janitor' ? 'Assigned: Janitor Raghu' : 'Pending Verification'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {r.status === 'pending' ? (
                                                        <button
                                                            onClick={() => handleAssignJanitor(r._id)}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                                                        >
                                                            Assign Janitor Raghu
                                                        </button>
                                                    ) : r.status === 'assigned_to_janitor' ? (
                                                        <button
                                                            onClick={() => handleDumpToExteriorBin(r._id)}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-2.5 py-1 rounded text-[11px] font-bold"
                                                        >
                                                            ✓ Dump into Exterior Bin
                                                        </button>
                                                    ) : (
                                                        <span className="text-emerald-400 text-[11px]">✓ Done</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Campus Exterior Container Card */}
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-emerald-400" /> Campus Main Exterior Dump Container (North Gate)
                                    </h4>
                                    <p className="text-xs text-slate-400 font-mono">Consolidated campus waste point linked to Municipal Dispatch Grid</p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${exteriorBinFill >= 80 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {exteriorBinFill}% CAPACITY
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${exteriorBinFill >= 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${exteriorBinFill}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* VIEW: WARDEN MOBILE COCKPIT (390px VIEW)                        */}
                {/* ============================================================== */}
                {currentTab === 'warden' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="text-center max-w-md">
                            <h3 className="text-lg font-bold text-white">👮‍♂️ Hostel Warden Mobile Cockpit</h3>
                            <p className="text-xs text-slate-400">Simulated 390px mobile view used by Warden Manoj Dash for on-duty inspection.</p>
                        </div>

                        <div className="w-[390px] bg-slate-950 rounded-[40px] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
                            {/* Phone Header */}
                            <div className="bg-slate-900 p-3 flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800">
                                <span>11:42 AM</span>
                                <div className="w-20 h-3.5 bg-black rounded-full"></div>
                                <span>5G 100%</span>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">MD</div>
                                    <div>
                                        <h5 className="font-bold text-white text-xs">Manoj Dash (Hostel Warden)</h5>
                                        <span className="text-[10px] text-slate-400">Hostel Block A • On Duty</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-xl border space-y-2 ${isWardenResolved ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-red-950/20 border-red-500/50'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-red-400 uppercase">⚡ CRITICAL SURGE ALERT</span>
                                        <span className="text-[10px] text-slate-400">Floor 4</span>
                                    </div>
                                    <h4 className="font-bold text-white text-sm">Excess Power Draw: {floor4Power} kW</h4>
                                    <p className="text-[11px] text-slate-300 font-sans">
                                        Inspection needed in rooms 402–418. Students left 3 unauthorized coolers and 1 immersion heater powered on during lecture hours.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-400 uppercase font-bold">Inspection Action Notes:</label>
                                    <textarea
                                        value={wardenNotes}
                                        onChange={(e) => setWardenNotes(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                                    ></textarea>
                                </div>

                                {!isWardenResolved ? (
                                    <button
                                        onClick={handleResolveWardenAlert}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-all text-xs"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>✓ Confirm Inspection & Resolve Surge</span>
                                    </button>
                                ) : (
                                    <div className="bg-emerald-500/20 border border-emerald-500/40 p-3 rounded-xl text-center space-y-1">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                                        <strong className="text-emerald-300 block text-xs">Surge Resolved by Warden</strong>
                                        <span className="text-[10px] text-slate-400 block">Floor 4 draw normalized to 12.8 kW.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* VIEW: WHAT-IF SCENARIO SIMULATOR                               */}
                {/* ============================================================== */}
                {currentTab === 'scenarios' && (
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-emerald-400" /> What-If Facility Scenario Simulator
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">Simulate peak power shaving, plumbing leak repair, and waste route optimization impact</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-slate-400">Peak Load Shaving (%):</span>
                                    <strong className="text-amber-400">{simPowerCut}%</strong>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="40"
                                    value={simPowerCut}
                                    onChange={(e) => setSimPowerCut(parseInt(e.target.value))}
                                    className="w-full accent-amber-500 cursor-pointer"
                                />
                                <span className="text-[10px] text-slate-500 block">Saves {simEnergyKwh} kWh / month</span>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-xs font-mono">
                                    <span className="text-slate-400">Repair Tank A Float Valve:</span>
                                    <input
                                        type="checkbox"
                                        checked={simFixLeaks}
                                        onChange={(e) => setSimFixLeaks(e.target.checked)}
                                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                    />
                                </div>
                                <span className="text-[10px] text-slate-500 block">Prevents 54,000 L of potable water loss / month</span>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-xs font-mono">
                                    <span className="text-slate-400">Enable Route Optimization:</span>
                                    <input
                                        type="checkbox"
                                        checked={simOptimizeWaste}
                                        onChange={(e) => setSimOptimizeWaste(e.target.checked)}
                                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                    />
                                </div>
                                <span className="text-[10px] text-slate-500 block">Saves ₹6,500 in diesel & hauler fees</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 text-center space-y-1">
                                <span className="text-xs text-slate-400 font-mono">ESTIMATED MONTHLY SAVINGS</span>
                                <h4 className="text-2xl font-bold font-mono text-emerald-400">₹{simTotalMonthlyRupees.toLocaleString()}</h4>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 text-center space-y-1">
                                <span className="text-xs text-slate-400 font-mono">WATER CONSERVED</span>
                                <h4 className="text-2xl font-bold font-mono text-cyan-400">{simWaterKl} kL</h4>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 text-center space-y-1">
                                <span className="text-xs text-slate-400 font-mono">CO₂e AVOIDED</span>
                                <h4 className="text-2xl font-bold font-mono text-amber-400">{simCo2Kg} kg</h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* VIEW: SUSTAINABILITY SCORECARD                                 */}
                {/* ============================================================== */}
                {currentTab === 'scorecard' && (
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-emerald-400" /> BPUT Facility Sustainability Scorecard
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">Comprehensive rating based on CEA India emission factors and resource efficiency</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                                <span className="text-xs text-slate-400 font-mono">OVERALL RATING</span>
                                <h4 className="text-3xl font-extrabold text-emerald-400">A-</h4>
                                <span className="text-[10px] text-slate-500">Top 15% in Odisha</span>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                                <span className="text-xs text-slate-400 font-mono">ENERGY INTENSITY</span>
                                <h4 className="text-2xl font-bold text-white font-mono">42.1 <small className="text-xs">kWh/m²</small></h4>
                                <span className="text-[10px] text-emerald-400">-12% vs National Benchmark</span>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                                <span className="text-xs text-slate-400 font-mono">WATER RECYCLE RATIO</span>
                                <h4 className="text-2xl font-bold text-white font-mono">68%</h4>
                                <span className="text-[10px] text-cyan-400">STP Greywater Reused</span>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                                <span className="text-xs text-slate-400 font-mono">LANDFILL DIVERSION</span>
                                <h4 className="text-2xl font-bold text-white font-mono">84%</h4>
                                <span className="text-[10px] text-emerald-400">Composted & Recycled</span>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* MODAL: SUBMIT CAMPUS INTERNAL WASTE REPORT */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h4 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-400" /> Report Campus Garbage
                            </h4>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleReportSubmit} className="space-y-3 text-xs font-mono">
                            <div>
                                <label className="block text-slate-400 mb-1">Your Name & Role</label>
                                <input
                                    type="text"
                                    required
                                    value={reportForm.reporterName}
                                    onChange={(e) => setReportForm({ ...reportForm, reporterName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1">Campus Location</label>
                                <input
                                    type="text"
                                    required
                                    value={reportForm.locationName}
                                    onChange={(e) => setReportForm({ ...reportForm, locationName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1">Waste Category</label>
                                <select
                                    value={reportForm.wasteType}
                                    onChange={(e) => setReportForm({ ...reportForm, wasteType: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                                >
                                    <option value="Dry / Plastic Waste">Dry / Plastic Waste</option>
                                    <option value="Organic Cafeteria Food">Organic Cafeteria Food</option>
                                    <option value="Paper & Packaging">Paper & Packaging</option>
                                    <option value="Lab E-Waste">Lab E-Waste</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={reportForm.description}
                                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg"
                                >
                                    Submit Campus Alert
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: REGULATORY ASSUMPTIONS & ML GROUNDING */}
            {showAssumptionsModal && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-emerald-400" />
                                    Model Assumptions, Tariffs & ML Backtesting
                                </h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                    Technical, Economic & Regulatory Grounding for BPUT Hackathon PS-4
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAssumptionsModal(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Regulatory Factor Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                            {/* CEA Factor */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-400 font-mono">⚡ CEA Grid Emission Factor</span>
                                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">CEA v19</span>
                                </div>
                                <div className="text-lg font-bold text-white font-mono">0.710 kg CO₂e / kWh</div>
                                <p className="text-slate-400 text-[11px] leading-relaxed">
                                    Official Central Electricity Authority (CEA) Baseline Carbon Database for the Indian Power Sector, Version 19 weighted average grid emission factor for Eastern Regional Grid.
                                </p>
                            </div>

                            {/* Power Tariff */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-amber-400 font-mono">💰 Institutional Electricity Tariff</span>
                                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">OERC HT</span>
                                </div>
                                <div className="text-lg font-bold text-white font-mono">₹7.50 / kWh</div>
                                <p className="text-slate-400 text-[11px] leading-relaxed">
                                    Odisha Electricity Regulatory Commission (OERC) commercial tariff schedule for High-Tension (HT) educational campuses and public institutions.
                                </p>
                            </div>

                            {/* Water Tariff */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-cyan-400 font-mono">💧 Potable Water Tariff</span>
                                    <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">PHED / RMC</span>
                                </div>
                                <div className="text-lg font-bold text-white font-mono">₹18.00 / kL (₹0.018 / L)</div>
                                <p className="text-slate-400 text-[11px] leading-relaxed">
                                    Public Health Engineering Department (PHED) & Rourkela Municipal Corporation commercial municipal bulk water supply schedule.
                                </p>
                            </div>

                            {/* Robust-Z MAD */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-purple-400 font-mono">📐 Robust-Z MAD Statistics</span>
                                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">Outlier Guard</span>
                                </div>
                                <div className="text-sm font-bold text-white font-mono">Z = 0.6745 · (x − Med) / MAD</div>
                                <p className="text-slate-400 text-[11px] leading-relaxed">
                                    Uses Median Absolute Deviation to filter IoT sensor noise. Anomalies are flagged only when |Z| &gt; 3.0, ensuring zero false alarms during normal lecture schedules.
                                </p>
                            </div>

                            {/* ML Forecaster */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-400 font-mono">🤖 Python scikit-learn GradientBoosting Backtest</span>
                                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">Backtested</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-200">
                                    <span>Holdout MAPE: <strong className="text-emerald-400">4.82%</strong></span>
                                    <span>•</span>
                                    <span>Seasonal-Naive Baseline: <span className="text-slate-400">15.34%</span></span>
                                    <span>•</span>
                                    <span>Error Reduction: <strong className="text-emerald-400">68.6%</strong></span>
                                </div>
                                <p className="text-slate-400 text-[11px] leading-relaxed">
                                    48-Hour out-of-sample holdout validation on campus power telemetry. GradientBoosting captures nonlinear thermal inertia and cyclic schedule variations far superior to standard naive forecasting.
                                </p>
                            </div>
                        </div>

                        {/* Statutory Advisory Disclaimer */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-300">
                            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-white mb-0.5">Decision-Support Advisory Notice</h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                                    Environmental, safety, and health-impact recommendations are calculated as decision-support guidance using open telemetry (Open-Meteo live API) and synthetic facility sensor feeds. They do not constitute official certified regulatory compliance measurements.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                onClick={() => setShowAssumptionsModal(false)}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
                            >
                                Close & Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUTHENTICATION & ORGANIZATION REGISTRATION MODAL */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLoginSuccess={handleLoginSuccess}
                currentOrg={authOrg.id}
            />

            {/* SQLITE LOCAL-FIRST DATABASE & OFFLINE SIMULATOR MODAL */}
            <SqliteOfflineModal
                isOpen={showSqliteModal}
                onClose={() => setShowSqliteModal(false)}
                isSimulatedOffline={isSimulatedOffline}
                onToggleOfflineMode={handleToggleOfflineMode}
            />
        </div>
    );
}
