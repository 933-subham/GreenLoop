import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Spinner, Tab, Nav, Table, Form, Modal } from 'react-bootstrap';
import { Users, FileText, CheckCircle, Clock, Download, ShoppingBag, Truck, AlertTriangle, Activity, Map as MapIcon, Award } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import LiveGarbageMap from '../components/LiveGarbageMap';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import Leaderboard from '../components/Leaderboard';
import FacilityOverviewTab from '../components/FacilityOverviewTab';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const STATUS_COLOR = { Submitted: '#6c757d', Assigned: '#fd7e14', Cleaning: '#0d6efd', Completed: '#28a745' };

export default function AdminDashboard() {
    const { user, authAxios } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [stats, setStats] = useState({});
    const [pending, setPending] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [activePartners, setActivePartners] = useState([]);
    const [shopItems, setShopItems] = useState([]);
    const [falseReports, setFalseReports] = useState([]);

    const [loading, setLoading] = useState({ stats: true, pending: true, users: true, reports: true, partners: false, shop: false, falseReports: true });
    const [alert, setAlert] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Assign report modal
    const [assignModal, setAssignModal] = useState(null);
    const [assignPartnerId, setAssignPartnerId] = useState('');

    // Add shop item modal
    const [shopModal, setShopModal] = useState(false);
    const [shopForm, setShopForm] = useState({ name: '', description: '', category: 'Reward', ecoCoinsRequired: 20, stock: -1, imageEmoji: '🎁' });

    // Delete Account Modal
    const [deleteModal, setDeleteModal] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));
    const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 5000); };

    const fetchAll = useCallback(async () => {
        try {
            const [s, p, u, r, ap] = await Promise.all([
                authAxios.get('/admin/stats'),
                authAxios.get('/admin/partners/pending'),
                authAxios.get('/admin/users'),
                authAxios.get('/reports'),
                authAxios.get('/admin/partners/active'),
            ]);
            setStats(s.data);
            setPending(p.data);
            setAllUsers(u.data);
            setAllReports(r.data);
            setActivePartners(ap.data);
            setFalseReports(r.data.filter(rep => rep.status === 'FalseReported'));
        } catch (err) {
            showAlert('danger', 'Failed to load dashboard data');
        } finally {
            setLoading({ stats: false, pending: false, users: false, reports: false, partners: false, shop: false, falseReports: false });
        }
    }, [authAxios]);

    const fetchShop = useCallback(async () => {
        try {
            const { data } = await authAxios.get('/shop');
            setShopItems(data);
        } catch { }
    }, [authAxios]);

    useEffect(() => { fetchAll(); fetchShop(); }, []);

    const handleApprove = async (id) => {
        setActionLoading(id + '_approve');
        try {
            await authAxios.put(`/admin/partners/${id}/approve`);
            setPending(prev => prev.filter(p => p._id !== id));
            showAlert('success', 'Partner approved and email sent!');
            fetchAll();
        } catch (err) { showAlert('danger', err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    const handleReject = async (id) => {
        setActionLoading(id + '_reject');
        try {
            await authAxios.put(`/admin/partners/${id}/reject`);
            setPending(prev => prev.filter(p => p._id !== id));
            showAlert('info', 'Partner rejected and notified.');
            fetchAll();
        } catch (err) { showAlert('danger', err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    const handleBlock = async (id, currentStatus) => {
        setActionLoading(id + '_block');
        try {
            const { data } = await authAxios.put(`/admin/users/${id}/block`);
            setAllUsers(prev => prev.map(u => u._id === id ? { ...u, status: data.user.status } : u));
            showAlert('success', data.message);
        } catch (err) { showAlert('danger', err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    const handleAssign = async () => {
        if (!assignPartnerId) return showAlert('warning', 'Select a partner first.');
        setActionLoading('assign');
        try {
            const { data } = await authAxios.put(`/reports/${assignModal}/assign-partner`, { partnerId: assignPartnerId });
            setAllReports(prev => prev.map(r => r._id === assignModal ? data : r));
            setAssignModal(null);
            showAlert('success', `Report assigned to ${data.partner?.name}`);
        } catch (err) { showAlert('danger', err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    const handleReviewFalseReport = async (reportId, action) => {
        setActionLoading(reportId + '_review');
        try {
            await authAxios.put(`/admin/reports/${reportId}/review-false-report`, { decision: action });
            showAlert('success', `False report marked as ${action}.`);
            fetchAll(); // Refresh everything
        } catch (err) {
            showAlert('danger', err.response?.data?.message || 'Error processing review.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddShopItem = async () => {
        try {
            await authAxios.post('/shop', shopForm);
            setShopModal(false);
            setShopForm({ name: '', description: '', category: 'Reward', ecoCoinsRequired: 20, stock: -1, imageEmoji: '🎁' });
            fetchShop();
            showAlert('success', 'Shop item added!');
        } catch (err) { showAlert('danger', err.response?.data?.message || 'Error'); }
    };

    const handleRemoveShopItem = async (id) => {
        try {
            await authAxios.delete(`/shop/${id}`);
            fetchShop();
            showAlert('info', 'Item removed from shop.');
        } catch (err) { showAlert('danger', err.response?.data?.message || 'Error'); }
    };

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            await authAxios.delete('/auth/delete-account');
            localStorage.removeItem('ecocity_token');
            navigate('/auth/login');
        } catch (err) {
            showAlert('danger', err.response?.data?.message || 'Failed to delete account');
            setDeletingAccount(false);
            setDeleteModal(false);
        }
    };

    const exportCSV = () => {
        const rows = [
            ['ID', 'Citizen', 'City', 'Waste Type', 'Status', 'Partner', 'Coins', 'Date'],
            ...allReports.map(r => [r._id, r.citizen?.name || '', r.cityName || '', r.wasteType, r.status, r.partner?.name || '', r.coinsAwarded, new Date(r.createdAt).toLocaleDateString('en-IN')])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'reports.csv'; a.click();
    };

    return (
        <div className="dashboard-layout">
            <Sidebar role="admin" />
            <div className="dashboard-content">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="fw-bold mb-1">Admin Dashboard 🏛️</h4>
                        <p className="text-muted small mb-0">📍 {user?.cityName}, {user?.district} — Municipality Head</p>
                    </div>
                    <Button variant="outline-danger" size="sm" onClick={() => setDeleteModal(true)}>
                        <AlertTriangle size={14} className="me-1" /> Deactivate Admin Account
                    </Button>
                </div>

                {alert && <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="small py-2 mb-3">{alert.msg}</Alert>}

                {/* KPIs */}
                <Row className="gy-3 mb-4">
                    {[
                        { icon: <FileText size={22} color="#6366f1" />, bg: '#ede9fe', value: stats.totalReports ?? '–', label: 'Total Reports' },
                        { icon: <CheckCircle size={22} color="#28a745" />, bg: '#d1fae5', value: stats.completedReports ?? '–', label: 'Cleaned' },
                        { icon: <Clock size={22} color="#fd7e14" />, bg: '#fff3cd', value: stats.pendingPartners ?? '–', label: 'Pending Partners' },
                        { icon: <Users size={22} color="#3b82f6" />, bg: '#dbeafe', value: stats.citizensCount ?? '–', label: 'Citizens' },
                        { icon: <Truck size={22} color="#0d6efd" />, bg: '#dbeafe', value: stats.partnersCount ?? '–', label: 'Active Partners' },
                        { icon: <Clock size={22} color="#ef4444" />, bg: '#fde8e8', value: stats.pendingReports ?? '–', label: 'Open Reports' },
                    ].map((k, i) => (
                        <Col xs={6} md={4} xl={2} key={i}>
                            <div className="kpi-card">
                                <div className="kpi-icon-wrap" style={{ background: k.bg }}>{k.icon}</div>
                                <div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div></div>
                            </div>
                        </Col>
                    ))}
                </Row>

                <Tab.Container activeKey={activeTab} onSelect={tab => navigate(`/admin/dashboard?tab=${tab}`)}>
                    <Nav variant="tabs" className="mb-3 border-bottom flex-wrap">
                        <Nav.Item><Nav.Link eventKey="overview" className="d-flex align-items-center gap-1 fw-bold text-success"><Activity size={16} /> 🌿 Facility Intelligence</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="analytics" className="d-flex align-items-center gap-1"><Activity size={16} /> Analytics</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="map" className="d-flex align-items-center gap-1"><MapIcon size={16} /> Map & Hotspots</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="false-reports" className="d-flex align-items-center gap-1">🚩 False Reports {falseReports.length > 0 && <Badge bg="danger" className="ms-1">{falseReports.length}</Badge>}</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="partners">👥 Pending Partners {pending.length > 0 && <Badge bg="danger" className="ms-1">{pending.length}</Badge>}</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="assign">📋 Assign Reports {allReports.filter(r => r.status === 'Submitted').length > 0 && <Badge bg="warning" text="dark" className="ms-1">{allReports.filter(r => r.status === 'Submitted').length}</Badge>}</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="leaderboard" className="d-flex align-items-center gap-1"><Award size={16} /> Leaderboard</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="users">👤 All Users</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="reports">📊 All Reports</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="shop">🛍️ Shop</Nav.Link></Nav.Item>
                    </Nav>

                    <Tab.Content>
                        {/* GREENLOOP PS-4 FACILITY INTELLIGENCE DASHBOARD */}
                        <Tab.Pane eventKey="overview">
                            <FacilityOverviewTab />
                        </Tab.Pane>

                        {/* ANALYTICS DASHBOARD */}
                        <Tab.Pane eventKey="analytics">
                            <AnalyticsDashboard />
                        </Tab.Pane>

                        {/* LIVE MAP & HOTSPOTS */}
                        <Tab.Pane eventKey="map" className="h-100">
                            {activeTab === 'map' && <div style={{ height: '600px' }}><LiveGarbageMap /></div>}
                        </Tab.Pane>

                        {/* FALSE REPORTS REVIEW */}
                        <Tab.Pane eventKey="false-reports">
                            {loading.falseReports ? <div className="text-center p-5"><Spinner animation="border" size="sm" /></div>
                                : falseReports.length === 0 ? <div className="text-center p-5 text-muted"><AlertTriangle size={40} className="mb-3 opacity-25" /><p>No false reports flagged by partners.</p></div>
                                    : <div className="d-flex flex-column gap-3">
                                        {falseReports.map(r => (
                                            <Card key={r._id} className="eco-card border-danger border border-2 border-opacity-50">
                                                <Card.Header className="bg-danger text-white fw-bold d-flex justify-content-between align-items-center py-2">
                                                    <span><AlertTriangle size={16} className="me-2 mb-1" />Partner Flagged False Report</span>
                                                    <Badge bg="light" text="danger">{new Date(r.updatedAt).toLocaleDateString('en-IN')}</Badge>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6} className="border-md-end mb-3 mb-md-0">
                                                            <h6 className="fw-bold text-muted mb-2">Citizen's Original Report</h6>
                                                            <p className="small mb-1"><span className="fw-semibold">Citizen:</span> {r.citizen?.name} ({r.citizen?.email})</p>
                                                            <p className="small mb-1"><span className="fw-semibold">Waste Type:</span> {r.wasteType}</p>
                                                            <p className="small mb-2"><span className="fw-semibold">Location:</span> {r.location?.address || r.cityName}</p>
                                                            {r.imageUrl && <img src={`http://localhost:5000${r.imageUrl}`} alt="Original" className="img-thumbnail" style={{ maxHeight: '120px' }} />}
                                                        </Col>
                                                        <Col md={6}>
                                                            <h6 className="fw-bold text-danger mb-2">Partner's Reason</h6>
                                                            <p className="small mb-1"><span className="fw-semibold">Partner:</span> {r.partner?.name}</p>
                                                            <div className="alert alert-danger py-2 small mb-2">{r.falseReportReason}</div>
                                                            {r.falseEvidenceUrl && <img src={`http://localhost:5000${r.falseEvidenceUrl}`} alt="Evidence" className="img-thumbnail mb-2" style={{ maxHeight: '120px' }} />}
                                                        </Col>
                                                    </Row>
                                                    <hr className="my-3" />
                                                    <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
                                                        <small className="text-muted d-block w-50">Approving will penalize the citizen (deduct coins & points). Rejecting will re-assign the task or leave it active.</small>
                                                        <div className="d-flex gap-2">
                                                            <Button variant="danger" size="sm" onClick={() => handleReviewFalseReport(r._id, 'approved')} disabled={actionLoading === r._id + '_review'}>
                                                                {actionLoading === r._id + '_review' ? <Spinner size="sm" /> : 'Approve (Penalize Citizen)'}
                                                            </Button>
                                                            <Button variant="outline-secondary" size="sm" onClick={() => handleReviewFalseReport(r._id, 'rejected')} disabled={actionLoading === r._id + '_review'}>
                                                                Reject Claim
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>}
                        </Tab.Pane>

                        {/* PENDING PARTNERS */}
                        <Tab.Pane eventKey="partners">
                            {loading.pending
                                ? <div className="text-center p-5"><Spinner animation="border" size="sm" /></div>
                                : pending.length === 0
                                    ? <div className="text-center p-5 text-muted"><Users size={40} className="mb-3 opacity-25" /><p>No pending partner applications right now.</p></div>
                                    : <div className="d-flex flex-column gap-3">
                                        {pending.map(p => (
                                            <Card key={p._id} className="eco-card border-0">
                                                <Card.Body className="p-4">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <h6 className="fw-bold mb-1">{p.name}</h6>
                                                            <p className="text-muted small mb-1">{p.email}</p>
                                                            <p className="text-muted small mb-0">📍 {p.cityName}, {p.district}, {p.state}</p>
                                                            <p className="text-muted small mb-0">Applied: {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <Button className="btn-eco btn-sm" onClick={() => handleApprove(p._id)} disabled={actionLoading === p._id + '_approve'}>
                                                                {actionLoading === p._id + '_approve' ? <Spinner size="sm" animation="border" /> : '✅ Approve'}
                                                            </Button>
                                                            <Button variant="outline-danger" size="sm" onClick={() => handleReject(p._id)} disabled={actionLoading === p._id + '_reject'}>
                                                                {actionLoading === p._id + '_reject' ? <Spinner size="sm" animation="border" /> : '❌ Reject'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>}
                        </Tab.Pane>

                        {/* ASSIGN REPORTS */}
                        <Tab.Pane eventKey="assign">
                            {allReports.filter(r => r.status === 'Submitted').length === 0
                                ? <div className="text-center p-5 text-muted"><CheckCircle size={40} className="mb-3 opacity-25" /><p>No unassigned reports in your city.</p></div>
                                : <div className="d-flex flex-column gap-3">
                                    {allReports.filter(r => r.status === 'Submitted').map(r => (
                                        <Card key={r._id} className="eco-card border-0">
                                            <Card.Body className="p-4">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6 className="fw-bold mb-1">🗑️ {r.wasteType}</h6>
                                                        <p className="text-muted small mb-1">{r.location?.address || r.cityName}</p>
                                                        {r.description && <p className="small text-muted mb-1">{r.description}</p>}
                                                        <p className="text-muted small mb-0">By: {r.citizen?.name} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                    <Button className="btn-eco btn-sm" onClick={() => { setAssignModal(r._id); setAssignPartnerId(''); }}>
                                                        🚛 Assign Partner
                                                    </Button>
                                                </div>
                                                {r.imageUrl && <img src={`http://localhost:5000${r.imageUrl}`} alt="report" className="w-100 mt-3 rounded-2" style={{ height: 120, objectFit: 'cover' }} />}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>}
                        </Tab.Pane>

                        {/* ALL USERS */}
                        <Tab.Pane eventKey="users">
                            <div className="table-responsive eco-card rounded-3 overflow-hidden">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Status</th><th>Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {allUsers.length === 0
                                            ? <tr><td colSpan={6} className="text-center p-4 text-muted">No users found</td></tr>
                                            : allUsers.map(u => (
                                                <tr key={u._id}>
                                                    <td className="fw-semibold small">{u.name}</td>
                                                    <td className="small text-muted">{u.email}</td>
                                                    <td><Badge bg={u.role === 'partner' ? 'primary' : 'secondary'} className="fw-normal">{u.role}</Badge></td>
                                                    <td className="small text-muted">{u.cityName || '—'}</td>
                                                    <td><Badge bg={u.status === 'active' ? 'success' : u.status === 'pending' ? 'warning' : 'danger'} className="fw-normal">{u.status}</Badge></td>
                                                    <td>
                                                        <Button variant={u.status === 'blocked' ? 'outline-success' : 'outline-danger'} size="sm"
                                                            onClick={() => handleBlock(u._id, u.status)} disabled={actionLoading === u._id + '_block'}>
                                                            {u.status === 'blocked' ? 'Unblock' : 'Block'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab.Pane>

                        {/* LEADERBOARD */}
                        <Tab.Pane eventKey="leaderboard">
                            <Leaderboard user={user} />
                        </Tab.Pane>

                        {/* ALL REPORTS */}
                        <Tab.Pane eventKey="reports">
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="outline-secondary" size="sm" onClick={exportCSV}>
                                    <Download size={14} className="me-1" />Export CSV
                                </Button>
                            </div>
                            <div className="table-responsive eco-card rounded-3 overflow-hidden">
                                <Table hover className="mb-0 align-middle small">
                                    <thead className="table-light">
                                        <tr><th>Citizen</th><th>Waste</th><th>Location</th><th>Status</th><th>Partner</th><th>Coins</th><th>Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {allReports.length === 0
                                            ? <tr><td colSpan={7} className="text-center p-4 text-muted">No reports</td></tr>
                                            : allReports.map(r => (
                                                <tr key={r._id}>
                                                    <td>{r.citizen?.name || '—'}</td>
                                                    <td><Badge style={{ background: '#e9ecef', color: '#333' }} className="fw-normal">{r.wasteType}</Badge></td>
                                                    <td className="text-muted">{r.location?.address || r.cityName || '—'}</td>
                                                    <td><span className="badge rounded-pill text-white fw-normal" style={{ background: STATUS_COLOR[r.status] }}>{r.status}</span></td>
                                                    <td>{r.partner?.name || <span className="text-muted">Unassigned</span>}</td>
                                                    <td>{r.coinsAwarded > 0 ? <span className="text-eco fw-bold">{r.coinsAwarded} 🪙</span> : '—'}</td>
                                                    <td>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab.Pane>

                        {/* SHOP MANAGEMENT */}
                        <Tab.Pane eventKey="shop">
                            <div className="d-flex justify-content-end mb-3">
                                <Button className="btn-eco btn-sm" onClick={() => setShopModal(true)}>+ Add Shop Item</Button>
                            </div>
                            {shopItems.length === 0
                                ? <div className="text-center p-5 text-muted"><ShoppingBag size={40} className="mb-3 opacity-25" /><p>No shop items. Add some!</p></div>
                                : <div className="table-responsive eco-card rounded-3 overflow-hidden">
                                    <Table hover className="mb-0 align-middle small">
                                        <thead className="table-light">
                                            <tr><th>Item</th><th>Category</th><th>Coins</th><th>Stock</th><th>Action</th></tr>
                                        </thead>
                                        <tbody>
                                            {shopItems.map(item => (
                                                <tr key={item._id}>
                                                    <td><span className="me-2">{item.imageEmoji}</span><strong>{item.name}</strong></td>
                                                    <td><Badge bg="secondary" className="fw-normal">{item.category}</Badge></td>
                                                    <td className="fw-bold text-eco">{item.ecoCoinsRequired} 🪙</td>
                                                    <td>{item.stock === -1 ? '∞' : item.stock}</td>
                                                    <td><Button variant="outline-danger" size="sm" onClick={() => handleRemoveShopItem(item._id)}>Remove</Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </div>

            {/* Assign Partner Modal */}
            <Modal show={!!assignModal} onHide={() => setAssignModal(null)} centered>
                <Modal.Header closeButton><Modal.Title>Assign Report to Partner</Modal.Title></Modal.Header>
                <Modal.Body>
                    {activePartners.length === 0
                        ? <Alert variant="warning">No active partners in your city. Approve partner applications first.</Alert>
                        : <Form.Group>
                            <Form.Label>Select a Partner</Form.Label>
                            <Form.Select value={assignPartnerId} onChange={e => setAssignPartnerId(e.target.value)}>
                                <option value="">— Choose Partner —</option>
                                {activePartners.map(p => <option key={p._id} value={p._id}>{p.name} ({p.email})</option>)}
                            </Form.Select>
                        </Form.Group>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setAssignModal(null)}>Cancel</Button>
                    <Button className="btn-eco" onClick={handleAssign} disabled={actionLoading === 'assign' || !assignPartnerId}>
                        {actionLoading === 'assign' ? <Spinner size="sm" animation="border" /> : '🚛 Assign'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add Shop Item Modal */}
            <Modal show={shopModal} onHide={() => setShopModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Add Shop Item</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control value={shopForm.name} onChange={e => setShopForm({ ...shopForm, name: e.target.value })} placeholder="Item name" /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={shopForm.description} onChange={e => setShopForm({ ...shopForm, description: e.target.value })} /></Form.Group>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Category</Form.Label><Form.Select value={shopForm.category} onChange={e => setShopForm({ ...shopForm, category: e.target.value })}>
                            {['Voucher', 'Nature', 'Reward', 'Utility'].map(c => <option key={c}>{c}</option>)}
                        </Form.Select></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Eco Coins Required</Form.Label><Form.Control type="number" min="1" value={shopForm.ecoCoinsRequired} onChange={e => setShopForm({ ...shopForm, ecoCoinsRequired: Number(e.target.value) })} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Stock (-1 = unlimited)</Form.Label><Form.Control type="number" min="-1" value={shopForm.stock} onChange={e => setShopForm({ ...shopForm, stock: Number(e.target.value) })} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Emoji Icon</Form.Label><Form.Control value={shopForm.imageEmoji} onChange={e => setShopForm({ ...shopForm, imageEmoji: e.target.value })} placeholder="🎁" /></Form.Group></Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShopModal(false)}>Cancel</Button>
                    <Button className="btn-eco" onClick={handleAddShopItem}>Add Item</Button>
                </Modal.Footer>
            </Modal>
            {/* Delete Account Modal */}
            <Modal show={deleteModal} onHide={() => setDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title className="fs-5"><AlertTriangle size={20} className="me-2" />Deactivate Account</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <h5 className="text-danger fw-bold mb-3">Are you absolutely sure?</h5>
                    <p className="text-muted mb-2">
                        Deleting this Admin account will permanently remove your login access and clear the official Admin position for <strong>{user?.cityName}</strong>.
                    </p>
                    <p className="text-muted small mb-0">
                        A new administrator will be able to register using the city's invite code once your account is deleted.
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
