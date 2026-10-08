import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OrgPortalApp from './apps/OrgPortalApp';
import MunicipalPortalApp from './apps/MunicipalPortalApp';

export default function App() {
    return (
        <Router>
            <Routes>
                {/* Website 1: Facility Multi-Org Root Monitoring (Colleges, Hospitals, Industries, Schools) */}
                <Route path="/" element={<OrgPortalApp />} />
                <Route path="/org" element={<OrgPortalApp />} />
                <Route path="/org/*" element={<OrgPortalApp />} />
                <Route path="/facility" element={<OrgPortalApp />} />
                <Route path="/admin" element={<OrgPortalApp />} />
                <Route path="/warden" element={<OrgPortalApp />} />

                {/* Website 2: Municipality & Collection Partner Waste Management Portal */}
                <Route path="/municipality" element={<MunicipalPortalApp />} />
                <Route path="/municipality/*" element={<MunicipalPortalApp />} />
                <Route path="/city" element={<MunicipalPortalApp />} />
                <Route path="/partner" element={<MunicipalPortalApp />} />
                <Route path="/driver" element={<MunicipalPortalApp />} />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
