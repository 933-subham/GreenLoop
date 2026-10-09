import Device from '../models/facility/Device.js';
import Alert from '../models/facility/Alert.js';
import SensorReading from '../models/facility/SensorReading.js';
import { appendReading } from '../services/readingStore.js';
import { getExpectedBaseline } from '../services/baselineService.js';
import { runDetectionForReading } from '../services/detectionService.js';
import { startSimulator, stopSimulator, getSimulatorStatus } from '../services/simulatorService.js';

/**
 * POST /api/sim/inject-fault (or /api/sim/fault)
 * Body: { deviceId, faultType, durationSec=300 }
 *   - 'spike': kw = baseline * 2.2
 *   - 'tank_leak': tank_level_pct falls at 3%/min, flow_lpm = 4.5
 *   - 'tank_dry': tank_level_pct = 8
 *   - 'tamper': flatline reading (kw = 0.05 or flat line)
 *   source = 'simulated-fault'
 */
export const injectSimFault = async (req, res) => {
    try {
        const { deviceId, faultType = 'spike', durationSec = 300, multiplier, mode } = req.body;

        if (!deviceId) {
            return res.status(400).json({ error: 'deviceId is required' });
        }

        const cleanId = deviceId.toUpperCase().trim();
        const device = await Device.findOne({ deviceId: cleanId, active: { $ne: false } }).populate('buildingId');
        if (!device) {
            return res.status(400).json({ error: 'Unregistered device' });
        }

        const now = new Date();
        const hour = now.getHours();
        const isWeekend = (now.getDay() === 0 || now.getDay() === 6);
        const orgId = device.orgId || 'bput_college';

        // Determine fault behavior
        const type = faultType || mode || (device.type === 'power' ? 'spike' : 'tank_leak');
        const createdReadings = [];
        const alertsCreated = [];

        // Number of 5-min intervals or 1-min intervals to inject based on durationSec (min 1, default 3 points)
        const pointCount = Math.max(1, Math.min(10, Math.round(durationSec / 60) || 3));

        if (type === 'spike' || device.type === 'power') {
            const baseline = getExpectedBaseline(cleanId, hour, isWeekend, 'kw');
            const factor = multiplier ? Number(multiplier) : (type === 'tamper' ? 0.02 : 2.2);
            const surgeKw = Math.round((baseline * factor) * 10) / 10;

            for (let i = pointCount - 1; i >= 0; i--) {
                const ts = new Date(now.getTime() - i * 60000);
                const reading = await appendReading({
                    deviceId: cleanId,
                    orgId,
                    buildingId: device.buildingId?._id || device.buildingId,
                    floor: device.floor,
                    type: 'power',
                    zone: device.zone || `Floor-${device.floor}`,
                    kw: type === 'tamper' ? 0.05 : surgeKw,
                    expected: baseline,
                    ts,
                    source: 'simulated-fault'
                });
                createdReadings.push(reading);
            }

            const lastReading = createdReadings[createdReadings.length - 1];
            const alerts = await runDetectionForReading(lastReading, device);
            alertsCreated.push(...alerts);

        } else if (type === 'tank_leak') {
            // tank_leak: tank_level_pct falls at 3%/min, flow_lpm = 4.5
            const baselineLvl = getExpectedBaseline(cleanId, hour, isWeekend, 'tank_level_pct');
            let level = 65.0;

            for (let i = pointCount - 1; i >= 0; i--) {
                const ts = new Date(now.getTime() - i * 60000);
                level = Math.max(5, level - 3.0); // falls at 3% per minute
                const reading = await appendReading({
                    deviceId: cleanId,
                    orgId,
                    buildingId: device.buildingId?._id || device.buildingId,
                    floor: device.floor,
                    type: 'water_tank',
                    zone: device.zone || 'Water Tank',
                    tank_level_pct: Math.round(level * 10) / 10,
                    flow_lpm: 4.5,
                    expected: baselineLvl,
                    ts,
                    source: 'simulated-fault'
                });
                createdReadings.push(reading);
            }

            const lastReading = createdReadings[createdReadings.length - 1];
            const alerts = await runDetectionForReading(lastReading, device);
            alertsCreated.push(...alerts);

        } else if (type === 'tank_dry') {
            // tank_dry: tank_level_pct = 8
            const baselineLvl = getExpectedBaseline(cleanId, hour, isWeekend, 'tank_level_pct');

            for (let i = pointCount - 1; i >= 0; i--) {
                const ts = new Date(now.getTime() - i * 60000);
                const reading = await appendReading({
                    deviceId: cleanId,
                    orgId,
                    buildingId: device.buildingId?._id || device.buildingId,
                    floor: device.floor,
                    type: 'water_tank',
                    zone: device.zone || 'Water Tank',
                    tank_level_pct: 8.0,
                    flow_lpm: 0,
                    expected: baselineLvl,
                    ts,
                    source: 'simulated-fault'
                });
                createdReadings.push(reading);
            }

            const lastReading = createdReadings[createdReadings.length - 1];
            const alerts = await runDetectionForReading(lastReading, device);
            alertsCreated.push(...alerts);

        } else if (type === 'tamper') {
            // tamper: flatline reading
            const baselineLvl = getExpectedBaseline(cleanId, hour, isWeekend, 'tank_level_pct');

            for (let i = pointCount - 1; i >= 0; i--) {
                const ts = new Date(now.getTime() - i * 60000);
                const reading = await appendReading({
                    deviceId: cleanId,
                    orgId,
                    buildingId: device.buildingId?._id || device.buildingId,
                    floor: device.floor,
                    type: device.type,
                    zone: device.zone || 'Facility Zone',
                    tank_level_pct: 50.0,
                    flow_lpm: 0,
                    kw: 0.05,
                    expected: baselineLvl,
                    ts,
                    source: 'simulated-fault'
                });
                createdReadings.push(reading);
            }

            const lastReading = createdReadings[createdReadings.length - 1];
            const alerts = await runDetectionForReading(lastReading, device);
            alertsCreated.push(...alerts);
        }

        res.status(201).json({
            success: true,
            deviceId: cleanId,
            faultType: type,
            readingsCreated: createdReadings.length,
            alertsCreated
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/sim/reset { deviceId? }
 *  - deviceId given: delete simulated-fault readings for that deviceId; auto-resolve its open alerts
 *  - deviceId omitted: delete all simulated-fault readings across the org; auto-resolve all open alerts.
 */
export const resetSimFaults = async (req, res) => {
    try {
        const { deviceId } = req.body || {};
        const orgId = req.query?.orgId || req.body?.orgId || 'bput_college';

        if (deviceId) {
            const cleanId = deviceId.toUpperCase().trim();
            const deletedReadings = await SensorReading.deleteMany({
                deviceId: cleanId,
                source: 'simulated-fault'
            });

            const resolvedAlerts = await Alert.updateMany(
                { deviceId: cleanId, status: 'open' },
                {
                    $set: {
                        status: 'resolved',
                        resolvedAt: new Date(),
                        note: 'Resolved via sim reset for device'
                    }
                }
            );

            return res.json({
                success: true,
                deviceId: cleanId,
                deletedReadingsCount: deletedReadings.deletedCount,
                resolvedAlertsCount: resolvedAlerts.modifiedCount
            });
        }

        // deviceId omitted: delete all simulated-fault readings; auto-resolve all open alerts
        const deletedReadings = await SensorReading.deleteMany({
            orgId,
            source: 'simulated-fault'
        });

        const resolvedAlerts = await Alert.updateMany(
            { orgId, status: 'open' },
            {
                $set: {
                    status: 'resolved',
                    resolvedAt: new Date(),
                    note: 'Resolved via campus-wide sim reset'
                }
            }
        );

        res.json({
            success: true,
            scope: 'all',
            deletedReadingsCount: deletedReadings.deletedCount,
            resolvedAlertsCount: resolvedAlerts.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Background simulator manual triggers if requested
export const startSim = (req, res) => {
    const result = startSimulator();
    res.json(result);
};

export const stopSim = (req, res) => {
    const result = stopSimulator();
    res.json(result);
};

export const getSimStatus = (req, res) => {
    const status = getSimulatorStatus();
    res.json(status);
};
