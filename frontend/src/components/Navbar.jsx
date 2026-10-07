import React from 'react';
import { Navbar, Container, Nav, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { citizen: 'Citizen', partner: 'Partner', admin: 'Admin' };
const ROLE_COLORS = { citizen: '#10b981', partner: '#3b82f6', admin: '#ef4444' };
const ROLE_DASH = { citizen: '/citizen/dashboard', partner: '/partner/dashboard', admin: '/admin/dashboard' };

const Navigation = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <Navbar expand="lg" className="eco-navbar sticky-top">
            <Container>
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 text-decoration-none">
                    <div style={{ background: 'linear-gradient(135deg,#28a745,#20c997)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf size={20} color="white" />
                    </div>
                    <span className="fw-bold fs-5 text-dark">EcoCity</span>
                    <span className="d-none d-md-inline text-muted" style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '1px', borderLeft: '1px solid #dee2e6', paddingLeft: '0.5rem', marginLeft: '0.1rem' }}>
                        SMART WASTE
                    </span>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="eco-nav" />
                <Navbar.Collapse id="eco-nav" className="justify-content-end">
                    <Nav className="align-items-center gap-1">
                        {!user ? (
                            <>
                                <Nav.Link as={Link} to="/#how-it-works" className="nav-link">How it Works</Nav.Link>
                                <Nav.Link as={Link} to="/#features" className="nav-link">Features</Nav.Link>
                                <Nav.Link as={Link} to="/login" className="nav-link">Login</Nav.Link>
                                <Link to="/register" className="btn btn-eco px-4 py-2 rounded-3 fw-semibold ms-2" style={{ fontSize: '0.9rem' }}>
                                    Register Free
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill me-2"
                                    style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: ROLE_COLORS[user.role] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={14} color={ROLE_COLORS[user.role]} />
                                    </div>
                                    <span className="fw-semibold small text-dark">{user.name}</span>
                                    <span className="badge rounded-pill text-white fw-semibold" style={{ background: ROLE_COLORS[user.role], fontSize: '0.68rem' }}>
                                        {ROLE_LABELS[user.role]}
                                    </span>
                                </div>
                                <Nav.Link as={Link} to={ROLE_DASH[user.role]} className="d-flex align-items-center gap-1 fw-medium nav-link">
                                    <LayoutDashboard size={16} /> Dashboard
                                </Nav.Link>
                                <Button variant="light" size="sm" onClick={() => { logout(); navigate('/login'); }}
                                    className="d-flex align-items-center gap-1 border fw-medium ms-1" style={{ fontSize: '0.85rem' }}>
                                    <LogOut size={15} className="text-danger" /> Logout
                                </Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Navigation;
