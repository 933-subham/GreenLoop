import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin, Github, Linkedin } from 'lucide-react';

const Footer = () => (
    <footer className="eco-footer py-5 mt-auto">
        <Container>
            <Row className="gy-4 mb-4">
                <Col lg={4}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div style={{ background: 'linear-gradient(135deg,#28a745,#20c997)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Leaf size={18} color="white" />
                        </div>
                        <span className="fw-bold text-white fs-5">EcoCity</span>
                    </div>
                    <p className="small mb-3" style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                        Smart City waste management platform connecting citizens, waste collectors, and municipality administration for a cleaner city.
                    </p>
                    <div className="d-flex gap-3">
                        <a href="#" style={{ color: '#9ca3af', fontSize: '0.85rem' }}><Github size={18} /></a>
                        <a href="#" style={{ color: '#9ca3af', fontSize: '0.85rem' }}><Linkedin size={18} /></a>
                    </div>
                </Col>
                <Col lg={2} md={4}>
                    <p className="fw-bold text-white small mb-3" style={{ letterSpacing: '1px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Platform</p>
                    {[['/', 'Home'], ['/register', 'Register'], ['/login', 'Login'], ['/#features', 'Features']].map(([to, label]) => (
                        <div key={label} className="mb-2"><Link to={to} className="small">{label}</Link></div>
                    ))}
                </Col>
                <Col lg={2} md={4}>
                    <p className="fw-bold text-white small mb-3" style={{ letterSpacing: '1px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Portals</p>
                    {[['Citizen Portal', '/citizen/dashboard'], ['Partner Portal', '/partner/dashboard'], ['Admin Panel', '/admin/dashboard']].map(([label, to]) => (
                        <div key={label} className="mb-2"><Link to={to} className="small">{label}</Link></div>
                    ))}
                </Col>
                <Col lg={4} md={4}>
                    <p className="fw-bold text-white small mb-3" style={{ letterSpacing: '1px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact</p>
                    {[
                        { icon: <MapPin size={14} />, text: 'City Hall, Smart District, Block-A' },
                        { icon: <Phone size={14} />, text: '1800-CLEAN-CITY' },
                        { icon: <Mail size={14} />, text: 'support@ecocity.gov' },
                    ].map((c, i) => (
                        <div key={i} className="d-flex align-items-start gap-2 mb-2 small" style={{ color: '#9ca3af' }}>
                            <span className="mt-1 flex-shrink-0">{c.icon}</span> {c.text}
                        </div>
                    ))}
                </Col>
            </Row>
            <hr style={{ borderColor: '#374151' }} />
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                <p className="small mb-0" style={{ color: '#6b7280' }}>© {new Date().getFullYear()} EcoCity Smart Waste Management. All rights reserved.</p>
                <p className="small mb-0" style={{ color: '#6b7280' }}>Powered by the Smart City Initiative 🌿</p>
            </div>
        </Container>
    </footer>
);

export default Footer;
