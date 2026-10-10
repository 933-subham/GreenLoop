import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASELINE_FILE = path.join(__dirname, '../config/baseline_profiles.json');

// Ensure config dir exists
const ensureConfigDir = () => {
    const dir = path.dirname(BASELINE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Generate default baseline profile for a building type and floor
export const generateProfileForDevice = (type, buildingType = 'hostel', floor = 1) => {
    if (type === 'water') {
        const weekdayLevels = [84, 83, 83, 82, 82, 92, 86, 80, 76, 74, 73, 72, 71, 70, 69, 68, 68, 67, 65, 64, 70, 78, 82, 84];
        const weekendLevels = [84, 83, 83, 82, 82, 92, 88, 82, 78, 76, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 70, 78, 82, 84];
        const weekdayFlow = [0.03, 0.02, 0.02, 0.02, 0.03, 0.10, 1.80, 2.20, 1.50, 0.60, 0.50, 0.70, 0.80, 0.50, 0.40, 0.60, 0.70, 0.90, 2.10, 1.80, 0.80, 0.30, 0.10, 0.05];
        const weekendFlow = [0.03, 0.02, 0.02, 0.02, 0.03, 0.10, 1.20, 1.80, 1.60, 0.80, 0.70, 0.80, 0.90, 0.60, 0.50, 0.60, 0.70, 0.90, 1.90, 1.70, 0.70, 0.30, 0.10, 0.05];
        return {
            type: 'water',
            tank_level_pct: { weekday: weekdayLevels, weekend: weekendLevels },
            flow_lpm: { weekday: weekdayFlow, weekend: weekendFlow }
        };
    }

    // Power device
    let weekday = [];
    let weekend = [];

    if (buildingType === 'hostel') {
        // Hostel: low class hours (9-16), high evening (17-21)
        weekday = [
            4.8, 4.5, 4.4, 4.5, 4.8, 5.5, 12.5, 14.0, 13.0,
            6.6, 6.5, 6.4, 6.8, 6.5, 6.6, 6.8, 7.5,
            17.5, 19.5, 20.0, 19.0, 17.0, 12.0, 7.5
        ];
        weekend = [
            5.2, 4.8, 4.6, 4.6, 4.8, 5.0, 8.5, 10.5, 12.0,
            13.5, 14.0, 13.8, 14.2, 13.5, 13.8, 14.0, 15.0,
            18.5, 20.0, 20.5, 19.5, 17.5, 13.0, 8.5
        ];
    } else if (buildingType === 'academic') {
        // Academic: high during class hours (8-17), idle night/weekend
        weekday = [
            2.2, 2.0, 2.0, 2.0, 2.2, 2.8, 4.5, 8.0, 18.5,
            24.0, 25.5, 25.0, 23.5, 25.0, 24.5, 24.0, 22.0,
            14.0, 8.5, 6.0, 4.5, 3.5, 2.8, 2.4
        ];
        weekend = [
            2.0, 2.0, 2.0, 2.0, 2.0, 2.2, 2.5, 3.0, 3.5,
            4.0, 4.5, 4.2, 4.0, 4.2, 4.0, 3.8, 3.5,
            3.0, 2.8, 2.5, 2.4, 2.2, 2.0, 2.0
        ];
    } else if (buildingType === 'canteen') {
        // Canteen: meal peaks
        weekday = [
            2.0, 1.8, 1.8, 2.0, 2.5, 4.0, 8.5, 15.0, 14.0,
            8.0, 12.0, 22.0, 26.5, 25.0, 14.0, 8.0, 9.5,
            16.0, 23.0, 24.0, 21.0, 12.0, 5.0, 3.0
        ];
        weekend = [
            2.0, 1.8, 1.8, 2.0, 2.5, 3.5, 7.0, 13.0, 12.5,
            8.0, 11.0, 19.0, 23.0, 22.0, 13.0, 8.0, 9.0,
            15.0, 21.0, 22.0, 19.0, 11.0, 4.5, 2.8
        ];
    } else if (buildingType === 'pump_house') {
        // Pump House: heavy pumping morning (05-09) and evening (17-20)
        weekday = [
            1.2, 1.2, 1.2, 1.2, 1.5, 16.5, 18.0, 17.5, 16.0,
            2.5, 2.0, 2.0, 2.5, 2.0, 2.0, 2.0, 3.5,
            16.0, 18.5, 17.0, 2.5, 1.8, 1.5, 1.2
        ];
        weekend = [
            1.2, 1.2, 1.2, 1.2, 1.5, 15.0, 17.0, 16.5, 15.0,
            2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 3.0,
            15.0, 17.5, 16.0, 2.0, 1.5, 1.2, 1.2
        ];
    } else if (buildingType === 'street_lighting') {
        // Street Lighting: evening/night ON (18:00 to 06:00), day OFF (0 kW)
        weekday = [
            8.5, 8.5, 8.5, 8.5, 8.5, 4.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            3.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5
        ];
        weekend = [
            8.5, 8.5, 8.5, 8.5, 8.5, 4.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            3.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5
        ];
    } else if (buildingType === 'hospital_icu') {
        weekday = [
            26.5, 26.0, 25.8, 26.0, 26.2, 27.5, 30.0, 32.5, 34.0,
            33.5, 33.0, 32.5, 32.0, 33.0, 33.5, 33.0, 32.5,
            31.0, 30.5, 30.0, 29.5, 28.5, 27.5, 27.0
        ];
        weekend = [
            26.0, 25.8, 25.5, 25.8, 26.0, 27.0, 29.5, 31.0, 32.5,
            32.0, 31.5, 31.0, 31.0, 31.5, 32.0, 31.5, 31.0,
            30.0, 29.5, 29.0, 28.5, 28.0, 27.0, 26.5
        ];
    } else if (buildingType === 'hospital_emergency') {
        weekday = [
            18.5, 18.0, 17.5, 17.5, 18.0, 19.5, 22.0, 24.5, 26.0,
            25.0, 24.5, 24.0, 23.5, 24.5, 25.0, 25.5, 26.5,
            27.5, 28.0, 27.5, 26.0, 24.0, 21.5, 19.5
        ];
        weekend = [
            19.0, 18.5, 18.0, 18.0, 18.5, 20.0, 23.0, 25.5, 27.0,
            26.5, 26.0, 25.5, 25.0, 26.0, 26.5, 27.0, 28.0,
            29.0, 29.5, 29.0, 27.5, 25.5, 23.0, 20.5
        ];
    } else if (buildingType === 'hospital_opd') {
        weekday = [
            4.5, 4.2, 4.0, 4.0, 4.2, 5.0, 9.5, 18.0, 26.5,
            28.0, 27.5, 27.0, 24.0, 26.5, 27.0, 26.0, 22.5,
            16.0, 10.5, 7.5, 6.0, 5.2, 4.8, 4.5
        ];
        weekend = [
            4.2, 4.0, 4.0, 4.0, 4.0, 4.5, 7.0, 13.5, 18.0,
            19.5, 19.0, 18.5, 15.0, 16.0, 15.5, 14.0, 11.5,
            8.0, 6.5, 5.5, 5.0, 4.5, 4.2, 4.0
        ];
    } else if (buildingType === 'hospital_inpatient') {
        weekday = [
            12.5, 12.0, 11.8, 12.0, 12.5, 14.0, 18.5, 21.0, 20.5,
            18.5, 18.0, 17.5, 18.0, 18.5, 18.0, 18.5, 19.5,
            21.5, 22.0, 21.5, 19.5, 17.0, 14.5, 13.0
        ];
        weekend = [
            13.0, 12.5, 12.0, 12.0, 12.5, 13.5, 17.0, 19.5, 20.0,
            19.0, 18.5, 18.0, 18.5, 19.0, 19.0, 19.5, 20.5,
            22.0, 22.5, 22.0, 20.5, 18.0, 15.0, 13.5
        ];
    } else if (buildingType === 'hospital_admin') {
        weekday = [
            5.5, 5.2, 5.0, 5.0, 5.2, 6.0, 8.5, 12.0, 15.5,
            16.5, 16.0, 15.5, 14.0, 15.5, 16.0, 15.0, 13.5,
            11.0, 9.5, 8.0, 7.0, 6.5, 6.0, 5.8
        ];
        weekend = [
            5.0, 4.8, 4.8, 4.8, 5.0, 5.5, 7.0, 9.5, 11.0,
            11.5, 11.0, 10.5, 9.5, 10.0, 10.5, 10.0, 9.0,
            8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.2
        ];
    } else {
        // Default / Library / Administrative / Other
        weekday = [
            2.5, 2.2, 2.0, 2.0, 2.2, 3.0, 5.0, 8.5, 14.0,
            16.5, 17.0, 16.5, 15.5, 16.5, 16.0, 15.5, 14.0,
            11.0, 8.0, 6.0, 4.5, 3.5, 3.0, 2.8
        ];
        weekend = [
            2.0, 2.0, 2.0, 2.0, 2.0, 2.2, 3.0, 5.0, 7.5,
            9.0, 9.5, 9.0, 8.5, 9.0, 8.8, 8.5, 7.5,
            6.0, 4.5, 3.5, 3.0, 2.5, 2.2, 2.0
        ];
    }

    return { type: 'power', weekday, weekend };
};

// Load all baseline profiles
export const loadAllProfiles = () => {
    ensureConfigDir();
    if (!fs.existsSync(BASELINE_FILE)) {
        return {};
    }
    try {
        const raw = fs.readFileSync(BASELINE_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

// Save a profile for a device
export const saveProfile = (deviceId, profile) => {
    ensureConfigDir();
    const all = loadAllProfiles();
    all[deviceId.toUpperCase().trim()] = profile;
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(all, null, 2), 'utf-8');
    return profile;
};

// Generate and save baseline for device
export const generateBaselineForDevice = (deviceId, buildingType = 'hostel', type = 'power') => {
    const profile = generateProfileForDevice(type, buildingType);
    return saveProfile(deviceId, profile);
};

// Get expected value for any device at specific hour and weekend flag
export const getExpectedBaseline = (deviceId, hour, isWeekend = false, metric = 'kw') => {
    const all = loadAllProfiles();
    const dId = deviceId.toUpperCase().trim();
    let profile = all[dId];

    if (!profile) {
        // Auto-generate profile based on naming convention
        let bType = 'hostel';
        if (dId.includes('ACAD') || dId.includes('AB')) bType = 'academic';
        else if (dId.includes('CANT')) bType = 'canteen';
        else if (dId.includes('LIB') || dId.includes('CL')) bType = 'library';
        else if (dId.includes('PH')) bType = 'pump_house';
        else if (dId.includes('SL')) bType = 'street_lighting';
        else if (dId.includes('ICU')) bType = 'hospital_icu';
        else if (dId.includes('EMG')) bType = 'hospital_emergency';
        else if (dId.includes('OPD')) bType = 'hospital_opd';
        else if (dId.includes('INP')) bType = 'hospital_inpatient';
        else if (dId.includes('ADMIN')) bType = 'hospital_admin';

        const isWater = dId.startsWith('WTR');
        profile = generateProfileForDevice(isWater ? 'water' : 'power', bType, 1);
        saveProfile(dId, profile);
    }

    const h = Math.max(0, Math.min(23, Math.floor(hour)));
    const key = isWeekend ? 'weekend' : 'weekday';

    if (profile.type === 'water') {
        if (metric === 'flow_lpm') {
            return profile.flow_lpm?.[key]?.[h] ?? 0.03;
        }
        return profile.tank_level_pct?.[key]?.[h] ?? 75.0;
    }

    return profile[key]?.[h] ?? 11.8;
};
