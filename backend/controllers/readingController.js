import Device from '../models/facility/Device.js';
import Building from '../models/facility/Building.js';
import Alert from '../models/facility/Alert.js';
import { appendReading, queryReadings } from '../services/readingStore.js';
import { getExpectedBaseline } from '../services/baselineService.js';
import { runDetectionForReading } from '../services/detectionService.js';

// GET /api/devices
export const getDevices = async (req, res) => {
    try {
        const orgId = req.query.orgId || 'bput_college';
        const devices = await Device.find({ orgId, active: { $ne: false } })
            .populate('buildingId', 'code name type floors')
            .sort({ deviceId: 1 })
            .lean();

        const now = Date.now();
        const twoMinutesMs = 2 * 60 * 1000;

        const results = devices.map(d => {
            const isOnline = d.lastSeen && (now - new Date(d.lastSeen).getTime() <= twoMinutesMs);
            return {
                ...d,
                status: isOnline ? 'online' : 'offline',
                building: d.buildingId?.name || d.buildingCode || 'Campus'
            };
        });

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/ingest/readings
export const ingestReadings = async (req, res) => {
    try {
        const expectedToken = process.env.DEVICE_INGEST_TOKEN || 'demo-token';
        const clientToken = req.headers['x-device-token'] || req.headers['authorization']?.replace('Bearer ', '');

        if (clientToken !== expectedToken) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-device-token header' });
        }

        const rawBody = req.body;
        const items = Array.isArray(rawBody) ? rawBody : [rawBody];

        if (items.length === 0) {
            return res.status(400).json({ error: 'Payload cannot be empty' });
        }

        const savedReadings = [];
        const allAlerts = [];
        const now = new Date();

        for (const item of items) {
            const { deviceId } = item;
            if (!deviceId) {
                return res.status(400).json({ error: 'deviceId is required' });
            }

            const cleanId = deviceId.toUpperCase().trim();
            const device = await Device.findOne({ deviceId: cleanId, active: { $ne: false } }).populate('buildingId');
            if (!device) {
                return res.status(400).json({ error: 'Unregistered device' });
            }

            const ts = item.ts ? new Date(item.ts) : now;
            const hour = ts.getHours();
            const isWeekend = (ts.getDay() === 0 || ts.getDay() === 6);

            const readingPayload = {
                deviceId: cleanId,
                orgId: device.orgId || 'bput_college',
                buildingId: device.buildingId?._id || device.buildingId,
                floor: device.floor,
                type: device.type,
                zone: device.zone || `Floor-${device.floor}`,
                ts,
                source: 'live'
            };

            if (device.type === 'power') {
                const kwVal = item.kw != null ? item.kw : item.value;
                if (typeof kwVal !== 'number' || isNaN(kwVal) || kwVal < 0) {
                    return res.status(400).json({ error: `Invalid kw reading for ${cleanId}: must be a non-negative number` });
                }
                readingPayload.kw = kwVal;
                readingPayload.expected = getExpectedBaseline(cleanId, hour, isWeekend, 'kw');
            } else if (device.type === 'water') {
                const levelVal = item.tank_level_pct != null ? item.tank_level_pct : item.value;
                const flowVal = item.flow_lpm != null ? item.flow_lpm : 0;

                if (typeof levelVal !== 'number' || isNaN(levelVal) || levelVal < 0 || levelVal > 100) {
                    return res.status(400).json({ error: `Invalid tank_level_pct for ${cleanId}: must be between 0 and 100` });
                }
                if (typeof flowVal !== 'number' || isNaN(flowVal) || flowVal < 0) {
                    return res.status(400).json({ error: `Invalid flow_lpm for ${cleanId}: must be a non-negative number` });
                }
                readingPayload.tank_level_pct = levelVal;
                readingPayload.flow_lpm = flowVal;
                readingPayload.expected = getExpectedBaseline(cleanId, hour, isWeekend, 'tank_level_pct');
            }

            // Save to MongoDB using readingStore
            const saved = await appendReading(readingPayload);
            savedReadings.push(saved);

            // Run detection
            const alerts = await runDetectionForReading(saved, device);
            allAlerts.push(...alerts);
        }

        res.status(201).json({
            success: true,
            count: savedReadings.length,
            readings: savedReadings,
            alertsCreated: allAlerts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/readings
export const getReadings = async (req, res) => {
    try {
        const { deviceId, type, from, to, limit = 50 } = req.query;
        const orgId = req.query.orgId || 'bput_college';

        const filter = { orgId };
        if (deviceId) filter.deviceId = deviceId.toUpperCase().trim();
        if (type) filter.type = type;
        if (from) filter.from = from;
        if (to) filter.to = to;

        const maxLimit = Math.min(500, parseInt(limit, 10) || 50);
        const raw = await queryReadings(filter, { limit: maxLimit, sort: { ts: -1 } });

        // Reverse to chronological order for charts
        const chronological = raw.reverse();

        // Ensure expected value is included for every point
        const results = chronological.map(r => {
            const d = new Date(r.ts);
            const exp = r.expected != null ? r.expected : getExpectedBaseline(r.deviceId, d.getHours(), (d.getDay() === 0 || d.getDay() === 6), r.type === 'power' ? 'kw' : 'tank_level_pct');
            return {
                ...r,
                expected: Math.round(exp * 10) / 10
            };
        });

        res.json({
            count: results.length,
            readings: results
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/alerts
export const getAlerts = async (req, res) => {
    try {
        const orgId = req.query.orgId || 'bput_college';
        const filter = { $or: [{ orgId }, { facilityId: orgId }] };
        if (req.query.status) filter.status = req.query.status;
        const alerts = await Alert.find(filter).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/alerts/:id/ack
export const ackAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { status = 'acknowledged', note, wardenNotes } = req.body;
        const updateData = { status };
        if (note || wardenNotes) updateData.wardenNotes = note || wardenNotes;
        if (status === 'acknowledged') updateData.acknowledgedAt = new Date();
        if (status === 'resolved') updateData.resolvedAt = new Date();

        const alert = await Alert.findByIdAndUpdate(id, updateData, { new: true });
        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        res.json({ success: true, alert });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

