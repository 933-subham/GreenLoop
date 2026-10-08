import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Badge, ListGroup, Alert, Tab, Nav, Spinner, Modal } from 'react-bootstrap';
import { Camera, MapPin, Award, Trash2, FileText, Clock, ShoppingBag, CheckCircle, Gift, Sparkles, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Leaderboard from '../components/Leaderboard';
import CameraCapture from '../components/CameraCapture';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoaderSpinner from '../components/LoaderSpinner';

const STATUS_COLOR = { Submitted: '#6c757d', Assigned: '#fd7e14', Cleaning: '#0d6efd', Completed: '#28a745' };
const STATUS_ICON = { Submitted: '📋', Assigned: '🚛', Cleaning: '🧹', Completed: '✅' };

export default function CitizenDashboard() {
    const { user, authAxios, setUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'report';
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [form, setForm] = useState({ wasteType: 'Organic', address: '', lat: '', lng: '', description: '', garbageIntensity: 'Medium' });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [gettingGPS, setGettingGPS] = useState(false);

    // AI & Duplicate states
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null); // { wasteType, confidence, instructions }
    const [duplicateChecking, setDuplicateChecking] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(false);
    // Shop state
    const [shopItems, setShopItems] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [buying, setBuying] = useState(null);
    const [liveCoins, setLiveCoins] = useState(user?.ecoCoins ?? 0);

    const fetchReports = useCallback(async () => {
        try {
            const { data } = await authAxios.get('/reports/myreports');
            setReports(data);
        } catch { } finally { setLoadingReports(false); }
    }, [authAxios]);

    const fetchShop = useCallback(async () => {
        try {
            const [items, hist] = await Promise.all([
                authAxios.get('/shop'),
                authAxios.get('/shop/my-purchases')
            ]);
            setShopItems(items.data);
            setPurchases(hist.data);
        } catch { }
    }, [authAxios]);

    const fetchCoins = useCallback(async () => {
        try {
            const { data } = await authAxios.get('/auth/profile');
            setLiveCoins(data.ecoCoins ?? 0);
        } catch { }
    }, [authAxios]);

    useEffect(() => { fetchReports(); fetchShop(); fetchCoins(); }, []);

    useEffect(() => {
        const handlePrefill = (e) => {
            const data = e.detail;
            if (data) {
                setForm(f => ({ ...f, wasteType: data.wasteType || 'Mixed', address: data.address || '' }));
                navigate('/citizen/dashboard?tab=report');
                setAlert({ type: 'success', msg: '✨ Report prepared by AI! Just snap a photo and submit.' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('chatbot_prefill', handlePrefill);
        return () => window.removeEventListener('chatbot_prefill', handlePrefill);
    }, [navigate]);


    const handleGPS = () => {
        setGettingGPS(true);
        navigator.geolocation?.getCurrentPosition(
            async pos => {
                const lat = pos.coords.latitude.toFixed(6);
                const lng = pos.coords.longitude.toFixed(6);

                try {
                    // Reverse geocode to get physical city context
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
                    const geoData = await geoRes.json();

                    const addressParts = geoData.address || {};
                    // Nominatim sometimes uses town, village, or municipality instead of city
                    const physicalCity = addressParts.city || addressParts.town || addressParts.village || addressParts.municipality || '';
                    const physicalState = addressParts.state || '';
                    const physicalDistrict = addressParts.county || addressParts.state_district || '';

                    setForm(f => ({
                        ...f,
                        lat, lng,
                        address: geoData.display_name || `GPS: ${lat}, ${lng}`,
                        city: physicalCity,
                        cityName: physicalCity,
                        state: physicalState,
                        district: physicalDistrict
                    }));
                } catch (err) {
                    console.error("Reverse geocoding failed", err);
                    setForm(f => ({ ...f, lat, lng, address: `GPS: ${lat}, ${lng}` }));
                }

                setGettingGPS(false);

                // Trigger Duplicate Check
                setDuplicateChecking(true);
                setDuplicateWarning(false);
                try {
                    const { data } = await authAxios.get(`/reports/check-duplicate?lat=${lat}&lng=${lng}`);
                    if (data.isDuplicate) setDuplicateWarning(true);
                } catch (err) {
                    console.error("Duplicate check failed:", err);
                } finally {
                    setDuplicateChecking(false);
                }
            },
            () => { setAlert({ tab: 'report', type: 'warning', msg: 'GPS unavailable. Enter address manually.' }); setGettingGPS(false); },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) return setAlert({ tab: 'report', type: 'warning', msg: 'Please upload a garbage photo.' });
        setSubmitting(true); setAlert(null);
        try {
            const fd = new FormData();
            fd.append('image', image);
            fd.append('wasteType', form.wasteType);
            fd.append('garbageIntensity', form.garbageIntensity);
            fd.append('description', form.description);
            fd.append('address', form.address);
            if (form.lat) fd.append('lat', form.lat);
            if (form.lng) fd.append('lng', form.lng);
            if (form.city) fd.append('city', form.city);
            if (form.cityName) fd.append('cityName', form.cityName);
            if (form.state) fd.append('state', form.state);
            if (form.district) fd.append('district', form.district);

            const { data } = await authAxios.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setReports(prev => [data, ...prev]);
            setImage(null); setImagePreview(null);
            setAiSuggestion(null); setDuplicateWarning(false);
            setForm({ wasteType: 'Organic', address: '', lat: '', lng: '', description: '', garbageIntensity: 'Medium', city: '', cityName: '', state: '', district: '' });
            setAlert({ tab: 'report', type: 'success', msg: `✅ Report submitted! You will earn Eco Coins based on the intensity once it is cleaned.` });
        } catch (err) {
            setAlert({ tab: 'report', type: 'danger', msg: err.response?.data?.message || 'Submission failed.' });
        } finally { setSubmitting(false); }
    };

    const handleBuy = async (item) => {
        setBuying(item._id);
        try {
            const { data } = await authAxios.post(`/shop/buy/${item._id}`);
            setLiveCoins(data.ecoCoinsRemaining);
            setPurchases(prev => [data.purchase, ...prev]);
            setAlert({ tab: 'shop', type: 'success', msg: data.message });
            fetchShop();
        } catch (err) {
            setAlert({ tab: 'shop', type: 'danger', msg: err.response?.data?.message || 'Purchase failed.' });
        } finally { setBuying(null); }
    };

    const [deleteModal, setDeleteModal] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            await authAxios.delete('/auth/delete-account');
            localStorage.removeItem('ecocity_token');
            navigate('/auth/login');
        } catch (err) {
            setAlert({ tab: 'report', type: 'danger', msg: err.response?.data?.message || 'Failed to delete account' });
            setDeletingAccount(false);
            setDeleteModal(false);
        }
    };

    const completedCount = reports.filter(r => r.status === 'Completed').length;
    const pendingCount = reports.filter(r => r.status !== 'Completed').length;

    return (
        <div className="dashboard-layout">
            <Sidebar role="citizen" />
            <div className="dashboard-content">
                <div className="mb-4 d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                        <h4 className="fw-bold mb-1">Welcome, {user?.name}! 👋</h4>
                        <p className="text-muted small mb-0">📍 {user?.cityName}, {user?.district}, {user?.state}</p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <Award size={20} color="#16a34a" />
                            <span className="fw-bold text-eco">{liveCoins} Eco Coins</span>
                        </div>
                        <Button variant="outline-danger" size="sm" onClick={() => setDeleteModal(true)}>
                            <AlertTriangle size={14} className="me-1" /> Deactivate
                        </Button>
                    </div>
                </div>

                {/* KPI Row */}
                <Row className="gy-3 mb-4">
                    {[
                        { icon: <Award size={22} color="#10b981" />, bg: '#d1fae5', value: liveCoins, label: 'Eco Coins' },
                        { icon: <FileText size={22} color="#3b82f6" />, bg: '#dbeafe', value: reports.length, label: 'Total Reports' },
                        { icon: <CheckCircle size={22} color="#28a745" />, bg: '#d1fae5', value: completedCount, label: 'Cleaned Up' },
                        { icon: <Clock size={22} color="#f59e0b" />, bg: '#fef3c7', value: pendingCount, label: 'Pending' },
                    ].map((k, i) => (
                        <Col xs={6} md={3} key={i}>
                            <div className="kpi-card">
                                <div className="kpi-icon-wrap" style={{ background: k.bg }}>{k.icon}</div>
                                <div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div></div>
                            </div>
                        </Col>
                    ))}
                </Row>

                <Tab.Container activeKey={activeTab} onSelect={tab => navigate(`/citizen/dashboard?tab=${tab}`)}>
                    <Nav variant="tabs" className="mb-3 border-bottom">
                        <Nav.Item key="nav-report"><Nav.Link eventKey="report">📷 Report Garbage</Nav.Link></Nav.Item>
                        <Nav.Item key="nav-history"><Nav.Link eventKey="history">📋 My Reports {reports.length > 0 && <Badge bg="secondary" className="ms-1 fw-normal">{reports.length}</Badge>}</Nav.Link></Nav.Item>
                        <Nav.Item key="nav-leaderboard"><Nav.Link eventKey="leaderboard">🏆 Leaderboard</Nav.Link></Nav.Item>
                        <Nav.Item key="nav-shop"><Nav.Link eventKey="shop">🛍️ Eco Shop {liveCoins > 0 && <Badge bg="success" className="ms-1 fw-normal">{liveCoins}🪙</Badge>}</Nav.Link></Nav.Item>
                    </Nav>
                    <Tab.Content>
                        {/* REPORT TAB */}
                        <Tab.Pane eventKey="report">
                            {alert?.tab === 'report' && <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="small py-2">{alert.msg}</Alert>}
                            <Card className="eco-card border-0">
                                <Card.Body className="p-4">
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-semibold">Garbage Photo *</Form.Label>
                                            <CameraCapture
                                                previewUrl={imagePreview}
                                                onCapture={async (file, url) => {
                                                    setImage(file);
                                                    setImagePreview(url);
                                                    // Trigger AI Classification
                                                    setAiAnalyzing(true);
                                                    setAiSuggestion(null);
                                                    try {
                                                        const fd = new FormData();
                                                        fd.append('image', file);
                                                        const { data } = await authAxios.post('/reports/classify-waste', fd, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        if (data.wasteType) {
                                                            setAiSuggestion({ wasteType: data.wasteType, confidence: data.confidence, instructions: data.instructions });
                                                            setForm(f => ({ ...f, wasteType: data.wasteType }));
                                                        }
                                                    } catch (err) {
                                                        console.error('AI Classification failed:', err);
                                                    } finally {
                                                        setAiAnalyzing(false);
                                                    }
                                                }}
                                                onClear={() => { setImage(null); setImagePreview(null); setAiSuggestion(null); }}
                                            />
                                            {aiAnalyzing && <p className="text-muted small mt-2"><Spinner size="sm" animation="border" className="me-1" /> Analyzing image with AI...</p>}
                                        </Form.Group>


                                        {aiSuggestion && (
                                            <div className="alert alert-success border-success border-opacity-25 rounded-3 mb-4 d-flex align-items-start gap-3">
                                                <Sparkles className="text-success mt-1" size={24} />
                                                <div>
                                                    <h6 className="fw-bold text-success mb-1">AI Suggestion: {aiSuggestion.wasteType}</h6>
                                                    <p className="small mb-1 text-dark">{aiSuggestion.instructions}</p>
                                                    <small className="text-muted">Confidence: {(aiSuggestion.confidence * 100).toFixed(0)}% • We have auto-selected this category for you.</small>
                                                </div>
                                            </div>
                                        )}

                                        <Row className="gy-3 mb-3">
                                            <Col md={6}>
                                                <Form.Label className="fw-semibold">Waste Type</Form.Label>
                                                <Form.Select value={form.wasteType} onChange={e => setForm({ ...form, wasteType: e.target.value })}>
                                                    {['Organic', 'Recyclable', 'Hazardous', 'Mixed'].map(t => <option key={t}>{t}</option>)}
                                                </Form.Select>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Label className="fw-semibold">Garbage Intensity</Form.Label>
                                                <Form.Select value={form.garbageIntensity} onChange={e => setForm({ ...form, garbageIntensity: e.target.value })}>
                                                    {['Low', 'Medium', 'High'].map(t => <option key={t}>{t}</option>)}
                                                </Form.Select>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Label className="fw-semibold">GPS Location</Form.Label>
                                                <Button variant="light" className="w-100 border d-flex align-items-center justify-content-center gap-2" onClick={handleGPS} disabled={gettingGPS || duplicateChecking} type="button">
                                                    <MapPin size={16} className="text-danger" />
                                                    {gettingGPS ? 'Getting GPS...' : duplicateChecking ? 'Checking area...' : form.address ? <span className="text-truncate">{form.address}</span> : 'Capture GPS Location'}
                                                </Button>
                                            </Col>
                                        </Row>

                                        {duplicateWarning && (
                                            <div className="alert alert-warning border-warning border-opacity-50 rounded-3 mb-3 d-flex align-items-start gap-3">
                                                <AlertTriangle className="text-warning mt-1" size={24} />
                                                <div>
                                                    <h6 className="fw-bold text-dark mb-1">Warning: Nearby Report Detected</h6>
                                                    <p className="small mb-0 text-dark">We found an existing active report within 30 meters of this location. Are you sure you want to submit a duplicate?</p>
                                                </div>
                                            </div>
                                        )}

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Manual Address</Form.Label>
                                            <Form.Control placeholder="Street, landmark, area — if GPS not captured" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-semibold">Description</Form.Label>
                                            <Form.Control as="textarea" rows={3} placeholder="Describe the garbage: type, smell, how long it's been there, any hazards, quantity..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                        </Form.Group>
                                        <div className="p-3 rounded-3 mb-3 small" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                            💡 <strong>Earn up to 20 Eco Coins</strong> based on garbage intensity once the area is cleaned (Low: 5, Medium: 10, High: 20 🪙).
                                        </div>
                                        <Button type="submit" className="btn-eco w-100 py-2 fw-semibold" disabled={submitting}>
                                            {submitting ? <><Spinner size="sm" animation="border" className="me-2" />Submitting...</> : '📋 Submit Report'}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Tab.Pane>

                        {/* HISTORY TAB */}
                        <Tab.Pane eventKey="history">
                            {loadingReports
                                ? <div className="text-center p-5"><Spinner animation="border" size="sm" /></div>
                                : reports.length === 0
                                    ? <div className="text-center p-5 text-muted"><Trash2 size={40} className="mb-3 opacity-25" /><p>No reports yet. Use the Report tab to get started!</p></div>
                                    : <div className="d-flex flex-column gap-3">
                                        {reports.map(r => (
                                            <Card key={r._id} className="eco-card border-0">
                                                <Card.Body className="p-3">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <span className="fw-semibold">
                                                                {r.falseReportFlag && r.adminDecision === 'approved' ? '❌' : STATUS_ICON[r.status]} {r.wasteType}
                                                            </span>
                                                            {r.description && <p className="text-muted small mb-0 mt-1">{r.description}</p>}
                                                            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                                                                <MapPin size={11} className="me-1" />{r.location?.address || r.cityName || 'Location not specified'}
                                                            </p>
                                                        </div>
                                                        <div className="text-end">
                                                            {r.falseReportFlag && r.adminDecision === 'approved' ? (
                                                                <>
                                                                    <span className="badge rounded-pill px-3 py-2 text-white fw-normal bg-danger">False Report</span>
                                                                    <p className="text-danger fw-bold small mt-1 mb-0">-10 🪙</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="badge rounded-pill px-3 py-2 text-white fw-normal" style={{ background: STATUS_COLOR[r.status] }}>{r.status}</span>
                                                                    {r.coinsAwarded > 0 && <p className="text-eco fw-bold small mt-1 mb-0">+{r.coinsAwarded} 🪙</p>}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                            <Clock size={11} className="me-1" />
                                                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        {r.partner && <span className="text-muted small">Partner: {r.partner.name}</span>}
                                                    </div>
                                                    {r.imageUrl && (
                                                        <img src={`http://localhost:5000${r.imageUrl}`} alt="report" className="w-100 mt-2 rounded-2" style={{ height: 100, objectFit: 'cover' }} />
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>}
                        </Tab.Pane>

                        {/* LEADERBOARD TAB */}
                        <Tab.Pane eventKey="leaderboard">
                            <Leaderboard user={user} />
                        </Tab.Pane>

                        {/* SHOP TAB */}
                        <Tab.Pane eventKey="shop">
                            {alert?.tab === 'shop' && <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="small py-2">{alert.msg}</Alert>}
                            <div className="mb-3 p-3 rounded-3 d-flex align-items-center gap-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Award size={28} color="#16a34a" />
                                <div>
                                    <p className="fw-bold mb-0 text-eco">You have {liveCoins} Eco Coins</p>
                                    <p className="text-muted small mb-0">Earn more by reporting and getting garbage cleaned!</p>
                                </div>
                            </div>

                            {shopItems.length === 0
                                ? <div className="text-center p-5 text-muted"><ShoppingBag size={40} className="mb-3 opacity-25" /><p>Shop is empty. Check back soon!</p></div>
                                : <Row className="gy-3">
                                    {shopItems.map(item => (
                                        <Col md={6} lg={4} key={item._id}>
                                            <Card className="eco-card border-0 h-100">
                                                <Card.Body className="p-4 d-flex flex-column">
                                                    <div className="text-center mb-3" style={{ fontSize: '3rem' }}>{item.imageEmoji}</div>
                                                    <Badge bg="secondary" className="fw-normal align-self-start mb-2">{item.category}</Badge>
                                                    <h6 className="fw-bold mb-1">{item.name}</h6>
                                                    <p className="text-muted small flex-grow-1">{item.description}</p>
                                                    {item.stock !== -1 && <p className="small text-muted mb-2">Stock: {item.stock} left</p>}
                                                    <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                                                        <span className="fw-bold text-eco">{item.ecoCoinsRequired} 🪙</span>
                                                        <Button
                                                            size="sm" className="btn-eco px-3"
                                                            disabled={liveCoins < item.ecoCoinsRequired || buying === item._id || item.stock === 0}
                                                            onClick={() => handleBuy(item)}
                                                        >
                                                            {buying === item._id ? <Spinner size="sm" animation="border" /> : item.stock === 0 ? 'Out of Stock' : liveCoins < item.ecoCoinsRequired ? 'Not Enough' : 'Redeem'}
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>}

                            {purchases.length > 0 && (
                                <div className="mt-4">
                                    <h6 className="fw-bold mb-3">📦 My Redemption History</h6>
                                    <ListGroup variant="flush" className="eco-card rounded-3">
                                        {purchases.map(p => (
                                            <ListGroup.Item key={p._id} className="d-flex justify-content-between align-items-center py-3 px-4">
                                                <div>
                                                    <p className="fw-semibold small mb-0">{p.shopItem?.imageEmoji || '🎁'} {p.itemName}</p>
                                                    <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                                                </div>
                                                <div className="text-end">
                                                    <span className="text-eco fw-bold small">-{p.ecoCoinsSpent} 🪙</span>
                                                    <br /><Badge bg={p.status === 'Fulfilled' ? 'success' : 'secondary'} className="fw-normal">{p.status}</Badge>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </div>

            {/* Delete Account Modal */}
            <Modal show={deleteModal} onHide={() => setDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title className="fs-5"><AlertTriangle size={20} className="me-2" />Deactivate Account</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <h5 className="text-danger fw-bold mb-3">Are you absolutely sure?</h5>
                    <p className="text-muted mb-2">
                        Deleting this Citizen account will permanently remove your login access.
                    </p>
                    <p className="text-muted small mb-0">
                        This action cannot be undone. You will lose all your {liveCoins} Eco Coins and leaderboard progress.
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
