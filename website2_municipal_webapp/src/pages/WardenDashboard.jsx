import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import { Zap, Droplets, AlertTriangle, CheckCircle, Clock, ShieldAlert, ArrowLeft, RefreshCw, Send, ChevronRight, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useFacility } from '../context/FacilityContext';
import ExplainabilityModal from '../components/ExplainabilityModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function WardenDashboard() {
    const { user } = useAuth();
    const { activeFacilityId, activePreset } = useFacility();

    const [alerts, setAlerts] = useState([]);
    const [powerData, setPowerData] = useState(null);
    const [waterData, setWaterData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);

    // Modal state for notes
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [actionType, setActionType] = useState('resolved');
    const [noteText, setNoteText] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);

    // Explainability modal
    const [explainItem, setExplainItem] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [alertsRes, powerRes, waterRes] = await Promise.all([
                axios.get(`${API_BASE}/actions/alerts?facilityId=${activeFacilityId}`),
                axios.get(`${API_BASE}/analytics/power?facilityId=${activeFacilityId}`),
                axios.get(`${API_BASE}/analytics/water?facilityId=${activeFacilityId}`)
            ]);
            setAlerts(alertsRes.data);
            setPowerData(powerRes.data);
            setWaterData(waterRes.data);
        } catch (err) {
            console.error('Failed to load warden operations data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeFacilityId]);

    const handleQuickAction = async (alertId, status) => {
        setActionLoading(alertId);
        try {
            await axios.put(`${API_BASE}/actions/alerts/${alertId}`, {
                status,
                wardenNotes: `Updated by ${user?.name || 'Warden'} at ${new Date().toLocaleTimeString()}`
            });
            setToastMsg(`Alert successfully marked as ${status.replace('_', ' ')}!`);
            fetchData();
        } catch (err) {
            alert('Failed to update alert status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenNoteModal = (alertItem, type) => {
        setSelectedAlert(alertItem);
        setActionType(type);
        setNoteText('');
        setShowNoteModal(true);
    };

    const handleSubmitNoteAction = async () => {
        if (!selectedAlert) return;
        setActionLoading(selectedAlert._id);
        try {
            await axios.put(`${API_BASE}/actions/alerts/${selectedAlert._id}`, {
                status: actionType,
                wardenNotes: noteText || `Action taken by ${user?.name || 'Warden'}`
            });
            setShowNoteModal(false);
            setToastMsg(`Alert marked as ${actionType} with warden note recorded.`);
            fetchData();
        } catch (err) {
            alert('Failed to submit note action');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '92vh', paddingBottom: '3rem' }}>
            <Container style={{ maxWidth: '820px' }} className="pt-3">
                {/* Mobile & Tablet Header Banner */}
                <div className="d-flex align-items-center justify-content-between mb-3 bg-white p-3 rounded-3 shadow-sm border">
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-warning text-dark px-2 py-1">Warden Operations</span>
                            <span className="badge bg-secondary-subtle text-secondary px-2 py-1">390px Mobile View</span>
                        </div>
                        <h5 className="fw-bold text-dark mb-0 mt-1">Hostel & Floor Operations</h5>
                        <small className="text-muted">{activePreset.name}</small>
                    </div>
                    <Button variant="outline-primary" size="sm" onClick={fetchData} className="d-flex align-items-center gap-1">
                        <RefreshCw size={14} /> Refresh
                    </Button>
                </div>

                {toastMsg && (
                    <Alert variant="success" dismissible onClose={() => setToastMsg(null)} className="py-2 small">
                        {toastMsg}
                    </Alert>
                )}

                {/* Quick Floor Power Telemetry */}
                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <Zap size={16} className="text-warning" /> Hostel Floor Power Telemetry (kW)
                </h6>
                <Row className="g-2 mb-4">
                    {['Floor-1', 'Floor-2', 'Floor-3', 'Floor-4'].map((fl, idx) => {
                        const isSurge = fl === 'Floor-3';
                        const currentKw = isSurge ? 29.8 : (10.5 + idx * 2.2);
                        return (
                            <Col xs={6} sm={3} key={fl}>
                                <Card className={`border shadow-sm text-center p-2 ${isSurge ? 'border-danger bg-danger-subtle' : 'bg-white'}`}>
                                    <small className="text-muted d-block fw-semibold">{fl}</small>
                                    <span className={`fs-5 fw-bold ${isSurge ? 'text-danger' : 'text-dark'}`}>
                                        {currentKw} kW
                                    </span>
                                    <small className={isSurge ? 'text-danger fw-bold' : 'text-success'}>
                                        {isSurge ? '🚨 Class Surge' : '✓ Normal'}
                                    </small>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {/* Water Tank Status */}
                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <Droplets size={16} className="text-primary" /> Overhead Water Tanks
                </h6>
                <Row className="g-2 mb-4">
                    <Col xs={6}>
                        <Card className="border-warning bg-warning-subtle p-2 text-center shadow-sm">
                            <small className="fw-semibold text-muted">Tank A (Overhead)</small>
                            <span className="fs-5 fw-bold text-warning-emphasis">68% Level</span>
                            <small className="text-danger fw-bold">⚠️ Night Leak Flagged</small>
                        </Card>
                    </Col>
                    <Col xs={6}>
                        <Card className="border bg-white p-2 text-center shadow-sm">
                            <small className="fw-semibold text-muted">Tank B (Ground Sump)</small>
                            <span className="fs-5 fw-bold text-success">84% Level</span>
                            <small className="text-success">✓ Buffer Adequate</small>
                        </Card>
                    </Col>
                </Row>

                {/* Operational Alert Inbox */}
                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <AlertTriangle size={16} className="text-danger" /> Actionable Alert Inbox ({alerts.filter(a => a.status === 'open').length} Open)
                </h6>

                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : alerts.length === 0 ? (
                    <Card className="p-4 text-center border-0 bg-white shadow-sm">
                        <CheckCircle size={32} className="text-success mx-auto mb-2" />
                        <h6 className="fw-bold text-muted">All Floor Telemetry is Within Expected Bounds</h6>
                    </Card>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {alerts.map((alt) => (
                            <Card key={alt._id} className="border shadow-sm p-3 bg-white">
                                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg={alt.severity === 'high' ? 'danger' : 'warning'} className="px-2 py-1">
                                            {alt.severity.toUpperCase()}
                                        </Badge>
                                        <span className="fw-bold text-dark">{alt.zoneId}</span>
                                    </div>
                                    <Badge bg={alt.status === 'open' ? 'danger' : 'secondary'} className="text-capitalize">
                                        {alt.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                <h6 className="fw-bold text-dark mb-1">{alt.title}</h6>
                                <p className="text-muted small mb-2" style={{ lineHeight: '1.4' }}>
                                    {alt.why?.explanation || 'Unusual telemetry deviation observed during scheduled operations.'}
                                </p>

                                {/* Impact metrics */}
                                <div className="d-flex flex-wrap gap-2 mb-3 bg-light p-2 rounded">
                                    {alt.impact?.kwh > 0 && <small className="text-warning-emphasis fw-bold">⚡ {alt.impact.kwh} kWh/hr</small>}
                                    {alt.impact?.rupees > 0 && <small className="text-danger fw-bold">₹ {alt.impact.rupees} cost loss</small>}
                                    {alt.impact?.kl > 0 && <small className="text-primary fw-bold">💧 {alt.impact.kl} kL loss</small>}
                                    <small className="text-muted ms-auto">Confidence: {Math.round((alt.confidence || 0.9) * 100)}%</small>
                                </div>

                                {/* Warden Action Buttons */}
                                <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                                    {alt.status === 'open' ? (
                                        <>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleQuickAction(alt._id, 'acknowledged')}
                                                disabled={actionLoading === alt._id}
                                                className="flex-grow-1"
                                            >
                                                {actionLoading === alt._id ? 'Updating...' : 'Acknowledge'}
                                            </Button>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleOpenNoteModal(alt, 'resolved')}
                                                className="flex-grow-1"
                                            >
                                                Mark Resolved
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => handleOpenNoteModal(alt, 'false_alarm')}
                                            >
                                                False Alarm
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="w-100 d-flex align-items-center justify-content-between text-muted small">
                                            <span>Action recorded ({alt.status})</span>
                                            {alt.wardenNotes && <span className="fst-italic">{alt.wardenNotes}</span>}
                                        </div>
                                    )}
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setExplainItem(alt)}
                                        className="text-decoration-none p-0 ms-auto text-primary d-flex align-items-center gap-1"
                                    >
                                        <HelpCircle size={14} /> Why Flagged?
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Container>

            {/* Note & Action Modal */}
            <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6 fw-bold">
                        {actionType === 'resolved' ? '✅ Mark Alert Resolved' : '⚠️ Mark False Alarm'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label className="small fw-semibold">
                            Warden / Operations Note (Optional):
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder={actionType === 'resolved' ? 'e.g. Inspected Floor 3 Room 214; turned off two 1.5kW heaters.' : 'e.g. Authorized laboratory trial in progress.'}
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowNoteModal(false)}>Cancel</Button>
                    <Button
                        variant={actionType === 'resolved' ? 'success' : 'danger'}
                        size="sm"
                        onClick={handleSubmitNoteAction}
                    >
                        Confirm Action
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Explainability "Why?" Modal */}
            <ExplainabilityModal
                show={Boolean(explainItem)}
                onHide={() => setExplainItem(null)}
                item={explainItem}
            />
        </div>
    );
}
