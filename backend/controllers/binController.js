import Bin from '../models/Bin.js';
import PickupRequest from '../models/PickupRequest.js';
import User from '../models/User.js';

// Get all bins for active facility
export const getBins = async (req, res) => {
    try {
        const facilityId = req.query.facilityId || 'bput_college';
        const bins = await Bin.find({ facilityId }).sort({ currentFillPct: -1 });
        res.json(bins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin verifies bin snapshot reading
export const verifyBin = async (req, res) => {
    try {
        const { id } = req.params;
        const bin = await Bin.findByIdAndUpdate(id, { verificationStatus: 'verified' }, { new: true });
        if (!bin) return res.status(404).json({ message: 'Bin not found' });
        res.json({ message: 'Bin fill level verified by Admin', bin });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin confirms pickup -> auto-assigns municipal driver
export const confirmPickup = async (req, res) => {
    try {
        const { id } = req.params;
        const bin = await Bin.findById(id);
        if (!bin) return res.status(404).json({ message: 'Bin not found' });

        bin.verificationStatus = 'requested';
        await bin.save();

        // Auto-assign nearest available driver
        // Candidates with score = distance_km + 3*load_ratio
        const mockDrivers = [
            { name: 'Driver Ramesh Kumar', vehicle: 'Tata Ace (OD-14-K-4921)', distanceKm: 1.4, loadRatio: 0.30, shiftRemainingMin: 240 },
            { name: 'Driver Suresh Nayak', vehicle: 'Eicher Pro (OD-14-H-1082)', distanceKm: 2.8, loadRatio: 0.65, shiftRemainingMin: 180 },
            { name: 'Driver Deepak Mohanty', vehicle: 'Mahindra Bolero (OD-14-M-7714)', distanceKm: 3.5, loadRatio: 0.15, shiftRemainingMin: 320 }
        ];

        // Compute scores
        const scored = mockDrivers.map(d => ({
            ...d,
            score: Math.round((d.distanceKm + 3 * d.loadRatio + (d.shiftRemainingMin < 60 ? 5 : 0)) * 100) / 100
        })).sort((a, b) => a.score - b.score);

        const best = scored[0];

        // Create or update pickup request
        const request = await PickupRequest.create({
            facilityId: bin.facilityId,
            binId: bin._id,
            binCode: bin.binCode,
            binName: bin.name,
            location: {
                lat: bin.lat,
                lng: bin.lng,
                address: `Near ${bin.name}, Campus Zone ${bin.zoneId}`
            },
            status: 'assigned',
            fillPctAtRequest: bin.currentFillPct,
            verifiedAt: new Date(),
            requestedAt: new Date(),
            assignedDriverName: best.name,
            assignedReason: {
                distanceKm: best.distanceKm,
                loadRatio: best.loadRatio,
                driverName: best.name,
                vehicle: best.vehicle,
                score: best.score,
                explanation: `Ranked #1 driver (${best.distanceKm} km away, truck ${Math.round(best.loadRatio * 100)}% full, score: ${best.score})`
            },
            notes: `Auto-dispatched via GreenLoop Smart Municipal Dispatcher`
        });

        bin.verificationStatus = 'assigned';
        await bin.save();

        res.json({
            message: `Pickup confirmed! Assigned to ${best.name}`,
            request,
            bin
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all pickup requests (for Municipality and Driver portals)
export const getPickupRequests = async (req, res) => {
    try {
        const requests = await PickupRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update request status (e.g. driver marks en_route or collected with proof)
export const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, proofImageUrl, notes } = req.body;
        
        const updateData = { status };
        if (status === 'en_route') updateData.acceptedAt = new Date();
        if (status === 'collected') {
            updateData.collectedAt = new Date();
            updateData.closedAt = new Date();
            if (proofImageUrl) updateData.proofImageUrl = proofImageUrl;
        }
        if (notes) updateData.notes = notes;

        const request = await PickupRequest.findByIdAndUpdate(id, updateData, { new: true });
        if (!request) return res.status(404).json({ message: 'Pickup request not found' });

        // If collected, reset bin fill level
        if (status === 'collected' && request.binId) {
            await Bin.findByIdAndUpdate(request.binId, {
                currentFillPct: 5.0,
                urgency: 'low',
                hoursToFull: 36.0,
                verificationStatus: 'collected'
            });
        }

        res.json({ message: `Request status updated to ${status}`, request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
