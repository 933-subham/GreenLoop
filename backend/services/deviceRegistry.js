import Device from '../models/Device.js';

export const SEED_DEVICES = [
    { deviceId: 'PWR-F1', type: 'power', zone: 'Floor-1', label: 'Hostel Ground Floor (Rooms 1-30)', facilityId: 'bput_college' },
    { deviceId: 'PWR-F2', type: 'power', zone: 'Floor-2', label: 'Hostel Floor 2 (Rooms 101-130)', facilityId: 'bput_college' },
    { deviceId: 'PWR-F3', type: 'power', zone: 'Floor-3', label: 'Hostel Floor 3 (Rooms 201-230)', facilityId: 'bput_college' },
    { deviceId: 'PWR-F4', type: 'power', zone: 'Floor-4', label: 'Hostel Floor 4 (Rooms 301-330)', facilityId: 'bput_college' },
    { deviceId: 'PWR-ACAD', type: 'power', zone: 'Academic-Block', label: 'Main Academic Block Substation', facilityId: 'bput_college' },
    { deviceId: 'WTR-TA', type: 'water', zone: 'Tank-A', label: 'Hostel Overhead Tank A (10,000 L)', facilityId: 'bput_college' },
    { deviceId: 'WTR-TB', type: 'water', zone: 'Tank-B', label: 'Campus Ground Water Sump B (25,000 L)', facilityId: 'bput_college' }
];

export const initDeviceRegistry = async () => {
    try {
        for (const dev of SEED_DEVICES) {
            await Device.findOneAndUpdate(
                { deviceId: dev.deviceId },
                { $setOnInsert: dev },
                { upsert: true, new: true }
            );
        }
        console.log('✓ Device Registry synchronized (7 default sensors ready)');
    } catch (err) {
        console.error('Device registry init error:', err.message);
    }
};
