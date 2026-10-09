import SensorReading from '../models/facility/SensorReading.js';
import Device from '../models/facility/Device.js';
import { appendLogCopy } from './logCopyService.js';

const LOG_MAX_ROWS = parseInt(process.env.LOG_MAX_ROWS, 10) || 300000;

/**
 * Append a single reading to MongoDB
 * Automatically denormalizes buildingId, floor, zone, and orgId from the Device registry.
 */
export const appendReading = async (readingData) => {
    const deviceId = readingData.deviceId?.toUpperCase().trim();
    if (!deviceId) throw new Error('deviceId is required');

    // Denormalize from Device if fields not provided
    let { orgId, buildingId, floor, zone, type } = readingData;
    let device = null;

    if (!buildingId || floor == null || !zone || !orgId || !type) {
        device = await Device.findOne({ deviceId, active: { $ne: false } });
        if (!device) {
            throw new Error(`Unregistered device: ${deviceId}`);
        }
        if (!orgId) orgId = device.orgId;
        if (!buildingId) buildingId = device.buildingId;
        if (floor == null) floor = device.floor;
        if (!zone) zone = device.zone || `Floor-${device.floor}`;
        if (!type) type = device.type;
    }

    const ts = readingData.ts instanceof Date ? readingData.ts : new Date(readingData.ts || Date.now());

    const docData = {
        deviceId,
        orgId: orgId || 'bput_college',
        buildingId: buildingId || null,
        floor: floor != null ? floor : 1,
        type,
        zone: zone || `Floor-${floor}`,
        kw: readingData.kw,
        tank_level_pct: readingData.tank_level_pct,
        flow_lpm: readingData.flow_lpm != null ? readingData.flow_lpm : 0,
        ts,
        source: readingData.source || 'live',
        expected: readingData.expected
    };

    const reading = await SensorReading.create(docData);
    appendLogCopy(docData);

    // Update Device lastSeen & status
    await Device.updateOne(
        { deviceId },
        { $set: { lastSeen: ts, status: 'online' } }
    );

    // Enforce safety cap: delete oldest if exceeded LOG_MAX_ROWS
    try {
        const total = await SensorReading.estimatedDocumentCount();
        if (total > LOG_MAX_ROWS) {
            const excess = total - LOG_MAX_ROWS + 1000;
            const oldest = await SensorReading.find({})
                .sort({ ts: 1 })
                .limit(excess)
                .select('_id')
                .lean();
            if (oldest.length > 0) {
                await SensorReading.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
            }
        }
    } catch (e) {
        // non-blocking
    }

    return reading;
};

/**
 * Append multiple readings in batch
 */
export const appendReadings = async (readingsArray) => {
    if (!Array.isArray(readingsArray) || readingsArray.length === 0) return [];
    
    // Resolve devices in memory
    const deviceIds = [...new Set(readingsArray.map(r => r.deviceId?.toUpperCase().trim()))];
    const devices = await Device.find({ deviceId: { $in: deviceIds } }).lean();
    const devMap = new Map(devices.map(d => [d.deviceId, d]));

    const docs = readingsArray.map(r => {
        const dId = r.deviceId?.toUpperCase().trim();
        const dev = devMap.get(dId);
        const ts = r.ts instanceof Date ? r.ts : new Date(r.ts || Date.now());
        return {
            deviceId: dId,
            orgId: r.orgId || dev?.orgId || 'bput_college',
            buildingId: r.buildingId || dev?.buildingId || null,
            floor: r.floor != null ? r.floor : (dev?.floor != null ? dev.floor : 1),
            type: r.type || dev?.type || 'power',
            zone: r.zone || dev?.zone || `Floor-${dev?.floor || 1}`,
            kw: r.kw,
            tank_level_pct: r.tank_level_pct,
            flow_lpm: r.flow_lpm != null ? r.flow_lpm : 0,
            ts,
            source: r.source || 'seed',
            expected: r.expected
        };
    });

    const result = await SensorReading.insertMany(docs, { ordered: false });
    return result;
};

/**
 * Query readings with filters, sorting, and pagination
 */
export const queryReadings = async (filter = {}, options = {}) => {
    const mongoFilter = {};

    if (filter.orgId) mongoFilter.orgId = filter.orgId;
    if (filter.deviceId) mongoFilter.deviceId = filter.deviceId.toUpperCase().trim();
    if (filter.buildingId) mongoFilter.buildingId = filter.buildingId;
    if (filter.floor != null) mongoFilter.floor = filter.floor;
    if (filter.type) mongoFilter.type = filter.type;
    if (filter.source) mongoFilter.source = filter.source;

    if (filter.from || filter.to) {
        mongoFilter.ts = {};
        if (filter.from) mongoFilter.ts.$gte = new Date(filter.from);
        if (filter.to) mongoFilter.ts.$lte = new Date(filter.to);
    }

    const sort = options.sort || { ts: -1 };
    const limit = options.limit ? parseInt(options.limit, 10) : 100;

    const readings = await SensorReading.find(mongoFilter)
        .sort(sort)
        .limit(limit)
        .lean();

    return readings;
};

/**
 * Remove readings by source (e.g. 'simulated-fault')
 */
export const removeBySource = async (source) => {
    const result = await SensorReading.deleteMany({ source });
    return result.deletedCount;
};
