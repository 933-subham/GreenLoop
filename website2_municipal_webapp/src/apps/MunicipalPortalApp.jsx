import React, { useState, useEffect } from 'react';
import {
    Building2, Truck, MapPin, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
    Plus, Bell, Navigation, Eye, UserCheck, Shield, ChevronRight, Check, Phone,
    FileText, Send, Sparkles, Activity, Layers, CornerDownRight, ArrowUpRight,
    BarChart3, Clock, Camera, Search, User, Filter, AlertOctagon, ThumbsUp
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
    Tooltip, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MunicipalPortalApp() {
    const [mainCategory, setMainCategory] = useState('command'); // command, partners, driver, public_reports
    const [activeTab, setActiveTab] = useState('overview'); // overview, approvals, driver, public_reports, analytics
    const [partnerFilter, setPartnerFilter] = useState('all'); // all, pending, approved
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    const handleSelectCategory = (cat) => {
        setMainCategory(cat);
        if (cat === 'command') {
            if (!['overview', 'analytics'].includes(activeTab)) setActiveTab('overview');
        } else if (cat === 'partners') {
            setActiveTab('approvals');
        } else if (cat === 'driver') {
            setActiveTab('driver');
        } else if (cat === 'public_reports') {
            setActiveTab('public_reports');
        }
    };

    // Live Municipal Exterior Bins (Across all registered organizations)
    const [exteriorBins, setExteriorBins] = useState([
        {
            _id: 'BIN-BPUT-01',
            facilityId: 'bput_college',
            facilityName: 'BPUT University Engineering Campus',
            binCode: 'BPUT-EXT-DUMP-01',
            locationName: 'North Gate Perimeter / Service Road',
            wasteType: 'Mixed Campus Waste',
            currentFillPct: 88,
            urgency: 'critical',
            hoursToFull: 1.2,
            assignedDriver: 'Driver Ramesh Kumar',
            vehicleNo: 'Tata Ace (OD-14-K-4921)',
            lat: 22.2585,
            lng: 84.8480,
            status: 'Assigned / En Route'
        },
        {
            _id: 'BIN-HOSP-01',
            facilityId: 'capital_hospital',
            facilityName: 'Capital District Super Specialty Hospital',
            binCode: 'HOSP-CLINICAL-DUMP-01',
            locationName: 'Biomedical Loading Dock B',
            wasteType: 'Hospital General & Segregated Waste',
            currentFillPct: 62,
            urgency: 'medium',
            hoursToFull: 8.5,
            assignedDriver: 'Pending Auto-Dispatch (<80%)',
            vehicleNo: '-',
            lat: 22.2490,
            lng: 84.8550,
            status: 'Normal Operations'
        },
        {
            _id: 'BIN-IND-01',
            facilityId: 'jindal_steel_ind',
            facilityName: 'Jindal Steel & Power Industrial Estate',
            binCode: 'IND-HAZ-DUMP-01',
            locationName: 'South Cargo Gate Container 3',
            wasteType: 'Non-Hazardous Industrial Refuse',
            currentFillPct: 45,
            urgency: 'low',
            hoursToFull: 22.0,
            assignedDriver: 'Pending Auto-Dispatch',
            vehicleNo: '-',
            lat: 22.2680,
            lng: 84.8320,
            status: 'Normal Operations'
        },
        {
            _id: 'BIN-SCH-01',
            facilityId: 'dav_public_school',
            facilityName: 'DAV Public Senior Secondary School',
            binCode: 'DAV-MAIN-DUMP-01',
            locationName: 'Sports Ground Rear Exit',
            wasteType: 'Dry Paper & Cafeteria Organic',
            currentFillPct: 35,
            urgency: 'low',
            hoursToFull: 31.0,
            assignedDriver: 'Standby Fleet',
            vehicleNo: '-',
            lat: 22.2380,
            lng: 84.8620,
            status: 'Normal Operations'
        }
    ]);

    // Partner Applications & Approved Fleet State
    const [partners, setPartners] = useState([
        {
            _id: 'PRT-201',
            name: 'Ramesh Kumar',
            agencyName: 'Maa Tarini Clean Logistics',
            phone: '+91 94371 88902',
            email: 'ramesh.logistics@ecocity.in',
            vehicleNumber: 'OD-14-K-4921',
            vehicleType: 'Tata Ace Tipper (1.5 Ton)',
            zone: 'Zone 1 - Chhend Colony & BPUT Campus',
            capacityKg: 1500,
            currentLoadKg: 1100,
            completedTasks: 38,
            status: 'approved',
            appliedAt: '2026-10-06 09:30 AM'
        },
        {
            _id: 'PRT-202',
            name: 'Subrat Mohanty',
            agencyName: 'Kalinga Green Transport',
            phone: '+91 98610 22345',
            email: 'subrat.mohanty@kalingagreen.in',
            vehicleNumber: 'OD-14-AX-7721',
            vehicleType: 'Mahindra Bolero Maxi Truck (2.0 Ton)',
            zone: 'Zone 2 - Civil Township & Hospital Road',
            capacityKg: 2000,
            currentLoadKg: 450,
            completedTasks: 19,
            status: 'approved',
            appliedAt: '2026-10-06 02:15 PM'
        },
        {
            _id: 'PRT-203',
            name: 'Bikash Das',
            agencyName: 'Steel City Swachh Services',
            phone: '+91 99380 44102',
            email: 'bikash.das@steelcityswachh.org',
            vehicleNumber: 'OD-14-BB-9904',
            vehicleType: 'Eicher Pro Compactor (6.0 Ton)',
            zone: 'Zone 3 - Industrial Estate & Kalunga Bypass',
            capacityKg: 6000,
            currentLoadKg: 0,
            completedTasks: 0,
            status: 'pending',
            appliedAt: 'Just Now (Pending Municipal Admin Review)'
        },
        {
            _id: 'PRT-204',
            name: 'Priyaranjan Sahoo',
            agencyName: 'EcoRide 3-Wheeler Fleet',
            phone: '+91 70081 55621',
            email: 'priya.sahoo@ecoride.in',
            vehicleNumber: 'OD-14-EL-1082',
            vehicleType: 'Piaggio Ape EV Tipper (800 kg)',
            zone: 'Zone 1 - Chhend Colony & BPUT Campus',
            capacityKg: 800,
            currentLoadKg: 0,
            completedTasks: 0,
            status: 'pending',
            appliedAt: '10 Mins Ago (Pending Municipal Admin Review)'
        }
    ]);

    // New Partner Registration Form State
    const [showNewPartnerModal, setShowNewPartnerModal] = useState(false);
    const [newPartnerForm, setNewPartnerForm] = useState({
        name: '',
        agencyName: '',
        phone: '',
        email: '',
        vehicleNumber: '',
        vehicleType: 'Tata Ace Tipper (1.5 Ton)',
        zone: 'Zone 1 - Chhend Colony & BPUT Campus',
        capacityKg: 1500
    });

    // Public Street Garbage Incidents (Reported by citizens outside campuses)
    const [publicStreetReports, setPublicStreetReports] = useState([
        {
            _id: 'STR-901',
            reporterName: 'Sunil Patnaik (Citizen)',
            locationName: 'Panposh Road Overbridge Chowk',
            landmark: 'Near Hanuman Temple corner',
            wasteType: 'Mixed Municipal Waste & Plastic Bags',
            garbageIntensity: 'High',
            status: 'Assigned to Maa Tarini Logistics',
            reportedAt: '42 mins ago',
            imageUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=500&auto=format&fit=crop&q=60'
        },
        {
            _id: 'STR-902',
            reporterName: 'Pooja Mohapatra (Citizen)',
            locationName: 'Civil Township Ring Road Bus Stop',
            landmark: 'Opposite State Bank ATM',
            wasteType: 'Cardboard & Street Packaging Overflow',
            garbageIntensity: 'Medium',
            status: 'Assigned to Kalinga Green Transport',
            reportedAt: '1 hour ago',
            imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60'
        }
    ]);

    // Public Street Report Modal State
    const [showPublicReportModal, setShowPublicReportModal] = useState(false);
    const [publicReportForm, setPublicReportForm] = useState({
        reporterName: '',
        locationName: '',
        landmark: '',
        wasteType: 'Mixed Street Garbage',
        garbageIntensity: 'High',
        description: ''
    });

    // Driver Cockpit State (Mobile 390px Simulation View)
    const [driverState, setDriverState] = useState({
        taskId: 'TASK-BPUT-01',
        taskTitle: 'BPUT University Campus - Main Gate Exterior Dump',
        location: 'BPUT North Gate Service Road, Chhend, Rourkela',
        fillPct: 88,
        binCode: 'BPUT-EXT-DUMP-01',
        currentStep: 'assigned', // assigned -> en_route -> arrived -> completed
        tripDistanceKm: 2.4,
        etaMinutes: 6,
        proofPhotoUploaded: false,
        proofPhotoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60'
    });

    const triggerToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 5000);
    };

    // Load Live Data from API on Mount
    useEffect(() => {
        fetchBackendData();
    }, []);

    const fetchBackendData = async () => {
        try {
            setLoading(true);
            // 1. Fetch Partners
            const prtRes = await axios.get(`${API_BASE}/partners`).catch(() => null);
            if (prtRes && prtRes.data && prtRes.data.length > 0) {
                setPartners(prev => {
                    const combined = [...prtRes.data];
                    return combined;
                });
            }

            // 2. Fetch Bins
            const binRes = await axios.get(`${API_BASE}/bins`).catch(() => null);
            if (binRes && binRes.data && binRes.data.length > 0) {
                // Update fill levels if found
                const bputBin = binRes.data.find(b => b.code?.includes('BPUT') || b.facilityId === 'bput_college');
                if (bputBin) {
                    setExteriorBins(prev => prev.map(b => b.facilityId === 'bput_college' ? {
                        ...b,
                        currentFillPct: bputBin.currentFillPct,
                        urgency: bputBin.urgency || (bputBin.currentFillPct >= 80 ? 'critical' : 'low'),
                        status: bputBin.currentFillPct <= 10 ? 'CLEAN (Reset after Pickup)' : 'Assigned / En Route'
                    } : b));
                }
            }
        } catch (e) {
            console.log('Using local municipal states:', e.message);
        } finally {
            setLoading(false);
        }
    };

    // Partner Approval Action (Root User)
    const handleUpdatePartnerStatus = async (partnerId, newStatus) => {
        try {
            setLoading(true);
            const res = await axios.put(`${API_BASE}/partners/${partnerId}/status`, {
                status: newStatus,
                rejectionReason: newStatus === 'rejected' ? 'Vehicle fitness or zone quota full' : undefined
            }).catch(() => null);

            // Update local state
            setPartners(prev => prev.map(p => p._id === partnerId ? {
                ...p,
                status: newStatus,
                approvedAt: newStatus === 'approved' ? 'Just Now' : undefined
            } : p));

            if (newStatus === 'approved') {
                triggerToast(`✅ Partner credentials APPROVED! Vehicle is now active in Municipal Waste Grid.`);
            } else {
                triggerToast(`⚠️ Partner application was REJECTED by Municipal Admin.`);
            }
        } catch (e) {
            triggerToast(`Partner status updated locally to ${newStatus.toUpperCase()}`);
        } finally {
            setLoading(false);
        }
    };

    // Submit New Partner Application
    const handleApplyPartner = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...newPartnerForm,
                email: newPartnerForm.email || `driver_${Date.now()}@ecocity.in`
            };

            await axios.post(`${API_BASE}/partners/apply`, payload).catch(() => null);

            const newEntry = {
                _id: `PRT-${Date.now().toString().slice(-4)}`,
                ...payload,
                completedTasks: 0,
                currentLoadKg: 0,
                status: 'pending',
                appliedAt: 'Just Now (Pending Municipal Admin Review)'
            };

            setPartners(prev => [newEntry, ...prev]);
            setShowNewPartnerModal(false);
            setNewPartnerForm({
                name: '', agencyName: '', phone: '', email: '',
                vehicleNumber: '', vehicleType: 'Tata Ace Tipper (1.5 Ton)',
                zone: 'Zone 1 - Chhend Colony & BPUT Campus', capacityKg: 1500
            });
            triggerToast(`🎉 Partner Application Submitted! Now listed under 'Pending Approvals' for Municipal Review.`);
        } catch (err) {
            triggerToast('Application recorded locally for demo verification.');
        } finally {
            setLoading(false);
        }
    };

    // Driver Complete Task with Photo Upload (Resets Org Exterior Bin!)
    const handleCompletePickup = async () => {
        try {
            setLoading(true);

            // Call backend pickup completion
            await axios.post(`${API_BASE}/partners/tasks/${driverState.taskId}/complete`, {
                proofImageUrl: driverState.proofPhotoUrl,
                driverNotes: 'Dump container emptied completely. Bin washed and disinfected.'
            }).catch(() => null);

            // ALSO call bin reset directly
            const bputBin = exteriorBins.find(b => b.facilityId === 'bput_college');
            if (bputBin) {
                await axios.put(`${API_BASE}/bins/${bputBin._id}`, {
                    currentFillPct: 6.0,
                    urgency: 'low',
                    hoursToFull: 36.0
                }).catch(() => null);
            }

            // Update driver state
            setDriverState(prev => ({
                ...prev,
                currentStep: 'completed',
                fillPct: 6
            }));

            // UPDATE Exterior Bins: BPUT Reset to 6%
            setExteriorBins(prev => prev.map(b => b.facilityId === 'bput_college' ? {
                ...b,
                currentFillPct: 6,
                urgency: 'low',
                hoursToFull: 38.0,
                status: 'CLEAN (Emptied by Driver Ramesh Kumar)'
            } : b));

            triggerToast(`🏆 SUCCESS! Dump container emptied. Proof photo logged. BPUT College Exterior Bin RESET to 6% (Clean) on Website 1!`);
        } catch (e) {
            triggerToast('Pickup logged and bin reset to 6% Clean.');
        } finally {
            setLoading(false);
        }
    };

    // Submit Public Street Garbage Report (Outside Campus)
    const handleSubmitPublicReport = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                lat: 22.2540,
                lng: 84.8510,
                address: `${publicReportForm.locationName} (${publicReportForm.landmark})`,
                wasteType: publicReportForm.wasteType,
                garbageIntensity: publicReportForm.garbageIntensity,
                description: publicReportForm.description
            };

            await axios.post(`${API_BASE}/reports/public-street`, payload).catch(() => null);

            const newStreetIncident = {
                _id: `STR-${Math.floor(100 + Math.random() * 900)}`,
                reporterName: publicReportForm.reporterName || 'Citizen Report',
                locationName: publicReportForm.locationName,
                landmark: publicReportForm.landmark,
                wasteType: publicReportForm.wasteType,
                garbageIntensity: publicReportForm.garbageIntensity,
                status: 'Auto-Assigned to Maa Tarini Logistics (Driver Ramesh)',
                reportedAt: 'Just Now',
                imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60'
            };

            setPublicStreetReports(prev => [newStreetIncident, ...prev]);
            setShowPublicReportModal(false);
            setPublicReportForm({
                reporterName: '', locationName: '', landmark: '',
                wasteType: 'Mixed Street Garbage', garbageIntensity: 'High', description: ''
            });

            triggerToast(`📢 Public Street Report Logged! Auto-dispatched to nearest municipal partner.`);
        } catch (e) {
            triggerToast('Street garbage alert registered and auto-dispatched.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#0b1120', color: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Top Global Cross-App Header */}
            <div style={{
                backgroundColor: '#111827',
                borderBottom: '1px solid #1f2937',
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)'
                    }}>
                        <Truck size={24} color="#ffffff" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#f8fafc' }}>
                                EcoCity <span style={{ color: '#38bdf8' }}>Municipal & Partner Portal</span>
                            </span>
                            <span style={{
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                fontWeight: 700
                            }}>
                                WEBSITE 2
                            </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Rourkela Municipal Corporation (RMC) • City Waste Command & Driver Logistics
                        </div>
                    </div>
                </div>

                {/* Right Action Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(5, 150, 105, 0.15)',
                        border: '1px solid rgba(5, 150, 105, 0.3)',
                        color: '#34d399',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                        Municipal Command Grid: Active
                    </div>

                    <button
                        onClick={() => setShowPublicReportModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#e11d48',
                            color: '#ffffff',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        <AlertTriangle size={16} />
                        Report Street Garbage (Citizen)
                    </button>

                    <button
                        onClick={fetchBackendData}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#1f2937',
                            color: '#94a3b8',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #374151',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Sync
                    </button>
                </div>
            </div>

            {/* Navigation Tab Bar with Primary Categories & Sub-Navigation */}
            <div style={{
                backgroundColor: '#0f172a',
                borderBottom: '1px solid #1e293b',
                padding: '12px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    overflowX: 'auto',
                    flexWrap: 'wrap'
                }}>
                    {[
                        { id: 'command', label: '🗺️ Municipal Operations & Command', icon: MapPin },
                        { id: 'partners', label: '📋 Partner Approvals & Logistics', icon: UserCheck, badge: partners.filter(p => p.status === 'pending').length },
                        { id: 'driver', label: '📱 Driver Mobile Cockpit (390px View)', icon: Navigation, badge: driverState.currentStep === 'assigned' ? 'Live Trip' : null },
                        { id: 'public_reports', label: '📢 Public Street Garbage Alerts', icon: AlertOctagon, count: publicStreetReports.length }
                    ].map(cat => {
                        const Icon = cat.icon;
                        const isActive = mainCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleSelectCategory(cat.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 18px',
                                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                                    border: isActive ? '1px solid #38bdf8' : '1px solid #334155',
                                    borderRadius: '10px',
                                    color: isActive ? '#38bdf8' : '#94a3b8',
                                    fontWeight: isActive ? 800 : 600,
                                    fontSize: '0.86rem',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    boxShadow: isActive ? '0 0 14px rgba(56, 189, 248, 0.2)' : 'none'
                                }}
                            >
                                <Icon size={16} />
                                {cat.label}
                                {cat.badge && (
                                    <span style={{
                                        backgroundColor: '#ef4444',
                                        color: '#ffffff',
                                        fontSize: '0.68rem',
                                        padding: '2px 7px',
                                        borderRadius: '999px',
                                        fontWeight: 800
                                    }}>
                                        {cat.badge}
                                    </span>
                                )}
                                {cat.count !== undefined && !cat.badge && (
                                    <span style={{
                                        backgroundColor: '#334155',
                                        color: '#cbd5e1',
                                        fontSize: '0.7rem',
                                        padding: '2px 6px',
                                        borderRadius: '999px'
                                    }}>
                                        {cat.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-Category Bar for Command */}
                {mainCategory === 'command' && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(51, 65, 85, 0.5)',
                        overflowX: 'auto'
                    }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                            Command Views:
                        </span>
                        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#020617', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            <button
                                onClick={() => setActiveTab('overview')}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: activeTab === 'overview' ? '#38bdf8' : 'transparent',
                                    color: activeTab === 'overview' ? '#0f172a' : '#94a3b8'
                                }}
                            >
                                🗺️ City Hotspot Map & Multi-Org Bins
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: activeTab === 'analytics' ? '#38bdf8' : 'transparent',
                                    color: activeTab === 'analytics' ? '#0f172a' : '#94a3b8'
                                }}
                            >
                                📈 Circular Economy & Landfill Metrics
                            </button>
                        </div>
                    </div>
                )}

                {/* Sub-Category Filter for Partner Approvals */}
                {mainCategory === 'partners' && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(51, 65, 85, 0.5)',
                        overflowX: 'auto'
                    }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                            Filter Fleet:
                        </span>
                        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#020617', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            {[
                                { id: 'all', label: `All Partners & Fleets (${partners.length})` },
                                { id: 'pending', label: `Pending Approvals (${partners.filter(p => p.status === 'pending').length})` },
                                { id: 'approved', label: `Active Approved (${partners.filter(p => p.status === 'approved').length})` }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setPartnerFilter(filter.id)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: partnerFilter === filter.id ? '#0284c7' : 'transparent',
                                        color: partnerFilter === filter.id ? '#ffffff' : '#94a3b8'
                                    }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Notification Banner */}
            {toastMsg && (
                <div style={{
                    margin: '16px 24px 0 24px',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#064e3b',
                    border: '1px solid #10b981',
                    color: '#a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                }}>
                    <CheckCircle2 size={20} color="#10b981" />
                    <span>{toastMsg}</span>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>

                {/* TAB 1: OVERVIEW & MAP */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* City KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                            <div style={{ backgroundColor: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>REGISTERED ORGANIZATIONS</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>4 Campuses</div>
                                <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px' }}>BPUT College, Capital Hospital, Jindal, DAV</div>
                            </div>
                            <div style={{ backgroundColor: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>CAMPUS EXTERIOR DUMP BINS</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>4 Active Points</div>
                                <div style={{ fontSize: '0.75rem', color: exteriorBins.some(b => b.currentFillPct >= 80) ? '#f87171' : '#34d399', marginTop: '4px' }}>
                                    {exteriorBins.some(b => b.currentFillPct >= 80) ? '⚠️ 1 Bin Critical Overflow (BPUT 88%)' : '✅ All exterior bins under safe threshold'}
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>ACTIVE COLLECTION FLEET</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                                    {partners.filter(p => p.status === 'approved').length} Approved Partners
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px' }}>
                                    {partners.filter(p => p.status === 'pending').length} applications awaiting Municipal Approval
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>AVG AUTO-DISPATCH LATENCY</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>1.8 Seconds</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Zero human bottleneck when &ge; 80%</div>
                            </div>
                        </div>

                        {/* Interactive City Hotspot Map Grid */}
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
                            <div style={{ padding: '18px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                                        🗺️ Live City Hotspot Map (Rourkela Municipal Grid)
                                    </h2>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                        Visualizing multi-facility exterior dump containers + public citizen street incidents
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#ef4444' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                                        Critical Overflow (&ge; 80%)
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#f59e0b' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
                                        Moderate (50-79%)
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#10b981' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                                        Clean / Low (&lt; 50%)
                                    </span>
                                </div>
                            </div>

                            {/* Simulated High-Tech Map Canvas */}
                            <div style={{
                                position: 'relative',
                                height: '360px',
                                backgroundColor: '#0f172a',
                                backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
                                backgroundSize: '24px 24px',
                                padding: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {/* Grid Road Lines SVG */}
                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.25 }}>
                                    <path d="M 50 180 Q 300 120 700 200 T 1300 160" fill="transparent" stroke="#38bdf8" strokeWidth="4" />
                                    <path d="M 400 30 L 450 330" fill="transparent" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,6" />
                                    <path d="M 850 40 L 800 330" fill="transparent" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,6" />
                                    <circle cx="430" cy="165" r="40" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                                </svg>

                                {/* BPUT Campus Exterior Bin Pin */}
                                {exteriorBins.map((bin, idx) => {
                                    const coords = [
                                        { left: '22%', top: '35%' },
                                        { left: '48%', top: '65%' },
                                        { left: '78%', top: '30%' },
                                        { left: '60%', top: '80%' }
                                    ][idx] || { left: '50%', top: '50%' };

                                    const isCritical = bin.currentFillPct >= 80;
                                    const pinColor = isCritical ? '#ef4444' : bin.currentFillPct >= 50 ? '#f59e0b' : '#10b981';

                                    return (
                                        <div
                                            key={bin._id}
                                            style={{
                                                position: 'absolute',
                                                left: coords.left,
                                                top: coords.top,
                                                transform: 'translate(-50%, -50%)',
                                                cursor: 'pointer',
                                                zIndex: 10
                                            }}
                                            onClick={() => triggerToast(`Inspecting ${bin.facilityName}: ${bin.currentFillPct}% Fill`)}
                                        >
                                            <div style={{
                                                backgroundColor: '#1e293b',
                                                border: `2px solid ${pinColor}`,
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                boxShadow: `0 0 20px ${pinColor}44`,
                                                minWidth: '180px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc' }}>
                                                    {bin.facilityName.split(' ')[0]} Ext. Bin
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: pinColor }}>
                                                        {bin.currentFillPct}%
                                                    </span>
                                                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                                        ({bin.urgency.toUpperCase()})
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#38bdf8', marginTop: '2px' }}>
                                                    {bin.status}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Active Driver Truck Icon moving towards BPUT */}
                                <div style={{
                                    position: 'absolute',
                                    left: driverState.currentStep === 'completed' ? '22%' : driverState.currentStep === 'arrived' ? '25%' : '35%',
                                    top: '42%',
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: '#0284c7',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    border: '2px solid #38bdf8',
                                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    zIndex: 20
                                }}>
                                    <Truck size={14} color="#ffffff" />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ffffff' }}>
                                        Driver Ramesh (Tata Ace)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Org Exterior Dump Containers Table */}
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
                            <div style={{ padding: '18px 24px', borderBottom: '1px solid #334155' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                                    🏢 Cross-Facility Exterior Dump Monitoring (Website 1 Synchronized)
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                    When an individual facility management dumps their internal campus waste here, levels rise. At &ge; 80%, this table triggers auto-dispatch.
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                            <th style={{ padding: '12px 18px' }}>ORGANIZATION</th>
                                            <th style={{ padding: '12px 18px' }}>CONTAINER LOCATION</th>
                                            <th style={{ padding: '12px 18px' }}>WASTE TYPE</th>
                                            <th style={{ padding: '12px 18px' }}>FILL LEVEL</th>
                                            <th style={{ padding: '12px 18px' }}>AUTO-DISPATCH STATUS</th>
                                            <th style={{ padding: '12px 18px' }}>ASSIGNED DRIVER & TRUCK</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exteriorBins.map(bin => {
                                            const isCritical = bin.currentFillPct >= 80;
                                            return (
                                                <tr key={bin._id} style={{ borderBottom: '1px solid #334155' }}>
                                                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Building2 size={16} color="#38bdf8" />
                                                            {bin.facilityName}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                                                        {bin.locationName}
                                                    </td>
                                                    <td style={{ padding: '14px 18px', color: '#94a3b8' }}>
                                                        {bin.wasteType}
                                                    </td>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{
                                                                width: '70px',
                                                                height: '10px',
                                                                backgroundColor: '#334155',
                                                                borderRadius: '999px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <div style={{
                                                                    width: `${bin.currentFillPct}%`,
                                                                    height: '100%',
                                                                    backgroundColor: isCritical ? '#ef4444' : bin.currentFillPct >= 50 ? '#f59e0b' : '#10b981'
                                                                }} />
                                                            </div>
                                                            <span style={{
                                                                fontWeight: 800,
                                                                color: isCritical ? '#ef4444' : bin.currentFillPct >= 50 ? '#f59e0b' : '#10b981'
                                                            }}>
                                                                {bin.currentFillPct}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <span style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '999px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                                                            color: isCritical ? '#ef4444' : '#10b981',
                                                            border: `1px solid ${isCritical ? '#ef4444' : '#10b981'}`
                                                        }}>
                                                            {bin.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', color: '#f8fafc' }}>
                                                        <div>{bin.assignedDriver}</div>
                                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{bin.vehicleNo}</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: PARTNER APPROVALS & REGISTRY */}
                {activeTab === 'approvals' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{
                            backgroundColor: '#1e293b',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                                    📋 Municipal Contractor & Partner Approval Workflow
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                    When waste transport contractors apply to become partners, they must be approved by the Municipal Root User before receiving collection dispatches.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNewPartnerModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#0284c7',
                                    color: '#ffffff',
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                                }}
                            >
                                <Plus size={18} />
                                Register New Contractor
                            </button>
                        </div>

                        {/* Pending Applications Section */}
                        {(partnerFilter === 'all' || partnerFilter === 'pending') && (
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
                            <div style={{
                                padding: '16px 20px',
                                backgroundColor: '#1e1b4b',
                                borderBottom: '1px solid #312e81',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={18} color="#a5b4fc" />
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#e0e7ff' }}>
                                        Awaiting Municipal Root User Approval ({partners.filter(p => p.status === 'pending').length})
                                    </h3>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: '#a5b4fc' }}>
                                    Review submitted vehicle documents & zone allocation
                                </span>
                            </div>

                            {partners.filter(p => p.status === 'pending').length === 0 ? (
                                <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                                    <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>All Partner Applications Reviewed!</div>
                                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>No contractors currently waiting in pending queue.</div>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                                <th style={{ padding: '12px 18px' }}>CONTRACTOR / AGENCY</th>
                                                <th style={{ padding: '12px 18px' }}>VEHICLE DETAILS</th>
                                                <th style={{ padding: '12px 18px' }}>PHONE & CONTACT</th>
                                                <th style={{ padding: '12px 18px' }}>ASSIGNED ZONE</th>
                                                <th style={{ padding: '12px 18px' }}>CAPACITY</th>
                                                <th style={{ padding: '12px 18px' }}>ROOT DECISION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partners.filter(p => p.status === 'pending').map(partner => (
                                                <tr key={partner._id} style={{ borderBottom: '1px solid #334155' }}>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{partner.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{partner.agencyName}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{partner.appliedAt}</div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{partner.vehicleNumber}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{partner.vehicleType}</div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Phone size={14} color="#94a3b8" />
                                                            {partner.phone}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{partner.email}</div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                                                        {partner.zone}
                                                    </td>
                                                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#f8fafc' }}>
                                                        {partner.capacityKg} kg
                                                    </td>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => handleUpdatePartnerStatus(partner._id, 'approved')}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    backgroundColor: '#059669',
                                                                    color: '#ffffff',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.78rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <Check size={14} />
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdatePartnerStatus(partner._id, 'rejected')}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    backgroundColor: '#dc2626',
                                                                    color: '#ffffff',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.78rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <XCircle size={14} />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        )}

                        {/* Approved Partners Registry Table */}
                        {(partnerFilter === 'all' || partnerFilter === 'approved') && (
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                                    ✅ Verified & Active Municipal Collection Fleet ({partners.filter(p => p.status === 'approved').length})
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                                    These authorized partners receive automated routing and smart pickup assignments
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                            <th style={{ padding: '12px 18px' }}>PARTNER NAME</th>
                                            <th style={{ padding: '12px 18px' }}>VEHICLE NUMBER & TYPE</th>
                                            <th style={{ padding: '12px 18px' }}>ASSIGNED ZONE</th>
                                            <th style={{ padding: '12px 18px' }}>CURRENT PAYLOAD</th>
                                            <th style={{ padding: '12px 18px' }}>COMPLETED RUNS</th>
                                            <th style={{ padding: '12px 18px' }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partners.filter(p => p.status === 'approved').map(partner => (
                                            <tr key={partner._id} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{partner.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{partner.agencyName}</div>
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{partner.vehicleNumber}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{partner.vehicleType}</div>
                                                </td>
                                                <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                                                    {partner.zone}
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                                                        {partner.currentLoadKg} / {partner.capacityKg} kg
                                                    </div>
                                                    <div style={{
                                                        width: '80px',
                                                        height: '6px',
                                                        backgroundColor: '#334155',
                                                        borderRadius: '999px',
                                                        overflow: 'hidden',
                                                        marginTop: '4px'
                                                    }}>
                                                        <div style={{
                                                            width: `${Math.min(100, (partner.currentLoadKg / partner.capacityKg) * 100)}%`,
                                                            height: '100%',
                                                            backgroundColor: '#38bdf8'
                                                        }} />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 18px', fontWeight: 800, color: '#10b981' }}>
                                                    {partner.completedTasks} Trips Done
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <span style={{
                                                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                                        color: '#10b981',
                                                        border: '1px solid #10b981',
                                                        padding: '4px 10px',
                                                        borderRadius: '999px',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700
                                                    }}>
                                                        ACTIVE AUTHORIZED
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                    </div>
                )}

                {/* TAB 3: DRIVER & PARTNER COCKPIT (MOBILE 390px VIEW) */}
                {activeTab === 'driver' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                                🚚 Partner Collection Driver Cockpit
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                Simulated Driver Smartphone Screen (390px Mobile View) used by cleaner driver Ramesh Kumar during real-world collection runs.
                            </p>
                        </div>

                        {/* 390px Phone Frame */}
                        <div style={{
                            width: '390px',
                            backgroundColor: '#030712',
                            borderRadius: '36px',
                            border: '10px solid #1f2937',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Phone Notch & Status Bar */}
                            <div style={{
                                backgroundColor: '#111827',
                                padding: '10px 18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                                borderBottom: '1px solid #1f2937'
                            }}>
                                <span>11:42 AM</span>
                                <div style={{
                                    width: '80px',
                                    height: '14px',
                                    backgroundColor: '#000000',
                                    borderRadius: '999px'
                                }}></div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <span>5G</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            {/* Driver App Header */}
                            <div style={{
                                backgroundColor: '#1e293b',
                                padding: '14px 18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #334155'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        backgroundColor: '#0284c7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800
                                    }}>
                                        RK
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>Ramesh Kumar</div>
                                        <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Tata Ace (OD-14-K-4921)</div>
                                    </div>
                                </div>
                                <span style={{
                                    backgroundColor: '#059669',
                                    color: '#ffffff',
                                    fontSize: '0.65rem',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontWeight: 700
                                }}>
                                    ON DUTY
                                </span>
                            </div>

                            {/* Active Job Card */}
                            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{
                                    backgroundColor: '#111827',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    border: '1px solid #374151'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            backgroundColor: driverState.fillPct >= 80 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                            color: driverState.fillPct >= 80 ? '#ef4444' : '#10b981',
                                            fontSize: '0.7rem',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontWeight: 800
                                        }}>
                                            {driverState.fillPct >= 80 ? 'CRITICAL DISPATCH' : 'CLEANED & VERIFIED'}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                            {driverState.binCode}
                                        </span>
                                    </div>

                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px 0' }}>
                                        {driverState.taskTitle}
                                    </h4>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={12} color="#38bdf8" />
                                        {driverState.location}
                                    </p>

                                    {/* Fill Indicator */}
                                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Container Fill Level:</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: driverState.fillPct >= 80 ? '#ef4444' : '#10b981' }}>
                                            {driverState.fillPct}%
                                        </span>
                                    </div>
                                </div>

                                {/* Step-by-Step Navigation & Completion Flow */}
                                <div style={{
                                    backgroundColor: '#111827',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    border: '1px solid #374151',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                                        📍 Turn-by-Turn Route Execution
                                    </div>

                                    {/* Step 1: Start Navigation */}
                                    {driverState.currentStep === 'assigned' && (
                                        <button
                                            onClick={() => {
                                                setDriverState(prev => ({ ...prev, currentStep: 'en_route' }));
                                                triggerToast('GPS Navigation Started: Following NH-143 towards BPUT Campus');
                                            }}
                                            style={{
                                                backgroundColor: '#0284c7',
                                                color: '#ffffff',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Navigation size={16} />
                                            Start GPS Route (2.4 km • 6 mins)
                                        </button>
                                    )}

                                    {/* Step 2: En Route -> Mark Arrived */}
                                    {driverState.currentStep === 'en_route' && (
                                        <button
                                            onClick={() => {
                                                setDriverState(prev => ({ ...prev, currentStep: 'arrived' }));
                                                triggerToast('Arrived at BPUT Campus North Gate Exterior Dump Container');
                                            }}
                                            style={{
                                                backgroundColor: '#f59e0b',
                                                color: '#000000',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <MapPin size={16} />
                                            Mark "Arrived at BPUT Campus"
                                        </button>
                                    )}

                                    {/* Step 3: Arrived -> Upload Proof Photo & Complete Cleanout */}
                                    {driverState.currentStep === 'arrived' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{
                                                borderRadius: '10px',
                                                overflow: 'hidden',
                                                height: '110px',
                                                border: '1px solid #374151'
                                            }}>
                                                <img
                                                    src={driverState.proofPhotoUrl}
                                                    alt="Cleanup Proof"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <button
                                                onClick={handleCompletePickup}
                                                style={{
                                                    backgroundColor: '#059669',
                                                    color: '#ffffff',
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    fontWeight: 800,
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
                                                }}
                                            >
                                                <Camera size={16} />
                                                📸 Upload Proof & Complete Cleanout
                                            </button>
                                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center' }}>
                                                💡 Submitting instantly resets BPUT College Exterior Bin to 6% Clean on Website 1!
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 4: Completed */}
                                    {driverState.currentStep === 'completed' && (
                                        <div style={{
                                            backgroundColor: '#064e3b',
                                            border: '1px solid #10b981',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            textAlign: 'center'
                                        }}>
                                            <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 6px auto' }} />
                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#a7f3d0' }}>
                                                Job Completed & Verified!
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#6ee7b7', marginTop: '2px' }}>
                                                Container emptied. BPUT Exterior Bin reset to 6% Clean.
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDriverState(prev => ({
                                                        ...prev,
                                                        currentStep: 'assigned',
                                                        fillPct: 88
                                                    }));
                                                    setExteriorBins(prev => prev.map(b => b.facilityId === 'bput_college' ? {
                                                        ...b,
                                                        currentFillPct: 88,
                                                        urgency: 'critical',
                                                        status: 'Assigned / En Route'
                                                    } : b));
                                                    triggerToast('Resetting simulation demo state back to 88% Critical Overflow');
                                                }}
                                                style={{
                                                    marginTop: '8px',
                                                    backgroundColor: 'transparent',
                                                    border: '1px solid #10b981',
                                                    color: '#a7f3d0',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🔄 Reset Demo for Another Run
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: PUBLIC CITIZEN STREET GARBAGE ALERTS */}
                {activeTab === 'public_reports' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{
                            backgroundColor: '#1e293b',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                                    📢 Public Citizen Street Garbage Reports (Outside Campus)
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                    When citizens spot garbage on city roads or outside institutional campuses, reports arrive here directly to Municipal Command & are auto-dispatched to collection partners.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPublicReportModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#e11d48',
                                    color: '#ffffff',
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
                                }}
                            >
                                <Plus size={18} />
                                Simulate Citizen Report
                            </button>
                        </div>

                        {/* Public Reports List */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                            {publicStreetReports.map(report => (
                                <div
                                    key={report._id}
                                    style={{
                                        backgroundColor: '#1e293b',
                                        borderRadius: '14px',
                                        border: '1px solid #334155',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                                        <img
                                            src={report.imageUrl}
                                            alt={report.locationName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            backgroundColor: report.garbageIntensity === 'High' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                                            color: '#ffffff',
                                            fontSize: '0.72rem',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            fontWeight: 800
                                        }}>
                                            {report.garbageIntensity} Intensity
                                        </span>
                                    </div>
                                    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                                                {report.locationName}
                                            </h3>
                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                                                Landmark: {report.landmark}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1' }}>
                                            <span>Waste: <strong>{report.wasteType}</strong></span>
                                            <span style={{ color: '#94a3b8' }}>{report.reportedAt}</span>
                                        </div>

                                        <div style={{
                                            backgroundColor: '#0f172a',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #1e293b',
                                            fontSize: '0.8rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <Truck size={16} color="#38bdf8" />
                                            <div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>DISPATCH STATUS</div>
                                                <div style={{ color: '#38bdf8', fontWeight: 700 }}>{report.status}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 5: CIRCULAR ECONOMY & METRICS */}
                {activeTab === 'analytics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                                📈 Municipal Waste Diversion & Route Efficiency Scorecard
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                AI-driven metrics proving sustainability impact across institutional and municipal sectors in Rourkela.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                            {/* Monthly Collection Bar Chart */}
                            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#f8fafc' }}>
                                    Monthly Waste Diverted from Landfills (Tons)
                                </h3>
                                <div style={{ height: '240px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { month: 'Jun', recycled: 42, landfill: 28 },
                                            { month: 'Jul', recycled: 58, landfill: 24 },
                                            { month: 'Aug', recycled: 72, landfill: 19 },
                                            { month: 'Sep', recycled: 88, landfill: 15 },
                                            { month: 'Oct', recycled: 96, landfill: 11 }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="month" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                            <Bar dataKey="recycled" name="Composted / Recycled" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="landfill" name="Unsorted Landfill" fill="#64748b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Fleet Route Efficiency Line Chart */}
                            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#f8fafc' }}>
                                    Fleet Fuel & Route Mileage Optimization (km saved)
                                </h3>
                                <div style={{ height: '240px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={[
                                            { day: 'Mon', kmSaved: 64 },
                                            { day: 'Tue', kmSaved: 82 },
                                            { day: 'Wed', kmSaved: 95 },
                                            { day: 'Thu', kmSaved: 110 },
                                            { day: 'Fri', kmSaved: 124 },
                                            { day: 'Sat', kmSaved: 140 }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="day" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                            <Line type="monotone" dataKey="kmSaved" name="Diesel Saved (km)" stroke="#38bdf8" strokeWidth={3} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* MODAL 1: REGISTER NEW PARTNER APPLICATION */}
            {showNewPartnerModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999,
                    padding: '16px'
                }}>
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '16px',
                        border: '1px solid #334155',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                                📝 Contractor / Partner Application
                            </h3>
                            <button
                                onClick={() => setShowNewPartnerModal(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleApplyPartner} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contractor / Driver Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newPartnerForm.name}
                                    onChange={e => setNewPartnerForm({ ...newPartnerForm, name: e.target.value })}
                                    placeholder="e.g. Alok Tripathy"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Agency / Transport Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newPartnerForm.agencyName}
                                    onChange={e => setNewPartnerForm({ ...newPartnerForm, agencyName: e.target.value })}
                                    placeholder="e.g. Utkal Clean Fleet Services"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vehicle Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPartnerForm.vehicleNumber}
                                        onChange={e => setNewPartnerForm({ ...newPartnerForm, vehicleNumber: e.target.value })}
                                        placeholder="OD-14-CZ-8821"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPartnerForm.phone}
                                        onChange={e => setNewPartnerForm({ ...newPartnerForm, phone: e.target.value })}
                                        placeholder="+91 94371 XXXXX"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vehicle Type</label>
                                    <select
                                        value={newPartnerForm.vehicleType}
                                        onChange={e => setNewPartnerForm({ ...newPartnerForm, vehicleType: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                    >
                                        <option value="Tata Ace Tipper (1.5 Ton)">Tata Ace Tipper (1.5 Ton)</option>
                                        <option value="Eicher Pro Compactor (6.0 Ton)">Eicher Pro Compactor (6.0 Ton)</option>
                                        <option value="Piaggio Ape EV (800 kg)">Piaggio Ape EV (800 kg)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Coverage Zone</label>
                                    <select
                                        value={newPartnerForm.zone}
                                        onChange={e => setNewPartnerForm({ ...newPartnerForm, zone: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                    >
                                        <option value="Zone 1 - Chhend Colony & BPUT Campus">Zone 1 - Chhend & BPUT</option>
                                        <option value="Zone 2 - Civil Township & Hospital Road">Zone 2 - Civil Township</option>
                                        <option value="Zone 3 - Industrial Estate & Kalunga Bypass">Zone 3 - Industrial Estate</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowNewPartnerModal(false)}
                                    style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#334155', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#0284c7', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: REPORT PUBLIC STREET GARBAGE */}
            {showPublicReportModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999,
                    padding: '16px'
                }}>
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '16px',
                        border: '1px solid #334155',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                                📢 Report Public Street Garbage (Outside Campus)
                            </h3>
                            <button
                                onClick={() => setShowPublicReportModal(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmitPublicReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Citizen Name</label>
                                <input
                                    type="text"
                                    value={publicReportForm.reporterName}
                                    onChange={e => setPublicReportForm({ ...publicReportForm, reporterName: e.target.value })}
                                    placeholder="e.g. Manas Swain"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Street / Public Road Location *</label>
                                <input
                                    type="text"
                                    required
                                    value={publicReportForm.locationName}
                                    onChange={e => setPublicReportForm({ ...publicReportForm, locationName: e.target.value })}
                                    placeholder="e.g. Panposh Road Chowk"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Landmark</label>
                                <input
                                    type="text"
                                    value={publicReportForm.landmark}
                                    onChange={e => setPublicReportForm({ ...publicReportForm, landmark: e.target.value })}
                                    placeholder="e.g. Near Hanuman Temple corner"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Garbage Intensity</label>
                                    <select
                                        value={publicReportForm.garbageIntensity}
                                        onChange={e => setPublicReportForm({ ...publicReportForm, garbageIntensity: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                    >
                                        <option value="High">High (Road Obstruction)</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Waste Category</label>
                                    <select
                                        value={publicReportForm.wasteType}
                                        onChange={e => setPublicReportForm({ ...publicReportForm, wasteType: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                                    >
                                        <option value="Mixed Street Garbage">Mixed Street Garbage</option>
                                        <option value="Construction Debris">Construction Debris</option>
                                        <option value="Plastic & Packaging">Plastic & Packaging</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPublicReportModal(false)}
                                    style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#334155', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#e11d48', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Dispatch to Municipal Partners
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
