import React, { useState } from 'react';
import { Container, Form, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { Leaf, UserCheck, Shield, Zap, Truck, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_REDIRECT = {
    citizen: '/citizen/dashboard',
    partner: '/partner/dashboard',
    driver: '/driver',
    admin: '/admin/dashboard',
    warden: '/warden',
    sustainability_officer: '/sustainability',
    municipality_admin: '/municipality'
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alertMsg, setAlertMsg] = useState(null);
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlertMsg(null);
        try {
            const user = await login(email, password);
            navigate(ROLE_REDIRECT[user.role] || '/admin/dashboard');
        } catch (err) {
            setAlertMsg(err.message);
        }
    };

    const handleQuickLogin = async (demoEmail, demoRole) => {
        setEmail(demoEmail);
        setPassword('Demo@1234');
        setAlertMsg(null);
        try {
            const user = await login(demoEmail, 'Demo@1234');
            navigate(ROLE_REDIRECT[demoRole || user.role] || '/admin/dashboard');
        } catch (err) {
            setAlertMsg(err.message);
        }
    };

    return (
        <div className="auth-wrapper py-5">
            <div className="auth-card" style={{ maxWidth: '520px' }}>
                <div className="text-center mb-4">
                    <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Leaf size={28} color="white" />
                    </div>
                    <h3 className="fw-bold">Sign In to GreenLoop</h3>
                    <p className="text-muted small">
                        Sustainable Facility & Estate Intelligence Platform (PS-4)
                    </p>
                </div>

                {alertMsg && <Alert variant="danger" className="small py-2 mb-3">{alertMsg}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Email Address</Form.Label>
                        <Form.Control type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label className="small fw-semibold">Password</Form.Label>
                        <Form.Control type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </Form.Group>
                    <Button type="submit" variant="success" className="w-100 py-2 fw-semibold rounded-3 mb-3" disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" className="me-2" /> : null}
                        Sign In
                    </Button>
                </Form>

                {/* 1-Click Hackathon Evaluator Login Panel */}
                <div className="p-3 rounded-3 border bg-light mt-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <small className="fw-bold text-dark d-flex align-items-center gap-1">
                            <UserCheck size={16} className="text-success" /> 1-Click Hackathon Demo Logins:
                        </small>
                        <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>Password: Demo@1234</Badge>
                    </div>
                    <Row className="g-2">
                        <Col xs={6}>
                            <Button
                                variant="outline-success"
                                size="sm"
                                className="w-100 text-start py-1 small"
                                onClick={() => handleQuickLogin('head@college.demo', 'admin')}
                            >
                                🎓 <strong>Campus Admin</strong>
                            </Button>
                        </Col>
                        <Col xs={6}>
                            <Button
                                variant="outline-warning"
                                size="sm"
                                className="w-100 text-start py-1 small text-dark"
                                onClick={() => handleQuickLogin('warden@college.demo', 'warden')}
                            >
                                🛡️ <strong>Hostel Warden</strong>
                            </Button>
                        </Col>
                        <Col xs={6}>
                            <Button
                                variant="outline-info"
                                size="sm"
                                className="w-100 text-start py-1 small text-dark"
                                onClick={() => handleQuickLogin('officer@college.demo', 'sustainability_officer')}
                            >
                                🍃 <strong>Sustainability Officer</strong>
                            </Button>
                        </Col>
                        <Col xs={6}>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="w-100 text-start py-1 small"
                                onClick={() => handleQuickLogin('admin@municipal.demo', 'municipality_admin')}
                            >
                                🏛️ <strong>Municipal Head</strong>
                            </Button>
                        </Col>
                        <Col xs={6}>
                            <Button
                                variant="outline-dark"
                                size="sm"
                                className="w-100 text-start py-1 small"
                                onClick={() => handleQuickLogin('driver1@municipal.demo', 'driver')}
                            >
                                🚛 <strong>Municipal Driver</strong>
                            </Button>
                        </Col>
                        <Col xs={6}>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="w-100 text-start py-1 small"
                                onClick={() => handleQuickLogin('student@college.demo', 'citizen')}
                            >
                                👤 <strong>Student / Citizen</strong>
                            </Button>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
};

export default Login;
