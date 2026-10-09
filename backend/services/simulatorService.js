import Device from '../models/facility/Device.js';
import { appendReading } from './readingStore.js';
import { getExpectedBaseline } from './baselineService.js';
import { runDetectionForReading } from './detectionService.js';

let simInterval = null;
let isRunning = false;
let lastTick = null;

const SIM_INTERVAL_SEC = parseInt(process.env.SIM_INTERVAL_SEC, 10) || 5;

// Generate one normal reading for a given active device
export const generateNormalReading = async (device) => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = (now.getDay() === 0 || now.getDay() === 6);
    const { deviceId, type, zone, buildingId, floor, orgId } = device;

    // +/- 8% noise
    const noise = (Math.random() * 0.16 - 0.08);

    const readingData = {
        deviceId,
        orgId: orgId || 'bput_college',
        buildingId,
        floor,
        type,
        zone: zone || `Floor-${floor}`,
        ts: now,
        source: 'live-sim'
    };

    if (type === 'power') {
        const baseline = getExpectedBaseline(deviceId, hour, isWeekend, 'kw');
        const kw = Math.max(0.5, Math.round(baseline * (1 + noise) * 10) / 10);
        readingData.kw = kw;
        readingData.expected = baseline;
    } else if (type === 'water') {
        const baselineLvl = getExpectedBaseline(deviceId, hour, isWeekend, 'tank_level_pct');
        const baselineFlow = getExpectedBaseline(deviceId, hour, isWeekend, 'flow_lpm');
        const levelPct = Math.min(100, Math.max(10, Math.round((baselineLvl + (Math.random() * 2 - 1)) * 10) / 10));
        const flowLpm = Math.max(0, Math.round((baselineFlow * (1 + noise)) * 100) / 100);

        readingData.tank_level_pct = levelPct;
        readingData.flow_lpm = flowLpm;
        readingData.expected = baselineLvl;
    }

    const saved = await appendReading(readingData);
    await runDetectionForReading(saved, device);
    return saved;
};

// Tick function
export const tickSimulator = async () => {
    try {
        const devices = await Device.find({ active: { $ne: false } }).lean();
        for (const dev of devices) {
            await generateNormalReading(dev);
        }
        lastTick = new Date();
    } catch (err) {
        console.error('Simulator tick error:', err.message);
    }
};

export const startSimulator = () => {
    if (isRunning) return { running: true, message: 'Simulator already running' };
    simInterval = setInterval(tickSimulator, SIM_INTERVAL_SEC * 1000);
    isRunning = true;
    lastTick = new Date();
    console.log(`⚡ Normal Telemetry Simulator started (${SIM_INTERVAL_SEC}s interval)`);
    tickSimulator();
    return { running: true, intervalSec: SIM_INTERVAL_SEC, lastTick };
};

export const stopSimulator = () => {
    if (simInterval) {
        clearInterval(simInterval);
        simInterval = null;
    }
    isRunning = false;
    console.log('🛑 Normal Telemetry Simulator stopped');
    return { running: false, lastTick };
};

export const getSimulatorStatus = () => {
    return {
        running: isRunning,
        intervalSec: SIM_INTERVAL_SEC,
        lastTick
    };
};
