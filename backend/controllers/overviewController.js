import mongoose from 'mongoose';
import Building from '../models/facility/Building.js';
import Device from '../models/facility/Device.js';
import SensorReading from '../models/facility/SensorReading.js';
import Alert from '../models/facility/Alert.js';
import Facility from '../models/Facility.js';
import { getExpectedBaseline } from '../services/baselineService.js';

// Helper to resolve building by ObjectId or code
const resolveBuilding = async (buildingId, orgId) => {
    if (!buildingId) return null;
    if (mongoose.Types.ObjectId.isValid(buildingId)) {
        const byId = await Building.findOne({ _id: buildingId, orgId });
        if (byId) return byId;
    }
    return await Building.findOne({ code: String(buildingId).toUpperCase().trim(), orgId });
};

// Helper to calculate date range
const getDateRange = (dateQuery) => {
    if (dateQuery) {
        const d = new Date(dateQuery);
        if (!isNaN(d.getTime())) {
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            return { start, end, hours: 24, isWeekend: d.getDay() === 0 || d.getDay() === 6 };
        }
    }
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 3600 * 1000);
    const day = end.getDay();
    return { start, end, hours: 24, isWeekend: day === 0 || day === 6 };
};

// Format HH:MM
const formatTime = (date) => {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// -------------------------------------------------------------
// 1) GET /api/power/overview
// -------------------------------------------------------------
export const getPowerOverview = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        const { level = 'campus', buildingId, floor, metric = 'kwh', date } = req.query;
        const { start, end, hours, isWeekend } = getDateRange(date);

        // Load facility assumptions
        const facility = await Facility.findOne({ facilityId: orgId }) || { tariffInr: 7.50, gridEmissionFactor: 0.71 };
        const tariff = facility.tariffInr || 7.50;
        const emissionFactor = facility.gridEmissionFactor || 0.71;

        if (level === 'campus') {
            const buildings = await Building.find({ orgId, active: { $ne: false } });
            const allDevices = await Device.find({ orgId, type: 'power', active: { $ne: false } });
            const openAlertsList = await Alert.find({ orgId, type: { $in: ['power', 'power_surge'] }, status: 'open' });

            // 1 single aggregate for the whole campus:
            const agg = await SensorReading.aggregate([
                {
                    $match: {
                        orgId,
                        type: 'power',
                        ts: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: { buildingId: '$buildingId', deviceId: '$deviceId' },
                        avgKw: { $avg: '$kw' }
                    }
                }
            ]);

            // Index aggregate results by buildingId
            const bldgDeviceAvgMap = new Map();
            for (const item of agg) {
                const bId = item._id.buildingId?.toString();
                if (!bId) continue;
                if (!bldgDeviceAvgMap.has(bId)) bldgDeviceAvgMap.set(bId, 0);
                bldgDeviceAvgMap.set(bId, bldgDeviceAvgMap.get(bId) + (item.avgKw || 0));
            }

            // Pre-group devices by building
            const devicesByBldg = new Map();
            for (const d of allDevices) {
                const bId = d.buildingId?.toString();
                if (!devicesByBldg.has(bId)) devicesByBldg.set(bId, []);
                devicesByBldg.get(bId).push(d);
            }

            const alertsByBldg = new Map();
            for (const a of openAlertsList) {
                const bId = a.buildingId?.toString();
                if (bId) {
                    alertsByBldg.set(bId, (alertsByBldg.get(bId) || 0) + 1);
                }
            }

            const bars = [];
            for (const b of buildings) {
                const bIdStr = b._id.toString();
                const devices = devicesByBldg.get(bIdStr) || [];

                let dailyExpKwh = 0;
                for (const d of devices) {
                    for (let h = 0; h < 24; h++) {
                        dailyExpKwh += getExpectedBaseline(d.deviceId, h, isWeekend, 'kw');
                    }
                }
                const expAvgKw = dailyExpKwh / 24;
                const actualAvgKw = bldgDeviceAvgMap.get(bIdStr) || 0;
                const actualKwh = actualAvgKw * hours;
                const expectedKwh = expAvgKw * hours;

                const openAlerts = alertsByBldg.get(bIdStr) || 0;

                let value = actualKwh;
                let expected = expectedKwh;
                if (metric === 'kw') {
                    value = actualAvgKw;
                    expected = expAvgKw;
                } else if (metric === 'rs') {
                    value = actualKwh * tariff;
                    expected = expectedKwh * tariff;
                } else if (metric === 'co2e') {
                    value = actualKwh * emissionFactor;
                    expected = expectedKwh * emissionFactor;
                }

                value = Math.round(value * 10) / 10;
                expected = Math.round(expected * 10) / 10;
                if (metric === 'rs') {
                    value = Math.round(value);
                    expected = Math.round(expected);
                }

                const percentAbove = expected > 0 ? Math.round(((value - expected) / expected) * 100) : 0;
                let status = 'green';
                if (openAlerts > 0 || percentAbove > 40) {
                    status = 'red';
                } else if (percentAbove >= 15) {
                    status = 'amber';
                }

                bars.push({
                    id: b.code || b._id.toString(),
                    buildingId: b._id.toString(),
                    code: b.code,
                    label: b.name,
                    value,
                    expected,
                    percentAbove,
                    openAlerts,
                    status,
                    deviceCount: devices.length
                });
            }

            bars.sort((a, b) => b.value - a.value);
            return res.json(bars);
        }

        if (level === 'building') {
            const b = await resolveBuilding(buildingId, orgId);
            if (!b) return res.status(404).json({ error: 'Building not found' });

            const bars = [];
            const floorCount = b.floors || 4;

            for (let f = 1; f <= floorCount; f++) {
                const device = await Device.findOne({ buildingId: b._id, floor: f, type: 'power', active: { $ne: false } });
                const deviceId = device ? device.deviceId : `PWR-${b.code}-F${f}`;

                let dailyExpKwh = 0;
                for (let h = 0; h < 24; h++) {
                    dailyExpKwh += getExpectedBaseline(deviceId, h, isWeekend, 'kw');
                }
                const expAvgKw = dailyExpKwh / 24;
                const expectedKwh = expAvgKw * hours;

                const agg = await SensorReading.aggregate([
                    {
                        $match: {
                            orgId,
                            buildingId: b._id,
                            floor: f,
                            type: 'power',
                            ts: { $gte: start, $lte: end }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avgKw: { $avg: '$kw' }
                        }
                    }
                ]);

                const actualAvgKw = agg.length > 0 ? agg[0].avgKw : 0;
                const actualKwh = actualAvgKw * hours;

                const openAlerts = await Alert.countDocuments({
                    orgId,
                    $or: [
                        { deviceId },
                        { buildingId: b._id, floor: { $in: [f, String(f), Number(f)] } }
                    ],
                    type: { $in: ['power', 'power_surge'] },
                    status: 'open'
                });

                let value = actualKwh;
                let expected = expectedKwh;
                if (metric === 'kw') {
                    value = actualAvgKw;
                    expected = expAvgKw;
                } else if (metric === 'rs') {
                    value = actualKwh * tariff;
                    expected = expectedKwh * tariff;
                } else if (metric === 'co2e') {
                    value = actualKwh * emissionFactor;
                    expected = expectedKwh * emissionFactor;
                }

                value = Math.round(value * 10) / 10;
                expected = Math.round(expected * 10) / 10;
                if (metric === 'rs') {
                    value = Math.round(value);
                    expected = Math.round(expected);
                }

                const percentAbove = expected > 0 ? Math.round(((value - expected) / expected) * 100) : 0;
                let status = 'green';
                if (openAlerts > 0 || percentAbove > 40) {
                    status = 'red';
                } else if (percentAbove >= 15) {
                    status = 'amber';
                }

                bars.push({
                    id: f,
                    floor: f,
                    deviceId,
                    label: `Floor ${f}`,
                    value,
                    expected,
                    percentAbove,
                    openAlerts,
                    status
                });
            }

            bars.sort((a, b) => b.value - a.value);
            return res.json(bars);
        }

        if (level === 'floor') {
            const b = await resolveBuilding(buildingId, orgId);
            const floorNum = Number(floor) || 1;
            const device = await Device.findOne({ buildingId: b?._id, floor: floorNum, type: 'power', active: { $ne: false } });
            const deviceId = device ? device.deviceId : `PWR-${b?.code || 'BLD'}-F${floorNum}`;

            let dailyExpKwh = 0;
            for (let h = 0; h < 24; h++) {
                dailyExpKwh += getExpectedBaseline(deviceId, h, isWeekend, 'kw');
            }
            const expAvgKw = dailyExpKwh / 24;
            const expectedKwh = expAvgKw * hours;

            const agg = await SensorReading.aggregate([
                {
                    $match: {
                        orgId,
                        deviceId,
                        type: 'power',
                        ts: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgKw: { $avg: '$kw' }
                    }
                }
            ]);

            const actualAvgKw = agg.length > 0 ? agg[0].avgKw : 0;
            const actualKwh = actualAvgKw * hours;

            const openAlerts = await Alert.countDocuments({
                orgId,
                deviceId,
                status: 'open'
            });

            let value = actualKwh;
            let expected = expectedKwh;
            if (metric === 'kw') {
                value = actualAvgKw;
                expected = expAvgKw;
            } else if (metric === 'rs') {
                value = actualKwh * tariff;
                expected = expectedKwh * tariff;
            } else if (metric === 'co2e') {
                value = actualKwh * emissionFactor;
                expected = expectedKwh * emissionFactor;
            }

            value = Math.round(value * 10) / 10;
            expected = Math.round(expected * 10) / 10;
            if (metric === 'rs') {
                value = Math.round(value);
                expected = Math.round(expected);
            }

            const percentAbove = expected > 0 ? Math.round(((value - expected) / expected) * 100) : 0;
            let status = 'green';
            if (openAlerts > 0 || percentAbove > 40) {
                status = 'red';
            } else if (percentAbove >= 15) {
                status = 'amber';
            }

            return res.json([{
                id: floorNum,
                floor: floorNum,
                deviceId,
                label: `${b?.name || 'Building'} Floor ${floorNum}`,
                value,
                expected,
                percentAbove,
                openAlerts,
                status
            }]);
        }

        res.status(400).json({ error: 'Invalid level' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// -------------------------------------------------------------
// 2) GET /api/power/profile
// -------------------------------------------------------------
export const getPowerProfile = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        const { level = 'campus', buildingId, floor, date } = req.query;
        const { start, end, isWeekend } = getDateRange(date);

        if (level === 'floor') {
            const b = await resolveBuilding(buildingId, orgId);
            const floorNum = Number(floor) || 1;
            const device = await Device.findOne({
                orgId,
                ...(b ? { buildingId: b._id } : {}),
                floor: floorNum,
                type: 'power',
                active: { $ne: false }
            });

            const cleanDeviceId = device ? device.deviceId : (b ? `PWR-${b.code}-F${floorNum}` : 'PWR-HA-F4');

            const readings = await SensorReading.find({
                orgId,
                deviceId: cleanDeviceId,
                ts: { $gte: start, $lte: end }
            }).sort({ ts: 1 }).limit(500);

            const series = readings.map(r => {
                const hour = r.ts.getHours();
                const exp = getExpectedBaseline(cleanDeviceId, hour, isWeekend, 'kw');
                return {
                    ts: r.ts,
                    time: formatTime(r.ts),
                    actual: r.kw,
                    expected: exp,
                    expectedMin: Math.round(exp * 0.85 * 10) / 10,
                    expectedMax: Math.round(exp * 1.15 * 10) / 10,
                    source: r.source
                };
            });

            const openAlerts = await Alert.find({
                orgId,
                deviceId: cleanDeviceId,
                status: 'open'
            }).select('_id severity whyText title value expected createdAt');

            const alertMarkers = openAlerts.map(a => ({
                ts: a.createdAt,
                alertId: a._id,
                severity: a.severity,
                message: a.whyText || a.title,
                value: a.value,
                expected: a.expected
            }));

            return res.json({
                level: 'floor',
                deviceId: cleanDeviceId,
                buildingName: b?.name || 'Building',
                floor: floorNum,
                series,
                alertMarkers
            });
        }

        if (level === 'building') {
            const b = await resolveBuilding(buildingId, orgId);
            if (!b) return res.status(404).json({ error: 'Building not found' });

            const devices = await Device.find({ buildingId: b._id, type: 'power', active: { $ne: false } });
            const deviceIds = devices.map(d => d.deviceId);

            const readings = await SensorReading.find({
                orgId,
                buildingId: b._id,
                type: 'power',
                ts: { $gte: start, $lte: end }
            }).sort({ ts: 1 });

            // Bucket by 5-minute slot
            const slotMap = new Map();
            for (const r of readings) {
                const ms = r.ts.getTime();
                const bucketMs = Math.floor(ms / (5 * 60 * 1000)) * (5 * 60 * 1000);
                if (!slotMap.has(bucketMs)) {
                    slotMap.set(bucketMs, { ts: new Date(bucketMs), time: formatTime(new Date(bucketMs)), total: 0, count: 0, byFloor: {}, source: r.source });
                }
                const slot = slotMap.get(bucketMs);
                const floorKey = `F${r.floor}`;
                if (!slot.byFloor[floorKey]) slot.byFloor[floorKey] = [];
                slot.byFloor[floorKey].push(r.kw);
                slot.total += r.kw;
                slot.count += 1;
                if (r.source === 'simulated-fault') slot.hasFault = true;
            }

            const series = [];
            for (const [bucketMs, slot] of Array.from(slotMap.entries()).sort((a, b) => a[0] - b[0])) {
                const d = new Date(bucketMs);
                const hour = d.getHours();

                // Compute baseline for this building at this hour
                let buildingBaseline = 0;
                for (const dev of devices) {
                    buildingBaseline += getExpectedBaseline(dev.deviceId, hour, isWeekend, 'kw');
                }
                const baselineRounded = Math.round(buildingBaseline * 10) / 10;
                const expectedMin = Math.round(buildingBaseline * 0.85 * 10) / 10;
                const expectedMax = Math.round(buildingBaseline * 1.15 * 10) / 10;
                const actual = Math.round(slot.total * 10) / 10;
                const isAnomaly = slot.hasFault || actual > (buildingBaseline * 1.35);

                const point = {
                    ts: slot.ts,
                    time: slot.time,
                    actual,
                    baseline: baselineRounded,
                    expectedMin,
                    expectedMax,
                    isAnomaly,
                    total: actual,
                    source: slot.source || 'seed'
                };
                for (const [fKey, vals] of Object.entries(slot.byFloor)) {
                    const avg = vals.reduce((a, c) => a + c, 0) / vals.length;
                    point[fKey] = Math.round(avg * 10) / 10;
                }
                series.push(point);
            }

            const openAlerts = await Alert.find({
                orgId,
                $or: [
                    { buildingId: b._id },
                    { deviceId: { $in: deviceIds } }
                ],
                type: { $in: ['power', 'power_surge'] },
                status: 'open'
            }).select('_id severity whyText title value expected createdAt deviceId');

            const alertMarkers = openAlerts.map(a => ({
                ts: a.createdAt,
                alertId: a._id,
                severity: a.severity,
                message: a.whyText || a.title,
                value: a.value,
                expected: a.expected,
                deviceId: a.deviceId
            }));

            return res.json({
                level: 'building',
                buildingId: b._id.toString(),
                buildingName: b.name,
                buildingCode: b.code,
                floors: Array.from({ length: b.floors || 4 }, (_, i) => i + 1),
                series: series.slice(-500),
                alertMarkers
            });
        }

        if (level === 'campus') {
            const buildings = await Building.find({ orgId, active: { $ne: false } });
            const buildingCodes = buildings.map(b => b.code);
            const allPowerDevices = await Device.find({ orgId, type: 'power', active: { $ne: false } });

            const readings = await SensorReading.find({
                orgId,
                type: 'power',
                ts: { $gte: start, $lte: end }
            }).populate('buildingId', 'code').sort({ ts: 1 });

            // Bucket by 5-minute slot
            const slotMap = new Map();
            for (const r of readings) {
                const ms = r.ts.getTime();
                const bucketMs = Math.floor(ms / (5 * 60 * 1000)) * (5 * 60 * 1000);
                if (!slotMap.has(bucketMs)) {
                    slotMap.set(bucketMs, { ts: new Date(bucketMs), time: formatTime(new Date(bucketMs)), total: 0, byBuilding: {}, source: r.source });
                }
                const slot = slotMap.get(bucketMs);
                const code = r.buildingId?.code || 'BLD';
                if (!slot.byBuilding[code]) slot.byBuilding[code] = [];
                slot.byBuilding[code].push(r.kw);
                slot.total += r.kw;
                if (r.source === 'simulated-fault') slot.hasFault = true;
            }

            const series = [];
            for (const [bucketMs, slot] of Array.from(slotMap.entries()).sort((a, b) => a[0] - b[0])) {
                const d = new Date(bucketMs);
                const hour = d.getHours();

                // Compute total campus baseline for this hour
                let campusBaseline = 0;
                for (const dev of allPowerDevices) {
                    campusBaseline += getExpectedBaseline(dev.deviceId, hour, isWeekend, 'kw');
                }
                const baselineRounded = Math.round(campusBaseline * 10) / 10;
                const expectedMin = Math.round(campusBaseline * 0.85 * 10) / 10;
                const expectedMax = Math.round(campusBaseline * 1.15 * 10) / 10;
                const actual = Math.round(slot.total * 10) / 10;
                const isAnomaly = slot.hasFault || actual > (campusBaseline * 1.35);

                const point = {
                    ts: slot.ts,
                    time: slot.time,
                    actual,
                    baseline: baselineRounded,
                    expectedMin,
                    expectedMax,
                    isAnomaly,
                    total: actual,
                    source: slot.source || 'seed'
                };
                for (const [code, vals] of Object.entries(slot.byBuilding)) {
                    const sum = vals.reduce((a, c) => a + c, 0);
                    const rounded = Math.round(sum * 10) / 10;
                    point[code] = rounded;
                    if (code === 'AB') point['ACAD'] = rounded;
                    if (code === 'ACAD') point['AB'] = rounded;
                }
                series.push(point);
            }

            const openAlerts = await Alert.find({
                orgId,
                type: { $in: ['power', 'power_surge'] },
                status: 'open'
            }).select('_id severity whyText title value expected createdAt deviceId');

            const alertMarkers = openAlerts.map(a => ({
                ts: a.createdAt,
                alertId: a._id,
                severity: a.severity,
                message: a.whyText || a.title,
                value: a.value,
                expected: a.expected,
                deviceId: a.deviceId
            }));

            return res.json({
                level: 'campus',
                buildings: buildingCodes,
                series: series.slice(-500),
                alertMarkers
            });
        }

        res.status(400).json({ error: 'Invalid level' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// -------------------------------------------------------------
// 3) GET /api/water/overview
// -------------------------------------------------------------
export const getWaterOverview = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        const { level = 'campus', buildingId, metric = 'tank_level', date } = req.query;
        const { start, end } = getDateRange(date);

        if (level === 'campus') {
            const buildings = await Building.find({ orgId, active: { $ne: false } });
            const bars = [];

            // 1. Campus Main Tank
            const campusDevice = await Device.findOne({ orgId, deviceId: 'WTR-CAMPUS-T1' });
            if (campusDevice) {
                const latest = await SensorReading.findOne({ orgId, deviceId: 'WTR-CAMPUS-T1' }).sort({ ts: -1 });
                const tankLevelPct = latest?.tank_level_pct ?? 82;

                // Night flow avg in 01:00-04:00
                const nightAgg = await SensorReading.aggregate([
                    {
                        $match: {
                            orgId,
                            deviceId: 'WTR-CAMPUS-T1',
                            ts: { $gte: start, $lte: end }
                        }
                    },
                    {
                        $project: {
                            flow_lpm: 1,
                            hour: { $hour: '$ts' }
                        }
                    },
                    {
                        $match: {
                            hour: { $gte: 1, $lt: 4 }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avgFlow: { $avg: '$flow_lpm' },
                            totalFlowLpm: { $sum: '$flow_lpm' }
                        }
                    }
                ]);

                const avgNightFlow = nightAgg.length > 0 ? nightAgg[0].avgFlow : 0.2;
                const openAlerts = await Alert.countDocuments({
                    orgId,
                    deviceId: 'WTR-CAMPUS-T1',
                    status: 'open'
                });

                const isRed = openAlerts > 0 || avgNightFlow >= 2.0 || tankLevelPct < 20;
                const isAmber = !isRed && (tankLevelPct < 35 || avgNightFlow >= 1.0);
                const status = isRed ? 'red' : (isAmber ? 'amber' : 'green');

                let value = tankLevelPct;
                let expected = 80;
                if (metric === 'night_flow') {
                    value = Math.round(avgNightFlow * 10) / 10;
                    expected = 0.2;
                } else if (metric === 'kl') {
                    value = 14.5;
                    expected = 14.0;
                }

                bars.push({
                    id: 'WTR-CAMPUS-T1',
                    deviceId: 'WTR-CAMPUS-T1',
                    label: 'Campus Central Reservoir',
                    value,
                    expected,
                    tankLevelPct,
                    nightFlowLpm: Math.round(avgNightFlow * 10) / 10,
                    openAlerts,
                    status
                });
            }

            // 2. Building Overhead Tanks
            for (const b of buildings) {
                const device = await Device.findOne({ buildingId: b._id, type: { $in: ['water', 'water_tank'] }, active: { $ne: false } });
                if (!device) continue;

                const latest = await SensorReading.findOne({ deviceId: device.deviceId }).sort({ ts: -1 });
                const tankLevelPct = latest?.tank_level_pct ?? 70;

                const nightAgg = await SensorReading.aggregate([
                    {
                        $match: {
                            deviceId: device.deviceId,
                            ts: { $gte: start, $lte: end }
                        }
                    },
                    {
                        $project: {
                            flow_lpm: 1,
                            hour: { $hour: '$ts' }
                        }
                    },
                    {
                        $match: {
                            hour: { $gte: 1, $lt: 4 }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avgFlow: { $avg: '$flow_lpm' }
                        }
                    }
                ]);

                const avgNightFlow = nightAgg.length > 0 ? nightAgg[0].avgFlow : 0.3;
                const openAlerts = await Alert.countDocuments({
                    deviceId: device.deviceId,
                    status: 'open'
                });

                const isRed = openAlerts > 0 || avgNightFlow >= 2.0 || tankLevelPct < 20;
                const isAmber = !isRed && (tankLevelPct < 35 || avgNightFlow >= 1.0);
                const status = isRed ? 'red' : (isAmber ? 'amber' : 'green');

                let value = tankLevelPct;
                let expected = 75;
                if (metric === 'night_flow') {
                    value = Math.round(avgNightFlow * 10) / 10;
                    expected = 0.2;
                } else if (metric === 'kl') {
                    value = 3.8;
                    expected = 3.5;
                }

                bars.push({
                    id: b.code || b._id.toString(),
                    buildingId: b._id.toString(),
                    code: b.code,
                    deviceId: device.deviceId,
                    label: b.name,
                    value,
                    expected,
                    tankLevelPct,
                    nightFlowLpm: Math.round(avgNightFlow * 10) / 10,
                    openAlerts,
                    status
                });
            }

            bars.sort((a, b) => b.value - a.value);
            return res.json(bars);
        }

        if (level === 'building') {
            const b = await resolveBuilding(buildingId, orgId);
            if (!b) return res.status(404).json({ error: 'Building not found' });

            const devices = await Device.find({ buildingId: b._id, type: { $in: ['water', 'water_tank'] }, active: { $ne: false } });
            const bars = [];

            for (const d of devices) {
                const latest = await SensorReading.findOne({ deviceId: d.deviceId }).sort({ ts: -1 });
                const tankLevelPct = latest?.tank_level_pct ?? 70;

                const nightAgg = await SensorReading.aggregate([
                    {
                        $match: {
                            deviceId: d.deviceId,
                            ts: { $gte: start, $lte: end }
                        }
                    },
                    {
                        $project: {
                            flow_lpm: 1,
                            hour: { $hour: '$ts' }
                        }
                    },
                    {
                        $match: {
                            hour: { $gte: 1, $lt: 4 }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avgFlow: { $avg: '$flow_lpm' }
                        }
                    }
                ]);

                const avgNightFlow = nightAgg.length > 0 ? nightAgg[0].avgFlow : 0.3;
                const openAlerts = await Alert.countDocuments({
                    deviceId: d.deviceId,
                    status: 'open'
                });

                const isRed = openAlerts > 0 || avgNightFlow >= 2.0 || tankLevelPct < 20;
                const isAmber = !isRed && (tankLevelPct < 35 || avgNightFlow >= 1.0);
                const status = isRed ? 'red' : (isAmber ? 'amber' : 'green');

                let value = tankLevelPct;
                let expected = 75;
                if (metric === 'night_flow') {
                    value = Math.round(avgNightFlow * 10) / 10;
                    expected = 0.2;
                } else if (metric === 'kl') {
                    value = 3.8;
                    expected = 3.5;
                }

                bars.push({
                    id: d.deviceId,
                    deviceId: d.deviceId,
                    label: d.label || `${b.name} Overhead Tank`,
                    value,
                    expected,
                    tankLevelPct,
                    nightFlowLpm: Math.round(avgNightFlow * 10) / 10,
                    openAlerts,
                    status
                });
            }

            return res.json(bars);
        }

        res.status(400).json({ error: 'Invalid level' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// -------------------------------------------------------------
// 4) GET /api/water/profile
// -------------------------------------------------------------
export const getWaterProfile = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        const { deviceId, buildingId, date } = req.query;
        const { start, end } = getDateRange(date);

        let targetDeviceId = deviceId ? deviceId.toUpperCase().trim() : null;

        if (!targetDeviceId && buildingId) {
            const b = await resolveBuilding(buildingId, orgId);
            if (b) {
                const dev = await Device.findOne({ buildingId: b._id, type: { $in: ['water', 'water_tank'] }, active: { $ne: false } });
                if (dev) targetDeviceId = dev.deviceId;
            }
        }

        if (!targetDeviceId) {
            targetDeviceId = 'WTR-CAMPUS-T1';
        }

        const device = await Device.findOne({ deviceId: targetDeviceId, ...(orgId ? { orgId } : {}) }) || {
            deviceId: targetDeviceId,
            label: `${targetDeviceId} Water Tank`
        };

        const waterReadingQuery = {
            deviceId: targetDeviceId,
            ts: { $gte: start, $lte: end }
        };
        if (orgId) waterReadingQuery.orgId = orgId;

        const readings = await SensorReading.find(waterReadingQuery).sort({ ts: 1 }).limit(500);

        const series = readings.map(r => {
            const hour = r.ts.getHours();
            const isNightWindow = (hour >= 1 && hour < 4);
            const actual = r.tank_level_pct;
            const baseline = 75;
            return {
                ts: r.ts,
                time: formatTime(r.ts),
                actual,
                baseline,
                expectedMin: 60,
                expectedMax: 90,
                tank_level_pct: r.tank_level_pct,
                flow_lpm: r.flow_lpm,
                isAnomaly: actual < 15 || (isNightWindow && r.flow_lpm > 1.0) || r.source === 'simulated-fault',
                isNightWindow,
                source: r.source
            };
        });

        const openAlerts = await Alert.find({
            deviceId: targetDeviceId,
            status: 'open'
        }).select('_id severity whyText title value expected createdAt');

        const alertMarkers = openAlerts.map(a => ({
            ts: a.createdAt,
            alertId: a._id,
            severity: a.severity,
            message: a.whyText || a.title,
            value: a.value,
            expected: a.expected
        }));

        res.json({
            deviceId: targetDeviceId,
            label: device.label,
            nightWindow: { start: '01:00', end: '04:00' },
            series,
            alertMarkers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const PALETTE = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];

export const allocateLargestRemainder = (items, targetSum = 100) => {
    if (!items || items.length === 0) return [];
    const total = items.reduce((acc, it) => acc + (it.value || 0), 0);
    if (total === 0) {
        return items.map(it => ({ ...it, percent: 0 }));
    }

    const withExact = items.map(it => {
        const exact = ((it.value || 0) / total) * targetSum;
        const floor = Math.floor(exact);
        const remainder = exact - floor;
        return { ...it, exact, floor, remainder };
    });

    const sumFloors = withExact.reduce((acc, it) => acc + it.floor, 0);
    let deficit = targetSum - sumFloors;

    const sorted = [...withExact].sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < sorted.length && deficit > 0; i++) {
        sorted[i].floor += 1;
        deficit -= 1;
    }

    return sorted.map(({ exact, floor, remainder, ...rest }) => ({
        ...rest,
        percent: floor
    }));
};

const getPeriodRange = (period = '24hr') => {
    const end = new Date();
    let start = new Date();
    if (period === '3h' || period === '3hr') {
        start = new Date(end.getTime() - 3 * 3600 * 1000);
    } else if (period === '24h' || period === '24hr') {
        start = new Date(end.getTime() - 24 * 3600 * 1000);
    } else if (period === '3d') {
        start = new Date(end.getTime() - 3 * 24 * 3600 * 1000);
    } else {
        start = new Date(end.getTime() - 24 * 3600 * 1000);
    }
    return { start, end };
};

// -------------------------------------------------------------
// 5) GET /api/power/mix
// -------------------------------------------------------------
export const getPowerMix = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        const { buildingId, period = '24hr' } = req.query;
        const { start, end } = getPeriodRange(period);

        let rawItems = [];

        if (buildingId) {
            const b = await resolveBuilding(buildingId, orgId);
            if (!b) return res.status(404).json({ error: 'Building not found' });

            const agg = await SensorReading.aggregate([
                {
                    $match: {
                        orgId,
                        buildingId: b._id,
                        type: 'power',
                        ts: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: '$floor',
                        totalKw: { $sum: '$kw' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            rawItems = agg.map(a => ({
                name: `Floor ${a._id}`,
                value: Math.round(a.totalKw * 10) / 10
            }));
        } else {
            const buildings = await Building.find({ orgId, active: { $ne: false } }).lean();
            const bMap = new Map(buildings.map(b => [b._id.toString(), b.name]));

            const agg = await SensorReading.aggregate([
                {
                    $match: {
                        orgId,
                        type: 'power',
                        ts: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: '$buildingId',
                        totalKw: { $sum: '$kw' }
                    }
                }
            ]);

            rawItems = agg.map(a => {
                const bId = a._id ? a._id.toString() : '';
                return {
                    name: bMap.get(bId) || 'Campus Facility',
                    value: Math.round(a.totalKw * 10) / 10
                };
            });
        }

        const totalVal = rawItems.reduce((acc, it) => acc + it.value, 0);
        if (totalVal === 0) {
            return res.json([]);
        }

        rawItems.sort((a, b) => b.value - a.value);

        const mainItems = [];
        let othersVal = 0;

        for (const item of rawItems) {
            const pct = (item.value / totalVal) * 100;
            if (pct < 3) {
                othersVal += item.value;
            } else {
                mainItems.push(item);
            }
        }

        if (othersVal > 0) {
            mainItems.push({
                name: 'Others',
                value: Math.round(othersVal * 10) / 10
            });
        }

        const withPercent = allocateLargestRemainder(mainItems, 100);

        const finalMix = withPercent.map((it, idx) => ({
            ...it,
            color: it.name === 'Others' ? '#64748b' : PALETTE[idx % PALETTE.length]
        }));

        res.json(finalMix);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// -------------------------------------------------------------
// 6) GET /api/water/mix
// -------------------------------------------------------------
export const getWaterMix = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        const { period = '24hr' } = req.query;
        const { start, end } = getPeriodRange(period);

        const devices = await Device.find({ orgId, type: { $in: ['water', 'water_tank'] }, active: { $ne: false } }).lean();
        const devMap = new Map(devices.map(d => [d.deviceId, d.label]));

        const agg = await SensorReading.aggregate([
            {
                $match: {
                    orgId,
                    type: { $in: ['water', 'water_tank'] },
                    ts: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$deviceId',
                    totalFlow: { $sum: '$flow_lpm' }
                }
            }
        ]);

        const rawItems = agg.map(a => ({
            name: devMap.get(a._id) || a._id,
            value: Math.round((a.totalFlow || 0) * 10) / 10
        }));

        const totalVal = rawItems.reduce((acc, it) => acc + it.value, 0);
        if (totalVal === 0) {
            return res.json([]);
        }

        rawItems.sort((a, b) => b.value - a.value);

        const mainItems = [];
        let othersVal = 0;

        for (const item of rawItems) {
            const pct = (item.value / totalVal) * 100;
            if (pct < 3) {
                othersVal += item.value;
            } else {
                mainItems.push(item);
            }
        }

        if (othersVal > 0) {
            mainItems.push({
                name: 'Others',
                value: Math.round(othersVal * 10) / 10
            });
        }

        const withPercent = allocateLargestRemainder(mainItems, 100);

        const finalMix = withPercent.map((it, idx) => ({
            ...it,
            color: it.name === 'Others' ? '#64748b' : PALETTE[idx % PALETTE.length]
        }));

        res.json(finalMix);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
