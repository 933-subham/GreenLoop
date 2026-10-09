import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- RUNNING PHASE 2 VERIFICATION TESTS ---');

// 1. Check AuthModal.jsx
const authModalPath = path.join(__dirname, '../src/components/AuthModal.jsx');
const authModalCode = fs.readFileSync(authModalPath, 'utf8');

if (authModalCode.includes('district_hospital') || authModalCode.includes('industrial_estate')) {
    throw new Error('AuthModal still contains hospital or industry demo accounts!');
}
if (!authModalCode.includes('bput_college')) {
    throw new Error('AuthModal must contain BPUT demo account!');
}
console.log('✓ AuthModal: Only BPUT demo account present, hospital/industry removed');

// 2. Check FacilitySetupTab.jsx
const facilitySetupPath = path.join(__dirname, '../src/components/FacilitySetupTab.jsx');
const facilitySetupCode = fs.readFileSync(facilitySetupPath, 'utf8');

if (facilitySetupCode.includes('handleApplyTemplate') || facilitySetupCode.includes('Facility Template Quick-Start')) {
    throw new Error('FacilitySetupTab still contains template switcher!');
}
const requiredBuildingTypes = [
    'hostel', 'academic', 'canteen', 'library', 'administrative',
    'sports', 'pump_house', 'street_lighting', 'other'
];
for (const bt of requiredBuildingTypes) {
    if (!facilitySetupCode.includes(`value="${bt}"`)) {
        throw new Error(`FacilitySetupTab missing building type option: ${bt}`);
    }
}
console.log('✓ FacilitySetupTab: Template switcher removed, all 9 specified building types present');

// 3. Check OrgPortalApp.jsx
const orgPortalPath = path.join(__dirname, '../src/apps/OrgPortalApp.jsx');
const orgPortalCode = fs.readFileSync(orgPortalPath, 'utf8');

if (orgPortalCode.includes('>Simulate Offline<') || orgPortalCode.includes('Simulate Offline</button>')) {
    throw new Error('OrgPortalApp still contains Simulate Offline button!');
}
if (!orgPortalCode.includes('Demo uses simulated sensor data')) {
    throw new Error('OrgPortalApp missing footer notice: Demo uses simulated sensor data');
}
console.log('✓ OrgPortalApp: Simulate Offline button removed, demo footer note preserved');

// 4. Check SqliteOfflineModal.jsx
const sqliteModalPath = path.join(__dirname, '../src/components/SqliteOfflineModal.jsx');
const sqliteModalCode = fs.readFileSync(sqliteModalPath, 'utf8');

if (sqliteModalCode.includes('Simulate Offline Mode')) {
    throw new Error('SqliteOfflineModal still contains Simulate Offline Mode button!');
}
console.log('✓ SqliteOfflineModal: Offline simulation toggle button removed');

console.log('🎉 ALL PHASE 2 TESTS PASSED SUCCESSFULLY!');
