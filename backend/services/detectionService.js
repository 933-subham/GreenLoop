import SensorReading from '../models/facility/SensorReading.js';
import Alert from '../models/facility/Alert.js';
import Device from '../models/facility/Device.js';
import Building from '../models/facility/Building.js';
import http from 'http';
import { getExpectedBaseline } from './baselineService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Helper to call Python AI service with short timeout (fallback if unavailable)
const callAiService = async (endpoint, method = 'POST', body = null) => {
    return new Promise((resolve) => {
        try {
            const url = new URL(endpoint, AI_SERVICE_URL);
            const req = http.request(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                timeout: 1800
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
            if (body) req.write(JSON.stringify(body));
            req.end();
        } catch {
            resolve(null);
        }
    });
};

/**
 * Run automatic detection for an incoming sensor reading
 * Rules:
 *  - Power > 1.35 * baseline => open alert (severity: critical if > 1.7, else warning)
 *  - Tank level < 15% => critical alert ("Reservoir critically low")
 *  - Night flow (01:00-04:00) > 1.0 L/min for 3 consecutive points => warning ("Probable night leak")
 *  - Auto-resolve alerts when reading returns to normal for 3 consecutive points
 */
export const runDetectionForReading = async (reading, device = null) => {
    const { deviceId, type, zone, kw, tank_level_pct, flow_lpm, ts } = reading;
    const readingDate = new Date(ts || Date.now());
    const hour = readingDate.getHours();
    const isWeekend = (readingDate.getDay() === 0 || readingDate.getDay() === 6);

    let dev = device;
    if (!dev) {
        dev = await Device.findOne({ deviceId }).populate('buildingId');
    }
    const buildingName = dev?.buildingId?.name || dev?.buildingCode || 'Campus Facility';
    const floorLabel = dev?.floor != null ? dev.floor : 1;
    const orgId = reading.orgId || dev?.orgId || 'bput_college';

    const alertsCreated = [];

    // Query recent readings for consecutive point checks & auto-resolve
    const recentReadings = await SensorReading.find({ deviceId })
        .sort({ ts: -1 })
        .limit(3)
        .lean();

    if (type === 'power') {
        const val = kw != null ? kw : (reading.value || 0);
        const expected = reading.expected != null ? reading.expected : getExpectedBaseline(deviceId, hour, isWeekend, 'kw');

        // Check power threshold: Power > 1.35 * baseline => open alert
        const isSpike = val > 1.35 * expected;

        if (isSpike) {
            const severity = val > 1.7 * expected ? 'critical' : 'warning';
            const percentOver = Math.round(((val - expected) / expected) * 100);
            const excessKw = Math.max(0, val - expected);
            const impactKwh = Math.round(excessKw * 3 * 10) / 10;
            const impactRupees = Math.round(impactKwh * 7.50);
            const impactCo2 = Math.round(impactKwh * 0.71 * 10) / 10;

            const whyText = `${buildingName}, Floor ${floorLabel} (${deviceId}) power draw of ${val.toFixed(1)} kW exceeds expected baseline ${expected.toFixed(1)} kW by ${percentOver}%.`;
            const suggestedAction = `Inspect Floor ${floorLabel} in ${buildingName} for unapproved heavy electrical loads or equipment left running.`;

            const existingAlert = await Alert.findOne({
                deviceId,
                type: 'power',
                status: 'open'
            });

            if (existingAlert) {
                existingAlert.value = val;
                existingAlert.expected = expected;
                existingAlert.percentOver = percentOver;
                existingAlert.severity = severity;
                existingAlert.whyText = whyText;
                existingAlert.suggestedAction = suggestedAction;
                existingAlert.impact = { kwh: impactKwh, rupees: impactRupees, co2e_kg: impactCo2, litres: 0 };
                await existingAlert.save();
                alertsCreated.push(existingAlert);
            } else {
                const newAlert = await Alert.create({
                    orgId,
                    buildingId: dev?.buildingId?._id || dev?.buildingId || null,
                    floor: floorLabel,
                    deviceId,
                    type: 'power',
                    severity,
                    value: val,
                    expected,
                    percentOver,
                    confidence: 0.95,
                    whyText,
                    suggestedAction,
                    impact: { kwh: impactKwh, rupees: impactRupees, co2e_kg: impactCo2, litres: 0 },
                    status: 'open',
                    createdAt: new Date()
                });
                alertsCreated.push(newAlert);
            }
        } else {
            // Check Auto-Resolve: reading returned to normal (<= 1.35 * baseline) for 3 consecutive points
            if (recentReadings.length >= 3) {
                const allNormal = recentReadings.every(r => (r.kw != null ? r.kw : 0) <= 1.35 * (r.expected || expected));
                if (allNormal) {
                    const openAlert = await Alert.findOne({ deviceId, type: 'power', status: 'open' });
                    if (openAlert) {
                        openAlert.status = 'resolved';
                        openAlert.resolvedAt = new Date();
                        openAlert.note = 'Auto-resolved: reading returned to normal baseline envelope for 3 consecutive intervals.';
                        await openAlert.save();
                    }
                }
            }
        }
    } else if (type === 'water_tank' || type === 'water') {
        const level = tank_level_pct != null ? tank_level_pct : (reading.value || 75);
        const flow = flow_lpm != null ? flow_lpm : 0;
        const expectedLvl = reading.expected != null ? reading.expected : getExpectedBaseline(deviceId, hour, isWeekend, 'tank_level_pct');

        // Rule 1: Tank level < 15% => critical alert ("Reservoir critically low")
        if (level < 15) {
            const whyText = `${buildingName} (${deviceId}) water level critically low at ${level.toFixed(0)}% (threshold: 15%).`;
            const suggestedAction = `Trigger campus main reservoir pump transfer to refill ${buildingName} tank immediately.`;

            const existing = await Alert.findOne({ deviceId, type: 'low_tank', status: 'open' });
            if (existing) {
                existing.value = level;
                existing.whyText = whyText;
                await existing.save();
                alertsCreated.push(existing);
            } else {
                const newAlert = await Alert.create({
                    orgId,
                    buildingId: dev?.buildingId?._id || dev?.buildingId || null,
                    floor: floorLabel,
                    deviceId,
                    type: 'low_tank',
                    severity: 'critical',
                    value: level,
                    expected: expectedLvl,
                    percentOver: 0,
                    confidence: 0.98,
                    whyText,
                    suggestedAction,
                    impact: { kwh: 0, rupees: 0, co2e_kg: 0, litres: 0 },
                    status: 'open',
                    createdAt: new Date()
                });
                alertsCreated.push(newAlert);
            }
        } else {
            // Auto-resolve low tank if >= 15% for 3 consecutive points
            if (recentReadings.length >= 3) {
                const allAdequate = recentReadings.every(r => (r.tank_level_pct != null ? r.tank_level_pct : 0) >= 15);
                if (allAdequate) {
                    const openLow = await Alert.findOne({ deviceId, type: 'low_tank', status: 'open' });
                    if (openLow) {
                        openLow.status = 'resolved';
                        openLow.resolvedAt = new Date();
                        openLow.note = 'Auto-resolved: water level refilled above 15% threshold for 3 consecutive intervals.';
                        await openLow.save();
                    }
                }
            }
        }

        // Rule 2: Night flow (01:00-04:00) > 1.0 L/min for 3 consecutive points => warning ("Probable night leak")
        const isNightHour = (hour >= 1 && hour < 4);
        if (isNightHour && flow > 1.0) {
            // Check 3 consecutive points
            const isThreeConsecutive = recentReadings.length >= 3 && recentReadings.every(r => (r.flow_lpm != null ? r.flow_lpm : 0) > 1.0);
            if (isThreeConsecutive) {
                const whyText = `Probable night leak: sustained outflow of ${flow.toFixed(1)} L/min between 01:00-04:00 AM in ${buildingName} (${deviceId}) while distribution pumps are idle.`;
                const suggestedAction = `Inspect restroom flush assemblies, pipe risers, and float valves in ${buildingName}.`;
                const lossRupees = Math.round(flow * 180 * 0.018);

                const existing = await Alert.findOne({ deviceId, type: 'water_leak', status: 'open' });
                if (existing) {
                    existing.value = flow;
                    existing.whyText = whyText;
                    await existing.save();
                    alertsCreated.push(existing);
                } else {
                    const newAlert = await Alert.create({
                        orgId,
                        buildingId: dev?.buildingId?._id || dev?.buildingId || null,
                        floor: floorLabel,
                        deviceId,
                        type: 'water_leak',
                        severity: 'warning',
                        value: flow,
                        expected: 0.05,
                        percentOver: Math.round(((flow - 0.05) / 0.05) * 100),
                        confidence: 0.94,
                        whyText,
                        suggestedAction,
                        impact: { kwh: 0, rupees: lossRupees, co2e_kg: 0, litres: Math.round(flow * 180) },
                        status: 'open',
                        createdAt: new Date()
                    });
                    alertsCreated.push(newAlert);
                }
            }
        } else {
            // Auto-resolve night leak if 3 consecutive points have flow <= 1.0 L/min
            if (recentReadings.length >= 3) {
                const allLeakFree = recentReadings.every(r => (r.flow_lpm != null ? r.flow_lpm : 0) <= 1.0);
                if (allLeakFree) {
                    const openLeak = await Alert.findOne({ deviceId, type: 'water_leak', status: 'open' });
                    if (openLeak) {
                        openLeak.status = 'resolved';
                        openLeak.resolvedAt = new Date();
                        openLeak.note = 'Auto-resolved: night flow returned below 1.0 L/min for 3 consecutive intervals.';
                        await openLeak.save();
                    }
                }
            }
        }
    }

    return alertsCreated;
};
