import Alert from '../models/Alert.js';
import Facility from '../models/Facility.js';
import http from 'http';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const callAiService = async (endpoint, method = 'GET', body = null) => {
    return new Promise((resolve) => {
        try {
            const url = new URL(endpoint, AI_SERVICE_URL);
            const req = http.request(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                timeout: 3000
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

// Get ranked unified actions
export const getRankedActions = async (req, res) => {
    try {
        const facilityId = req.query.facilityId || 'bput_college';
        const facility = await Facility.findOne({ facilityId }) || {
            facilityType: 'engineering_college',
            tariffInr: 7.50,
            gridEmissionFactor: 0.71
        };

        // Call Python recommendation engine
        let aiResult = await callAiService('/recommend', 'POST', {
            facility_type: facility.facilityType,
            tariff_inr: facility.tariffInr,
            emission_factor: facility.gridEmissionFactor
        });

        if (aiResult && aiResult.actions) {
            return res.json(aiResult.actions);
        }

        // Deterministic fallback
        res.json([
            {
                id: 'ACT-1',
                priority: 'P1 - Critical',
                module: 'Power',
                title: 'Address Floor 3 Hostel Power Surge During Class Hours',
                owner: 'Hostel Warden / Electrician',
                why: 'Floor 3 power draw is 42% above normal for a weekday 11 AM class session (students in academic block). Likely multiple fans, room coolers or heaters left on.',
                impact: { kwh: 38.4, rupees: Math.round(38.4 * facility.tariffInr), co2e_kg: Math.round(38.4 * facility.gridEmissionFactor), kl: 0 },
                confidence: 0.94,
                status: 'Open',
                action_type: 'inspection'
            },
            {
                id: 'ACT-2',
                priority: 'P1 - Critical',
                module: 'Water',
                title: 'Repair Tank A Overhead Pipe Night-Flow Leak',
                owner: 'Estate Maintenance Head',
                why: 'Continuous 2.3% per hour drop detected between 01:00 AM - 04:00 AM with pump off. Wasting approx 1,800 Liters of treated water every night.',
                impact: { kwh: 6.2, rupees: 240, co2e_kg: 4.4, kl: 1.8 },
                confidence: 0.92,
                status: 'Open',
                action_type: 'maintenance'
            },
            {
                id: 'ACT-3',
                priority: 'P2 - High',
                module: 'Waste',
                title: 'Verify & Dispatch Pickup for Canteen Bin #4 (88% Full)',
                owner: 'Campus Admin / Municipal Driver',
                why: 'Canteen smart camera detected 88% organic fill level with fill rate of 8.2%/hr. Overflow ETA is within 2.5 hours before lunch crowd.',
                impact: { kwh: 0, rupees: 500, co2e_kg: 18.0, kl: 0 },
                confidence: 0.89,
                status: 'Pending Verification',
                action_type: 'dispatch'
            }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get alerts for operations and hostel warden
export const getAlerts = async (req, res) => {
    try {
        const facilityId = req.query.facilityId || 'bput_college';
        const alerts = await Alert.find({ facilityId }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Warden / Ops updates alert (Acknowledge, Resolve, False Alarm)
export const updateAlertStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, wardenNotes } = req.body;

        const updateData = { status };
        if (wardenNotes) updateData.wardenNotes = wardenNotes;
        if (status === 'acknowledged') updateData.acknowledgedAt = new Date();
        if (status === 'resolved' || status === 'false_alarm') updateData.resolvedAt = new Date();

        const alert = await Alert.findByIdAndUpdate(id, updateData, { new: true });
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        res.json({ message: `Alert updated to ${status}`, alert });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Scenario Simulator
export const runScenarioSimulation = async (req, res) => {
    try {
        const facilityId = req.body.facilityId || 'bput_college';
        const facility = await Facility.findOne({ facilityId }) || {
            facilityType: 'engineering_college',
            tariffInr: 7.50,
            gridEmissionFactor: 0.71,
            waterCostPerKl: 18.0
        };

        const payload = {
            facility_type: facility.facilityType,
            off_hours_cut_pct: req.body.off_hours_cut_pct || 15.0,
            fix_night_leaks: req.body.fix_night_leaks !== false,
            optimize_waste_routes: req.body.optimize_waste_routes !== false,
            tariff_inr: facility.tariffInr,
            emission_factor: facility.gridEmissionFactor,
            water_cost_per_kl: facility.waterCostPerKl
        };

        let aiResult = await callAiService('/scenario', 'POST', payload);
        if (aiResult) return res.json(aiResult);

        // Fallback calculation
        const kwh_saved = Math.round(45000 * 0.40 * (payload.off_hours_cut_pct / 100));
        const rupees_energy = Math.round(kwh_saved * facility.tariffInr);
        const co2_energy = Math.round(kwh_saved * facility.gridEmissionFactor);
        const water_kl_saved = payload.fix_night_leaks ? 45 : 0;
        const rupees_water = Math.round(water_kl_saved * facility.waterCostPerKl);
        const waste_rupees = payload.optimize_waste_routes ? 6500 : 0;
        const total_rupees = rupees_energy + rupees_water + waste_rupees;

        res.json({
            facility_type: facility.facilityType,
            inputs: payload,
            monthly_savings: {
                total_rupees,
                energy_kwh: kwh_saved,
                water_kl: water_kl_saved,
                co2e_kg: co2_energy + (payload.optimize_waste_routes ? 85 : 0),
                annualized_rupees: total_rupees * 12
            },
            breakdown: [
                { module: 'Power Schedules', savings_rupees: rupees_energy, co2e_kg: co2_energy, metric: `${kwh_saved} kWh` },
                { module: 'Water Leak Mitigation', savings_rupees: rupees_water, co2e_kg: 0, metric: `${water_kl_saved} kL` },
                { module: 'Smart Waste Dispatch', savings_rupees: waste_rupees, co2e_kg: 85, metric: 'Route Consolidation' }
            ],
            assumptions: [
                `Electricity Tariff: ₹${facility.tariffInr}/kWh`,
                `Grid Emission Factor: ${facility.gridEmissionFactor} kg CO2e/kWh (CEA Baseline)`,
                `Water Tariff: ₹${facility.waterCostPerKl}/kL`
            ]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
