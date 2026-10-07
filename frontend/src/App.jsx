import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotWidget from './components/ChatbotWidget';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboards
import CitizenDashboard from './pages/CitizenDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ROLE_DASH = { citizen: '/citizen/dashboard', partner: '/partner/dashboard', admin: '/admin/dashboard' };

const SmartRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_DASH[user.role] || '/login'} replace />;
};

function AppRoutes() {
  // If AuthContext is loading, we might want to show a different loader or nothing,
  // but the instruction is to remove the check that *unmounts the router*.
  // By not having an `if (loading) return <Loader />` here, the router remains mounted.

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation />
      <main className="flex-grow-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Legacy convenience aliases */}
          <Route path="/register/citizen" element={<Register />} />
          <Route path="/register/partner" element={<Register />} />
          <Route path="/dashboard" element={<SmartRedirect />} />

          {/* Protected - Citizen */}
          <Route path="/citizen/dashboard" element={<ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/citizen/report" element={<ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/citizen/my-reports" element={<ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>} />

          {/* Protected - Partner */}
          <Route path="/partner/dashboard" element={<ProtectedRoute role="partner"><PartnerDashboard /></ProtectedRoute>} />
          <Route path="/partner/tasks" element={<ProtectedRoute role="partner"><PartnerDashboard /></ProtectedRoute>} />
          <Route path="/partner/history" element={<ProtectedRoute role="partner"><PartnerDashboard /></ProtectedRoute>} />

          {/* Protected - Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/partners" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      {/* Global Chatbot for Citizens */}
      <ChatbotWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
