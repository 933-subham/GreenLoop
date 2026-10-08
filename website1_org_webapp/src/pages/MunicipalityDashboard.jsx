import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, CheckCircle2, AlertTriangle, RefreshCw, Navigation, MapPin, Eye, ExternalLink, UserCheck, PlusCircle, Send, Check, X } from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useFacility } from '../context/FacilityContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Custom icons
const binIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function MunicipalityDashboard() {
    const { activeFacilityId, activePreset } = useFacility();

    const [requests, setRequests] = useState([]);
    const [bins, setBins] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);

    // Partner registration application modal
    const [applyPartnerModal, setApplyPartnerModal] = useState(false);
    const [partnerForm, setPartnerForm] = useState({
        name: 'Bikash Mohanty',
        agencyName: 'Kalinga Clean Logistics',
        vehicleNumber: 'OD-14-P-8899',
        vehicleType: 'Tata Ace Mini-Truck',
        phone: '+91 97782 44319',
        zone: 'Zone 1 - Chhend Colony & BPUT',
        capacityKg: 1500
    });

    // Public citizen street report modal
    const [streetReportModal, setStreetReportModal] = useState(false);
    const [streetForm, setStreetForm] = useState({
        name: 'Deepak Nayak',
        address: 'Civil Township Ring Road near Daily Market',
        wasteType: 'Mixed Garbage',
        garbageIntensity: 'High',
        description: 'Illegal waste heap near municipal electric pole on main ring road.'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, binRes, partRes] = await Promise.all([
                axios.get(`${API_BASE}/bins/requests`),
                axios.get(`${API_BASE}/bins?facilityId=${activeFacilityId}`),
                axios.get(`${API_BASE}/partners`).catch(() => ({ data: [] }))
            ]);
            setRequests(reqRes.data);
            setBins(binRes.data);
            setPartners(partRes.data || []);
        } catch (err) {
            console.error('Failed to load municipal dispatch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeFacilityId]);

    // Municipal Root User Approves Partner Application
    const handleApprovePartner = async (partnerId) => {
        setActionLoading(partnerId);
        try {
            await axios.put(`${API_BASE}/partners/${partnerId}/status`, { status: 'approved' });
            setToastMsg('✅ Partner application APPROVED! Contractor is now active in city dispatch engine.');
            fetchData();
        } catch (err) {
            alert('Failed to approve partner');
        } finally {
            setActionLoading(null);
        }
    };

    // Municipal Root User Rejects Partner Application
    const handleRejectPartner = async (partnerId) => {
        setActionLoading(partnerId);
        try {
            await axios.put(`${API_BASE}/partners/${partnerId}/status`, { status: 'rejected' });
            setToastMsg('❌ Partner application rejected.');
            fetchData();
        } catch (err) {
            alert('Failed to reject partner');
        } finally {
            setActionLoading(null);
        }
    };

    // Submit New Partner Application (Pending Approval)
    const handleSubmitPartnerApplication = async (e) => {
        e.preventDefault();
        setActionLoading('apply-partner');
        try {
            await axios.post(`${API_BASE}/partners/apply`, {
                email: `partner.${Date.now()}@cleanodisha.org`,
                ...partnerForm
            });
            setToastMsg('✅ Partner application submitted! Marked as PENDING review by Municipality Admin.');
            setApplyPartnerModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit application');
        } finally {
            setActionLoading(null);
        }
    };

    // Submit Public Street Garbage Report (Citizen Outside Org)
    const handleSubmitStreetReport = async (e) => {
        e.preventDefault();
        setActionLoading('street-report');
        try {
            await axios.post(`${API_BASE}/reports/public-street`, {
                ...streetForm
            });
            setToastMsg('✅ Public street report submitted! Nearest municipal collection partner auto-assigned.');
            setStreetReportModal(false);
            fetchData();
        } catch (err) {
            alert('Failed to submit street report');
        } finally {
            setActionLoading(null);
        }
    };

    // Drivers coordinates
    const drivers = [
        { id: 'D1', name: 'Ramesh Kumar', vehicle: 'Tata Ace (OD-14-K-4921)', lat: 22.2580, lng: 84.8500, load: '30%', status: 'En-Route' },
        { id: 'D2', name: 'Suresh Nayak', vehicle: 'Eicher Pro (OD-14-H-1082)', lat: 22.2640, lng: 84.8570, load: '65%', status: 'Available' },
        { id: 'D3', name: 'Deepak Mohanty', vehicle: 'Mahindra Bolero (OD-14-M-7714)', lat: 22.2550, lng: 84.8560, load: '15%', status: 'Available' }
    ];

    const centerLat = 22.2604;
    const centerLng = 84.8536;

    const pendingPartners = partners.filter(p => p.status === 'pending');

    return (
        <div style={{ background: '#f8fafc', minHeight: '92vh', paddingBottom: '3rem' }}>
            <Container fluid className="pt-3 px-4">
                {/* Header */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white p-3 rounded-3 shadow-sm border mb-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <Badge bg="primary" className="px-2 py-1">WEBSITE 2: MUNICIPALPORTAL</Badge>
                            <span className="badge bg-secondary-subtle text-secondary px-2 py-1">Rourkela Municipal Corp. (RMC)</span>
                            <span className="badge bg-success-subtle text-success px-2 py-1">Zero Paid APIs</span>
                        </div>
                        <h4 className="fw-bold text-dark mb-0">City-Wide Smart Waste Logistics & Partner Approval Engine</h4>
                        <small className="text-muted">Oversees multi-organization exterior bins, partner credentials approval, and public street reports</small>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <Button variant="outline-primary" size="sm" onClick={fetchData} className="d-flex align-items-center gap-1">
                            <RefreshCw size={14} /> Refresh
                        </Button>
                        <Button variant="outline-success" size="sm" onClick={() => setApplyPartnerModal(true)} className="d-flex align-items-center gap-1">
                            <PlusCircle size={14} /> Apply for Partner Role
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => setStreetReportModal(true)} className="d-flex align-items-center gap-1">
                            <AlertTriangle size={14} /> Report Public Street Waste
                        </Button>
                        <Link to="/driver" className="btn btn-outline-info btn-sm d-flex align-items-center gap-1">
                            <Truck size={14} /> Driver Cockpit
                        </Link>
                        <Link to="/org" className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1">
                            🏢 Website 1 (OrgPortal)
                        </Link>
                    </div>
                </div>

                {toastMsg && (
                    <Alert variant="success" dismissible onClose={() => setToastMsg(null)} className="py-2 small mb-3">
                        {toastMsg}
                    </Alert>
                )}

                {/* KPI Overview Cards */}
                <Row className="g-3 mb-3">
                    <Col md={3}>
                        <Card className="border shadow-sm bg-white p-3">
                            <small className="text-muted fw-bold">Active Pickup Dispatches</small>
                            <h4 className="fw-bold text-primary mb-0">{requests.filter(r => r.status !== 'collected').length} Active</h4>
                            <small className="text-muted">Nearest partner auto-assigned</small>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border shadow-sm bg-white p-3">
                            <small className="text-muted fw-bold">Registered Org Dump Bins</small>
                            <h4 className="fw-bold text-dark mb-0">4 Institutions</h4>
                            <small className="text-muted">BPUT, Hospital, Industry, DPS</small>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border shadow-sm bg-white p-3">
                            <small className="text-muted fw-bold">Approved Partner Fleet</small>
                            <h4 className="fw-bold text-success mb-0">{partners.filter(p => p.status === 'approved').length || 2} Trucks</h4>
                            <small className="text-muted">Ramesh (Tata Ace), Suresh (Compactor)</small>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border border-warning shadow-sm bg-warning-subtle p-3">
                            <small className="text-warning-emphasis fw-bold">Pending Partner Applications</small>
                            <h4 className="fw-bold text-warning-emphasis mb-0">{pendingPartners.length || 1} Pending</h4>
                            <small className="text-muted">Requires Municipal Root Approval</small>
                        </Card>
                    </Col>
                </Row>

                {/* PARTNER APPROVAL WORKFLOW SECTION */}
                <Card className="border shadow-sm bg-white mb-3">
                    <Card.Header className="bg-light py-2 d-flex align-items-center justify-content-between">
                        <span className="fw-bold small d-flex align-items-center gap-2">
                            <UserCheck size={16} className="text-primary" /> Collection Partner Registration & Verification Panel
                        </span>
                        <Badge bg={pendingPartners.length > 0 ? 'warning' : 'secondary'}>
                            {pendingPartners.length} Pending Review
                        </Badge>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {partners.length === 0 ? (
                            <div className="p-3 text-center text-muted small">Loading partner records...</div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle small" style={{ fontSize: '0.82rem' }}>
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Driver / Agency</th>
                                            <th>Vehicle Number & Type</th>
                                            <th>Coverage Zone & Phone</th>
                                            <th>Payload Capacity</th>
                                            <th>Status</th>
                                            <th className="text-end">Municipal Root Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partners.map((p) => (
                                            <tr key={p._id}>
                                                <td>
                                                    <strong className="d-block text-dark">{p.name}</strong>
                                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{p.agencyName}</span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-primary">{p.vehicleNumber}</span><br />
                                                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>{p.vehicleType}</span>
                                                </td>
                                                <td>
                                                    <span>{p.zone}</span><br />
                                                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>{p.phone}</span>
                                                </td>
                                                <td>{p.capacityKg} kg</td>
                                                <td>
                                                    <Badge bg={p.status === 'approved' ? 'success' : p.status === 'rejected' ? 'danger' : 'warning'}>
                                                        {p.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="text-end">
                                                    {p.status === 'pending' ? (
                                                        <div className="d-flex justify-content-end gap-1">
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                onClick={() => handleApprovePartner(p._id)}
                                                                disabled={actionLoading === p._id}
                                                                className="px-2 py-0"
                                                            >
                                                                ✓ Approve
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleRejectPartner(p._id)}
                                                                disabled={actionLoading === p._id}
                                                                className="px-2 py-0"
                                                            >
                                                                ✕ Reject
                                                            </Button>
                                                        </div>
                                                    ) : p.status === 'approved' ? (
                                                        <span className="text-success fw-bold">✓ Active Partner</span>
                                                    ) : (
                                                        <span className="text-danger">Rejected</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                <Row className="g-3">
                    {/* Live Leaflet Map */}
                    <Col lg={7}>
                        <Card className="border shadow-sm overflow-hidden bg-white mb-3">
                            <Card.Header className="bg-light d-flex align-items-center justify-content-between py-2">
                                <span className="fw-bold small d-flex align-items-center gap-1">
                                    <MapPin size={16} className="text-danger" /> Live Smart Bin & Vehicle Fleet Map
                                </span>
                                <div className="d-flex align-items-center gap-2 small">
                                    <span className="d-flex align-items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> Urgent Bins</span>
                                    <span className="d-flex align-items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> Municipal Trucks</span>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0" style={{ height: '420px' }}>
                                <MapContainer center={[centerLat, centerLng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                                    />
                                    {/* Smart Bins */}
                                    {bins.map((bin) => (
                                        <Marker key={bin._id} position={[bin.lat, bin.lng]} icon={binIcon}>
                                            <Popup>
                                                <div className="p-1">
                                                    <strong>{bin.binCode}: {bin.name}</strong><br />
                                                    Fill Level: <strong style={{ color: bin.currentFillPct > 80 ? 'red' : 'green' }}>{bin.currentFillPct}%</strong><br />
                                                    Hours to Full: <strong>{bin.hoursToFull}h</strong><br />
                                                    Status: <em>{bin.verificationStatus}</em>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {/* Municipal Trucks */}
                                    {drivers.map((drv) => (
                                        <Marker key={drv.id} position={[drv.lat, drv.lng]} icon={driverIcon}>
                                            <Popup>
                                                <div className="p-1">
                                                    <strong>🚛 {drv.name}</strong><br />
                                                    Vehicle: {drv.vehicle}<br />
                                                    Current Load: {drv.load}<br />
                                                    Status: <strong>{drv.status}</strong>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Active Dispatch Requests & "Why This Driver" */}
                    <Col lg={5}>
                        <Card className="border shadow-sm bg-white mb-3">
                            <Card.Header className="bg-light py-2 d-flex align-items-center justify-content-between">
                                <span className="fw-bold small d-flex align-items-center gap-1">
                                    <Truck size={16} className="text-primary" /> Active Pickup Requests ({requests.length})
                                </span>
                                <Badge bg="success">Closed Loop Workflow</Badge>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {loading ? (
                                    <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                                ) : requests.length === 0 ? (
                                    <div className="p-4 text-center text-muted small">No active pickup requests right now.</div>
                                ) : (
                                    <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                        {requests.map((req) => (
                                            <div key={req._id} className="p-3 border-bottom">
                                                <div className="d-flex align-items-start justify-content-between mb-1">
                                                    <span className="fw-bold text-dark">{req.binCode || 'BIN'} - {req.binName}</span>
                                                    <Badge bg={req.status === 'collected' ? 'success' : req.status === 'assigned' ? 'primary' : 'warning'}>
                                                        {req.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <small className="text-muted d-block mb-1">{req.location?.address}</small>

                                                {/* Algorithmic Reason Box */}
                                                <div className="bg-light p-2 rounded mb-2 border small">
                                                    <span className="fw-bold text-dark d-block">
                                                        🎯 Auto-Assigned: {req.assignedDriverName || 'Driver Ramesh Kumar'}
                                                    </span>
                                                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                        {req.assignedReason?.explanation || 'Selected by lowest score: distance (1.4 km) + 3×load_ratio + shift status.'}
                                                    </span>
                                                </div>

                                                <div className="d-flex align-items-center justify-content-between small text-muted">
                                                    <span>Fill at Request: <strong>{req.fillPctAtRequest || 88}%</strong></span>
                                                    {req.proofImageUrl ? (
                                                        <span className="text-success fw-bold d-flex align-items-center gap-1">
                                                            <CheckCircle2 size={14} /> Cleanup Verified
                                                        </span>
                                                    ) : (
                                                        <Link to="/driver" className="text-primary fw-semibold text-decoration-none">
                                                            Open in Driver Cockpit →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* MODAL 1: APPLY FOR PARTNER ROLE */}
            <Modal show={applyPartnerModal} onHide={() => setApplyPartnerModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6 fw-bold">Apply for Waste Collection Partner Role</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmitPartnerApplication}>
                    <Modal.Body className="small">
                        <Form.Group className="mb-2">
                            <Form.Label>Contractor / Driver Name</Form.Label>
                            <Form.Control
                                type="text"
                                size="sm"
                                value={partnerForm.name}
                                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Agency / Transport Name</Form.Label>
                            <Form.Control
                                type="text"
                                size="sm"
                                value={partnerForm.agencyName}
                                onChange={(e) => setPartnerForm({ ...partnerForm, agencyName: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Row className="g-2 mb-2">
                            <Col sm={6}>
                                <Form.Label>Vehicle Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    size="sm"
                                    value={partnerForm.vehicleNumber}
                                    onChange={(e) => setPartnerForm({ ...partnerForm, vehicleNumber: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={6}>
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    size="sm"
                                    value={partnerForm.phone}
                                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                                    required
                                />
                            </Col>
                        </Row>
                        <Form.Group className="mb-2">
                            <Form.Label>Vehicle Type</Form.Label>
                            <Form.Select
                                size="sm"
                                value={partnerForm.vehicleType}
                                onChange={(e) => setPartnerForm({ ...partnerForm, vehicleType: e.target.value })}
                            >
                                <option value="Tata Ace Mini-Truck">Tata Ace Mini-Truck (1,500 kg)</option>
                                <option value="Compactor Truck">Compactor Truck (3,500 kg)</option>
                                <option value="Hydraulic Tipper">Hydraulic Tipper (2,000 kg)</option>
                                <option value="Electric Waste Cart">Electric Waste Cart (800 kg)</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Preferred Coverage Zone</Form.Label>
                            <Form.Select
                                size="sm"
                                value={partnerForm.zone}
                                onChange={(e) => setPartnerForm({ ...partnerForm, zone: e.target.value })}
                            >
                                <option value="Zone 1 - Chhend Colony & BPUT">Zone 1 - Chhend Colony & BPUT Campus</option>
                                <option value="Zone 2 - Civil Township & Panposh">Zone 2 - Civil Township & Panposh</option>
                                <option value="Zone 3 - Steel City & Sector 4">Zone 3 - Steel City & Sector 4</option>
                            </Form.Select>
                        </Form.Group>
                        <div className="bg-light p-2 rounded text-muted" style={{ fontSize: '0.75rem' }}>
                            ⚠️ <em>Application will be submitted as PENDING. Municipal Root User must review and approve credentials before tasks are dispatched.</em>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" size="sm" onClick={() => setApplyPartnerModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" disabled={actionLoading === 'apply-partner'}>
                            Submit Application
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* MODAL 2: PUBLIC CITIZEN STREET REPORT */}
            <Modal show={streetReportModal} onHide={() => setStreetReportModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6 fw-bold">Report Garbage on Public Street / Road</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmitStreetReport}>
                    <Modal.Body className="small">
                        <div className="bg-info-subtle p-2 rounded text-dark mb-2" style={{ fontSize: '0.75rem' }}>
                            💡 <em>For waste spotted on public roads/streets OUTSIDE any college or institution boundary. Routes directly to Municipality!</em>
                        </div>
                        <Form.Group className="mb-2">
                            <Form.Label>Your Name & Contact</Form.Label>
                            <Form.Control
                                type="text"
                                size="sm"
                                value={streetForm.name}
                                onChange={(e) => setStreetForm({ ...streetForm, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Street Location / Landmark</Form.Label>
                            <Form.Control
                                type="text"
                                size="sm"
                                value={streetForm.address}
                                onChange={(e) => setStreetForm({ ...streetForm, address: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Row className="g-2 mb-2">
                            <Col sm={6}>
                                <Form.Label>Waste Category</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={streetForm.wasteType}
                                    onChange={(e) => setStreetForm({ ...streetForm, wasteType: e.target.value })}
                                >
                                    <option value="Mixed Garbage">Mixed Trash</option>
                                    <option value="Plastic Heap">Plastic Heap</option>
                                    <option value="Construction Scrap">Construction Debris</option>
                                    <option value="Organic Wet">Market Wet Waste</option>
                                </Form.Select>
                            </Col>
                            <Col sm={6}>
                                <Form.Label>Garbage Intensity</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={streetForm.garbageIntensity}
                                    onChange={(e) => setStreetForm({ ...streetForm, garbageIntensity: e.target.value })}
                                >
                                    <option value="High">High (Urgent Truck)</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </Form.Select>
                            </Col>
                        </Row>
                        <Form.Group className="mb-2">
                            <Form.Label>Description / Note</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                size="sm"
                                value={streetForm.description}
                                onChange={(e) => setStreetForm({ ...streetForm, description: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" size="sm" onClick={() => setStreetReportModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" size="sm" type="submit" disabled={actionLoading === 'street-report'}>
                            Submit Street Report
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
