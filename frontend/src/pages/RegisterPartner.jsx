import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Leaf, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPartner = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);
    const { registerPartner, loading } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlertMsg(null);
        try {
            await registerPartner(name, email, password);
            setSubmitted(true);
        } catch (err) {
            setAlertMsg(err.message);
        }
    };

    if (submitted) {
        return (
            <Container className="min-vh-100-custom d-flex align-items-center justify-content-center py-5">
                <Card className="eco-card border-0 text-center w-100" style={{ maxWidth: 420, padding: '2.5rem' }}>
                    <Clock size={52} className="text-warning mx-auto mb-3" />
                    <h4 className="fw-bold text-dark mb-2">Registration Submitted!</h4>
                    <p className="text-muted small mb-4">
                        Your partner account is <strong>pending admin approval</strong>. You'll be able to log in once approved.
                    </p>
                    <Link to="/login" className="btn btn-outline-secondary btn-sm rounded-2">Back to Login</Link>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="min-vh-100-custom d-flex align-items-center justify-content-center py-5">
            <Card className="eco-card border-0 w-100" style={{ maxWidth: 420, padding: '2rem' }}>
                <div className="text-center mb-4">
                    <Leaf size={48} className="text-eco mb-2" />
                    <h2 className="fw-bolder text-dark">Partner Registration</h2>
                    <Alert variant="info" className="small py-2 mt-2">
                        Partner accounts require <strong>admin approval</strong> before login.
                    </Alert>
                    <p className="text-muted small">
                        Registering as a citizen?{' '}
                        <Link to="/register/citizen" className="text-eco fw-medium text-decoration-none">Citizen Registration →</Link>
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
                        {loading ? <Spinner size="sm" animation="border" /> : 'Submit Partner Application'}
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default RegisterPartner;
