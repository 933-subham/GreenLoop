import React, { useState, useEffect } from 'react';
import {
    Building2, Zap, Droplet, Camera, Trash2, ShieldAlert, CheckCircle2,
    AlertTriangle, RefreshCw, Plus, Bell, Wrench, Truck, Activity,
    Sliders, Award, Eye, MapPin, Wind, Thermometer,
    Clock, Check, Sparkles, BookOpen, Info, Database, User,
    LayoutDashboard, ChevronRight, Menu, Radio
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import axios from 'axios';
import AuthModal from '../components/AuthModal';
import SqliteOfflineModal from '../components/SqliteOfflineModal';
import { offlineDb } from '../services/offlineDb';
import PowerWaterMonitoring from '../components/PowerWaterMonitoring';
import DevicesAndLogsTab from '../components/DevicesAndLogsTab';
import FacilitySetupTab from '../components/FacilitySetupTab';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Sidebar nav config ───────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'overview',      label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'power_water',   label: 'Power & Water',    icon: Zap },
    { id: 'devices',       label: 'Devices & Logs',   icon: Database },
    { id: 'setup',         label: 'Facility Setup',   icon: Sliders },
    { id: 'waste',         label: 'Waste & Camera',   icon: Trash2 },
    { id: 'warden',        label: 'Incident Cockpit', icon: ShieldAlert },
    { id: 'scenarios',     label: 'Scenario Sim',     icon: Activity },
    { id: 'scorecard',     label: 'Scorecard',        icon: Award },
];

// ─── Reusable Card & KPI components ───────────────────────────────────────────
const Card = ({ children, className = '', style = {} }) => (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl ${className}`} style={style}>
        {children}
    </div>
);

const KpiCard = ({ label, sensorId, value, sub, badge, badgeColor = 'emerald', icon: Icon, iconColor = 'text-emerald-400', source, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 transition-all ${onClick ? 'cursor-pointer hover:border-slate-600' : ''}`}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">{label}</span>
                {sensorId && (
                    <span className="text-[10px] bg-slate-800 text-emerald-400 border border-slate-700 font-mono px-1.5 py-0.2 rounded font-bold">
                        {sensorId}
                    </span>
                )}
            </div>
            {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        </div>
        <div>
            <div className="text-2xl font-bold font-mono text-white leading-none">{value}</div>
            {sub && <div className="text-xs text-slate-500 mt-1 font-mono">{sub}</div>}
        </div>
        <div className="flex items-center justify-between pt-1">
            {badge && (
                <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    badgeColor === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' :
                    badgeColor === 'amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                    {badge}
                </span>
            )}
            {source && (
                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                    source === 'simulated-fault' ? 'bg-red-950/40 text-red-400 border-red-600/40' :
                    source === 'live' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40' :
                    source === 'live-sim' ? 'bg-cyan-950/40 text-cyan-300 border-cyan-600/40' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                    {source}
                </span>
            )}
        </div>
    </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
            {Icon && <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center"><Icon className="w-5 h-5 text-emerald-400" /></div>}
            <div>
                <h2 className="text-base font-bold text-white">{title}</h2>
                {subtitle && <p className="text-xs text-slate-400 font-mono">{subtitle}</p>}
            </div>
        </div>
        {action}
    </div>
);

// ─── Default normal fallback series (calibrated baseline without faults) ───────
const DEFAULT_NORMAL_POWER = [
    { h: '00', F1: 5.2, F2: 4.8, F3: 5.1, F4: 5.0, expF4: 5.0, source: 'seed' },
    { h: '02', F1: 4.9, F2: 4.6, F3: 4.8, F4: 4.7, expF4: 4.7, source: 'seed' },
    { h: '04', F1: 5.4, F2: 5.0, F3: 5.2, F4: 5.1, expF4: 5.1, source: 'seed' },
    { h: '06', F1: 13.8, F2: 12.9, F3: 13.4, F4: 13.1, expF4: 13.1, source: 'seed' },
    { h: '08', F1: 14.2, F2: 13.5, F3: 13.9, F4: 13.6, expF4: 13.6, source: 'seed' },
    { h: '10', F1: 12.0, F2: 11.5, F3: 12.1, F4: 11.8, expF4: 11.8, source: 'seed' },
    { h: '12', F1: 12.2, F2: 11.6, F3: 12.0, F4: 11.9, expF4: 11.9, source: 'seed' },
    { h: '14', F1: 11.9, F2: 11.4, F3: 11.8, F4: 11.7, expF4: 11.7, source: 'seed' },
    { h: '16', F1: 12.4, F2: 11.8, F3: 12.2, F4: 12.0, expF4: 12.0, source: 'seed' },
    { h: '18', F1: 19.5, F2: 18.8, F3: 19.4, F4: 19.1, expF4: 19.1, source: 'seed' },
    { h: '20', F1: 20.1, F2: 19.2, F3: 19.8, F4: 19.5, expF4: 19.5, source: 'seed' },
    { h: '22', F1: 12.8, F2: 12.1, F3: 12.5, F4: 12.2, expF4: 12.2, source: 'seed' },
];

const DEFAULT_NORMAL_WATER = [
    { h: '00', lvl: 84, exp: 84, flow: 0.04, source: 'seed' },
    { h: '01', lvl: 83, exp: 83, flow: 0.03, source: 'seed' },
    { h: '02', lvl: 83, exp: 83, flow: 0.02, source: 'seed' },
    { h: '03', lvl: 82, exp: 82, flow: 0.03, source: 'seed' },
    { h: '04', lvl: 82, exp: 82, flow: 0.03, source: 'seed' },
    { h: '05', lvl: 90, exp: 90, flow: 0.10, source: 'seed' }, // night refill
    { h: '06', lvl: 86, exp: 86, flow: 1.20, source: 'seed' },
    { h: '08', lvl: 76, exp: 76, flow: 1.80, source: 'seed' },
    { h: '10', lvl: 74, exp: 74, flow: 0.60, source: 'seed' },
    { h: '12', lvl: 72, exp: 72, flow: 0.50, source: 'seed' },
    { h: '16', lvl: 69, exp: 69, flow: 0.80, source: 'seed' },
    { h: '20', lvl: 75, exp: 75, flow: 1.40, source: 'seed' },
];

const TOOLTIP_STYLE = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: 11 };
const AXIS_STYLE = { fontSize: 11, fill: '#64748b' };

