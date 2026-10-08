import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Leaf, Clock, CheckCircle, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ROLE_REDIRECT = { citizen: '/citizen/dashboard', partner: '/partner/dashboard', admin: '/admin/dashboard' };

const Register = () => {
    const [role, setRole] = useState('citizen');

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminCode, setAdminCode] = useState('');

    // Location cascade
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedCityId, setSelectedCityId] = useState('');

    const [submitted, setSubmitted] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);
    const { registerCitizen, registerPartner, loading } = useAuth();
    const navigate = useNavigate();

    // Fetch states on mount
    useEffect(() => {
        axios.get(`${API}/cities/states`)
            .then(r => setStates(r.data))
            .catch(() => { });
    }, []);

    // Fetch districts when state selected
    useEffect(() => {
        if (!selectedState) { setDistricts([]); setSelectedDistrict(''); setCities([]); setSelectedCityId(''); return; }
        axios.get(`${API}/cities/districts?state=${encodeURIComponent(selectedState)}`)
            .then(r => { setDistricts(r.data); setSelectedDistrict(''); setCities([]); setSelectedCityId(''); })
            .catch(() => { });
    }, [selectedState]);

    // Fetch cities when district selected
    useEffect(() => {
        if (!selectedState || !selectedDistrict) { setCities([]); setSelectedCityId(''); return; }
        axios.get(`${API}/cities/cities?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`)
            .then(r => { setCities(r.data); setSelectedCityId(''); })
            .catch(() => { });
    }, [selectedDistrict]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlertMsg(null);
        if (!selectedCityId) return setAlertMsg('Please select your state, district, and city.');
        try {
            if (role === 'citizen') {
                await registerCitizen(name, email, password, selectedCityId);
                navigate(ROLE_REDIRECT.citizen);
            } else if (role === 'partner') {
                await registerPartner(name, email, password, selectedCityId);
                setSubmitted(true);
            } else if (role === 'admin') {
                if (!adminCode) return setAlertMsg('Admin registration code is required.');
                const { data } = await axios.post(`${API}/auth/register-admin`, {
                    name, email, password, cityId: selectedCityId, adminCode
                });
                // Save to localStorage + navigate
                localStorage.setItem('ecocity_user', JSON.stringify(data));
                localStorage.setItem('ecocity_token', data.token);
                navigate(ROLE_REDIRECT.admin);
                window.location.reload(); // sync auth context
            }
        } catch (err) {
            setAlertMsg(err.response?.data?.message || err.message);
        }
    };

    if (submitted) {
        return (
            <div className="auth-wrapper">
                <div className="auth-card text-center" style={{ maxWidth: 480 }}>
                    <div className="mb-4">
                        <div style={{ width: 72, height: 72, background: '#fff3cd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Clock size={36} color="#856404" />
                        </div>
                        <h3 className="fw-bold">Application Submitted!</h3>
                        <p className="text-muted mt-2">
                            Your <strong>partner application</strong> is under review by the <strong>{selectedDistrict} Municipality Administration</strong>.
                            You will receive an email at <strong>{email}</strong> once approved.
                        </p>
                    </div>
                    <div className="p-3 rounded-3 text-start mb-4" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                        <p className="small fw-bold mb-2 text-eco">📍 Your City</p>
                        <p className="small text-muted mb-0">{cities.find(c => c._id === selectedCityId)?.city}, {selectedDistrict}, {selectedState}</p>
                    </div>
                    <div className="p-3 rounded-3 text-start mb-4" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                        <p className="small fw-bold mb-2">Review Process:</p>
                        <div className="d-flex align-items-center gap-2 mb-2 small text-muted"><CheckCircle size={16} color="#28a745" /> Application submitted</div>
                        <div className="d-flex align-items-center gap-2 mb-2 small text-muted"><CheckCircle size={16} color="#dee2e6" /> City admin reviews your application</div>
                        <div className="d-flex align-items-center gap-2 small text-muted"><CheckCircle size={16} color="#dee2e6" /> Approval email sent to you</div>
                    </div>
                    <Link to="/login" className="btn btn-eco w-100 py-2 fw-semibold">Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card" style={{ maxWidth: 480 }}>
                <div className="text-center mb-4">
                    <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#28a745,#20c997)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Leaf size={28} color="white" />
                    </div>
                    <h3 className="fw-bold">Create Account</h3>
                    <p className="text-muted small">
                        Already have an account? <Link to="/login" className="text-eco fw-semibold text-decoration-none">Sign in →</Link>
                    </p>
                </div>

                {alertMsg && <Alert variant="danger" className="small py-2 mb-3">{alertMsg}</Alert>}

                <Form onSubmit={handleSubmit}>
                    {/* Role Selection */}
                    <Form.Group className="mb-3">
                        <Form.Label>I am registering as</Form.Label>
                        <Form.Select value={role} onChange={e => { setRole(e.target.value); setAlertMsg(null); }}>
                            <option value="citizen">👤 Citizen – Report garbage in my area</option>
                            <option value="partner">🚛 Partner – Waste collection crew</option>
                            <option value="admin">🏛️ Municipality Head (Admin)</option>
                        </Form.Select>
                        {role === 'partner' && (
                            <div className="mt-2 p-2 rounded-2 small" style={{ background: '#fff3cd', border: '1px solid #ffc107', color: '#856404' }}>
                                ⏳ Partner accounts require <strong>City Admin approval</strong> before you can login.
                            </div>
                        )}
                        {role === 'admin' && (
                            <div className="mt-2 p-2 rounded-2 small d-flex align-items-start gap-2" style={{ background: '#e8f4fd', border: '1px solid #93c5fd', color: '#1e40af' }}>
                                <Shield size={15} className="mt-1 flex-shrink-0" />
                                <span>Municipality Head accounts require a <strong>secure registration code</strong> issued by the system administrator. Each city can have only one admin.</span>
                            </div>
                        )}
                    </Form.Group>

                    {/* Name & Email */}
                    <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password {role === 'admin' && <span className="text-muted small">(min. 8 chars)</span>}</Form.Label>
                        <Form.Control type="password" placeholder={role === 'admin' ? 'Min. 8 characters' : 'Min. 6 characters'} value={password} onChange={e => setPassword(e.target.value)} required minLength={role === 'admin' ? 8 : 6} />
                    </Form.Group>

                    {/* Cascading Location Dropdowns */}
                    <div className="mb-3 p-3 rounded-3" style={{ background: '#f8fafb', border: '1px solid #e5e7eb' }}>
                        <p className="fw-semibold small mb-2 text-eco">📍 Your Location</p>
                        <Form.Group className="mb-2">
                            <Form.Label className="small">State</Form.Label>
                            <Form.Select value={selectedState} onChange={e => setSelectedState(e.target.value)} required>
                                <option value="">— Select State —</option>
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label className="small">District</Form.Label>
                            <Form.Select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} disabled={!selectedState} required>
                                <option value="">— Select District —</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="small">City / Town</Form.Label>
                            <Form.Select value={selectedCityId} onChange={e => setSelectedCityId(e.target.value)} disabled={!selectedDistrict} required>
                                <option value="">— Select City —</option>
                                {cities.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.city}{c.admin ? ' ✓ Admin assigned' : ''}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {states.length === 0 && (
                            <p className="small text-muted mt-2 mb-0">
                                ⚠️ No cities found. Run <code>npm run seed-cities</code> in backend to add them.
                            </p>
                        )}
                    </div>

                    {/* Admin Code */}
                    {role === 'admin' && (
                        <Form.Group className="mb-3">
                            <Form.Label>Admin Registration Code</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter the secure code provided to you"
                                value={adminCode}
                                onChange={e => setAdminCode(e.target.value)}
                                required
                            />
                            <Form.Text className="text-muted small">This code is provided by the system administrator to authorized municipality heads only.</Form.Text>
                        </Form.Group>
                    )}

                    <Button type="submit" className="btn-eco w-100 py-2 fw-semibold rounded-3 mt-2" disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" className="me-2" /> : null}
                        {role === 'citizen' ? 'Create Citizen Account'
                            : role === 'partner' ? 'Submit Partner Application'
                                : 'Register as Municipality Head'}
                    </Button>
                </Form>
            </div>
        </div>
    );
};

export default Register;
