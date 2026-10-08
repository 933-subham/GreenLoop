import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterCitizen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alertMsg, setAlertMsg] = useState(null);
    const { registerCitizen, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlertMsg(null);
        try {
            await registerCitizen(name, email, password);
            navigate('/citizen/dashboard');
        } catch (err) {
            setAlertMsg(err.message);
        }
    };

    return (
        <Container className="min-vh-100-custom d-flex align-items-center justify-content-center py-5">
            <Card className="eco-card border-0 w-100" style={{ maxWidth: 420, padding: '2rem' }}>
                <div className="text-center mb-4">
                    <Leaf size={48} className="text-eco mb-2" />
                    <h2 className="fw-bolder text-dark">Citizen Registration</h2>
                    <p className="text-muted small">
                        Already have an account?{' '}
                        <Link to="/login" className="text-eco fw-medium text-decoration-none">Sign in</Link>
                    </p>
                    <p className="text-muted small">
                        Registering as a waste collector?{' '}
                        <Link to="/register/partner" className="text-eco fw-medium text-decoration-none">Partner Registration →</Link>
                    </p>
                </div>

                {alertMsg && <Alert variant="danger" className="small py-2">{alertMsg}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Control type="text" placeholder="Full Name" value={name}
                            onChange={e => setName(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Control type="email" placeholder="Email address" value={email}
                            onChange={e => setEmail(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Control type="password" placeholder="Password (min 6 chars)" value={password}
                            onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </Form.Group>
                    <Button type="submit" className="btn-eco w-100 py-2 fw-semibold" disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : 'Create Citizen Account'}
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default RegisterCitizen;
