import Building from '../models/facility/Building.js';
import Device from '../models/facility/Device.js';
import SensorReading from '../models/facility/SensorReading.js';
import Alert from '../models/facility/Alert.js';
import { getExpectedBaseline } from './baselineService.js';

export const seedCampusHierarchy = async (orgId = 'bput_college', force = false) => {
    // Check if already seeded (idempotent, only if the org has no buildings)
    const existingBuildings = await Building.countDocuments({ orgId, active: true });
    const existingReadings = await SensorReading.countDocuments({ orgId });
    if (!force && existingBuildings > 0 && existingReadings > 0) {
        console.log(`✓ Campus hierarchy and readings already exist for ${orgId} (${existingBuildings} buildings, ${existingReadings} readings). Skipping duplicate seed.`);
        return { skipped: true, count: existingBuildings };
    }

    if (process.env.SEED_DEMO_CAMPUS === 'false' && !force) {
        console.log(`SEED_DEMO_CAMPUS is false. Skipping campus seed.`);
        return { skipped: true };
    }

    console.log(`🌱 Seeding EstateIQ Campus Hierarchy (6 buildings, 13 devices, 3 days of normal data) for ${orgId}...`);

    // 1. Create the 6 Buildings
    const buildingsConfig = [
        { code: 'HA', name: 'Hostel Block A', type: 'hostel', floors: 4 },
        { code: 'HB', name: 'Hostel Block B', type: 'hostel', floors: 3 },
        { code: 'AB', name: 'Academic Block', type: 'academic', floors: 3 },
        { code: 'CANT', name: 'Canteen & Mess', type: 'canteen', floors: 1 },
        { code: 'PH', name: 'Pump House', type: 'pump_house', floors: 1 },
        { code: 'SL', name: 'Street Lighting', type: 'street_lighting', floors: 1 }
    ];

    const buildingMap = {};
    for (const b of buildingsConfig) {
        const doc = await Building.findOneAndUpdate(
            { orgId, code: b.code },
            { $set: { ...b, active: true } },
            { upsert: true, returnDocument: 'after' }
        );
        buildingMap[b.code] = doc;
    }

    // 2. Create Devices
    const devicesConfig = [];

    // One power meter per floor
    for (const b of buildingsConfig) {
        for (let f = 1; f <= b.floors; f++) {
            devicesConfig.push({
                deviceId: `PWR-${b.code}-F${f}`,
                orgId,
                buildingId: buildingMap[b.code]._id,
                buildingCode: b.code,
                floor: f,
                type: 'power',
                label: `${b.name} Floor ${f} Power`,
                status: 'online',
                active: true,
                lastSeen: new Date()
            });
        }
    }

    // One water tank per building
    for (const b of buildingsConfig) {
        devicesConfig.push({
            deviceId: `WTR-${b.code}-T1`,
            orgId,
            buildingId: buildingMap[b.code]._id,
            buildingCode: b.code,
            floor: b.floors,
            type: 'water_tank',
            label: `${b.name} Overhead Tank`,
            status: 'online',
            active: true,
            lastSeen: new Date()
        });
    }

    // Plus Campus Reservoir
    devicesConfig.push({
        deviceId: 'WTR-CAMPUS-T1',
        orgId,
        buildingId: buildingMap['PH']._id,
        buildingCode: 'PH',
        floor: 'campus',
        type: 'water_tank',
        label: 'Central Campus Reservoir (50,000 L)',
        status: 'online',
        active: true,
        lastSeen: new Date()
    });

    const savedDevices = [];
    for (const d of devicesConfig) {
        const devDoc = await Device.findOneAndUpdate(
            { deviceId: d.deviceId },
            { $set: d },
            { upsert: true, returnDocument: 'after' }
        );
        savedDevices.push({ ...d, _id: devDoc._id });
    }

    // 3. Clear existing readings/alerts for this org if force
    if (force) {
        await SensorReading.deleteMany({ orgId });
        await Alert.deleteMany({ orgId });
    }

    // 4. Generate 3 days of NORMAL history at 5-minute resolution inside the last 3 days
    const now = Date.now();
    const intervalMs = 5 * 60 * 1000; // 5 mins
    const totalIntervals = (3 * 24 * 60) / 5; // 864 intervals
    const startTime = now - (totalIntervals * intervalMs);

    const readingsBatch = [];

    for (let step = 0; step < totalIntervals; step++) {
        const ts = new Date(startTime + (step * intervalMs));
        const hour = ts.getHours();
        const isWeekend = (ts.getDay() === 0 || ts.getDay() === 6);

        // ~2% missing data simulation (drop randomly, but never for the latest hour)
        const isLatestHour = (now - ts.getTime()) < 3600000;

        for (const dev of savedDevices) {
            if (!isLatestHour && Math.random() < 0.02) {
                continue; // 2% missing point
            }

            // Normal +/- 8% noise
            const noise = 1 + ((Math.random() - 0.5) * 0.16);

            if (dev.type === 'power') {
                const expKw = getExpectedBaseline(dev.deviceId, hour, isWeekend, 'kw');
                const valKw = Math.round((expKw * noise) * 10) / 10;

                readingsBatch.push({
                    deviceId: dev.deviceId,
                    orgId,
                    buildingId: dev.buildingId,
                    floor: dev.floor,
                    type: 'power',
                    zone: dev.label,
                    kw: Math.max(0.1, valKw),
                    expected: expKw,
                    ts,
                    source: 'seed'
                });
            } else {
                // Water tank
                const expLvl = getExpectedBaseline(dev.deviceId, hour, isWeekend, 'tank_level_pct');
                const expFlow = getExpectedBaseline(dev.deviceId, hour, isWeekend, 'flow_lpm');

                let flow = expFlow * noise;
                // Night 01:00-04:00 flow near 0
                if (hour >= 1 && hour < 4) {
                    flow = 0.01 + (Math.random() * 0.03); // near 0
                }

                const lvl = Math.min(98, Math.max(25, expLvl + ((Math.random() - 0.5) * 3)));

                readingsBatch.push({
                    deviceId: dev.deviceId,
                    orgId,
                    buildingId: dev.buildingId,
                    floor: dev.floor,
                    type: 'water_tank',
                    zone: dev.label,
                    tank_level_pct: Math.round(lvl * 10) / 10,
                    flow_lpm: Math.round(flow * 100) / 100,
                    expected: expLvl,
                    ts,
                    source: 'seed'
                });
            }
        }
    }

    // Insert in bulk directly through Mongo collection for maximum speed
    await SensorReading.collection.insertMany(readingsBatch, { ordered: false });

    console.log(`✓ Seeded ${buildingsConfig.length} buildings, ${savedDevices.length} devices, and ${readingsBatch.length} readings into estateiq_facility.`);
    return {
        success: true,
        buildingsCount: buildingsConfig.length,
        devicesCount: savedDevices.length,
        readingsCount: readingsBatch.length
    };
};
