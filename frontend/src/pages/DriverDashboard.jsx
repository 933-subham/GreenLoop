import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { Truck, CheckCircle2, Navigation, Camera, MapPin, RefreshCw, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DriverDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);

    const [proofModal, setProofModal] = useState(false);
    const [selectedReq, setSelectedReq] = useState(null);
    const [notes, setNotes] = useState('');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/bins/requests`);
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to load driver tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleStartTrip = async (id) => {
        setActionLoading(id);
        try {
            await axios.put(`${API_BASE}/bins/requests/${id}/status`, { status: 'en_route' });
            setToastMsg('Trip started! Status updated to En-Route.');
            fetchTasks();
        } catch (err) {
            alert('Failed to update trip status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCompleteCollection = async () => {
        if (!selectedReq) return;
        setActionLoading(selectedReq._id);
        try {
            await axios.put(`${API_BASE}/bins/requests/${selectedReq._id}/status`, {
                status: 'collected',
                proofImageUrl: '/uploads/cleaned_proof.jpg',
                notes: notes || 'Area cleared and bin emptied successfully.'
            });
            setProofModal(false);
            setToastMsg('Collection completed! Proof photo uploaded and bin reset to clean status.');
            fetchTasks();
        } catch (err) {
            alert('Failed to record collection');
        } finally {
            setActionLoading(null);
        }
    };

    const activeTasks = requests.filter(r => r.status === 'assigned' || r.status === 'en_route');
    const completedTasks = requests.filter(r => r.status === 'collected' || r.status === 'closed');

    return (
        <div style={{ background: '#f8fafc', minHeight: '92vh', paddingBottom: '3rem' }}>
            <Container style={{ maxWidth: '480px' }} className="pt-3">
                {/* Driver Banner */}
                <div className="bg-white p-3 rounded-3 shadow-sm border mb-3 d-flex align-items-center justify-content-between">
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary px-2 py-1">Municipal Fleet Driver</span>
                            <span className="badge bg-secondary-subtle text-secondary">390px View</span>
                        </div>
                        <h5 className="fw-bold text-dark mb-0 mt-1">{user?.name || 'Driver Ramesh Kumar'}</h5>
                        <small className="text-muted">Vehicle: Tata Ace (OD-14-K-4921)</small>
                    </div>
                    <Button variant="outline-primary" size="sm" onClick={fetchTasks}>
                        <RefreshCw size={14} />
                    </Button>
                </div>

                {toastMsg && (
                    <Alert variant="success" dismissible onClose={() => setToastMsg(null)} className="py-2 small">
                        {toastMsg}
                    </Alert>
                )}

                {/* Active Pickup Tasks */}
                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <Navigation size={16} className="text-primary" /> Active Assigned Pickups ({activeTasks.length})
                </h6>

                {loading ? (
                    <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                ) : activeTasks.length === 0 ? (
                    <Card className="p-4 text-center border-0 bg-white shadow-sm mb-4">
                        <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
                        <h6 className="fw-bold text-muted mb-0">No Pending Pickup Tasks Assigned</h6>
                        <small className="text-muted">You are currently available for new campus dispatches.</small>
                    </Card>
                ) : (
                    activeTasks.map((t) => (
                        <Card key={t._id} className="border shadow-sm p-3 mb-3 bg-white">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                                <span className="fw-bold text-dark fs-6">{t.binCode || 'BIN'} - {t.binName}</span>
                                <Badge bg={t.status === 'en_route' ? 'warning' : 'primary'} className="text-uppercase">
                                    {t.status}
                                </Badge>
                            </div>

                            <p className="small text-muted mb-2 d-flex align-items-center gap-1">
                                <MapPin size={14} className="text-danger" /> {t.location?.address}
                            </p>

                            <div className="bg-light p-2 rounded mb-3 small d-flex justify-content-between">
                                <span>Fill Level: <strong className="text-danger">{t.fillPctAtRequest || 92}%</strong></span>
                                <span>Distance: <strong>1.4 km</strong></span>
                                <span>ETA: <strong>6 mins</strong></span>
                            </div>

                            <div className="d-grid gap-2">
                                {t.status === 'assigned' ? (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleStartTrip(t._id)}
                                        disabled={actionLoading === t._id}
                                        className="fw-semibold d-flex align-items-center justify-content-center gap-2"
                                    >
                                        <Truck size={16} /> Start Navigation / En-Route
                                    </Button>
                                ) : (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => { setSelectedReq(t); setProofModal(true); }}
                                        className="fw-semibold d-flex align-items-center justify-content-center gap-2"
                                    >
                                        <Camera size={16} /> Upload Cleanup Proof & Complete
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))
                )}

                {/* Completed History */}
                <h6 className="fw-bold text-dark mb-2 mt-4 d-flex align-items-center gap-2">
                    <Clock size={16} className="text-secondary" /> Recent Completed Cleanups ({completedTasks.length})
                </h6>
                {completedTasks.slice(0, 3).map((ct) => (
                    <Card key={ct._id} className="border-0 bg-light p-2 mb-2 small shadow-none">
                        <div className="d-flex justify-content-between">
                            <strong>{ct.binName}</strong>
                            <span className="badge bg-success-subtle text-success">Cleaned</span>
                        </div>
                        <small className="text-muted">Completed at {new Date(ct.collectedAt || ct.updatedAt).toLocaleTimeString()}</small>
                    </Card>
                ))}
            </Container>

            {/* Proof Upload Modal */}
            <Modal show={proofModal} onHide={() => setProofModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6 fw-bold">📸 Upload Cleanup Proof Photo</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="small text-muted mb-3">
                        Capturing photo of cleaned area outside {selectedReq?.binName}.
                    </p>
                    <div className="p-4 border border-dashed rounded text-center bg-light mb-3">
                        <Camera size={36} className="text-success mb-2" />
                        <span className="d-block small fw-bold text-dark">Simulated Camera Photo Attached</span>
                        <small className="text-muted">proof_photo_geo_tagged.jpg (GPS Verified)</small>
                    </div>
                    <Form.Group>
                        <Form.Label className="small fw-semibold">Driver Notes:</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="e.g. 180kg organic waste transferred to compactor truck."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setProofModal(false)}>Cancel</Button>
                    <Button variant="success" size="sm" onClick={handleCompleteCollection}>
                        Submit Proof & Close Task
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
