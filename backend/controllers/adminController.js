import User from '../models/User.js';
import Report from '../models/Report.js';
import { sendPartnerApprovedEmail, sendPartnerRejectedEmail, sendPenaltyEmail } from '../utils/email.js';

// Helper: city filter for the logged-in admin
const cityFilter = (req) => req.user.city ? { city: req.user.city } : {};

const getDashboardStats = async (req, res) => {
    try {
        const filter = cityFilter(req);
        // Get citizen/partner IDs in this city
        const cityUsers = await User.find({ ...filter, role: { $in: ['citizen', 'partner'] } }).select('_id');
        const cityUserIds = cityUsers.map(u => u._id);

        const totalReports = await Report.countDocuments({ citizen: { $in: cityUserIds } });
        const completedReports = await Report.countDocuments({ citizen: { $in: cityUserIds }, status: 'Completed' });
        const citizensCount = await User.countDocuments({ ...filter, role: 'citizen' });
        const partnersCount = await User.countDocuments({ ...filter, role: 'partner', status: 'active' });
        const pendingPartners = await User.countDocuments({ ...filter, role: 'partner', status: 'pending' });
        res.json({ totalReports, completedReports, pendingReports: totalReports - completedReports, citizensCount, partnersCount, pendingPartners });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getActivePartners = async (req, res) => {
    try {
        const filter = cityFilter(req);
        const partners = await User.find({ ...filter, role: 'partner', status: 'active' }).select('-password').sort({ name: 1 });
        res.json(partners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const filter = cityFilter(req);
        const users = await User.find({ ...filter, role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAllReports = async (req, res) => {
    try {
        const filter = cityFilter(req);
        // Get all citizens in this city first
        const cityUsers = await User.find({ ...filter, role: 'citizen' }).select('_id');
        const cityUserIds = cityUsers.map(u => u._id);
        const reports = await Report.find({ citizen: { $in: cityUserIds } })
            .populate('citizen', 'name email cityName district state')
            .populate('partner', 'name email')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getPendingPartners = async (req, res) => {
    try {
        const filter = cityFilter(req);
        const partners = await User.find({ ...filter, role: 'partner', status: 'pending' }).select('-password').sort({ createdAt: -1 });
        res.json(partners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const approvePartner = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'partner') return res.status(404).json({ message: 'Partner not found' });
        // Security: ensure admin only manages their city
        if (req.user.city && String(user.city) !== String(req.user.city))
            return res.status(403).json({ message: 'Cannot manage partners from another city' });
        user.status = 'active';
        await user.save();
        sendPartnerApprovedEmail({ name: user.name, email: user.email }).catch(e => console.error('Email error:', e.message));
        res.json({ message: 'Partner approved and notified by email', user: { _id: user._id, name: user.name, email: user.email, status: user.status } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const rejectPartner = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'partner') return res.status(404).json({ message: 'Partner not found' });
        if (req.user.city && String(user.city) !== String(req.user.city))
            return res.status(403).json({ message: 'Cannot manage partners from another city' });
        user.status = 'blocked';
        await user.save();
        sendPartnerRejectedEmail({ name: user.name, email: user.email }).catch(e => console.error('Email error:', e.message));
        res.json({ message: 'Partner rejected and notified', user: { _id: user._id, name: user.name, status: user.status } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const blockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.status = user.status === 'blocked' ? 'active' : 'blocked';
        await user.save();
        res.json({ message: `User ${user.status}`, user: { _id: user._id, name: user.name, status: user.status } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- False Report Review ---

export const reviewFalseReport = async (req, res) => {
    try {
        const { decision } = req.body; // 'approved' or 'rejected'
        const report = await Report.findById(req.params.id).populate('citizen');
        
        if (!report) return res.status(404).json({ message: 'Report not found' });
        if (report.status !== 'FalseReported') return res.status(400).json({ message: 'Report is not marked as false' });
        
        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: 'Decision must be approved or rejected' });
        }

        report.adminDecision = decision;

        if (decision === 'approved') {
            // Penalize citizen
            if (report.citizen) {
                await User.findByIdAndUpdate(report.citizen._id, {
                    $inc: { ecoCoins: -10, citizenPoints: -10, penaltyCount: 1 }
                });
                
                // Send penalty email (fire and forget)
                sendPenaltyEmail(report.citizen, 10).catch(e => console.error('Penalty email error:', e.message));
            }
            report.status = 'Completed'; // Close the report
        } else {
            // Reject partner's claim, return task to Assigned/Cleaning state
            report.status = 'Assigned'; 
            report.falseReportFlag = false;
        }

        await report.save();
        res.json({ message: `False report claim ${decision}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Analytics ---

export const getAnalyticsWasteTypes = async (req, res) => {
    try {
        const filter = cityFilter(req);
        const data = await Report.aggregate([
            { $match: filter },
            { $group: { _id: "$wasteType", count: { $sum: 1 } } },
            { $project: { wasteType: "$_id", count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getAnalyticsMonthlyCleanups = async (req, res) => {
    try {
        const filter = cityFilter(req);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);

        const data = await Report.aggregate([
            { $match: { ...filter, status: 'Completed', updatedAt: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$updatedAt" },
                        month: { $month: "$updatedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format to friendly output
        const formatted = data.map(d => {
            const date = new Date(d._id.year, d._id.month - 1);
            return {
                month: date.toLocaleString('default', { month: 'short' }) + ' ' + d._id.year,
                count: d.count
            };
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getAnalyticsAreaCleanliness = async (req, res) => {
    try {
        const filter = cityFilter(req);
        const data = await Report.aggregate([
            { $match: filter },
            { $match: { district: { $ne: '' } } },
            {
                $group: {
                    _id: "$district",
                    total: { $sum: 1 },
                    cleaned: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
                }
            },
            {
                $project: {
                    district: "$_id",
                    score: {
                        $cond: [
                            { $gt: ["$total", 0] },
                            { $multiply: [{ $divide: ["$cleaned", "$total"] }, 100] },
                            0
                        ]
                    },
                    _id: 0
                }
            },
            { $sort: { score: -1 } }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getAnalyticsPartnerPerformance = async (req, res) => {
    try {
        const filter = cityFilter(req);
        const partners = await User.find({ ...filter, role: 'partner', status: 'active' })
            .select('name stats.tasksCompleted')
            .sort({ 'stats.tasksCompleted': -1 })
            .limit(10);
        
        const data = partners.map(p => ({
            name: p.name,
            tasksCompleted: p.stats.tasksCompleted
        }));
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Hotspot Detection ---

export const getHotspots = async (req, res) => {
    try {
        const filter = cityFilter(req);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find all recent reports with GPS
        const recentReports = await Report.find({
            ...filter,
            createdAt: { $gte: thirtyDaysAgo },
            'geoLocation.coordinates': { $exists: true, $ne: [0,0] }
        }).select('geoLocation.coordinates');

        if (recentReports.length === 0) return res.json([]);

        // Simple distance-based clustering wrapper around naive quadratic (fine for small cities)
        // A real production app would use DB aggregations or PostGIS DB for clustering.
        const HOTSPOT_RADIUS_M = 100; // 100 meters
        const HOTSPOT_THRESHOLD = 3;  // Min reports to call it a hotspot

        const getDistance = (lon1, lat1, lon2, lat2) => {
            const R = 6371e3; // meters
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lon2-lon1) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        };

        let clusters = [];
        let processed = new Set();

        for (let i = 0; i < recentReports.length; i++) {
            if (processed.has(i)) continue;
            
            const p1 = recentReports[i].geoLocation.coordinates; // [lng, lat]
            let currentCluster = [recentReports[i]];
            processed.add(i);

            for (let j = i + 1; j < recentReports.length; j++) {
                if (processed.has(j)) continue;
                const p2 = recentReports[j].geoLocation.coordinates;
                
                if (getDistance(p1[0], p1[1], p2[0], p2[1]) <= HOTSPOT_RADIUS_M) {
                    currentCluster.push(recentReports[j]);
                    processed.add(j);
                }
            }

            if (currentCluster.length >= HOTSPOT_THRESHOLD) {
                // Calculate centroid
                const sumLng = currentCluster.reduce((sum, r) => sum + r.geoLocation.coordinates[0], 0);
                const sumLat = currentCluster.reduce((sum, r) => sum + r.geoLocation.coordinates[1], 0);
                clusters.push({
                    coordinates: [sumLng / currentCluster.length, sumLat / currentCluster.length],
                    reportCount: currentCluster.length
                });
            }
        }

        res.json(clusters);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export { 
    getDashboardStats, getActivePartners, getAllUsers, getAllReports, 
    getPendingPartners, approvePartner, rejectPartner, blockUser
};
