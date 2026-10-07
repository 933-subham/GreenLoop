import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280'];

const AnalyticsDashboard = () => {
    const [wasteTypes, setWasteTypes] = useState([]);
    const [monthlyCleanups, setMonthlyCleanups] = useState([]);
    const [areaCleanliness, setAreaCleanliness] = useState([]);
    const [partnerPerf, setPartnerPerf] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [wtRes, mcRes, acRes, ppRes] = await Promise.all([
                    api.get('/admin/analytics/waste-types'),
                    api.get('/admin/analytics/monthly-cleanups'),
                    api.get('/admin/analytics/area-cleanliness'),
                    api.get('/admin/analytics/partner-performance')
                ]);
                
                setWasteTypes(wtRes.data);
                setMonthlyCleanups(mcRes.data);
                setAreaCleanliness(acRes.data);
                setPartnerPerf(ppRes.data);
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
        return percent > 0.05 ? (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        ) : null;
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex align-items-center mb-4">
                <Activity className="text-success me-2" size={28} />
                <h3 className="mb-0 fw-bold">City Analytics Engine</h3>
            </div>

            <div className="row g-4">
                {/* Waste Distribution Pie Chart */}
                <div className="col-12 col-xl-6">
                    <div className="card shadow-sm border-0 rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 pb-0 px-4 d-flex align-items-center gap-2">
                            <PieChartIcon className="text-primary" size={20} />
                            <h5 className="mb-0 fw-bold">Waste Composition</h5>
                        </div>
                        <div className="card-body" style={{ height: '350px' }}>
                            {wasteTypes.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={wasteTypes}
                                            cx="50%" cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="count"
                                            nameKey="wasteType"
                                        >
                                            {wasteTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value, name) => [value + ' Reports', name]} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>}
                        </div>
                    </div>
                </div>

                {/* Monthly Cleanups Trend */}
                <div className="col-12 col-xl-6">
                    <div className="card shadow-sm border-0 rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 pb-0 px-4 d-flex align-items-center gap-2">
                            <Activity className="text-success" size={20} />
                            <h5 className="mb-0 fw-bold">Cleanups (Last 12 Months)</h5>
                        </div>
                        <div className="card-body" style={{ height: '350px' }}>
                            {monthlyCleanups.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <BarChart data={monthlyCleanups} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6c757d', fontSize: 12}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6c757d', fontSize: 12}} />
                                        <RechartsTooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                                        <Bar dataKey="count" name="Cleaned Reports" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>}
                        </div>
                    </div>
                </div>

                {/* Partner Performance */}
                <div className="col-12 col-xl-6">
                    <div className="card shadow-sm border-0 rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 pb-0 px-4 d-flex align-items-center gap-2">
                            <BarChart2 className="text-warning" size={20} />
                            <h5 className="mb-0 fw-bold">Partner Performance (Tasks)</h5>
                        </div>
                        <div className="card-body" style={{ height: '350px' }}>
                            {partnerPerf.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <BarChart data={partnerPerf} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6c757d', fontSize: 12}} />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#495057', fontSize: 12, fontWeight: 500}} width={100} />
                                        <RechartsTooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '8px'}} />
                                        <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>}
                        </div>
                    </div>
                </div>

                {/* Area Cleanliness Table */}
                <div className="col-12 col-xl-6">
                    <div className="card shadow-sm border-0 rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 pb-0 px-4 d-flex align-items-center gap-2">
                            <Activity className="text-info" size={20} />
                            <h5 className="mb-0 fw-bold">District Cleanliness Index</h5>
                        </div>
                        <div className="card-body overflow-auto px-4">
                            {areaCleanliness.length > 0 ? (
                                <table className="table table-hover table-borderless align-middle mt-2">
                                    <thead className="table-light text-muted small text-uppercase">
                                        <tr>
                                            <th className="rounded-start">District</th>
                                            <th>Score</th>
                                            <th className="rounded-end">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {areaCleanliness.map((area, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-medium">{area.district}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="fw-bold" style={{width: '35px'}}>{Math.round(area.score)}%</span>
                                                        <div className="progress flex-grow-1" style={{height: '6px'}}>
                                                            <div className={`progress-bar ${area.score >= 80 ? 'bg-success' : area.score >= 50 ? 'bg-warning' : 'bg-danger'}`} 
                                                                 style={{width: `${area.score}%`}}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${area.score >= 80 ? 'bg-success-subtle text-success' : area.score >= 50 ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'}`}>
                                                        {area.score >= 80 ? 'Clean' : area.score >= 50 ? 'Moderate' : 'Critical'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
