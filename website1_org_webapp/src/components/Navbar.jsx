import React from 'react';
import { Navbar, Container, Nav, Button, Badge, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, LogOut, User, LayoutDashboard, Sliders, Shield, Truck, Zap, HelpCircle, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFacility, FACILITY_PRESETS } from '../context/FacilityContext';

export default function Navigation() {
    const { user, logout } = useAuth();
    const { activeFacilityId, activePreset, switchFacility } = useFacility();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Navbar expand="lg" className="eco-navbar sticky-top bg-white border-bottom shadow-sm py-2">
            <Container fluid className="px-3 px-lg-4">
                {/* Brand & Badge */}
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 text-decoration-none">
                    <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf size={20} color="white" />
                    </div>
                    <div>
                        <span className="fw-bold fs-5 text-dark">GreenLoop</span>
                        <span className="badge bg-success-subtle text-success ms-2 small fw-semibold" style={{ fontSize: '0.65rem' }}>
                            PS-4 BPUT
                        </span>
                    </div>
                </Navbar.Brand>

                {/* Facility Template Switcher Dropdown (20% Marks Criterion) */}
                <div className="d-flex align-items-center gap-1 mx-2">
                    <NavDropdown
                        title={<span className="small fw-bold text-dark">{activePreset?.badge || '🎓 College'}</span>}
                        id="facility-switcher-dropdown"
                        className="border rounded-pill px-2 py-1 bg-light shadow-sm"
                    >
                        <NavDropdown.Header className="small fw-bold text-muted">
                            Switch Facility Profile (India-Specific Templates)
                        </NavDropdown.Header>
                        {FACILITY_PRESETS.map((p) => (
                            <NavDropdown.Item
                                key={p.id}
                                active={p.id === activeFacilityId}
                                onClick={() => switchFacility(p.id)}
                                className="small d-flex align-items-center justify-content-between py-2"
                            >
                                <span>{p.badge}</span>
                                <small className="text-muted ms-3">₹{p.tariff}/kWh</small>
                            </NavDropdown.Item>
                        ))}
                    </NavDropdown>
                </div>

                <Navbar.Toggle aria-controls="greenloop-nav" />
                <Navbar.Collapse id="greenloop-nav" className="justify-content-end">
                    <Nav className="align-items-center gap-1">
                        {/* Portals & Role Views */}
                        <Nav.Link as={Link} to="/org" className={`small fw-bold nav-link ${location.pathname.startsWith('/org') || location.pathname.startsWith('/admin') ? 'text-success' : 'text-dark'}`}>
                            🏢 OrgPortal (Web 1)
                        </Nav.Link>
                        <Nav.Link as={Link} to="/municipality" className={`small fw-bold nav-link ${location.pathname === '/municipality' ? 'text-primary' : 'text-dark'}`}>
                            🏛️ MunicipalPortal (Web 2)
                        </Nav.Link>
                        <Nav.Link as={Link} to="/warden" className={`small fw-semibold nav-link ${location.pathname === '/warden' ? 'text-warning-emphasis fw-bold' : ''}`}>
                            🛡️ Warden Cockpit
                        </Nav.Link>
                        <Nav.Link as={Link} to="/driver" className={`small fw-semibold nav-link ${location.pathname === '/driver' ? 'text-info-emphasis fw-bold' : ''}`}>
                            🚛 Driver Cockpit
                        </Nav.Link>
                        <Nav.Link as={Link} to="/sustainability" className={`small fw-semibold nav-link ${location.pathname === '/sustainability' ? 'text-success fw-bold' : ''}`}>
                            🌱 Sustainability & AI
                        </Nav.Link>
                        <Nav.Link as={Link} to="/citizen/dashboard" className={`small fw-semibold nav-link ${location.pathname.startsWith('/citizen') ? 'text-success fw-bold' : ''}`}>
                            👥 Student / Public
                        </Nav.Link>


                        {/* User Profile / Auth */}
                        {!user ? (
                            <Link to="/login" className="btn btn-success btn-sm rounded-pill px-3 py-1 fw-semibold ms-2" style={{ fontSize: '0.85rem' }}>
                                Login
                            </Link>
                        ) : (
                            <div className="d-flex align-items-center gap-2 ms-2">
                                <span className="badge bg-light text-dark border small fw-semibold px-2 py-1">
                                    {user.name.split(' ')[0]} ({user.role})
                                </span>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => { logout(); navigate('/login'); }}
                                    className="p-1 px-2 border-0"
                                    title="Logout"
                                >
                                    <LogOut size={16} className="text-danger" />
                                </Button>
                            </div>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
