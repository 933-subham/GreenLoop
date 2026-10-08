import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Trash2, FileText, ClipboardList, CheckSquare,
    Users, ShoppingBag, LogOut, Truck, Map as MapIcon, Navigation, Award, AlertTriangle, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Each item points to the same dashboard route, but with a ?tab= param
const MENUS = {
    citizen: {
        label: 'Citizen Portal',
        base: '/citizen/dashboard',
        items: [
            { tab: 'report', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { tab: 'report', icon: <Trash2 size={18} />, label: 'Report Garbage' },
            { tab: 'history', icon: <FileText size={18} />, label: 'My Reports' },
            { tab: 'leaderboard', icon: <Award size={18} />, label: 'Leaderboard' },
            { tab: 'shop', icon: <ShoppingBag size={18} />, label: 'Eco Shop' },
        ]
    },
    partner: {
        label: 'Partner Portal',
        base: '/partner/dashboard',
        items: [
            { tab: 'available', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { tab: 'map', icon: <MapIcon size={18} />, label: 'Live Map' },
            { tab: 'route', icon: <Navigation size={18} />, label: 'Optimized Route' },
            { tab: 'available', icon: <ClipboardList size={18} />, label: 'Available Tasks' },
            { tab: 'mytasks', icon: <Truck size={18} />, label: 'My Tasks' },
            { tab: 'history', icon: <CheckSquare size={18} />, label: 'History' },
        ]
    },
    admin: {
        label: 'Admin Panel',
        base: '/admin/dashboard',
        items: [
            { tab: 'overview', icon: <LayoutDashboard size={18} />, label: 'Facility Intelligence' },
            { tab: 'analytics', icon: <Activity size={18} />, label: 'Analytics' },
            { tab: 'map', icon: <MapIcon size={18} />, label: 'Live Map' },
            { tab: 'false-reports', icon: <AlertTriangle size={18} />, label: 'False Reports' },
            { tab: 'partners', icon: <CheckSquare size={18} />, label: 'Pending Partners' },
            { tab: 'assign', icon: <ClipboardList size={18} />, label: 'Assign Reports' },
            { tab: 'leaderboard', icon: <Award size={18} />, label: 'Leaderboard' },
            { tab: 'users', icon: <Users size={18} />, label: 'All Users' },
            { tab: 'reports', icon: <FileText size={18} />, label: 'All Reports' },
            { tab: 'shop', icon: <ShoppingBag size={18} />, label: 'Shop Management' },
        ]
    },
};

const Sidebar = ({ role }) => {
    const menu = MENUS[role];
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    if (!menu) return null;

    const currentTab = new URLSearchParams(location.search).get('tab') || menu.items[0].tab;

    const handleNav = (tab) => {
        navigate(`${menu.base}?tab=${tab}`);
    };

    return (
        <div className="eco-sidebar">
            <div className="sidebar-label">{menu.label}</div>
            {menu.items.map(item => (
                <button
                    key={item.label}
                    onClick={() => handleNav(item.tab)}
                    className={`sidebar-nav-btn${currentTab === item.tab ? ' active' : ''}`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
            <div className="mt-auto" style={{ borderTop: '1px solid #f0f0f0', padding: '1rem 1.25rem 0' }}>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="d-flex align-items-center gap-2 text-muted border-0 bg-transparent w-100 py-2 small fw-medium"
                    style={{ cursor: 'pointer', borderRadius: 8 }}
                >
                    <LogOut size={16} className="text-danger" /> Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
