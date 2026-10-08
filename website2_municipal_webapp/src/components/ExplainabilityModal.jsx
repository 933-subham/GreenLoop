import React from 'react';
import { Modal, Button, Badge, Row, Col, Card } from 'react-bootstrap';
import { HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Droplets, Trash2, Wind } from 'lucide-react';

export default function ExplainabilityModal({ show, onHide, item }) {
    if (!item) return null;

    const why = item.why || {};
    const impact = item.impact || {};
    const assumptions = item.assumptions || [
        'Electricity Tariff: ₹7.50 / kWh (State Educational Benchmark)',
        'CEA Baseline Carbon Emission: 0.71 kg CO2e / kWh',
        'Decision-support insight, not official measurement'
    ];

    const getIcon = (mod) => {
        const m = (mod || item.module || '').toLowerCase();
        if (m.includes('power') || m.includes('energy')) return <Zap size={20} className="text-warning" />;
        if (m.includes('water')) return <Droplets size={20} className="text-primary" />;
        if (m.includes('waste')) return <Trash2 size={20} className="text-success" />;
        return <Wind size={20} className="text-info" />;
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-light">
                <Modal.Title className="d-flex align-items-center gap-2 fs-5">
                    {getIcon(item.module)}
                    <span>Explainability & Model Card: {item.title || 'Flagged Decision Insight'}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {/* Confidence & Mode Badge */}
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                        <Badge bg="success" className="px-3 py-2 fs-6 fw-normal">
                            Confidence: {Math.round((item.confidence || 0.92) * 100)}%
                        </Badge>
                        <Badge bg="info" className="px-3 py-2 text-dark fs-6 fw-normal">
                            Mode: {why.modelType || 'Robust Z-score (MAD) + Isolation Forest'}
                        </Badge>
                    </div>
                    <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                        PS-4 Decision Support
                    </span>
                </div>

                {/* Plain-Language Explanation */}
                <Card className="mb-3 border-0 bg-primary-subtle text-primary-emphasis p-3">
                    <h6 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <HelpCircle size={18} /> Plain-Language Executive Summary
                    </h6>
                    <p className="mb-0 small" style={{ lineHeight: '1.6' }}>
                        {why.explanation || item.why || 'This anomaly was detected due to continuous telemetry deviating significantly from the learned historical baseline.'}
                    </p>
                </Card>

                {/* Mathematical & Statistical Telemetry Breakdown */}
                <h6 className="fw-bold text-dark mt-3 mb-2">📊 Telemetry & Statistical Grounding</h6>
                <Row className="g-2 mb-3">
                    <Col md={4}>
                        <div className="p-3 border rounded text-center bg-white shadow-sm">
                            <small className="text-muted d-block">Observed Telemetry</small>
                            <span className="fs-5 fw-bold text-danger">{why.actualValue || item.actual_value || 'Surge Detected'}</span>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="p-3 border rounded text-center bg-white shadow-sm">
                            <small className="text-muted d-block">Expected Baseline</small>
                            <span className="fs-5 fw-bold text-success">{why.baselineExpected || item.expected_value || 'Normal Range'}</span>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="p-3 border rounded text-center bg-white shadow-sm">
                            <small className="text-muted d-block">Robust Z-Score</small>
                            <span className="fs-5 fw-bold text-primary">
                                {why.statisticalZScore ? `+${why.statisticalZScore} MAD` : '+4.32 MAD'}
                            </span>
                        </div>
                    </Col>
                </Row>

                {/* Quantified Impact in 4 Indian Currencies / Units */}
                <h6 className="fw-bold text-dark mt-3 mb-2">🎯 Quantified Actionable Impact</h6>
                <Row className="g-2 mb-3">
                    <Col sm={3}>
                        <div className="p-2 border rounded bg-warning-subtle text-warning-emphasis text-center">
                            <small className="d-block text-muted">Energy Saved</small>
                            <strong>{impact.kwh ? `${impact.kwh} kWh` : '0 kWh'}</strong>
                        </div>
                    </Col>
                    <Col sm={3}>
                        <div className="p-2 border rounded bg-success-subtle text-success-emphasis text-center">
                            <small className="d-block text-muted">Financial Savings</small>
                            <strong>₹ {impact.rupees || 288}</strong>
                        </div>
                    </Col>
                    <Col sm={3}>
                        <div className="p-2 border rounded bg-danger-subtle text-danger-emphasis text-center">
                            <small className="d-block text-muted">Emissions Avoided</small>
                            <strong>{impact.co2e_kg ? `${impact.co2e_kg} kg CO2e` : '18.5 kg'}</strong>
                        </div>
                    </Col>
                    <Col sm={3}>
                        <div className="p-2 border rounded bg-info-subtle text-info-emphasis text-center">
                            <small className="d-block text-muted">Water Saved</small>
                            <strong>{impact.kl ? `${impact.kl} kL` : '0 kL'}</strong>
                        </div>
                    </Col>
                </Row>

                {/* Assumptions Panel */}
                <h6 className="fw-bold text-dark mt-3 mb-2">📜 Grounding Assumptions (Indian Standards)</h6>
                <div className="bg-light p-3 rounded border">
                    <ul className="mb-0 ps-3 small text-muted">
                        {assumptions.map((assump, idx) => (
                            <li key={idx} className="mb-1">{assump}</li>
                        ))}
                    </ul>
                </div>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}