export default function OrgPortalApp() {
    // ── Auth / org state ──────────────────────────────────────────────────────
    const [authOrg, setAuthOrg] = useState(() => ({
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
    }));
    const [userRole, setUserRole] = useState('admin');
    const [currentTab, setCurrentTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ── UI modals ─────────────────────────────────────────────────────────────
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showSqliteModal, setShowSqliteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);

    // ── Offline / db ──────────────────────────────────────────────────────────
    const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
    const [dbRecordCount, setDbRecordCount] = useState(() => offlineDb.getDatabaseStats().totalRecords);

    // ── Live Backend Sensor State & Registry ──────────────────────────────────
    const [devices, setDevices] = useState([]);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [powerSeries, setPowerSeries] = useState(DEFAULT_NORMAL_POWER);
    const [waterSeries, setWaterSeries] = useState(DEFAULT_NORMAL_WATER);

    // Dynamic Sensor Values (Default: NORMAL)
    const [floor4Power, setFloor4Power] = useState(11.8);
    const [floor4Source, setFloor4Source] = useState('seed');
    const [tankALevel, setTankALevel] = useState(76.0);
    const [tankASource, setTankASource] = useState('seed');
    const [tankAFlow, setTankAFlow] = useState(0.03);
    const [streamVolts, setStreamVolts] = useState('230.8');

    // Incident Notes
    const [wardenNotes, setWardenNotes] = useState('Inspection completed for designated rooms.');
    const [isPlumberDispatched, setIsPlumberDispatched] = useState(false);

    // Ambient weather
    const [ambientData, setAmbientData] = useState({
        temperature: 24.5, humidity: 78, pressure: 992.4, windSpeed: 2.1,
        pm25: 58.0, pm10: 79.5, aqiBand: 'Moderate', aqiColor: '#f59e0b',
        lastUpdated: 'Fetching…', isLive: false
    });

    // Campus Waste
    const [exteriorBinFill, setExteriorBinFill] = useState(54);
    const [cameraSnapshot, setCameraSnapshot] = useState({
        fillPct: 54, isHeavy: false,
        img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
        time: '11:00 AM'
    });
    const [internalReports, setInternalReports] = useState([
        { _id: 'RPT-101', reporterName: 'Aniket Verma (Student)', locationName: 'Hostel Block A Courtyard', wasteType: 'Dry / Plastic', status: 'pending', assignedJanitorName: '' }
    ]);
    const [reportForm, setReportForm] = useState({ reporterName: '', locationName: '', wasteType: 'Dry / Plastic', description: '' });

    // Scenario sim
    const [simPowerCut, setSimPowerCut] = useState(15);
    const [simFixLeaks, setSimFixLeaks] = useState(true);
    const [simOptimizeWaste, setSimOptimizeWaste] = useState(true);

    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 4000); };

    // ── 1. Fetch Open-Meteo Weather ───────────────────────────────────────────
    const fetchWeather = async (lat = authOrg.lat, lon = authOrg.lon) => {
        if (isSimulatedOffline) return;
        try {
            const [wRes, aRes] = await Promise.all([
                axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m`),
                axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,ozone`)
            ]);
            const w = wRes.data?.current || {};
            const a = aRes.data?.current || {};
            const pm25 = a.pm2_5 || 42; const pm10 = a.pm10 || 68;
            let band = 'Good', color = '#10b981';
            if (pm25 > 120 || pm10 > 250) { band = 'Very Poor'; color = '#ef4444'; }
            else if (pm25 > 60 || pm10 > 100) { band = 'Moderate'; color = '#f59e0b'; }
            else if (pm25 > 30 || pm10 > 50) { band = 'Satisfactory'; color = '#38bdf8'; }
            const nd = { temperature: w.temperature_2m || 25, humidity: w.relative_humidity_2m || 72, pressure: w.surface_pressure || 1002, windSpeed: w.wind_speed_10m || 2, pm25, pm10, aqiBand: band, aqiColor: color, lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isLive: true };
            setAmbientData(nd);
            offlineDb.recordTelemetry({ facilityId: authOrg.id, city: authOrg.city, lat, lon, ambient: nd, powerKw: floor4Power, waterLevelPct: tankALevel });
            setDbRecordCount(offlineDb.getDatabaseStats().totalRecords);
        } catch { setAmbientData(p => ({ ...p, lastUpdated: 'Cached (Offline)', isLive: false })); }
    };

    // ── 2. Poll Real-time Devices, Alerts & Readings (Every 2.5s) ──────────────
    const pollTelemetry = async () => {
        if (isSimulatedOffline) return;
        try {
            // A. Fetch Devices
            const devRes = await axios.get(`${API_BASE}/devices`).catch(() => null);
            if (devRes && devRes.data) {
                setDevices(devRes.data);
            }

            // B. Fetch Open Alerts
            const alertRes = await axios.get(`${API_BASE}/actions/alerts?facilityId=${authOrg.id}`).catch(() => null);
            if (alertRes && Array.isArray(alertRes.data)) {
                const openAlerts = alertRes.data.filter(a => a.status === 'open');
                setActiveAlerts(openAlerts);
            }

            // C. Fetch Power Readings from GET /api/readings
            const pRes = await axios.get(`${API_BASE}/readings?type=power&limit=48`).catch(() => null);
            if (pRes && pRes.data && Array.isArray(pRes.data.readings) && pRes.data.readings.length > 0) {
                const rawP = pRes.data.readings;
                // Find latest Floor 4 reading
                const f4Readings = rawP.filter(r => r.deviceId === 'PWR-F4' || r.zone === 'Floor-4');
                if (f4Readings.length > 0) {
                    const latestF4 = f4Readings[f4Readings.length - 1];
                    const val = latestF4.kw != null ? latestF4.kw : latestF4.value;
                    setFloor4Power(val);
                    setFloor4Source(latestF4.source || 'seed');
                }

                // Construct 12-slot time-series curve
                const points = [];
                const sampleHours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
                sampleHours.forEach(h => {
                    const match = rawP.filter(r => {
                        const rdHour = new Date(r.ts || r.timestamp).getHours();
                        return String(rdHour).padStart(2, '0') === h;
                    });
                    const getKw = (id, fallback) => {
                        const m = match.find(r => r.deviceId === id || r.zoneId === id);
                        return m ? (m.kw ?? m.value) : fallback;
                    };
                    const latestPointF4 = match.find(r => r.deviceId === 'PWR-F4' || r.zone === 'Floor-4');
                    points.push({
                        h,
                        F1: getKw('PWR-F1', 12.0),
                        F2: getKw('PWR-F2', 11.5),
                        F3: getKw('PWR-F3', 12.1),
                        F4: latestPointF4 ? (latestPointF4.kw ?? latestPointF4.value) : (h === '10' ? floor4Power : 11.8),
                        expF4: latestPointF4?.expected || 11.8,
                        source: latestPointF4?.source || 'seed'
                    });
                });
                setPowerSeries(points);
            }

            // D. Fetch Water Readings from GET /api/readings
            const wRes = await axios.get(`${API_BASE}/readings?type=water&limit=36`).catch(() => null);
            if (wRes && wRes.data && Array.isArray(wRes.data.readings) && wRes.data.readings.length > 0) {
                const rawW = wRes.data.readings;
                const taReadings = rawW.filter(r => r.deviceId === 'WTR-TA' || r.zone === 'Tank-A');
                if (taReadings.length > 0) {
                    const latestTA = taReadings[taReadings.length - 1];
                    const lvl = latestTA.tank_level_pct != null ? latestTA.tank_level_pct : latestTA.value;
                    setTankALevel(lvl);
                    setTankASource(latestTA.source || 'seed');
                    setTankAFlow(latestTA.flow_lpm != null ? latestTA.flow_lpm : 0.03);
                }

                // Construct series
                const wPoints = rawW.slice(-12).map(r => {
                    const d = new Date(r.ts || r.timestamp);
                    const h = String(d.getHours()).padStart(2, '0');
                    return {
                        h,
                        lvl: r.tank_level_pct != null ? r.tank_level_pct : r.value,
                        exp: r.expected || 75,
                        flow: r.flow_lpm || 0.03,
                        source: r.source || 'seed'
                    };
                });
                if (wPoints.length >= 6) setWaterSeries(wPoints);
            }
        } catch (err) {
            // keep graceful local state
        }
    };

    useEffect(() => {
        fetchWeather(authOrg.lat, authOrg.lon);
        pollTelemetry();

        const weatherInt = setInterval(() => fetchWeather(authOrg.lat, authOrg.lon), 60000);
        const pollInt = setInterval(pollTelemetry, 2500); // 2.5s rapid poll for Postman changes
        const scadaTick = setInterval(() => {
            setStreamVolts((230 + Math.random() * 2.0).toFixed(1));
        }, 3000);

        return () => {
            clearInterval(weatherInt);
            clearInterval(pollInt);
            clearInterval(scadaTick);
        };
    }, [authOrg, isSimulatedOffline]);

    const handleLoginSuccess = (profile) => {
        setAuthOrg(profile);
        setUserRole(profile.role || 'admin');
        showToast(`✓ Session: ${profile.adminName} @ ${profile.name}`);
        fetchWeather(profile.lat, profile.lon);
    };

    // Find any active alerts for Floor 4 or Tank A
    const floor4Alert = activeAlerts.find(a => a.deviceId === 'PWR-F4' || a.zoneId === 'Floor-4' || a.zone === 'Floor-4');
    const tankAAlert = activeAlerts.find(a => a.deviceId === 'WTR-TA' || a.zoneId === 'Tank-A' || a.zone === 'Tank-A');

    // Energy breakdown mix
    const energyMix = [
        { name: 'Hostel Rooms (PWR-F1..F4)', value: 38, color: '#f59e0b' },
        { name: 'Academic Block (PWR-ACAD)', value: 24, color: '#38bdf8' },
        { name: 'Mess & Kitchen',            value: 16, color: '#10b981' },
        { name: 'Water Pumping (WTR-TA/TB)', value: 12, color: '#ec4899' },
        { name: 'Common Street Lighting',    value: 10, color: '#8b5cf6' },
    ];

    // Scenario calculations
    const simEnergy  = Math.round(45000 * 0.40 * (simPowerCut / 100));
    const simPowerRs = Math.round(simEnergy * 7.50);
    const simWaterKl = simFixLeaks ? 54 : 0;
    const simTotal   = simPowerRs + simWaterKl * 18 + (simOptimizeWaste ? 6500 : 0);
    const simCo2     = Math.round(simEnergy * 0.71 + (simOptimizeWaste ? 85 : 0));

    // ── Alert Actions ─────────────────────────────────────────────────────────
    const handleAlertWarden = () => {
        showToast('⚡ Push alert dispatched to Hostel Warden!');
        axios.post(`${API_BASE}/facility/alert-warden`, { facilityId: authOrg.id, floor: 'Floor-4', message: 'Surge verified' }).catch(() => {});
    };

    const handleResolveAlert = async (alertId) => {
        try {
            await axios.put(`${API_BASE}/actions/alerts/${alertId}`, {
                status: 'resolved',
                wardenNotes
            });
            showToast('✅ Alert marked resolved. Load normalized.');
            pollTelemetry();
        } catch (e) {
            showToast('✅ Alert resolved locally.');
            setActiveAlerts(activeAlerts.filter(a => a._id !== alertId));
        }
    };

    const handleReportSubmit = (e) => {
        e.preventDefault();
        setInternalReports(r => [{ _id: `RPT-${Math.floor(100 + Math.random() * 900)}`, ...reportForm, status: 'pending' }, ...r]);
        setShowReportModal(false);
        setReportForm({ reporterName: '', locationName: '', wasteType: 'Dry / Plastic', description: '' });
        showToast('✅ Report submitted — routed to Facility Management.');
    };

    // AI insight text per role
    const insights = {
        energy: {
            admin:          floor4Alert ? `Floor 4 (PWR-F4) draw ${floor4Power} kW is above normal. Avoidable tariff accumulating.` : `All hostel meters (PWR-F1..F4) within nominal range (median 11.8 kW). Class hours normal.`,
            operations:     floor4Alert ? `PWR-F4 draw ${floor4Power} kW. Robust-Z outlier detected. Timer shutoff recommended.` : `Bus voltage ${streamVolts}V nominal, 50.02 Hz. All 4 hostel floor sub-breakers operating within safety thresholds.`,
            sustainability: floor4Alert ? `Hostel surge curtails avoidable kWh → averting Scope 2 CO₂e.` : `Facility power efficiency factor 0.94. Daylight harvesting active across Academic Block.`,
        },
        water: {
            admin:          tankAAlert ? `Tank A (WTR-TA) leak detected. Maintenance plumber alert logged.` : `Both Tank A (WTR-TA) and Tank B (WTR-TB) operating normally. Flow rates nominal (<0.05 L/min at night).`,
            operations:     tankAAlert ? `WTR-TA continuous night outflow detected. Float valve check required.` : `No night weepage detected between 01:00-04:00 AM. Inflow/outflow mass balance balanced.`,
            sustainability: tankAAlert ? `Repairing leak prevents potable water loss.` : `Facility water recycling ratio 68%. STP greywater reused for grounds.`,
        },
        waste: {
            admin:          `Exterior Gate-1 container at ${exteriorBinFill}%. Collection scheduled with Municipal Fleet.`,
            operations:     `Central vision camera cycle (${cameraSnapshot.time}) fill estimate ${cameraSnapshot.fillPct}%. Normal campus flow.`,
            sustainability: `84% landfill diversion achieved. Organic cafeteria waste composted on-site.`,
        },
        ambient: {
            admin:          `Open-Meteo PM2.5 ${ambientData.pm25} µg/m³ (${ambientData.aqiBand}) — within permissible standards.`,
            operations:     `${ambientData.temperature}°C, ${ambientData.humidity}% RH, wind ${ambientData.windSpeed} km/h. Fresh-air damper set to 40%.`,
            sustainability: `Campus tree perimeter provides natural buffer, reducing particulate levels vs highway baseline.`,
        },
    };

    const activeNav = NAV_ITEMS.find(n => n.id === currentTab) || NAV_ITEMS[0];

    return (
        <div style={{ minHeight: '100vh', background: '#020617', color: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

            {/* ── TOP HEADER ───────────────────────────────────────────────── */}
            <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
                {/* Left: Hamburger & Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => setSidebarOpen(o => !o)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={20} />
                    </button>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={18} color="#020617" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>{authOrg.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{authOrg.typeName} · {authOrg.city}, {authOrg.state}</div>
                    </div>
                </div>

                {/* Right: Sensors & Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Live Open-Meteo strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#020617', border: '1px solid #1e293b', borderRadius: 10, padding: '5px 12px', fontSize: 11, fontFamily: 'monospace' }}>
                        <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Thermometer size={13} />{ambientData.temperature}°C
                        </span>
                        <span style={{ color: '#67e8f9', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Wind size={13} />{ambientData.windSpeed} km/h
                        </span>
                        <span style={{ fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: `${ambientData.aqiColor}22`, color: ambientData.aqiColor }}>
                            PM2.5 {ambientData.pm25} ({ambientData.aqiBand})
                        </span>
                        <span style={{ color: ambientData.isLive ? '#10b981' : '#f59e0b', fontSize: 10 }}>
                            ● {ambientData.isLive ? 'Live Station' : 'Cached'}
                        </span>
                    </div>

                    {/* SQLite Offline Monitor */}
                    <button onClick={() => setShowSqliteModal(true)} style={{ background: '#1e1b4b', border: '1px solid #4c1d95', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontFamily: 'monospace', color: '#c084fc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Database size={13} />{dbRecordCount} rows
                    </button>

                    {/* Auth profile button */}
                    <button onClick={() => setShowAuthModal(true)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontFamily: 'monospace', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} color="#10b981" />
                        {authOrg.adminName}
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ── SIDEBAR ─────────────────────────────────────────────── */}
                <aside style={{
                    width: sidebarOpen ? 220 : 64,
                    background: '#0f172a',
                    borderRight: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.2s ease',
                    overflow: 'hidden',
                    position: 'sticky',
                    top: 60,
                    height: 'calc(100vh - 60px)',
                    flexShrink: 0,
                }}>
                    {/* Role perspective selector */}
                    {sidebarOpen && (
                        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #1e293b' }}>
                            <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>View as</div>
                            {['admin', 'operations', 'sustainability'].map(r => (
                                <button key={r} onClick={() => { setUserRole(r); showToast(`Switched to ${r} perspective`); }}
                                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', marginBottom: 3, borderRadius: 6, border: 'none', fontSize: 11, fontWeight: userRole === r ? 700 : 400, cursor: 'pointer', background: userRole === r ? '#064e3b' : 'transparent', color: userRole === r ? '#34d399' : '#94a3b8', transition: 'all 0.15s' }}>
                                    {r === 'admin' ? '🏛️ Facility Admin' : r === 'operations' ? '⚡ Operations' : '🌿 Sustainability'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Nav links */}
                    <nav style={{ flex: 1, padding: '8px 0' }}>
                        {NAV_ITEMS.map(item => {
                            const Icon = item.icon;
                            const active = currentTab === item.id;
                            const hasAlert = item.id === 'warden' && activeAlerts.length > 0;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { setCurrentTab(item.id); if (window.innerWidth < 640) setSidebarOpen(false); }}
                                    title={item.label}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        width: '100%', padding: '10px 16px', border: 'none', cursor: 'pointer',
                                        background: active ? '#064e3b' : 'transparent',
                                        borderLeft: active ? '3px solid #10b981' : '3px solid transparent',
                                        color: active ? '#34d399' : '#94a3b8',
                                        fontSize: 13, fontWeight: active ? 700 : 400,
                                        transition: 'all 0.15s',
                                        whiteSpace: 'nowrap', overflow: 'hidden',
                                    }}
                                >
                                    <Icon size={17} style={{ flexShrink: 0 }} />
                                    {sidebarOpen && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                                    {sidebarOpen && hasAlert && (
                                        <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>
                                            {activeAlerts.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Sidebar footer */}
                    {sidebarOpen && (
                        <div style={{ borderTop: '1px solid #1e293b', padding: '10px 12px' }}>
                            <button onClick={() => setShowAssumptionsModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer', padding: '5px 4px' }}>
                                <BookOpen size={13} /> Model Assumptions
                            </button>
                        </div>
                    )}
                </aside>

                {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '100%' }}>

                    {/* Breadcrumb & Demo Info Notice */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                            <Building2 size={13} />
                            <span>{authOrg.name}</span>
                            <ChevronRight size={12} />
                            <span style={{ color: '#34d399', fontWeight: 600 }}>{activeNav.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', border: '1px solid #1e293b', padding: '3px 10px', borderRadius: 8 }}>
                            <Radio size={12} color="#10b981" />
                            <span>Demo uses simulated sensor data · Default: Normal pattern</span>
                        </div>
                    </div>

                    {/* ── DASHBOARD OVERVIEW ─────────────────────────────── */}
                    {currentTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* KPI Row (Shows sensor ID and live source badge) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
                                <KpiCard
                                    label="Hostel Floor 4"
                                    sensorId="PWR-F4"
                                    value={`${floor4Power.toFixed(1)} kW`}
                                    sub={`Expected: 11.8 kW · Bus ${streamVolts}V`}
                                    badge={floor4Alert ? '⚡ Anomaly Surge' : 'Normal'}
                                    badgeColor={floor4Alert ? 'red' : 'emerald'}
                                    icon={Zap}
                                    iconColor="text-amber-400"
                                    source={floor4Source}
                                    onClick={() => setCurrentTab('power')}
                                />
                                <KpiCard
                                    label="Overhead Tank A"
                                    sensorId="WTR-TA"
                                    value={`${tankALevel.toFixed(1)}%`}
                                    sub={`Flow: ${tankAFlow.toFixed(2)} L/min`}
                                    badge={tankAAlert ? 'Night Leak' : 'Normal'}
                                    badgeColor={tankAAlert ? 'red' : 'emerald'}
                                    icon={Droplet}
                                    iconColor="text-cyan-400"
                                    source={tankASource}
                                    onClick={() => setCurrentTab('water')}
                                />
                                <KpiCard
                                    label="Ambient Air (CPCB)"
                                    sensorId="OPEN-METEO"
                                    value={`${ambientData.temperature}°C`}
                                    sub={`PM2.5: ${ambientData.pm25} µg/m³`}
                                    badge={ambientData.aqiBand}
                                    badgeColor="cyan"
                                    icon={Wind}
                                    iconColor="text-cyan-400"
                                    source="live-api"
                                />
                                <KpiCard
                                    label="Campus Dump Bin"
                                    sensorId="GATE-1"
                                    value={`${exteriorBinFill}%`}
                                    sub="Auto-dispatch at ≥80%"
                                    badge={exteriorBinFill >= 80 ? 'Dispatched' : 'Normal'}
                                    badgeColor={exteriorBinFill >= 80 ? 'red' : 'emerald'}
                                    icon={Truck}
                                    iconColor="text-emerald-400"
                                    source="live-sim"
                                    onClick={() => setCurrentTab('waste')}
                                />
                            </div>

                            {/* ALERT / INCIDENT BANNER (Only renders if active faults are present!) */}
                            {activeAlerts.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {activeAlerts.map(alert => (
                                        <div key={alert._id || alert.deviceId} style={{ background: 'linear-gradient(90deg, #451a03 0%, #020617 100%)', border: '1px solid #b45309', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <span style={{ background: '#7f1d1d', color: '#fca5a5', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                                                        {alert.severity ? alert.severity.toUpperCase() : 'ANOMALY'}
                                                    </span>
                                                    <span style={{ background: '#1e293b', color: '#34d399', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                                                        {alert.zone || alert.zoneId} · {alert.deviceId}
                                                    </span>
                                                    <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{alert.title}</span>
                                                </div>
                                                <p style={{ fontSize: 12, color: '#cbd5e1' }}>
                                                    {alert.whyText || alert.why?.explanation}
                                                </p>
                                                {alert.suggestedAction && (
                                                    <p style={{ fontSize: 11, color: '#fcd34d', marginTop: 4, fontFamily: 'monospace' }}>
                                                        Action: {alert.suggestedAction}
                                                    </p>
                                                )}
                                                {alert.impact && (
                                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' }}>
                                                        Impact: {alert.impact.rupees ? `₹${alert.impact.rupees} tariff` : ''} {alert.impact.co2e_kg ? `· ${alert.impact.co2e_kg} kg CO₂e` : ''} {alert.impact.kl ? `· ${alert.impact.kl} kL water` : ''}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleResolveAlert(alert._id)} style={{ background: '#059669', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Check size={14} /> Resolve Alert
                                                </button>
                                                <button onClick={handleAlertWarden} style={{ background: 'linear-gradient(90deg,#f59e0b,#ea580c)', border: 'none', color: '#020617', fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 10, cursor: 'pointer' }}>
                                                    <Bell size={14} /> Alert Staff
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ background: '#022c22', border: '1px solid #065f46', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6ee7b7' }}>
                                        <CheckCircle2 size={16} />
                                        <span><strong>All Systems Normal:</strong> All 7 registered SCADA sensors are operating within expected baselines. No active anomalies.</span>
                                    </div>
                                    <span style={{ fontSize: 10, color: '#34d399', fontFamily: 'monospace' }}>Faults appear only when triggered via Postman</span>
                                </div>
                            )}

                            {/* GenAI Facility Copilot */}
                            <Card className="p-5">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Sparkles size={18} color="#c084fc" className={isGeneratingAi ? 'animate-spin' : ''} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>GenAI Facility Copilot (Decision Support Synthesis)</div>
                                            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>Plain-language synthesis for <span style={{ color: '#34d399' }}>{userRole}</span> perspective</div>
                                        </div>
                                    </div>
                                    <button onClick={() => { setIsGeneratingAi(true); setTimeout(() => { setIsGeneratingAi(false); showToast('✨ Insights re-synthesized across telemetry feeds!'); }, 1000); }} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', fontSize: 11, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
                                        <RefreshCw size={12} className={isGeneratingAi ? 'animate-spin' : ''} />
                                        {isGeneratingAi ? 'Synthesizing…' : 'Re-Synthesize'}
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                                    {[
                                        { key: 'energy', color: '#f59e0b', label: '⚡ Energy (PWR-F1..F4)', badge: floor4Alert ? 'SURGE' : 'NORMAL' },
                                        { key: 'water',  color: '#06b6d4', label: '💧 Water (WTR-TA/TB)',  badge: tankAAlert ? 'LEAK' : 'NORMAL' },
                                        { key: 'waste',  color: '#10b981', label: '🚛 Solid Waste (GATE-1)', badge: exteriorBinFill >= 80 ? 'DISPATCHED' : 'NORMAL' },
                                        { key: 'ambient',color: '#a855f7', label: '🌬️ Ambient Air Quality', badge: ambientData.aqiBand },
                                    ].map(({ key, color, label, badge }) => (
                                        <div key={key} style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12, padding: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ color, fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>{label}</span>
                                                <span style={{ background: `${color}22`, color, fontSize: 10, padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{badge}</span>
                                            </div>
                                            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>{insights[key][userRole]}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 14, padding: '8px 12px', background: '#020617', border: '1px solid #1e293b', borderRadius: 10, fontSize: 11, color: '#64748b', fontFamily: 'monospace', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                    <Info size={13} style={{ color: '#38bdf8', marginTop: 1, flexShrink: 0 }} />
                                    <span><strong style={{ color: '#94a3b8' }}>Decision-Support Notice:</strong> All forecasts, Robust-Z scores, and anomaly assessments are decision aids, not official regulatory measurements.</span>
                                </div>
                            </Card>

                            {/* Charts Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                                <Card className="p-5">
                                    <SectionHeader
                                        icon={Zap}
                                        title="24-Hour Multi-Floor Power Load Profile"
                                        subtitle="Hostel meters PWR-F1 to PWR-F4 vs Expected Baseline"
                                        action={
                                            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', background: '#020617', padding: '3px 8px', borderRadius: 6, border: '1px solid #1e293b' }}>
                                                Source: {floor4Source}
                                            </span>
                                        }
                                    />
                                    <div style={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={powerSeries}>
                                                <defs>
                                                    <linearGradient id="gF4" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={floor4Alert ? '#ef4444' : '#10b981'} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={floor4Alert ? '#ef4444' : '#10b981'} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                <XAxis dataKey="h" tick={AXIS_STYLE} stroke="#1e293b" />
                                                <YAxis tick={AXIS_STYLE} stroke="#1e293b" unit=" kW" />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val, name) => [`${val} kW`, name]} />
                                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                                <Area type="monotone" dataKey="F4" name="Floor 4 · PWR-F4 (Actual)" stroke={floor4Alert ? '#ef4444' : '#10b981'} strokeWidth={2.5} fill="url(#gF4)" />
                                                <Area type="monotone" dataKey="expF4" name="Floor 4 Expected Baseline" stroke="#64748b" strokeDasharray="4 4" strokeWidth={1.5} fillOpacity={0} />
                                                <Area type="monotone" dataKey="F1" name="Floor 1 · PWR-F1" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={0} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                <Card className="p-5">
                                    <SectionHeader title="Campus Energy Mix" subtitle="End-use distribution" />
                                    <div style={{ height: 180 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={energyMix} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                                                    {energyMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ marginTop: 10 }}>
                                        {energyMix.map((e, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', padding: '2px 0', fontFamily: 'monospace' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                                                    {e.name}
                                                </span>
                                                <strong style={{ color: '#f1f5f9' }}>{e.value}%</strong>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* ── DEVICE REGISTRY TABLE (Requirement 2 & 7) ─────────────── */}
                            <Card className="p-5">
                                <SectionHeader
                                    icon={Radio}
                                    title="Device & Sensor Registry"
                                    subtitle="Connected IoT Meters (GET /api/devices)"
                                    action={
                                        <button onClick={pollTelemetry} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <RefreshCw size={11} /> Refresh Devices
                                        </button>
                                    }
                                />
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
                                        <thead>
                                            <tr style={{ background: '#020617', color: '#64748b', textAlign: 'left' }}>
                                                {['Sensor ID', 'Zone / Location', 'Type', 'Last Reading Time', 'Network Status', 'Latest Reading'].map(h => (
                                                    <th key={h} style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {devices.length > 0 ? devices.map(d => (
                                                <tr key={d.deviceId} style={{ borderBottom: '1px solid #1e293b' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#34d399' }}>{d.deviceId}</td>
                                                    <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{d.zone} <small style={{ color: '#64748b' }}>({d.label})</small></td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <span style={{ textTransform: 'uppercase', fontSize: 10, color: d.type === 'power' ? '#fbbf24' : '#67e8f9', background: '#020617', padding: '2px 6px', borderRadius: 4, border: '1px solid #1e293b' }}>
                                                            {d.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                                                        {d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString() : 'Never'}
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: d.status === 'online' ? '#064e3b' : '#1e293b', color: d.status === 'online' ? '#34d399' : '#64748b' }}>
                                                            ● {d.status === 'online' ? 'Online' : 'Offline'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', color: '#fff' }}>
                                                        {d.deviceId === 'PWR-F4' ? `${floor4Power.toFixed(1)} kW` :
                                                         d.deviceId === 'WTR-TA' ? `${tankALevel.toFixed(1)}%` :
                                                         d.type === 'power' ? '12.0 kW' : '82.0%'}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                                                        Loading Device Registry… (PWR-F1..F4, PWR-ACAD, WTR-TA, WTR-TB)
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                        </div>
                    )}

                    {/* ── POWER & WATER SCADA VIEW ─────────────────────────── */}
                    {(currentTab === 'power_water' || currentTab === 'power' || currentTab === 'water') && (
                        <PowerWaterMonitoring orgId={authOrg.id} userRole={userRole} />
                    )}

                    {/* ── DEVICES & DATA LOGS VIEW ──────────────────────────── */}
                    {currentTab === 'devices' && (
                        <DevicesAndLogsTab orgId={authOrg.id} />
                    )}

                    {/* ── FACILITY SETUP VIEW ───────────────────────────────── */}
                    {currentTab === 'setup' && (
                        <FacilitySetupTab orgId={authOrg.id} userRole={userRole} />
                    )}

                    {/* ── INCIDENT COCKPIT VIEW ─────────────────────────────── */}
                    {currentTab === 'warden' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                            <div style={{ textAlign: 'center', maxWidth: 480 }}>
                                <SectionHeader
                                    icon={ShieldAlert}
                                    title={`${authOrg.type === 'hospital' ? 'Superintendent' : authOrg.type === 'industry' ? 'Safety Officer' : authOrg.type === 'school' ? 'Principal' : 'Hostel Warden'} Incident Cockpit`}
                                    subtitle="Mobile 390px on-ground operational view"
                                />
                            </div>

                            <div style={{ width: 390, background: '#020617', borderRadius: 40, border: '8px solid #1e293b', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
                                <div style={{ background: '#0f172a', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', borderBottom: '1px solid #1e293b' }}>
                                    <span>11:42 AM</span><div style={{ width: 60, height: 12, background: '#020617', borderRadius: 99 }} /><span>5G 🔋</span>
                                </div>
                                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontWeight: 700, fontSize: 13 }}>MD</div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: 12 }}>Manoj Dash – Hostel Warden</div>
                                            <div style={{ fontSize: 10, color: '#64748b' }}>Hostel Block A · On Ground</div>
                                        </div>
                                    </div>

                                    {/* Incident status */}
                                    {floor4Alert ? (
                                        <div style={{ background: '#1c0505', border: '1px solid #7f1d1d', borderRadius: 12, padding: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ color: '#f87171', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' }}>⚡ CRITICAL SURGE ALERT</span>
                                                <span style={{ color: '#34d399', fontSize: 10, fontFamily: 'monospace' }}>Floor-4 · PWR-F4</span>
                                            </div>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: 16, fontFamily: 'monospace', marginBottom: 6 }}>{floor4Power.toFixed(1)} kW (Expected: 11.8 kW)</div>
                                            <p style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5 }}>
                                                {floor4Alert.whyText || 'Surge detected during class hours.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ background: '#022c22', border: '1px solid #065f46', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                            <CheckCircle2 size={24} color="#34d399" style={{ margin: '0 auto 6px' }} />
                                            <div style={{ fontWeight: 700, color: '#34d399', fontSize: 12 }}>No Active Power Anomalies</div>
                                            <div style={{ fontSize: 10, color: '#64748b' }}>PWR-F4 operating at nominal {floor4Power.toFixed(1)} kW</div>
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Inspection Notes</label>
                                        <textarea value={wardenNotes} onChange={e => setWardenNotes(e.target.value)} rows={3}
                                            style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 8, color: '#fff', fontSize: 11, fontFamily: 'monospace', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>

                                    {floor4Alert && (
                                        <button onClick={() => handleResolveAlert(floor4Alert._id)} style={{ background: 'linear-gradient(90deg,#059669,#0891b2)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, padding: '12px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <Check size={16} /> Confirm Inspection & Resolve Surge
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── WASTE & CAMERA VIEW ───────────────────────────────── */}
                    {currentTab === 'waste' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <SectionHeader icon={Trash2} title="Campus Waste & Camera AI" subtitle="Internal reports → janitor → exterior bin GATE-1 → municipal fleet" action={
                                <button onClick={() => setShowReportModal(true)} style={{ background: '#059669', border: 'none', color: '#f1f5f9', fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Plus size={14} /> Submit Report
                                </button>
                            } />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Card className="p-5">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                        <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Camera size={15} color="#c084fc" /> Central Camera AI (CAM-01)</div>
                                        <button onClick={() => { setCameraSnapshot(p => ({ ...p, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })); showToast('📸 Camera cycle executed.'); }} style={{ background: '#581c87', border: 'none', color: '#fff', fontSize: 11, padding: '5px 10px', borderRadius: 8, cursor: 'pointer' }}>
                                            Run Cycle
                                        </button>
                                    </div>
                                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 12, aspectRatio: '16/9', background: '#020617' }}>
                                        <img src={cameraSnapshot.img} alt="Camera feed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(2,6,23,0.8)', color: '#34d399', fontSize: 10, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4, border: '1px solid #1e293b' }}>
                                            CAM-01 | {cameraSnapshot.time} · {cameraSnapshot.fillPct}% Fill
                                        </span>
                                    </div>
                                </Card>

                                <Card className="p-5">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                        <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Truck size={15} color="#34d399" /> Exterior Dump Container (GATE-1)</div>
                                        <span style={{ background: exteriorBinFill >= 80 ? '#7f1d1d' : '#064e3b', color: exteriorBinFill >= 80 ? '#fca5a5' : '#6ee7b7', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                                            {exteriorBinFill}% {exteriorBinFill >= 80 ? 'CRITICAL' : 'NORMAL'}
                                        </span>
                                    </div>
                                    <div style={{ background: '#1e293b', borderRadius: 99, height: 12, overflow: 'hidden', marginBottom: 14 }}>
                                        <div style={{ height: '100%', width: `${exteriorBinFill}%`, background: exteriorBinFill >= 80 ? '#ef4444' : '#10b981', borderRadius: 99, transition: 'width 0.5s' }} />
                                    </div>
                                    <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 10, padding: 12, fontSize: 11, fontFamily: 'monospace' }}>
                                        <div style={{ color: '#34d399', fontWeight: 700, marginBottom: 4 }}>Automated Municipal Fleet Webhook</div>
                                        <div style={{ color: '#cbd5e1' }}>When bin reaches &ge;80%, pickup request is auto-dispatched to municipal routing network.</div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* ── SCENARIOS VIEW ────────────────────────────────────── */}
                    {currentTab === 'scenarios' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <SectionHeader icon={Sliders} title="What-If Scenario Simulator" subtitle="Calculate economic & carbon impact of conservation interventions" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                                <Card className="p-5">
                                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginBottom: 12 }}>⚡ Peak Load Shaving</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 13, marginBottom: 8 }}>
                                        <span style={{ color: '#e2e8f0' }}>Reduction %</span>
                                        <strong style={{ color: '#fbbf24' }}>{simPowerCut}%</strong>
                                    </div>
                                    <input type="range" min="0" max="40" value={simPowerCut} onChange={e => setSimPowerCut(+e.target.value)} style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer', marginBottom: 6 }} />
                                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>Saves {simEnergy.toLocaleString()} kWh / month</div>
                                </Card>
                                <Card className="p-5">
                                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginBottom: 12 }}>💧 Repair Float Valves</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, color: '#e2e8f0' }}>Enable</span>
                                        <input type="checkbox" checked={simFixLeaks} onChange={e => setSimFixLeaks(e.target.checked)} style={{ cursor: 'pointer' }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>Prevents 54,000 L water loss / month</div>
                                </Card>
                                <Card className="p-5">
                                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginBottom: 12 }}>🚛 Route Optimization</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, color: '#e2e8f0' }}>Enable</span>
                                        <input type="checkbox" checked={simOptimizeWaste} onChange={e => setSimOptimizeWaste(e.target.checked)} style={{ cursor: 'pointer' }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>Saves ₹6,500 in hauler fees</div>
                                </Card>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                {[
                                    { label: 'Monthly Savings', value: `₹${simTotal.toLocaleString()}`, color: '#34d399' },
                                    { label: 'Water Conserved', value: `${simWaterKl} kL`, color: '#38bdf8' },
                                    { label: 'CO₂e Avoided', value: `${simCo2} kg`, color: '#fbbf24' },
                                ].map(({ label, value, color }) => (
                                    <Card key={label} className="p-5" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                                        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color }}>{value}</div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── SCORECARD VIEW ────────────────────────────────────── */}
                    {currentTab === 'scorecard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <SectionHeader icon={Award} title="Sustainability & ESG Scorecard" subtitle="CEA India emission factor benchmarks (v19) & resource circularity" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                                {[
                                    { label: 'Overall Rating', value: 'A−', sub: 'Top 15% in Odisha', color: '#34d399' },
                                    { label: 'Energy Intensity', value: '42.1', unit: 'kWh/m²', sub: '-12% vs National Avg', color: '#fbbf24' },
                                    { label: 'Water Recycle Ratio', value: '68%', sub: 'STP Greywater Reused', color: '#38bdf8' },
                                    { label: 'Landfill Diversion', value: '84%', sub: 'Composted & Recycled', color: '#34d399' },
                                ].map(({ label, value, unit, sub, color }) => (
                                    <Card key={label} className="p-5" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                                        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color }}>{value}{unit && <span style={{ fontSize: 12, fontWeight: 400 }}>{unit}</span>}</div>
                                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', marginTop: 6 }}>{sub}</div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* ── TOAST ─────────────────────────────────────────────────────── */}
            {toastMsg && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100, background: '#0f172a', border: '1px solid #10b981', color: '#34d399', padding: '10px 18px', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontSize: 12, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 380 }}>
                    <CheckCircle2 size={15} />
                    <span>{toastMsg}</span>
                </div>
            )}

            {/* ── MODALS ────────────────────────────────────────────────────── */}
            {showReportModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 20, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontWeight: 700, color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} color="#10b981" /> Report Campus Garbage</h3>
                            <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        </div>
                        <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[['reporterName','Your Name & Role','text'],['locationName','Campus Location','text']].map(([field, label, type]) => (
                                <div key={field}>
                                    <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginBottom: 4 }}>{label}</label>
                                    <input type={type} required value={reportForm[field]} onChange={e => setReportForm(f => ({ ...f, [field]: e.target.value }))}
                                        style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            ))}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginBottom: 4 }}>Waste Category</label>
                                <select value={reportForm.wasteType} onChange={e => setReportForm(f => ({ ...f, wasteType: e.target.value }))}
                                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none' }}>
                                    <option>Dry / Plastic</option><option>Organic Cafeteria Food</option><option>Paper & Packaging</option><option>Lab E-Waste</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginBottom: 4 }}>Description</label>
                                <textarea rows={3} value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                                <button type="button" onClick={() => setShowReportModal(false)} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                                <button type="submit" style={{ background: '#059669', border: 'none', color: '#fff', fontWeight: 700, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Submit Alert</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssumptionsModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 20, width: '100%', maxWidth: 640, padding: 28, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>📘 Model Assumptions & Tariffs</h3>
                                <p style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>BPUT Hackathon PS-4 Technical Grounding</p>
                            </div>
                            <button onClick={() => setShowAssumptionsModal(false)} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px 10px', borderRadius: 8 }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12 }}>
                            {[
                                { label: '⚡ CEA Grid Emission Factor', value: '0.710 kg CO₂e / kWh', note: 'Central Electricity Authority v19, Eastern Regional Grid.' },
                                { label: '💸 Power Tariff (Odisha DISCOM)', value: '₹7.50 / kWh', note: 'Standard commercial campus supply rate (HT category).' },
                                { label: '💧 Water Tariff', value: '₹18 / kL', note: 'Odisha municipal potable water utility tariff.' },
                                { label: '📊 ML Engine', value: 'Gradient Boosting + Robust-Z (MAD)', note: 'Backtest MAPE 4.82% vs naive 15.34%. Local sklearn ensemble.' },
                                { label: '🌤️ Weather API', value: 'Open-Meteo (Free, No Key)', note: 'Dynamic GPS geocoding. 0 cost, 0 API key required.' },
                                { label: '⚠️ Notice', value: 'Decision Support Only', note: 'Outputs are decision aids, not official regulatory measurements.' },
                            ].map(({ label, value, note }) => (
                                <div key={label} style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12, padding: 14 }}>
                                    <div style={{ color: '#34d399', fontWeight: 700, fontFamily: 'monospace', fontSize: 11, marginBottom: 6 }}>{label}</div>
                                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, fontFamily: 'monospace', marginBottom: 4 }}>{value}</div>
                                    <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5 }}>{note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showAuthModal && <AuthModal onLoginSuccess={handleLoginSuccess} onClose={() => setShowAuthModal(false)} />}
            {showSqliteModal && <SqliteOfflineModal isSimulatedOffline={isSimulatedOffline} onToggleOffline={() => { setIsSimulatedOffline(o => !o); }} onClose={() => setShowSqliteModal(false)} />}
        </div>
    );
}
