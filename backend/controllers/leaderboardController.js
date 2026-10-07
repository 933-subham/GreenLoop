import User from '../models/User.js';
import Report from '../models/Report.js';

export const getLeaderboard = async (req, res) => {
    try {
        // Scope to city if accessing user has a city
        const filter = req.user.city ? { city: req.user.city } : {};

        // 1. Top Reporting Citizens
        const citizens = await User.find({ ...filter, role: 'citizen' })
            .select('name cityName citizenPoints')
            .sort({ citizenPoints: -1 })
            .limit(10);

        // 2. Top Waste Collectors (Partners)
        const partners = await User.find({ ...filter, role: 'partner', status: 'active' })
            .select('name cityName partnerPoints stats')
            // Fallback to tasksCompleted if partnerPoints is tied
            .sort({ partnerPoints: -1, 'stats.tasksCompleted': -1 })
            .limit(10);

        // 3. Cleanest Areas (Districts within the city)
        // Aggregate reports to find completion ratio per district
        const areaStats = await Report.aggregate([
            { $match: filter },
            { $match: { district: { $ne: '' }, status: { $ne: 'FalseReported' } } },
            {
                $group: {
                    _id: "$district",
                    totalReports: { $sum: 1 },
                    completedReports: {
                        $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    district: "$_id",
                    totalReports: 1,
                    completedReports: 1,
                    cleanlinessScore: {
                        // Formula: (Completed / Total) * 100
                        $cond: [
                            { $gt: ["$totalReports", 0] },
                            { $multiply: [{ $divide: ["$completedReports", "$totalReports"] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { cleanlinessScore: -1, totalReports: -1 } },
            { $limit: 10 }
        ]);

        res.json({ citizens, partners, areas: areaStats });

    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ message: 'Failed to fetch leaderboard data' });
    }
};
