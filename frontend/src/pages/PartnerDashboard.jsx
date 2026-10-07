import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Spinner, Tab, Nav, Modal, Form, ListGroup } from 'react-bootstrap';
import { Truck, CheckCircle, Clock, MapPin, Camera, Star, AlertTriangle, Navigation as NavIcon, Map as MapIconComponent } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import LiveGarbageMap from '../components/LiveGarbageMap';
import OptimizedRouteMap from '../components/OptimizedRouteMap';
import LoaderSpinner from '../components/LoaderSpinner';
import CameraCapture from '../components/CameraCapture';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const STATUS_COLOR = { Submitted: '#6c757d', Assigned: '#fd7e14', Cleaning: '#0d6efd', Completed: '#28a745' };

export default function PartnerDashboard() {
    const { user, authAxios } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'available';
    const [available, setAvailable] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [history, setHistory] = useState([]);
    const [loadingAvail, setLoadingAvail] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [alert, setAlert] = useState(null);
    const [proofModal, setProofModal] = useState(null); // report id
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [accepting, setAccepting] = useState(null);

    // False Report State
    const [falseReportModal, setFalseReportModal] = useState(null); // report id
    const [falseReportReason, setFalseReportReason] = useState('');
    const [falseReportProof, setFalseReportProof] = useState(null);
    const [falseReportPreview, setFalseReportPreview] = useState(null);
    const [flagging, setFlagging] = useState(false);

    const fetchAvailable = useCallback(async () => {
        try {
            const { data } = await authAxios.get('/reports/available');
            setAvailable(data);
        } catch { } finally { setLoadingAvail(false); }
    }, [authAxios]);

    const fetchMyTasks = useCallback(async () => {
        try {
            const [tasks, hist] = await Promise.all([
                authAxios.get('/reports/mytasks'),
                authAxios.get('/reports/task-history')
            ]);
            setMyTasks(tasks.data);
            setHistory(hist.data);
        } catch { } finally { setLoadingTasks(false); }
    }, [authAxios]);

    useEffect(() => { fetchAvailable(); fetchMyTasks(); }, []);

    const handleAccept = async (reportId) => {
        setAccepting(reportId);
        try {
            await authAxios.put(`/reports/${reportId}/assign`);
            await Promise.all([fetchAvailable(), fetchMyTasks()]);
            setAlert({ type: 'success', msg: '✅ Task accepted! Check "My Tasks" tab.' });
        } catch (err) {
            setAlert({ type: 'danger', msg: err.response?.data?.message || 'Failed to accept task.' });
        } finally { setAccepting(null); }
    };

    const handleMarkCleaning = async (reportId) => {
        try {
            await authAxios.put(`/reports/${reportId}/cleaning`);
            fetchMyTasks();
        } catch (err) {
            setAlert({ type: 'danger', msg: err.response?.data?.message || 'Error' });
        }
    };

    const handleComplete = async () => {
        if (!proofFile) return setAlert({ type: 'warning', msg: 'Please upload a proof photo.' });
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('proof', proofFile);
            await authAxios.put(`/reports/${proofModal}/complete`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setProofModal(null); setProofFile(null);
            await Promise.all([fetchMyTasks(), fetchAvailable()]);
            setAlert({ type: 'success', msg: '🎉 Task completed! Citizen has been awarded Eco Coins.' });
        } catch (err) {
            setAlert({ type: 'danger', msg: err.response?.data?.message || 'Upload failed.' });
        } finally { setUploading(false); }
    };

    const handleFalseReport = async () => {
        if (!falseReportReason || !falseReportProof) return setAlert({ type: 'warning', msg: 'Please provide both a reason and a photo.' });
        setFlagging(true);

        if (!navigator.geolocation) {
            setFlagging(false);
            return setAlert({ type: 'danger', msg: 'Geolocation is not supported.' });
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const fd = new FormData();
                    fd.append('proof', falseReportProof);
                    fd.append('reason', falseReportReason);
                    fd.append('lat', latitude);
                    fd.append('lng', longitude);
                    
                    await authAxios.put(`/reports/${falseReportModal}/false-report`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    setFalseReportModal(null); setFalseReportReason(''); setFalseReportProof(null);
                    fetchMyTasks();
                    setAlert({ type: 'success', msg: '🚩 Report flagged as false. An admin will review it.' });
                } catch (err) {
                    setAlert({ type: 'danger', msg: err.response?.data?.message || 'Flagging failed.' });
                } finally { setFlagging(false); }
            },
            (err) => {
                setFlagging(false);
                setAlert({ type: 'danger', msg: 'Location access required to verify false report.' });
            },
            { enableHighAccuracy: true }
        );
    };

    const activeCount = myTasks.length;
    const completedCount = history.length;

    // Delete Account states
    const [deleteModal, setDeleteModal] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            await authAxios.delete('/auth/delete-account');
            localStorage.removeItem('ecocity_token');
            navigate('/auth/login');
        } catch (err) {
            setAlert({ type: 'danger', msg: err.response?.data?.message || 'Failed to delete account' });
            setDeletingAccount(false);
            setDeleteModal(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar role="partner" />
            <div className="dashboard-content">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="fw-bold mb-1">Partner Dashboard 🚛</h4>
                        <p className="text-muted small mb-0">📍 {user?.cityName}, {user?.district} — Waste Collection Partner</p>
                    </div>
                    <Button variant="outline-danger" size="sm" onClick={() => setDeleteModal(true)}>
                        <AlertTriangle size={14} className="me-1" /> Deactivate Account
                    </Button>
                </div>

                {alert && <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="small py-2 mb-3">{alert.msg}</Alert>}

                {/* KPIs */}
                <Row className="gy-3 mb-4">
                    {[
                        { icon: <Clock size={22} color="#fd7e14" />, bg: '#fff3cd', value: available.length, label: 'Available Tasks' },
                        { icon: <Truck size={22} color="#0d6efd" />, bg: '#dbeafe', value: activeCount, label: 'My Active Tasks' },
                        { icon: <CheckCircle size={22} color="#28a745" />, bg: '#d1fae5', value: completedCount, label: 'Completed' },
                        { icon: <Star size={22} color="#8b5cf6" />, bg: '#ede9fe', value: user?.stats?.tasksCompleted ?? 0, label: 'Total Completed' },
                    ].map((k, i) => (
                        <Col xs={6} md={3} key={i}>
                            <div className="kpi-card">
                                <div className="kpi-icon-wrap" style={{ background: k.bg }}>{k.icon}</div>
                                <div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div></div>
                            </div>
                        </Col>
                    ))}
                </Row>

                <Tab.Container activeKey={activeTab} onSelect={tab => navigate(`/partner/dashboard?tab=${tab}`)}>
                    <Nav variant="tabs" className="mb-3 border-bottom">
                        <Nav.Item key="nav-available"><Nav.Link eventKey="available" className="d-flex align-items-center gap-1">📋 Available {available.length > 0 && <Badge bg="danger" className="ms-1">{available.length}</Badge>}</Nav.Link></Nav.Item>
                        <Nav.Item key="nav-map"><Nav.Link eventKey="map" className="d-flex align-items-center gap-1"><MapIconComponent size={16}/> Live Map</Nav.Link></Nav.Item>
                        <Nav.Item key="nav-route"><Nav.Link eventKey="route" className="d-flex align-items-center gap-1"><NavIcon size={16}/> Route</Nav.Link></Nav.Item>
                        <Nav.Item key="nav-mytasks"><Nav.Link eventKey="mytasks" className="d-flex align-items-center gap-1">🚛 My Tasks {myTasks.length > 0 && <Badge bg="warning" text="dark" className="ms-1">{myTasks.length}</Badge>}</Nav.Link></Nav.Item>
                        <Nav.Item key="nav-history"><Nav.Link eventKey="history" className="d-flex align-items-center gap-1">✅ History {history.length > 0 && <Badge bg="success" className="ms-1">{history.length}</Badge>}</Nav.Link></Nav.Item>
                    </Nav>
                    <Tab.Content>
                        {/* AVAILABLE TASKS */}
                        <Tab.Pane eventKey="available" key="pane-available">
                            {loadingAvail
                                ? <div className="text-center p-5"><Spinner animation="border" size="sm" /></div>
                                : available.length === 0
                                    ? <div className="text-center p-5 text-muted"><CheckCircle size={40} className="mb-3 opacity-25" /><p>No available tasks right now. Check back soon!</p></div>
                                    : <div className="d-flex flex-column gap-3">
                                        {available.map(r => (
                                            <Card key={r._id} className="eco-card border-0">
                                                <Card.Body className="p-4">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div>
                                                            <h6 className="fw-bold mb-1">🗑️ {r.wasteType} Waste</h6>
                                                            <p className="text-muted small mb-1"><MapPin size={12} className="me-1" />{r.location?.address || r.cityName}</p>
                                                            {r.description && <p className="small text-muted mb-0">{r.description}</p>}
                                                        </div>
                                                        <Badge className="fw-normal" style={{ background: '#6c757d' }}>Submitted</Badge>
                                                    </div>
                                                    {r.imageUrl && <img src={`http://localhost:5000${r.imageUrl}`} alt="report" className="w-100 rounded-2 mb-3" style={{ height: 140, objectFit: 'cover' }} />}
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                            <Clock size={11} className="me-1" />Reported {new Date(r.createdAt).toLocaleDateString('en-IN')}
                                                            {r.citizen && <span> · by {r.citizen.name}</span>}
                                                        </span>
                                                        <Button className="btn-eco btn-sm px-3" onClick={() => handleAccept(r._id)} disabled={accepting === r._id}>
                                                            {accepting === r._id ? <Spinner size="sm" animation="border" /> : 'Accept Task'}
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>}
                        </Tab.Pane>

                        {/* LIVE MAP */}
                        <Tab.Pane eventKey="map" className="h-100" key="pane-map">
                            {activeTab === 'map' && <div style={{height: '600px'}}><LiveGarbageMap /></div>}
                        </Tab.Pane>

                        {/* OPTIMIZED ROUTE */}
                        <Tab.Pane eventKey="route" className="h-100" key="pane-route">
                            {activeTab === 'route' && <div style={{height: '600px'}}><OptimizedRouteMap /></div>}
                        </Tab.Pane>

                        {/* MY TASKS */}
                        <Tab.Pane eventKey="mytasks" key="pane-mytasks">
                            {loadingTasks
                                ? <LoaderSpinner message="Loading your tasks..." />
                                : myTasks.length === 0
                                    ? <div className="text-center p-5 text-muted"><Truck size={40} className="mb-3 opacity-25" /><p>No active tasks. Accept tasks from the Available Tasks tab.</p></div>
                                    : <div className="d-flex flex-column gap-3">
                                        {myTasks.map(r => (
                                            <Card key={r._id} className="eco-card border-0">
                                                <Card.Body className="p-4">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <h6 className="fw-bold mb-1">🗑️ {r.wasteType}</h6>
                                                            <p className="text-muted small mb-1"><MapPin size={12} className="me-1" />{r.location?.address || r.cityName}</p>
                                                            {r.description && <p className="small text-muted mb-0">{r.description}</p>}
                                                        </div>
                                                        <span className="badge rounded-pill px-3 py-2 text-white fw-normal" style={{ background: STATUS_COLOR[r.status] }}>{r.status}</span>
                                                    </div>
                                                    {r.imageUrl && <img src={`http://localhost:5000${r.imageUrl}`} alt="report" className="w-100 rounded-2 mb-3" style={{ height: 120, objectFit: 'cover' }} />}
                                                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top gap-2 flex-wrap">
                                                        <div className="d-flex gap-2">
                                                            {r.status === 'Assigned' && (
                                                                <Button variant="outline-primary" size="sm" onClick={() => handleMarkCleaning(r._id)}>
                                                                    🧹 Mark as Cleaning
                                                                </Button>
                                                            )}
                                                            {(r.status === 'Assigned' || r.status === 'Cleaning') && (
                                                                <Button className="btn-eco btn-sm" onClick={() => { setProofModal(r._id); setProofFile(null); }}>
                                                                    <Camera size={14} className="me-1" />Upload Proof & Complete
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {r.status !== 'FalseReported' && (
                                                            <Button variant="outline-danger" size="sm" className="ms-auto border-0" onClick={() => { setFalseReportModal(r._id); setFalseReportReason(''); setFalseReportProof(null); }}>
                                                                <AlertTriangle size={14} className="me-1"/> Flag False Report
                                                            </Button>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>}
                        </Tab.Pane>

                        {/* HISTORY */}
                        <Tab.Pane eventKey="history" key="pane-history">
                            {history.length === 0
                                ? <div className="text-center p-5 text-muted"><CheckCircle size={40} className="mb-3 opacity-25" /><p>No completed tasks yet.</p></div>
                                : <ListGroup variant="flush" className="eco-card rounded-3">
                                    {history.map(r => (
                                        <ListGroup.Item key={r._id} className="py-3 px-4">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <p className="fw-semibold small mb-0">✅ {r.wasteType} — {r.location?.address || r.cityName}</p>
                                                    <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>{new Date(r.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                                <Badge bg="success" className="fw-normal">Completed</Badge>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </div>

            {/* Proof Upload Modal */}
            <Modal show={!!proofModal} onHide={() => { setProofModal(null); setProofFile(null); setProofPreview(null); }} centered>
                <Modal.Header closeButton><Modal.Title>📸 Snap Cleanup Proof</Modal.Title></Modal.Header>
                <Modal.Body>
                    <p className="text-muted small">Take a real-time photo proving the area has been cleaned. The citizen will receive 10 Eco Coins after this.</p>
                    <Form.Group>
                        <Form.Label>Proof Photo *</Form.Label>
                        <CameraCapture
                            previewUrl={proofPreview}
                            onCapture={(file, url) => { setProofFile(file); setProofPreview(url); }}
                            onClear={() => { setProofFile(null); setProofPreview(null); }}
                        />
                    </Form.Group>
                    {alert?.type === 'warning' && <Alert variant="warning" className="mt-2 small py-2">{alert.msg}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => { setProofModal(null); setProofFile(null); setProofPreview(null); }}>Cancel</Button>
                    <Button className="btn-eco" onClick={handleComplete} disabled={uploading}>
                        {uploading ? <><Spinner size="sm" animation="border" className="me-2" />Uploading...</> : '✅ Mark as Completed'}
                    </Button>
                </Modal.Footer>
            </Modal>


            {/* False Report Modal */}
            <Modal show={!!falseReportModal} onHide={() => { setFalseReportModal(null); setFalseReportProof(null); setFalseReportPreview(null); setFalseReportReason(''); }} centered>
                <Modal.Header closeButton className="bg-danger text-white"><Modal.Title className="fs-5"><AlertTriangle size={20} className="me-2"/>Flag False Report</Modal.Title></Modal.Header>
                <Modal.Body>
                    <p className="text-muted small">If the reported garbage does not exist or is a duplicate, you can flag it for admin review. Citizens may lose Eco Coins for false reporting.</p>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Reason *</Form.Label>
                        <Form.Control as="textarea" rows={2} placeholder="E.g., No garbage found at this location." value={falseReportReason} onChange={e => setFalseReportReason(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fw-semibold">Evidence Photo (Snap in real-time)</Form.Label>
                        <CameraCapture
                            previewUrl={falseReportPreview}
                            onCapture={(file, url) => { setFalseReportProof(file); setFalseReportPreview(url); }}
                            onClear={() => { setFalseReportProof(null); setFalseReportPreview(null); }}
                            label="Optional but recommended"
                        />
                    </Form.Group>
                    {alert?.type === 'warning' && <Alert variant="warning" className="mt-3 small py-2">{alert.msg}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => { setFalseReportModal(null); setFalseReportProof(null); setFalseReportPreview(null); setFalseReportReason(''); }}>Cancel</Button>
                    <Button variant="danger" onClick={handleFalseReport} disabled={flagging}>
                        {flagging ? <><Spinner size="sm" animation="border" className="me-2" />Submitting...</> : 'Submit Flag'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Account Modal */}
            <Modal show={deleteModal} onHide={() => setDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title className="fs-5"><AlertTriangle size={20} className="me-2"/>Deactivate Account</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <h5 className="text-danger fw-bold mb-3">Are you absolutely sure?</h5>
                    <p className="text-muted mb-2">
                        Deleting this Partner account will permanently remove your login access and clear your active tasks.
                    </p>
                    <p className="text-muted small mb-0">
                        This action cannot be undone. You will lose any accrued Eco Coins or performance metrics.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteAccount} disabled={deletingAccount}>
                        {deletingAccount ? <Spinner size="sm" animation="border" /> : 'Yes, Delete My Account'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
