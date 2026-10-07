import Report from '../models/Report.js';
import User from '../models/User.js';

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private (Citizen)
    export const createReport = async (req, res) => {
        try {
            const { lat, lng, address, wasteType, description, garbageIntensity } = req.body;
            if (!wasteType) return res.status(400).json({ message: 'Waste type is required' });
            if (!req.file) return res.status(400).json({ message: 'Garbage photo is required' });
    
            const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
            const report = await Report.create({
                citizen: req.user._id,
                
                // Prioritize physical location sent from frontend (geocoded), fallback to profile
                city: req.body.city || req.user.city,
                state: req.body.state || req.user.state,
                district: req.body.district || req.user.district,
                cityName: req.body.cityName || req.user.cityName,
                
                location: { lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null, address: address || '' },
                geoLocation: { type: 'Point', coordinates: [lng ? parseFloat(lng) : 0, lat ? parseFloat(lat) : 0] },
                wasteType, description: description || '',
                garbageIntensity: garbageIntensity || 'Medium',
                imageUrl,
                status: 'Submitted', coinsAwarded: 0
            });
        // Increment report count — NO coins yet
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.reportsSubmitted': 1, 'citizenPoints': 10 } });
        res.status(201).json(report);
    } catch (err) {
        console.error('createReport error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get city-scoped or all reports
// @route   GET /api/reports
// @access  Private (Admin, Partner)
export const getReports = async (req, res) => {
    try {
        const filter = req.user.city ? { city: req.user.city } : {};
        const reports = await Report.find(filter)
            .populate('citizen', 'name email cityName district state')
            .populate('partner', 'name email')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get available (Submitted) reports for partner's city
// @route   GET /api/reports/available
// @access  Private (Partner)
export const getAvailableReports = async (req, res) => {
    try {
        const filter = { status: 'Submitted' };
        if (req.user.city) filter.city = req.user.city;
        const reports = await Report.find(filter)
            .populate('citizen', 'name email cityName')
            .sort({ createdAt: 1 }); // oldest first — fairness
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get user's own reports
// @route   GET /api/reports/myreports
// @access  Private (Citizen)
export const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ citizen: req.user._id })
            .populate('partner', 'name')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Partner accepts a report (self-assign)
// @route   PUT /api/reports/:id/assign
// @access  Private (Partner)
export const assignReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        if (report.status !== 'Submitted')
            return res.status(400).json({ message: 'Report is already assigned or completed' });
        report.partner = req.user._id;
        report.status = 'Assigned';
        await report.save();
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Admin manually assigns to specific partner
// @route   PUT /api/reports/:id/assign-partner
// @access  Private (Admin)
export const adminAssignReport = async (req, res) => {
    try {
        const { partnerId } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        const partner = await User.findById(partnerId);
        if (!partner || partner.role !== 'partner' || partner.status !== 'active')
            return res.status(400).json({ message: 'Invalid partner' });
        report.partner = partnerId;
        report.status = 'Assigned';
        await report.save();
        const updated = await Report.findById(report._id).populate('citizen', 'name email').populate('partner', 'name email');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Partner marks report as Cleaning (started work)
// @route   PUT /api/reports/:id/cleaning
// @access  Private (Partner)
export const markCleaning = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        if (String(report.partner) !== String(req.user._id))
            return res.status(403).json({ message: 'This report is not assigned to you' });
        report.status = 'Cleaning';
        await report.save();
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Partner completes a report with proof image
// @route   PUT /api/reports/:id/complete
// @access  Private (Partner)
export const completeReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('citizen');
        if (!report) return res.status(404).json({ message: 'Report not found' });
        if (String(report.partner) !== String(req.user._id))
            return res.status(403).json({ message: 'This report is not assigned to you' });

        const intensities = {
            'Low': 5,
            'Medium': 10,
            'High': 20
        };
        const COIN_REWARD = intensities[report.garbageIntensity] || 10;
        
        report.status = 'Completed';
        report.proofImageUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : '';
        report.coinsAwarded = COIN_REWARD;
        await report.save();

        // Award eco coins to citizen NOW (only on completion)
        if (report.citizen) {
            await User.findByIdAndUpdate(report.citizen._id, {
                $inc: { ecoCoins: COIN_REWARD }
            });
        }

        // Increment partner completed stat
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'stats.tasksCompleted': 1 }
        });

        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get tasks assigned to this partner
// @route   GET /api/reports/mytasks
// @access  Private (Partner)
export const getMyTasks = async (req, res) => {
    try {
        const reports = await Report.find({
            partner: req.user._id,
            status: { $in: ['Assigned', 'Cleaning'] }
        }).populate('citizen', 'name email cityName').sort({ createdAt: 1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get partner's completed task history
// @route   GET /api/reports/task-history
// @access  Private (Partner)
export const getTaskHistory = async (req, res) => {
    try {
        const reports = await Report.find({ partner: req.user._id, status: 'Completed' })
            .populate('citizen', 'name email').sort({ updatedAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Check for duplicate reports within 30m
// @route   GET /api/reports/check-duplicate
// @access  Private (Citizen)
export const checkDuplicate = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.json({ isDuplicate: false });

        const radiusInRadians = 30 / 6378137; // 30 meters / Earth radius
        const duplicates = await Report.find({
            status: { $in: ['Submitted', 'Assigned', 'Cleaning'] },
            geoLocation: {
                $geoWithin: {
                    $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
                }
            }
        });

        res.json({ isDuplicate: duplicates.length > 0, duplicates });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get live map data for reports
// @route   GET /api/reports/map-data
// @access  Private (Admin, Partner)
export const getMapData = async (req, res) => {
    try {
        const adminCity = req.user.city; 
        const filter = adminCity ? { city: adminCity } : {};
        
        const reports = await Report.find(filter)
            .select('_id location geoLocation status wasteType')
            .lean();
            
        res.json({
            userCity: adminCity || 'India', // Send the scope context to the frontend map
            reports
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Partner marks a task as a false report
// @route   PUT /api/reports/:id/false-report
// @access  Private (Partner)
export const markFalseReport = async (req, res) => {
    try {
        const { reason, lat, lng } = req.body;
        const report = await Report.findById(req.params.id);
        
        if (!report) return res.status(404).json({ message: 'Report not found' });
        if (String(report.partner) !== String(req.user._id)) {
            return res.status(403).json({ message: 'This report is not assigned to you' });
        }
        
        if (!reason) return res.status(400).json({ message: 'Must provide a reason' });
        if (!req.file) return res.status(400).json({ message: 'Must upload evidence photo' });
        if (!lat || !lng) return res.status(400).json({ message: 'Current GPS location is required to flag a false report' });

        const pLat = parseFloat(lat);
        const pLng = parseFloat(lng);
        const rLat = report.location?.lat;
        const rLng = report.location?.lng;

        if (rLat && rLng) {
            const R = 6371e3; // Earth radius meters
            const rad = Math.PI / 180;
            const dLat = (pLat - rLat) * rad;
            const dLon = (pLng - rLng) * rad;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                      Math.cos(rLat * rad) * Math.cos(pLat * rad) * 
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            // Partner must be within ~200 meters of the reported garbage
            if (distance > 200) {
                return res.status(400).json({ message: `You are too far (${Math.round(distance)}m) from the citizen's reported location. You must be at the site to flag it as false.` });
            }
        }

        report.status = 'FalseReported';
        report.falseReportFlag = true;
        report.falseReportReason = reason;
        report.falseEvidenceUrl = `/${req.file.path.replace(/\\/g, '/')}`;
        report.falseReportLocation = { lat: pLat, lng: pLng };
        report.adminDecision = 'pending';
        
        await report.save();
        res.json(report);
    } catch (err) {
        if (req.file) {
            import('fs').then(fs => fs.unlink(req.file.path, () => {}));
        }
        res.status(500).json({ message: err.message });
    }
};
