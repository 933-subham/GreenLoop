import React, { useState, useEffect } from 'react';
import { Trophy, Medal, MapPin, Award } from 'lucide-react';
import api from '../services/api';

const Leaderboard = ({ user }) => {
    const [data, setData] = useState({ citizens: [], partners: [], areas: [] });
    const [activeTab, setActiveTab] = useState('citizens');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/leaderboard');
                setData({
                    citizens: res.data.citizens || [],
                    partners: res.data.partners || [],
                    areas: res.data.areas || []
                });
            } catch (err) {
                console.error("Error fetching leaderboard:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

    const rankStyles = (index) => {
        if (index === 0) return { bg: 'bg-warning bg-opacity-10 border-warning', text: 'text-warning', icon: <Trophy size={20} /> };
        if (index === 1) return { bg: 'bg-secondary bg-opacity-10 border-secondary', text: 'text-secondary', icon: <Medal size={20} /> };
        if (index === 2) return { bg: 'bg-danger bg-opacity-10 border-danger', text: 'text-danger', icon: <Medal size={20} /> };
        return { bg: 'bg-light border-light', text: 'text-muted', icon: <span className="fw-bold">{index + 1}</span> };
    };

    return (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                <div className="d-flex align-items-center mb-3">
                    <Award className="text-success me-2" size={28} />
                    <h4 className="mb-0 fw-bold">Eco Warriors Leaderboard</h4>
                </div>
                
                {/* Tabs */}
                <ul className="nav nav-pills gap-2 mb-3">
                    <li className="nav-item">
                        <button 
                            className={`nav-link rounded-pill px-4 ${activeTab === 'citizens' ? 'active bg-success' : 'text-dark bg-light'}`}
                            onClick={() => setActiveTab('citizens')}
                        >
                            Top Citizens
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link rounded-pill px-4 ${activeTab === 'partners' ? 'active bg-success' : 'text-dark bg-light'}`}
                            onClick={() => setActiveTab('partners')}
                        >
                            Top Partners
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link rounded-pill px-4 ${activeTab === 'areas' ? 'active bg-success' : 'text-dark bg-light'}`}
                            onClick={() => setActiveTab('areas')}
                        >
                            Cleanest Areas
                        </button>
                    </li>
                </ul>
            </div>

            <div className="card-body p-0">
                {activeTab === 'citizens' && (
                    <ul className="list-group list-group-flush">
                        {data.citizens.length === 0 ? <li className="list-group-item text-center p-4 text-muted">No data available</li> : null}
                        {data.citizens.map((citizen, idx) => {
                            const style = rankStyles(idx);
                            const isMe = user?._id === citizen._id;
                            return (
                                <li key={citizen._id} className={`list-group-item d-flex justify-content-between align-items-center p-3 px-4 ${isMe ? 'bg-success bg-opacity-10' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`rounded-circle d-flex justify-content-center align-items-center ${style.bg} ${style.text}`} style={{width: '40px', height: '40px', border: '2px solid'}}>
                                            {style.icon}
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{citizen.name} {isMe && <span className="badge bg-success ms-1">You</span>}</h6>
                                            <small className="text-muted"><MapPin size={12}/> {citizen.cityName}</small>
                                        </div>
                                    </div>
                                    <h5 className="mb-0 fw-bold text-success">{citizen.citizenPoints} <small className="text-muted fw-normal fs-6">pts</small></h5>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {activeTab === 'partners' && (
                    <ul className="list-group list-group-flush">
                        {data.partners.length === 0 ? <li className="list-group-item text-center p-4 text-muted">No data available</li> : null}
                        {data.partners.map((partner, idx) => {
                            const style = rankStyles(idx);
                            const isMe = user?._id === partner._id;
                            return (
                                <li key={partner._id} className={`list-group-item d-flex justify-content-between align-items-center p-3 px-4 ${isMe ? 'bg-success bg-opacity-10' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`rounded-circle d-flex justify-content-center align-items-center ${style.bg} ${style.text}`} style={{width: '40px', height: '40px', border: '2px solid'}}>
                                            {style.icon}
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{partner.name} {isMe && <span className="badge bg-success ms-1">You</span>}</h6>
                                            <small className="text-muted"><MapPin size={12}/> {partner.cityName}</small>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <h5 className="mb-0 fw-bold text-success">{partner.partnerPoints} <small className="text-muted fw-normal fs-6">pts</small></h5>
                                        <small className="text-muted">{partner.stats?.tasksCompleted} Tasks</small>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {activeTab === 'areas' && (
                    <ul className="list-group list-group-flush">
                        {data.areas.length === 0 ? <li className="list-group-item text-center p-4 text-muted">No data available</li> : null}
                        {data.areas.map((area, idx) => {
                            const style = rankStyles(idx);
                            return (
                                <li key={idx} className="list-group-item p-3 px-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`rounded-circle d-flex justify-content-center align-items-center ${style.bg} ${style.text}`} style={{width: '32px', height: '32px', border: '1px solid'}}>
                                                <span className="fw-bold" style={{fontSize: '0.8rem'}}>{idx + 1}</span>
                                            </div>
                                            <h6 className="mb-0 fw-bold">{area.district}</h6>
                                        </div>
                                        <h6 className={`mb-0 fw-bold ${area.cleanlinessScore >= 80 ? 'text-success' : area.cleanlinessScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                                            {Math.round(area.cleanlinessScore)}% Clean
                                        </h6>
                                    </div>
                                    <div className="progress" style={{height: '6px'}}>
                                        <div 
                                            className={`progress-bar ${area.cleanlinessScore >= 80 ? 'bg-success' : area.cleanlinessScore >= 50 ? 'bg-warning' : 'bg-danger'}`} 
                                            role="progressbar" 
                                            style={{ width: `${area.cleanlinessScore}%` }}
                                            aria-valuenow={area.cleanlinessScore} aria-valuemin="0" aria-valuemax="100"
                                        ></div>
                                    </div>
                                    <div className="d-flex justify-content-between mt-1">
                                        <small className="text-muted" style={{fontSize: '0.75rem'}}>Completed: {area.completedReports}</small>
                                        <small className="text-muted" style={{fontSize: '0.75rem'}}>Total: {area.totalReports}</small>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
