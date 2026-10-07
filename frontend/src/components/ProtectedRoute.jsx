import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
    citizen: '/citizen/dashboard',
    partner: '/partner/dashboard',
    admin: '/admin/dashboard',
};

/**
 * ProtectedRoute – wraps a route element and enforces:
 *  1. Authentication (must be logged in)
 *  2. Role (must match `role` prop, if given)
 *
 * Usage:
 *   <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, role }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // Not logged in – send to login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role && user.role !== role) {
        // Wrong role – redirect to their own dashboard
        const home = ROLE_HOME[user.role] || '/login';
        return <Navigate to={home} replace />;
    }

    return children;
};

export default ProtectedRoute;
