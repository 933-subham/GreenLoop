import SensorReading from '../models/facility/SensorReading.js';
import Building from '../models/facility/Building.js';

// GET /api/logs/status
export const getLogStatus = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        
        const count = await SensorReading.countDocuments({ orgId });
        const powerCount = await SensorReading.countDocuments({ orgId, type: 'power' });
        const waterCount = await SensorReading.countDocuments({ orgId, type: { $in: ['water', 'water_tank'] } });

        const oldestDoc = await SensorReading.findOne({ orgId }).sort({ ts: 1 }).select('ts').lean();
        const newestDoc = await SensorReading.findOne({ orgId }).sort({ ts: -1 }).select('ts').lean();

        res.json({
            count,
            powerCount,
            waterCount,
            oldest: oldestDoc?.ts || null,
            newest: newestDoc?.ts || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/logs/download?type=&from=&to=
// Streams readings as CSV: ts, deviceId, buildingCode, floor, type, kw, tank_level_pct, flow_lpm, source
export const downloadLogs = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        const { type, from, to } = req.query;

        const filter = { orgId };
        if (type) filter.type = type;
        if (from || to) {
            filter.ts = {};
            if (from) filter.ts.$gte = new Date(from);
            if (to) filter.ts.$lte = new Date(to);
        }

        // Cache building codes
        const buildings = await Building.find({ orgId }).select('_id code name').lean();
        const bMap = new Map(buildings.map(b => [b._id.toString(), b.code || b.name]));

        const filename = `facility_readings_${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Write CSV Header
        res.write('ts,deviceId,buildingCode,floor,type,kw,tank_level_pct,flow_lpm,source\n');

        // Stream cursor directly without buffering in memory
        const cursor = SensorReading.find(filter).sort({ ts: 1 }).cursor();

        cursor.on('data', (doc) => {
            const tsStr = doc.ts ? doc.ts.toISOString() : '';
            const bCode = doc.buildingId ? (bMap.get(doc.buildingId.toString()) || '') : '';
            const kwVal = doc.kw != null ? doc.kw : '';
            const lvlVal = doc.tank_level_pct != null ? doc.tank_level_pct : '';
            const flowVal = doc.flow_lpm != null ? doc.flow_lpm : '';

            res.write(`"${tsStr}","${doc.deviceId || ''}","${bCode}","${doc.floor != null ? doc.floor : ''}","${doc.type || ''}",${kwVal},${lvlVal},${flowVal},"${doc.source || ''}"\n`);
        });

        cursor.on('end', () => {
            res.end();
        });

        cursor.on('error', (err) => {
            console.error('CSV stream cursor error:', err);
            res.end();
        });

    } catch (err) {
        console.error('Download logs error:', err);
        res.status(500).json({ error: err.message });
    }
};
