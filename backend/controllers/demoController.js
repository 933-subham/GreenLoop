import Facility from '../models/Facility.js';
import Bin from '../models/Bin.js';
import Alert from '../models/Alert.js';
import SensorReading from '../models/SensorReading.js';

export const getDemoStatus = async (req, res) => {
    try {
        const facility = await Facility.findOne({ facilityId: 'bput_college' });
        res.json({
            faults: facility ? facility.activeDemoFaults : {
                floor3Surge: true,
                tankALeak: true,
                bin4Overflow: true,
                cameraMiss: false
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const injectFloor3Surge = async (req, res) => {
    try {
        await Facility.findOneAndUpdate(
            { facilityId: 'bput_college' },
            { $set: { 'activeDemoFaults.floor3Surge': true } }
        );

        // Insert new high surge reading for Floor 3
        await SensorReading.create({
            facilityId: 'bput_college',
            module: 'power',
            zoneId: 'Floor-3',
            timestamp: new Date(),
            value: 29.8, // 45% above expected 14.5 kW
            isClassHours: true,
            isWeekend: false,
            temperature: 31.5,
            qualityFlag: 'injected_fault'
        });

        // Ensure alert exists
        await Alert.findOneAndUpdate(
            { facilityId: 'bput_college', zoneId: 'Floor-3', module: 'power' },
            {
                severity: 'high',
                status: 'open',
                title: 'High Power Surge on Floor 3 during Class Hours (29.8 kW)',
                'why.actualValue': '29.8 kW',
                'why.statisticalZScore': 4.35,
                'why.explanation': 'Class hours active (11:00 AM). Floor 3 drawing +15.3 kW above normal baseline. Likely hostel coolers or equipment left running.',
                'impact.kwh': 38.4,
                'impact.rupees': 288,
                'impact.co2e_kg': 27.2
            },
            { upsert: true }
        );

        res.json({ message: '🚨 Injected Floor 3 Class-Hour Power Surge Fault!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const injectTankALeak = async (req, res) => {
    try {
        await Facility.findOneAndUpdate(
            { facilityId: 'bput_college' },
            { $set: { 'activeDemoFaults.tankALeak': true } }
        );

        // Update alert
        await Alert.findOneAndUpdate(
            { facilityId: 'bput_college', zoneId: 'Tank-A', module: 'water' },
            {
                severity: 'high',
                status: 'open',
                title: 'Continuous Night Water Leak in Tank A (Overhead)',
                'why.actualValue': 'Loss 75 L/hr',
                'why.statisticalZScore': 3.9,
                'why.explanation': 'Continuous tank level drop between 01:00 - 04:00 AM with pump inactive.',
                'impact.kl': 1.8,
                'impact.rupees': 240
            },
            { upsert: true }
        );

        res.json({ message: '💧 Injected Tank A Night-Flow Water Leak Fault!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const injectBin4Overflow = async (req, res) => {
    try {
        await Facility.findOneAndUpdate(
            { facilityId: 'bput_college' },
            { $set: { 'activeDemoFaults.bin4Overflow': true } }
        );

        // Set Bin 4 to 92% full and critical urgency
        await Bin.findOneAndUpdate(
            { facilityId: 'bput_college', binCode: 'BIN-04' },
            {
                currentFillPct: 92.0,
                urgency: 'critical',
                hoursToFull: 1.5,
                verificationStatus: 'unverified'
            }
        );

        res.json({ message: '🗑️ Injected Bin 4 Overflow (92% Fill, 1.5h to Full)!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const injectCameraMiss = async (req, res) => {
    try {
        const facility = await Facility.findOne({ facilityId: 'bput_college' });
        const current = facility ? facility.activeDemoFaults.cameraMiss : false;
        await Facility.findOneAndUpdate(
            { facilityId: 'bput_college' },
            { $set: { 'activeDemoFaults.cameraMiss': !current } }
        );
        res.json({ message: `Simulated Camera Vision Miss toggled: ${!current}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetDemo = async (req, res) => {
    try {
        await Facility.findOneAndUpdate(
            { facilityId: 'bput_college' },
            {
                $set: {
                    activeDemoFaults: {
                        floor3Surge: false,
                        tankALeak: false,
                        bin4Overflow: false,
                        cameraMiss: false
                    }
                }
            }
        );

        // Reset Bin 4
        await Bin.findOneAndUpdate(
            { facilityId: 'bput_college', binCode: 'BIN-04' },
            {
                currentFillPct: 45.0,
                urgency: 'low',
                hoursToFull: 18.0,
                verificationStatus: 'unverified'
            }
        );

        // Auto close active alerts
        await Alert.updateMany(
            { facilityId: 'bput_college' },
            { $set: { status: 'resolved' } }
        );

        res.json({ message: '✅ All Demo Faults Reset to Clean Baseline!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
