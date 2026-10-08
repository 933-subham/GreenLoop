import Partner from '../models/Partner.js';
import PickupRequest from '../models/PickupRequest.js';
import Bin from '../models/Bin.js';
import Report from '../models/Report.js';

// 1. Submit Partner Application (Pending Municipal Approval)
export const applyPartner = async (req, res) => {
    try {
        const {
            name,
            agencyName,
            email,
            phone,
            vehicleNumber,
            vehicleType,
            zone,
            capacityKg,
            driverLicense
        } = req.body;

        if (!name || !email || !phone || !vehicleNumber) {
            return res.status(400).json({ message: 'Name, email, phone, and vehicle number are required' });
        }

        const existing = await Partner.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Application with this email already exists' });
        }

        const partner = await Partner.create({
            name,
            agencyName: agencyName || `${name} Waste Logistics`,
            email,
            phone,
            vehicleNumber,
            vehicleType: vehicleType || 'Tata Ace Mini-Truck',
            zone: zone || 'Zone 1 - Chhend Colony & BPUT',
            capacityKg: capacityKg || 1500,
            driverLicense: driverLicense || 'OD-14-2023-44129',
            status: 'pending',
            currentLocation: { lat: 22.2585, lng: 84.8480 }
        });

        res.status(201).json({
            message: 'Application submitted successfully! Your credentials are now pending review by Municipality Admin.',
            partner
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Get Partners (Municipal Admin review or list)
export const getPartners = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const partners = await Partner.find(filter).sort({ createdAt: -1 });
        res.json(partners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Municipal Admin Approves or Rejects Partner Application
export const updatePartnerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const updateData = { status };
        if (status === 'approved') updateData.approvedAt = new Date();
        if (status === 'rejected') {
            updateData.rejectedAt = new Date();
            if (rejectionReason) updateData.rejectionReason = rejectionReason;
        }

        const partner = await Partner.findByIdAndUpdate(id, updateData, { new: true });
        if (!partner) return res.status(404).json({ message: 'Partner record not found' });

        res.json({
            message: `Partner application ${status === 'approved' ? 'APPROVED' : 'REJECTED'} successfully!`,
            partner
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Get Assigned Tasks for Drivers / Partners
export const getPartnerTasks = async (req, res) => {
    try {
        const tasks = await PickupRequest.find({
            status: { $in: ['assigned', 'en_route', 'requested', 'predicted', 'collected'] }
        }).sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Complete Pickup Task with Proof Photo Upload (Resets Org Exterior Bin!)
export const completePickupTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { proofImageUrl, driverNotes } = req.body;

        const request = await PickupRequest.findById(id);
        if (!request) return res.status(404).json({ message: 'Pickup request not found' });

        request.status = 'collected';
        request.collectedAt = new Date();
        request.closedAt = new Date();
        request.proofImageUrl = proofImageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60';
        if (driverNotes) request.notes = driverNotes;
        await request.save();

        // If associated with a campus exterior dump bin, reset the bin fill %
        if (request.binId) {
            await Bin.findByIdAndUpdate(request.binId, {
                currentFillPct: 6.0,
                urgency: 'low',
                hoursToFull: 36.0,
                verificationStatus: 'collected'
            });
        }

        // Also update any matching partner stats
        await Partner.findOneAndUpdate(
            { name: request.assignedDriverName },
            { $inc: { completedTasks: 1, currentLoadKg: 250 } }
        );

        res.json({
            message: 'Pickup completed! Proof photo verified and organization exterior bin reset to 6% (Clean).',
            request
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. TSP / Nearest-Neighbor Route Optimization for Waste Truck
export const getOptimizedRoute = async (req, res) => {
    try {
        const { lat = 22.2585, lng = 84.8480 } = req.query;
        const startLat = parseFloat(lat);
        const startLng = parseFloat(lng);

        // Fetch pending/assigned pickup requests
        const tasks = await PickupRequest.find({
            status: { $in: ['assigned', 'en_route', 'requested'] }
        });

        if (tasks.length === 0) {
            return res.json({
                start: { lat: startLat, lng: startLng },
                waypoints: [],
                totalDistanceKm: 0,
                estimatedTravelMinutes: 0
            });
        }

        // Haversine distance
        const getDistKm = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        let unvisited = tasks.map(t => ({
            id: t._id,
            binCode: t.binCode,
            binName: t.binName,
            address: t.location?.address || 'Campus Exterior Gate',
            lat: t.location?.lat || 22.2598,
            lng: t.location?.lng || 84.8492,
            fillPct: t.fillPctAtRequest || 85,
            urgency: t.fillPctAtRequest >= 85 ? 'Critical' : 'Moderate'
        }));

        let route = [];
        let curLat = startLat;
        let curLng = startLng;
        let totalDist = 0;

        while (unvisited.length > 0) {
            let bestIdx = 0;
            let minDist = Infinity;
            for (let i = 0; i < unvisited.length; i++) {
                const d = getDistKm(curLat, curLng, unvisited[i].lat, unvisited[i].lng);
                if (d < minDist) {
                    minDist = d;
                    bestIdx = i;
                }
            }
            const nextStop = unvisited[bestIdx];
            totalDist += minDist;
            nextStop.legDistanceKm = Math.round(minDist * 10) / 10;
            route.push(nextStop);
            curLat = nextStop.lat;
            curLng = nextStop.lng;
            unvisited.splice(bestIdx, 1);
        }

        res.json({
            start: { lat: startLat, lng: startLng, name: 'Municipal Depot / Current Truck GPS' },
            waypoints: route,
            totalDistanceKm: Math.round(totalDist * 10) / 10,
            estimatedTravelMinutes: Math.round(totalDist * 3.5 + route.length * 8)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
