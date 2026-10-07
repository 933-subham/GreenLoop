import React, { useState } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_REDIRECT = { citizen: '/citizen/dashboard', partner: '/partner/dashboard', admin: '/admin/dashboard' };

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
            navigate(ROLE_REDIRECT[user.role] || '/');
        } catch (err) {
            setAlertMsg(err.message);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="text-center mb-4">
                    <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#28a745,#20c997)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Leaf size={28} color="white" />
                    </div>
                    <h3 className="fw-bold">Welcome Back</h3>
                    <p className="text-muted small">
                        New here? <Link to="/register" className="text-eco fw-semibold text-decoration-none">Create account →</Link>
                    </p>
                </div>

                {alertMsg && <Alert variant="danger" className="small py-2 mb-3">{alertMsg}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </Form.Group>
                    <Button type="submit" className="btn-eco w-100 py-2 fw-semibold rounded-3" disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" className="me-2" /> : null}
                        Sign In to EcoCity
                    </Button>
                </Form>

                <div className="mt-4 p-3 rounded-3 small" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="fw-semibold mb-1 text-eco">🔐 Login roles:</p>
                    <p className="mb-0 text-muted">
                        <strong>Citizen</strong> — residents reporting garbage<br />
                        <strong>Partner</strong> — waste collectors (needs admin approval)<br />
                        <strong>Admin</strong> — Municipality Head
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
