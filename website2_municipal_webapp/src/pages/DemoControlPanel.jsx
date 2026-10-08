import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Zap, Droplets, Trash2, Camera, RotateCcw, Play, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DemoControlPanel() {
    const [faults, setFaults] = useState({
        floor3Surge: true,
        tankALeak: true,
        bin4Overflow: true,
        cameraMiss: false
    });
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE}/demo/status`);
            if (res.data.faults) setFaults(res.data.faults);
        } catch (err) {
            console.error('Failed to load demo status:', err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleInject = async (endpoint, msg) => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/demo/${endpoint}`);
            setStatusMsg({ type: 'success', text: msg });
            fetchStatus();
        } catch (err) {
            setStatusMsg({ type: 'danger', text: 'Fault injection failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '92vh', paddingBottom: '4rem' }}>
            <Container className="pt-4" style={{ maxWidth: '920px' }}>
                {/* Header */}
                <div className="bg-white p-3 rounded-3 shadow-sm border mb-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <Badge bg="danger" className="px-2 py-1">Demo Master Control</Badge>
                            <Badge bg="dark" className="px-2 py-1">5-Minute Script Ready</Badge>
                        </div>
                        <h4 className="fw-bold text-dark mb-0">Live Fault Injection & Presentation Console</h4>
                        <small className="text-muted">Inject and reset live simulated IoT faults during the BPUT hackathon pitch.</small>
                    </div>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleInject('reset', '✅ All faults reset to normal operational baseline!')}
                        disabled={loading}
                        className="d-flex align-items-center gap-1 fw-bold"
                    >
                        <RotateCcw size={16} /> Reset All Demo Faults
                    </Button>
                </div>

                {statusMsg && (
                    <Alert variant={statusMsg.type} dismissible onClose={() => setStatusMsg(null)} className="py-2 small">
                        {statusMsg.text}
                    </Alert>
                )}

                {/* 5 Instant Fault Injection Cards */}
                <Row className="g-3 mb-4">
                    {/* 1. Floor 3 Surge */}
                    <Col md={6}>
                        <Card className="border shadow-sm h-100 bg-white">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                    <span className="fw-bold text-dark d-flex align-items-center gap-2">
                                        <Zap size={18} className="text-warning" /> 1. Floor 3 Power Surge
                                    </span>
                                    <Badge bg={faults.floor3Surge ? 'danger' : 'secondary'}>
                                        {faults.floor3Surge ? 'ACTIVE FAULT' : 'NORMAL'}
                                    </Badge>
                                </div>
                                <p className="small text-muted mb-3" style={{ minHeight: '40px' }}>
                                    Spikes Floor 3 power draw to 29.8 kW during weekday class hours (students in academic block). MAD z-score crosses +4.3.
                                </p>
                                <Button
                                    variant={faults.floor3Surge ? 'outline-danger' : 'danger'}
                                    size="sm"
                                    className="w-100 fw-semibold"
                                    onClick={() => handleInject('inject-floor3', '🚨 Injected Floor 3 class-hour power surge!')}
                                    disabled={loading}
                                >
                                    <Play size={14} className="me-1" /> Inject Class-Hour Power Surge
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* 2. Tank A Leak */}
                    <Col md={6}>
                        <Card className="border shadow-sm h-100 bg-white">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                    <span className="fw-bold text-dark d-flex align-items-center gap-2">
                                        <Droplets size={18} className="text-primary" /> 2. Tank A Night Water Leak
                                    </span>
                                    <Badge bg={faults.tankALeak ? 'danger' : 'secondary'}>
                                        {faults.tankALeak ? 'ACTIVE FAULT' : 'NORMAL'}
                                    </Badge>
                                </div>
                                <p className="small text-muted mb-3" style={{ minHeight: '40px' }}>
                                    Triggers 75 L/hr continuous depletion between 01:00 AM - 04:00 AM with pump inactive. Wasting 1,800 L treated water.
                                </p>
                                <Button
                                    variant={faults.tankALeak ? 'outline-primary' : 'primary'}
                                    size="sm"
                                    className="w-100 fw-semibold"
                                    onClick={() => handleInject('inject-tank-leak', '💧 Injected Tank A night-flow water leak!')}
                                    disabled={loading}
                                >
                                    <Play size={14} className="me-1" /> Start Tank A Night Leak
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* 3. Bin 4 Overflow */}
                    <Col md={6}>
                        <Card className="border shadow-sm h-100 bg-white">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                    <span className="fw-bold text-dark d-flex align-items-center gap-2">
                                        <Trash2 size={18} className="text-success" /> 3. Bin 4 Overflow (92% Full)
                                    </span>
                                    <Badge bg={faults.bin4Overflow ? 'danger' : 'secondary'}>
                                        {faults.bin4Overflow ? 'ACTIVE FAULT' : 'NORMAL'}
                                    </Badge>
                                </div>
                                <p className="small text-muted mb-3" style={{ minHeight: '40px' }}>
                                    Canteen Bin #4 fill jumped to 92% with 1.5h until overflow. Pushes item to Admin Verification & Municipal Dispatch queue.
                                </p>
                                <Button
                                    variant={faults.bin4Overflow ? 'outline-success' : 'success'}
                                    size="sm"
                                    className="w-100 fw-semibold"
                                    onClick={() => handleInject('inject-bin-overflow', '🗑️ Injected Bin 4 food court overflow!')}
                                    disabled={loading}
                                >
                                    <Play size={14} className="me-1" /> Fill Bin 4 to 92% (Critical)
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* 4. Camera Miss */}
                    <Col md={6}>
                        <Card className="border shadow-sm h-100 bg-white">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                    <span className="fw-bold text-dark d-flex align-items-center gap-2">
                                        <Camera size={18} className="text-secondary" /> 4. Camera Vision Discrepancy
                                    </span>
                                    <Badge bg={faults.cameraMiss ? 'warning' : 'secondary'}>
                                        {faults.cameraMiss ? 'ACTIVE' : 'NORMAL'}
                                    </Badge>
                                </div>
                                <p className="small text-muted mb-3" style={{ minHeight: '40px' }}>
                                    Simulates a dirty camera lens under-reporting fill % (40%), while student citizen report flags overflowing waste.
                                </p>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="w-100 fw-semibold"
                                    onClick={() => handleInject('inject-camera-miss', '📷 Toggled camera vision discrepancy test!')}
                                    disabled={loading}
                                >
                                    <Play size={14} className="me-1" /> Toggle Camera Miss
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 5-Minute Hackathon Demo Script */}
                <Card className="border shadow-sm bg-white p-4">
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                        <CheckCircle2 size={20} className="text-success" /> 5-Minute Scripted Presentation Flow for Judges
                    </h5>
                    <ol className="ps-3 text-muted small" style={{ lineHeight: '1.8' }}>
                        <li>
                            <strong className="text-dark">Minute 1 (Campus Admin Portal):</strong> Open <Link to="/admin/dashboard" className="text-primary fw-bold">/admin/dashboard</Link>. Show the Sustainability Health Score (82.4/100) and the Top 5 Ranked Actions with quantifiable impact in ₹ INR, kg CO2e, and kWh.
                        </li>
                        <li>
                            <strong className="text-dark">Minute 2 (Power & Water Anomalies):</strong> Show the Floor 3 surge alert during class hours. Click <span className="text-primary fw-bold">"Why Flagged?"</span> to reveal the Robust Z-score (+4.35 MAD) and Gradient Boosting 24h forecast with the Backtest MAPE badge.
                        </li>
                        <li>
                            <strong className="text-dark">Minute 3 (Hostel Warden Mobile Flow):</strong> Open <Link to="/warden" className="text-primary fw-bold">/warden</Link> (responsive at 390px). Demonstrate the warden acknowledging the Floor 3 room cooler alert and recording a resolution note.
                        </li>
                        <li>
                            <strong className="text-dark">Minute 4 (Smart Waste Closed Loop):</strong> In Admin view, verify Bin #4 (92% full) and click <span className="text-success fw-bold">"Confirm Pickup"</span>. Show how it immediately auto-assigns the nearest Municipal Driver on <Link to="/municipality" className="text-primary fw-bold">/municipality</Link> with explainable scoring (distance + load + shift). Then switch to <Link to="/driver" className="text-primary fw-bold">/driver</Link> and upload proof to complete the loop!
                        </li>
                        <li>
                            <strong className="text-dark">Minute 5 (Facility Switcher & Scenario Simulator):</strong> Use the top dropdown to switch from <span className="fw-bold text-success">College Campus</span> to <span className="fw-bold text-primary">Hospital</span> or <span className="fw-bold text-warning">Industrial Estate</span>. Open <Link to="/sustainability" className="text-primary fw-bold">/sustainability</Link>, drag the What-If slider to cut off-hours load by 20%, and see the live monthly ₹26,850 financial and 1,920 kg CO2e savings!
                        </li>
                    </ol>
                </Card>
            </Container>
        </div>
    );
}
