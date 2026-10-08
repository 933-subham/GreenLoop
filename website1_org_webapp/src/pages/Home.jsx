import React, { Suspense, useState } from 'react';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import {
    AlertCircle, MapPin, Recycle, Award, TrendingUp, ChevronRight,
    Trash2, Leaf, Phone, Mail, CheckCircle, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroScene from '../threejs/HeroScene';

const steps = [
    { n: '01', title: 'Report Garbage', desc: 'Citizens use the app to photograph and report waste with GPS location, waste type, and images.', icon: <AlertCircle size={24} color="#28a745" /> },
    { n: '02', title: 'Assign to Partner', desc: 'Municipality admin assigns the report to a registered waste collection partner in the area.', icon: <Trash2 size={24} color="#0d6efd" /> },
    { n: '03', title: 'Clean & Earn', desc: 'Partner cleans and uploads proof. Citizen gets Eco Coins for each completed report!', icon: <Award size={24} color="#ffc107" /> },
];

const features = [
    { icon: '📱', title: 'Report in Seconds', desc: 'Photograph waste, auto-capture GPS, and submit with one tap.', bg: '#e6f4ea' },
    { icon: '🏆', title: 'Eco Coin Rewards', desc: 'Earn coins for every verified cleanup. Top reporters win city-wide recognition.', bg: '#fff3cd' },
    { icon: '🗺️', title: 'Live City Map', desc: 'Real-time garbage heatmap for admins to monitor city cleanliness at a glance.', bg: '#e8f4fd' },
    { icon: '🚛', title: 'Partner Network', desc: 'Verified waste collectors accept and complete tasks with route optimization.', bg: '#fde8e8' },
    { icon: '📧', title: 'Email Notifications', desc: 'Instant alerts for report submissions, assignments, and completions.', bg: '#f3e8ff' },
    { icon: '📊', title: 'Analytics Dashboard', desc: 'Municipality gets full analytics – waste collected, carbon saved, city metrics.', bg: '#e0f7fa' },
];

const stats = [
    { n: '50,000+', label: 'Reports Resolved' },
    { n: '2,400+', label: 'Active Citizens' },
    { n: '380+', label: 'Collection Partners' },
    { n: '12 MT', label: 'Waste Recycled' },
];

const ContactSection = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            setStatus({ ok: res.ok, msg: data.message });
            if (res.ok) setForm({ name: '', email: '', subject: '', message: '' });
        } catch {
            setStatus({ ok: false, msg: 'Failed to send. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-5" style={{ background: 'white' }}>
            <Container>
                <Row className="justify-content-center mb-5">
                    <Col md={8} className="text-center">
                        <span className="section-badge mb-3 d-inline-block">Get In Touch</span>
                        <h2 className="section-title mb-3">Contact Municipality Administration</h2>
                        <p className="text-muted">Have questions or need support? Send us a message and we'll respond within 24-48 hours.</p>
                    </Col>
                </Row>
                <Row className="gy-4 justify-content-center">
                    <Col lg={7}>
                        <Card className="eco-card border-0 p-4">
                            {status && (
                                <div className={`alert ${status.ok ? 'alert-success' : 'alert-danger'} py-2 small mb-4`}>
                                    {status.msg}
                                </div>
                            )}
                            <Form onSubmit={handleSubmit}>
                                <Row className="gy-3">
                                    <Col md={6}>
                                        <Form.Label>Full Name</Form.Label>
                                        <Form.Control placeholder="Your name" value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })} required />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Email Address</Form.Label>
                                        <Form.Control type="email" placeholder="you@example.com" value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })} required />
                                    </Col>
                                    <Col md={12}>
                                        <Form.Label>Subject</Form.Label>
                                        <Form.Control placeholder="How can we help?" value={form.subject}
                                            onChange={e => setForm({ ...form, subject: e.target.value })} required />
                                    </Col>
                                    <Col md={12}>
                                        <Form.Label>Message</Form.Label>
                                        <Form.Control as="textarea" rows={4} placeholder="Describe your query..." value={form.message}
                                            onChange={e => setForm({ ...form, message: e.target.value })} required />
                                    </Col>
                                    <Col md={12}>
                                        <Button type="submit" className="btn-eco px-5 py-2 fw-semibold" disabled={loading}>
                                            {loading ? 'Sending...' : 'Send Message →'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <div className="d-flex flex-column gap-3 h-100">
                            {[
                                { icon: <MapPin size={22} color="#28a745" />, t: 'Office', v: 'City Hall, Smart District, Block-A' },
                                { icon: <Phone size={22} color="#28a745" />, t: 'Helpline', v: '1800-CLEAN-CITY (Free)' },
                                { icon: <Mail size={22} color="#28a745" />, t: 'Email', v: 'support@ecocity.gov' },
                            ].map((c, i) => (
                                <div key={i} className="eco-card p-4 d-flex align-items-start gap-3">
                                    <div style={{ background: '#e6f4ea', padding: 12, borderRadius: 12 }}>{c.icon}</div>
                                    <div>
                                        <p className="mb-0 fw-bold small">{c.t}</p>
                                        <p className="mb-0 text-muted small">{c.v}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default function Home() {
    return (
        <div>
            {/* Hero */}
            <section className="hero-section">
                <Container>
                    <Row className="align-items-center gy-5">
                        <Col lg={6}>
                            <div className="pe-lg-3">
                                <span className="section-badge mb-3 d-inline-block">🌿 Smart City Initiative</span>
                                <h1 className="hero-title mb-4">
                                    Smart Waste Management<br />for a <span className="text-eco">Cleaner City</span>
                                </h1>
                                <p className="text-muted mb-5" style={{ fontSize: '1.1rem', maxWidth: 480 }}>
                                    Report garbage. Earn eco coins. Help clean the city. Join India's leading smart city waste management initiative.
                                </p>
                                <div className="d-flex flex-wrap gap-3">
                                    <Link to="/register" className="btn btn-eco px-5 py-3 fw-semibold rounded-3 d-flex align-items-center gap-2">
                                        <AlertCircle size={18} /> Report Garbage
                                    </Link>
                                    <Link to="/login" className="btn btn-eco-outline px-5 py-3 fw-semibold rounded-3 d-flex align-items-center gap-2" style={{ borderRadius: '0.75rem' }}>
                                        <MapPin size={18} /> View Dashboard
                                    </Link>
                                </div>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="hero-canvas-wrapper">
                                <Suspense fallback={
                                    <div className="d-flex align-items-center justify-content-center h-100">
                                        <div className="text-center">
                                            <div className="spinner-border text-eco" style={{ width: 36, height: 36 }} />
                                            <p className="text-muted small mt-3 font-monospace">INITIALIZING 3D ENGINE...</p>
                                        </div>
                                    </div>
                                }>
                                    <HeroScene />
                                </Suspense>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Stats */}
            <section className="py-5" style={{ background: 'white' }}>
                <Container>
                    <Row className="gy-4">
                        {stats.map((s, i) => (
                            <Col key={i} sm={6} lg={3}>
                                <div className="stat-card">
                                    <div className="stat-number">{s.n}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* How It Works */}
            <section className="py-5" style={{ background: '#f8fafb' }}>
                <Container>
                    <Row className="justify-content-center mb-5">
                        <Col md={8} className="text-center">
                            <span className="section-badge mb-3 d-inline-block">How It Works</span>
                            <h2 className="section-title">Simple 3-Step Process</h2>
                        </Col>
                    </Row>
                    <Row className="gy-4">
                        {steps.map((s, i) => (
                            <Col key={i} md={4}>
                                <div className="eco-card eco-card-hover p-4 h-100">
                                    <div className="d-flex align-items-start gap-3 mb-3">
                                        <div className="step-number">{s.n}</div>
                                        <div className="mt-1">{s.icon}</div>
                                    </div>
                                    <h5 className="fw-bold mb-2">{s.title}</h5>
                                    <p className="text-muted small mb-0">{s.desc}</p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Features */}
            <section className="py-5" style={{ background: 'white' }}>
                <Container>
                    <Row className="justify-content-center mb-5">
                        <Col md={8} className="text-center">
                            <span className="section-badge mb-3 d-inline-block">Features</span>
                            <h2 className="section-title">Everything You Need</h2>
                            <p className="text-muted mt-2">A complete platform for citizens, waste collectors, and municipality administrators.</p>
                        </Col>
                    </Row>
                    <Row className="gy-4">
                        {features.map((f, i) => (
                            <Col key={i} sm={6} lg={4}>
                                <div className="eco-card eco-card-hover p-4 h-100">
                                    <div className="feature-icon-wrap" style={{ background: f.bg }}>
                                        <span style={{ fontSize: '1.75rem' }}>{f.icon}</span>
                                    </div>
                                    <h5 className="fw-bold mb-2">{f.title}</h5>
                                    <p className="text-muted small mb-0">{f.desc}</p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Waste Types Guide */}
            <section className="py-5" style={{ background: '#f8fafb' }}>
                <Container>
                    <Row className="justify-content-center mb-5">
                        <Col md={8} className="text-center">
                            <span className="section-badge mb-3 d-inline-block">Segregation Guide</span>
                            <h2 className="section-title">Know Your Waste</h2>
                        </Col>
                    </Row>
                    <Row className="gy-3">
                        {[
                            { color: '#10b981', bg: '#d1fae5', label: 'Organic / Wet Waste', tip: 'Food scraps, vegetable peels, garden waste — goes green bin.' },
                            { color: '#3b82f6', bg: '#dbeafe', label: 'Recyclable / Dry Waste', tip: 'Paper, plastic, glass, metal — goes blue bin.' },
                            { color: '#ef4444', bg: '#fee2e2', label: 'Hazardous Waste', tip: 'Batteries, chemicals, e-waste — special disposal required.' },
                            { color: '#f59e0b', bg: '#fef3c7', label: 'Mixed / Other Waste', tip: 'Cannot be categorized — goes in black bin for processing.' },
                        ].map((w, i) => (
                            <Col key={i} md={6}>
                                <div className="eco-card p-4 d-flex align-items-center gap-4">
                                    <div style={{ width: 56, height: 56, background: w.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Recycle size={28} color={w.color} />
                                    </div>
                                    <div>
                                        <p className="fw-bold mb-1" style={{ color: w.color }}>{w.label}</p>
                                        <p className="text-muted small mb-0">{w.tip}</p>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Roles Explainer */}
            <section className="py-5" style={{ background: 'white' }}>
                <Container>
                    <Row className="justify-content-center mb-5">
                        <Col md={8} className="text-center">
                            <span className="section-badge mb-3 d-inline-block">Who Uses EcoCity</span>
                            <h2 className="section-title">Built for Everyone</h2>
                        </Col>
                    </Row>
                    <Row className="gy-4">
                        {[
                            { role: 'Citizen', emoji: '👤', color: '#10b981', bg: '#d1fae5', desc: 'Residents who report garbage, track cleanup status, and earn Eco Coins.', actions: ['Report garbage with photo', 'Track report status', 'Earn Eco Coins', 'Find recycling centers'] },
                            { role: 'Partner', emoji: '🚛', color: '#3b82f6', bg: '#dbeafe', desc: 'Waste collection crews who accept tasks and complete cleanups.', actions: ['View assigned tasks', 'Accept or reject tasks', 'Navigate to location', 'Upload cleanup proof'] },
                            { role: 'Admin', emoji: '🏛️', color: '#ef4444', bg: '#fee2e2', desc: 'Municipality Head who manages the entire system and approves partners.', actions: ['Approve partner collectors', 'View city heatmap', 'Manage all users', 'Export reports as CSV'] },
                        ].map((r, i) => (
                            <Col key={i} md={4}>
                                <div className="eco-card eco-card-hover p-4 h-100">
                                    <div className="mb-3" style={{ fontSize: '2.5rem' }}>{r.emoji}</div>
                                    <h5 className="fw-bold mb-1">{r.role}</h5>
                                    <p className="text-muted small mb-3">{r.desc}</p>
                                    <ul className="list-unstyled mb-0">
                                        {r.actions.map((a, j) => (
                                            <li key={j} className="d-flex align-items-center gap-2 mb-2 small">
                                                <CheckCircle size={15} color={r.color} /> {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            <ContactSection />

            {/* CTA Banner */}
            <section className="py-5" style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}>
                <Container className="text-center text-white">
                    <h2 className="fw-bold mb-3" style={{ fontSize: '2rem' }}>Ready to Make Your City Cleaner?</h2>
                    <p className="mb-4 opacity-90">Join thousands of citizens already making a difference.</p>
                    <Link to="/register" className="btn btn-light px-5 py-3 fw-semibold text-eco rounded-3">
                        Join EcoCity Now <ChevronRight size={18} />
                    </Link>
                </Container>
            </section>
        </div>
    );
}
