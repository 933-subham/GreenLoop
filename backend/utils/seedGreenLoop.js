import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Facility from '../models/Facility.js';
import SensorReading from '../models/SensorReading.js';
import Bin from '../models/Bin.js';
import Alert from '../models/Alert.js';
import PickupRequest from '../models/PickupRequest.js';
import Partner from '../models/Partner.js';
import InternalReport from '../models/InternalReport.js';
import Device from '../models/Device.js';
import Building from '../models/Building.js';
import { seedCampusHierarchy } from '../services/campusSeeder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecocity_greenloop';

const seedDatabase = async () => {
    try {
        console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected for GreenLoop Seeding 🌱');

        // Clear existing facility data
        await Facility.deleteMany({});
        await SensorReading.deleteMany({});
        await Bin.deleteMany({});
        await Alert.deleteMany({});
        await PickupRequest.deleteMany({});

        // 1. Seed Facilities across 4 Indian Institution Templates
        console.log('Seeding 4 Facility Templates (College, Hospital, Industry, Municipal)...');
        const facilities = [
            {
                facilityId: 'bput_college',
                name: 'BPUT University & Engineering College Campus',
                facilityType: 'engineering_college',
                location: {
                    lat: 22.2604,
                    lng: 84.8536,
                    address: 'BPUT Campus, Chhend Colony, Rourkela, Odisha 769015',
                    city: 'Rourkela',
                    state: 'Odisha'
                },
                tariffInr: 7.50, // Higher Education Tariff
                gridEmissionFactor: 0.71, // CEA India grid factor
                waterCostPerKl: 18.0,
                sustainabilityScore: 82.4,
                scoreWeights: { power: 0.35, water: 0.25, waste: 0.25, air: 0.15 },
                zones: [
                    { id: 'Floor-1', name: 'Hostel Ground Floor (Common Area & Dining)', type: 'hostel_floor' },
                    { id: 'Floor-2', name: 'Hostel First Floor (Rooms 101-130)', type: 'hostel_floor' },
                    { id: 'Floor-3', name: 'Hostel Second Floor (Rooms 201-230)', type: 'hostel_floor' },
                    { id: 'Floor-4', name: 'Hostel Third Floor (Rooms 301-330)', type: 'hostel_floor' },
                    { id: 'Tank-A', name: 'Hostel Overhead Water Tank (10,000 L)', type: 'water_tank' },
                    { id: 'Tank-B', name: 'Campus Ground Water Sump (25,000 L)', type: 'water_tank' },
                    { id: 'Canteen-Area', name: 'Central Food Court & Mess', type: 'canteen' },
                    { id: 'Academic-Block', name: 'Main Engineering Academic Block', type: 'academic_block' }
                ],
                activeDemoFaults: {
                    floor3Surge: true,
                    tankALeak: true,
                    bin4Overflow: true,
                    cameraMiss: false
                }
            },
            {
                facilityId: 'district_hospital',
                name: 'Rourkela District General Hospital (DGH)',
                facilityType: 'government_hospital',
                location: {
                    lat: 22.2215,
                    lng: 84.8620,
                    address: 'Panposh Road, Civil Township, Rourkela, Odisha',
                    city: 'Rourkela',
                    state: 'Odisha'
                },
                tariffInr: 6.80, // Essential Public Utility Tariff
                gridEmissionFactor: 0.71,
                waterCostPerKl: 15.0,
                sustainabilityScore: 76.2,
                scoreWeights: { power: 0.40, water: 0.20, waste: 0.30, air: 0.10 },
                zones: [
                    { id: 'ICU-Ward', name: 'Intensive Care Unit (24/7 Priority)', type: 'icu_ward' },
                    { id: 'OT-Complex', name: 'Modular Operation Theater Complex', type: 'icu_ward' },
                    { id: 'Tank-Chiller', name: 'Medical Chiller & HVAC Water Tank', type: 'water_tank' },
                    { id: 'Biomedical-Bin-Area', name: 'Bio-Medical Waste Storage Hub', type: 'bin_area' }
                ]
            },
            {
                facilityId: 'industrial_estate',
                name: 'Rourkela Steel & Industrial Estate Complex',
                facilityType: 'industrial_estate',
                location: {
                    lat: 22.2045,
                    lng: 84.8821,
                    address: 'Sector 19 Industrial Area, Rourkela, Odisha',
                    city: 'Rourkela',
                    state: 'Odisha'
                },
                tariffInr: 8.90, // HT Industrial Tariff
                gridEmissionFactor: 0.75,
                waterCostPerKl: 24.0,
                sustainabilityScore: 69.8,
                scoreWeights: { power: 0.45, water: 0.25, waste: 0.15, air: 0.15 },
                zones: [
                    { id: 'Furnace-Bay', name: 'Induction Furnace & Smelting Line', type: 'machinery_bay' },
                    { id: 'ETP-Clarifier', name: 'Effluent Treatment Plant (ETP) Sump', type: 'water_tank' },
                    { id: 'Hazardous-Scrap', name: 'Heavy Scrap & Slag Yard', type: 'bin_area' }
                ]
            },
            {
                facilityId: 'municipal_hq',
                name: 'Rourkela Municipal Corporation (RMC) Civic Center',
                facilityType: 'municipal_facility',
                location: {
                    lat: 22.2450,
                    lng: 84.8690,
                    address: 'Udit Nagar, Rourkela, Odisha 769012',
                    city: 'Rourkela',
                    state: 'Odisha'
                },
                tariffInr: 7.20,
                gridEmissionFactor: 0.71,
                waterCostPerKl: 18.0,
                sustainabilityScore: 84.1,
                scoreWeights: { power: 0.30, water: 0.25, waste: 0.35, air: 0.10 },
                zones: [
                    { id: 'Civic-Admin', name: 'Municipal Head Office & Server Room', type: 'civic_center' },
                    { id: 'Secondary-Dump', name: 'RMC Secondary Sorting & Compactor Depot', type: 'bin_area' }
                ]
            }
        ];
        await Facility.insertMany(facilities);

        // 2. Seed 12 Smart Bins for BPUT Campus
        console.log('Seeding 12 Smart Bins with GPS and AI cameras...');
        const bins = [
            { binCode: 'BIN-01', name: 'Hostel Block A Entry', zoneId: 'Floor-1', lat: 22.2610, lng: 84.8540, currentFillPct: 52.0, fillRatePerHour: 2.1, hoursToFull: 22.8, urgency: 'low', wasteType: 'Mixed' },
            { binCode: 'BIN-02', name: 'Hostel Block B Courtyard', zoneId: 'Floor-1', lat: 22.2618, lng: 84.8545, currentFillPct: 38.0, fillRatePerHour: 1.8, hoursToFull: 34.4, urgency: 'low', wasteType: 'Recyclable' },
            { binCode: 'BIN-03', name: 'Academic Block 1 Lobby', zoneId: 'Academic-Block', lat: 22.2600, lng: 84.8530, currentFillPct: 68.0, fillRatePerHour: 3.5, hoursToFull: 9.1, urgency: 'medium', wasteType: 'Recyclable' },
            { binCode: 'BIN-04', name: 'Central Canteen Food Court', zoneId: 'Canteen-Area', lat: 22.2595, lng: 84.8525, currentFillPct: 92.0, fillRatePerHour: 8.2, hoursToFull: 1.5, urgency: 'critical', wasteType: 'Organic', verificationStatus: 'unverified' },
            { binCode: 'BIN-05', name: 'Central Library Garden', zoneId: 'Academic-Block', lat: 22.2608, lng: 84.8520, currentFillPct: 32.0, fillRatePerHour: 1.2, hoursToFull: 56.6, urgency: 'low', wasteType: 'Mixed' },
            { binCode: 'BIN-06', name: 'Mechanical Workshop Bay', zoneId: 'Academic-Block', lat: 22.2588, lng: 84.8538, currentFillPct: 74.0, fillRatePerHour: 4.1, hoursToFull: 6.3, urgency: 'medium', wasteType: 'Hazardous' },
            { binCode: 'BIN-07', name: 'Sports Complex Pavillion', zoneId: 'Academic-Block', lat: 22.2625, lng: 84.8550, currentFillPct: 24.0, fillRatePerHour: 1.0, hoursToFull: 76.0, urgency: 'low', wasteType: 'Mixed' },
            { binCode: 'BIN-08', name: 'Admin Block Porch', zoneId: 'Academic-Block', lat: 22.2605, lng: 84.8532, currentFillPct: 45.0, fillRatePerHour: 2.0, hoursToFull: 27.5, urgency: 'low', wasteType: 'Recyclable' },
            { binCode: 'BIN-09', name: 'Main Campus Entry Gate', zoneId: 'Academic-Block', lat: 22.2575, lng: 84.8515, currentFillPct: 81.0, fillRatePerHour: 5.0, hoursToFull: 3.8, urgency: 'medium', wasteType: 'Mixed' },
            { binCode: 'BIN-10', name: 'Auditorium Concourse', zoneId: 'Academic-Block', lat: 22.2612, lng: 84.8555, currentFillPct: 18.0, fillRatePerHour: 0.8, hoursToFull: 95.0, urgency: 'low', wasteType: 'Recyclable' },
            { binCode: 'BIN-11', name: 'Student Activity Center (SAC)', zoneId: 'Academic-Block', lat: 22.2602, lng: 84.8542, currentFillPct: 58.0, fillRatePerHour: 2.8, hoursToFull: 15.0, urgency: 'low', wasteType: 'Mixed' },
            { binCode: 'BIN-12', name: 'Faculty Residential Quarters', zoneId: 'Academic-Block', lat: 22.2630, lng: 84.8560, currentFillPct: 42.0, fillRatePerHour: 1.5, hoursToFull: 38.6, urgency: 'low', wasteType: 'Organic' }
        ];

        const binDocs = bins.map(b => ({
            ...b,
            facilityId: 'bput_college',
            capacityL: 240,
            lastSnapshotUrl: '/uploads/sample_bin.jpg',
            cameraStatus: 'online',
            modelMode: 'simulated'
        }));
        await Bin.insertMany(binDocs);

        // 2b & 3. Seed Campus Hierarchy (Buildings, Devices, 3-day 5-min resolution normal history)
        await seedCampusHierarchy('bput_college', true);

        // 5. Seed Users with Known Passwords
        console.log('Seeding multi-role user accounts (password: Demo@1234)...');
        const demoUsers = [
            { name: 'Dr. S. K. Patnaik', email: 'head@college.demo', password: 'Demo@1234', role: 'admin', cityName: 'Rourkela', state: 'Odisha' },
            { name: 'Mr. Manoj Dash (Warden)', email: 'warden@college.demo', password: 'Demo@1234', role: 'warden', cityName: 'Rourkela', state: 'Odisha' },
            { name: 'Er. Ananya Mohapatra', email: 'officer@college.demo', password: 'Demo@1234', role: 'sustainability_officer', cityName: 'Rourkela', state: 'Odisha' },
            { name: 'Rourkela Municipal Comm.', email: 'admin@municipal.demo', password: 'Demo@1234', role: 'municipality_admin', cityName: 'Rourkela', state: 'Odisha' },
            { name: 'Ramesh Kumar (Driver)', email: 'driver1@municipal.demo', password: 'Demo@1234', role: 'driver', cityName: 'Rourkela', state: 'Odisha', status: 'active' },
            { name: 'Ayush Mohanty (Student)', email: 'student@college.demo', password: 'Demo@1234', role: 'citizen', cityName: 'Rourkela', state: 'Odisha', ecoCoins: 120 },
            { name: 'Dr. B. K. Behera (DGH)', email: 'head@hospital.demo', password: 'Demo@1234', role: 'admin', cityName: 'Rourkela', state: 'Odisha' },
            { name: 'Er. R. K. Singhania (Plant)', email: 'head@industry.demo', password: 'Demo@1234', role: 'admin', cityName: 'Rourkela', state: 'Odisha' }
        ];

        for (const u of demoUsers) {
            const existing = await User.findOne({ email: u.email });
            if (!existing) {
                await User.create(u);
            }
        }

        // 6. Seed Municipal Collection Partners (Approved & Pending Approval)
        console.log('Seeding Municipal Partners...');
        await Partner.deleteMany({});
        const partners = [
            {
                name: 'Driver Ramesh Kumar',
                agencyName: 'Maa Tarini Clean Logistics',
                email: 'ramesh.waste@gmail.com',
                phone: '+91 94371 88201',
                vehicleNumber: 'Tata Ace (OD-14-K-4921)',
                vehicleType: 'Tata Ace Mini-Truck',
                zone: 'Zone 1 - Chhend Colony & BPUT',
                capacityKg: 1500,
                currentLoadKg: 450,
                status: 'approved',
                completedTasks: 42,
                activeTasks: 1,
                currentLocation: { lat: 22.2585, lng: 84.8480 },
                approvedAt: new Date(Date.now() - 7 * 86400000)
            },
            {
                name: 'Driver Suresh Nayak',
                agencyName: 'Rourkela Green Transport Ltd',
                email: 'suresh.nayak@cleanodisha.org',
                phone: '+91 98610 55412',
                vehicleNumber: 'Eicher Pro Compactor (OD-14-H-1082)',
                vehicleType: 'Compactor Truck',
                zone: 'Zone 2 - Civil Township & Panposh',
                capacityKg: 3500,
                currentLoadKg: 1200,
                status: 'approved',
                completedTasks: 28,
                activeTasks: 0,
                currentLocation: { lat: 22.2280, lng: 84.8550 },
                approvedAt: new Date(Date.now() - 14 * 86400000)
            },
            {
                name: 'Driver Amit Mohapatra (New Applicant)',
                agencyName: 'Steel City Swachhata Services',
                email: 'amit.swachh@gmail.com',
                phone: '+91 79782 12093',
                vehicleNumber: 'Mahindra Bolero Maxi-Truck (OD-14-M-3344)',
                vehicleType: 'Hydraulic Tipper',
                zone: 'Zone 3 - Steel City & Sector 4',
                capacityKg: 2000,
                currentLoadKg: 0,
                status: 'pending',
                completedTasks: 0,
                activeTasks: 0,
                currentLocation: { lat: 22.2150, lng: 84.8790 }
            }
        ];
        await Partner.insertMany(partners);

        // 7. Seed Internal Campus Waste Reports
        console.log('Seeding Internal Campus Waste Reports...');
        await InternalReport.deleteMany({});
        const internalReports = [
            {
                facilityId: 'bput_college',
                reporterName: 'Aniket Verma (B.Tech CSE, 3rd Year)',
                reporterRole: 'student',
                locationName: 'Hostel Block A Courtyard Benches',
                wasteType: 'Dry / Plastic Waste',
                description: 'Multiple discarded cold drink bottles and snack packaging left after evening study group.',
                imageUrl: 'https://images.unsplash.com/photo-1611288875785-f203874317f2?w=500&auto=format&fit=crop&q=60',
                status: 'pending'
            },
            {
                facilityId: 'bput_college',
                reporterName: 'Dr. Debabrata Roy (Faculty)',
                reporterRole: 'faculty',
                locationName: 'Behind Mechanical Workshop Block',
                wasteType: 'Dry / Plastic Waste',
                description: 'Scrap packing material from newly arrived lab equipment.',
                imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
                status: 'assigned_to_janitor',
                assignedJanitorName: 'Janitor Raghu Behera'
            }
        ];
        await InternalReport.insertMany(internalReports);

        console.log('✅ GREENLOOP SEEDING COMPLETED SUCCESSFULLY!');

        console.log('---------------------------------------------------------');
        console.log('Seeded Accounts (Password: Demo@1234):');
        console.log('1. Campus Admin:          head@college.demo');
        console.log('2. Hostel Warden:         warden@college.demo');
        console.log('3. Sustainability Officer: officer@college.demo');
        console.log('4. Municipality Admin:    admin@municipal.demo');
        console.log('5. Municipal Driver:       driver1@municipal.demo');
        console.log('6. Student / Citizen:     student@college.demo');
        console.log('7. Hospital Admin:        head@hospital.demo');
        console.log('8. Industry Admin:        head@industry.demo');
        console.log('---------------------------------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedDatabase();
