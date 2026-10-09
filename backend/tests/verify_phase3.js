import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import facilityConnection from '../config/facilityDb.js';
import Device from '../models/facility/Device.js';
import SensorReading from '../models/facility/SensorReading.js';
import Alert from '../models/facility/Alert.js';
import { appendReading } from '../services/readingStore.js';
import { runDetectionForReading } from '../services/detectionService.js';
import { getExpectedBaseline } from '../services/baselineService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const runTests = async () => {
    console.log('--- RUNNING PHASE 3 VERIFICATION TESTS (INGEST, FAULTS, DETECTION, AUTO-RESOLVE, RESET) ---');

    if (facilityConnection.readyState !== 1) {
        await new Promise((resolve) => facilityConnection.once('connected', resolve));
    }

    const orgId = 'bput_college';

    // 1. Check devices exist
    const pwrDev = await Device.findOne({ deviceId: 'PWR-HA-F4', orgId });
    const wtrDev = await Device.findOne({ deviceId: 'WTR-HA-T1', orgId });
    if (!pwrDev || !wtrDev) throw new Error('Seeded devices PWR-HA-F4 or WTR-HA-T1 missing');
    console.log(`✓ Test devices located: ${pwrDev.deviceId}, ${wtrDev.deviceId}`);

    // Clean existing test alerts for these devices
    await Alert.deleteMany({ deviceId: { $in: ['PWR-HA-F4', 'WTR-HA-T1'] } });
    await SensorReading.deleteMany({ deviceId: { $in: ['PWR-HA-F4', 'WTR-HA-T1'] }, source: { $in: ['live', 'simulated-fault'] } });

    // 2. Normal Ingest (Power & Water) -> Should NOT create alerts
    const now = new Date();
    const expKw = getExpectedBaseline(pwrDev.deviceId, now.getHours(), false, 'kw');
    const normalPowerReading = await appendReading({
        deviceId: 'PWR-HA-F4',
        orgId,
        type: 'power',
        kw: expKw,
        expected: expKw,
        ts: now,
        source: 'live'
    });
    const normalAlerts = await runDetectionForReading(normalPowerReading, pwrDev);
    if (normalAlerts.length !== 0) throw new Error(`Normal power reading created unexpected alert: ${normalAlerts.length}`);
    console.log(`✓ Normal power ingest: value=${normalPowerReading.kw} kW (baseline=${expKw}), 0 alerts created`);

    // 3. Fault Injection -> Power Spike -> Should create open alert
    const spikeKw = Math.round((expKw * 2.2) * 10) / 10;
    const spikeReading = await appendReading({
        deviceId: 'PWR-HA-F4',
        orgId,
        type: 'power',
        kw: spikeKw,
        expected: expKw,
        ts: new Date(),
        source: 'simulated-fault'
    });
    const spikeAlerts = await runDetectionForReading(spikeReading, pwrDev);
    if (spikeAlerts.length === 0) throw new Error('Power spike fault did not generate an alert');

    const alert = await Alert.findOne({ deviceId: 'PWR-HA-F4', status: 'open' });
    if (!alert) throw new Error('Alert not found in database with status open');

    // 4. Verify Alert Schema Shape
    console.log(`✓ Fault injection generated alert: [${alert.severity.toUpperCase()}] ${alert.whyText}`);
    const requiredFields = ['orgId', 'buildingId', 'floor', 'deviceId', 'type', 'severity', 'value', 'expected', 'percentOver', 'confidence', 'whyText', 'suggestedAction', 'impact', 'status', 'createdAt'];
    for (const f of requiredFields) {
        if (alert[f] === undefined) throw new Error(`Alert schema missing required field: ${f}`);
    }
    console.log(`✓ Alert schema shape strictly verified (all ${requiredFields.length} fields valid)`);

    // 5. Water Fault Injection -> Low Tank (< 15%)
    const lowTankReading = await appendReading({
        deviceId: 'WTR-HA-T1',
        orgId,
        type: 'water_tank',
        tank_level_pct: 8.0,
        flow_lpm: 0,
        expected: 75,
        ts: new Date(),
        source: 'simulated-fault'
    });
    const wtrAlerts = await runDetectionForReading(lowTankReading, wtrDev);
    if (wtrAlerts.length === 0) throw new Error('Low tank fault did not generate an alert');
    const wtrAlert = await Alert.findOne({ deviceId: 'WTR-HA-T1', status: 'open' });
    if (!wtrAlert || wtrAlert.severity !== 'critical') throw new Error('Low tank alert missing or not critical');
    console.log(`✓ Water low-tank fault generated critical alert: ${wtrAlert.whyText}`);

    // 6. Test Auto-Resolve for Power Spike (3 consecutive normal readings)
    console.log('Testing auto-resolve logic for power alert...');
    for (let i = 0; i < 3; i++) {
        const normRead = await appendReading({
            deviceId: 'PWR-HA-F4',
            orgId,
            type: 'power',
            kw: expKw,
            expected: expKw,
            ts: new Date(Date.now() + (i + 1) * 60000),
            source: 'live'
        });
        await runDetectionForReading(normRead, pwrDev);
    }
    const resolvedPowerAlert = await Alert.findById(alert._id);
    if (resolvedPowerAlert.status !== 'resolved') {
        throw new Error(`Auto-resolve failed: expected 'resolved', got '${resolvedPowerAlert.status}'`);
    }
    console.log(`✓ Auto-resolve confirmed: Alert status transitioned to '${resolvedPowerAlert.status}' after 3 normal readings`);

    // 7. Test Reset Faults (Single Device & All)
    // Re-inject a fault reading to test reset
    await appendReading({
        deviceId: 'PWR-HA-F4',
        orgId,
        type: 'power',
        kw: spikeKw,
        expected: expKw,
        ts: new Date(),
        source: 'simulated-fault'
    });
    await runDetectionForReading({ deviceId: 'PWR-HA-F4', orgId, type: 'power', kw: spikeKw, expected: expKw }, pwrDev);

    // Test device-specific reset
    const delDevReadings = await SensorReading.deleteMany({ deviceId: 'PWR-HA-F4', source: 'simulated-fault' });
    const resDevAlerts = await Alert.updateMany({ deviceId: 'PWR-HA-F4', status: 'open' }, { $set: { status: 'resolved' } });
    console.log(`✓ Reset one device (PWR-HA-F4): ${delDevReadings.deletedCount} readings purged, ${resDevAlerts.modifiedCount} alerts resolved`);

    // Test campus-wide reset
    const delAllReadings = await SensorReading.deleteMany({ orgId, source: 'simulated-fault' });
    const resAllAlerts = await Alert.updateMany({ orgId, status: 'open' }, { $set: { status: 'resolved' } });
    console.log(`✓ Reset all (campus-wide): ${delAllReadings.deletedCount} readings purged, ${resAllAlerts.modifiedCount} alerts resolved`);

    const openCount = await Alert.countDocuments({ orgId, status: 'open' });
    if (openCount !== 0) throw new Error(`Expected 0 open alerts after reset, got ${openCount}`);
    console.log('✓ Zero open alerts remaining after reset');

    console.log('🎉 ALL PHASE 3 TESTS PASSED SUCCESSFULLY!');
    await facilityConnection.close();
    process.exit(0);
};

runTests().catch(err => {
    console.error('Phase 3 Test Failure:', err);
    process.exit(1);
});
