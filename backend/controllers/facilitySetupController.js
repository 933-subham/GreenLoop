import Building from '../models/facility/Building.js';
import Device from '../models/facility/Device.js';
import { generateBaselineForDevice } from '../services/baselineService.js';

// Helper to derive uppercase initials for building code
export const deriveBuildingCode = (name) => {
    if (!name) return 'BLD';
    const words = name.trim().split(/\s+/);
    if (words.length > 1) {
        return words.map(w => w.charAt(0)).join('').toUpperCase().slice(0, 6);
    }
    return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
};

// GET /api/buildings
export const getBuildings = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.query.orgId || 'bput_college';
        const includeInactive = req.query.includeInactive === 'true';
        const filter = { orgId };
        if (!includeInactive) filter.active = { $ne: false };

        const buildings = await Building.find(filter).sort({ createdAt: -1 });
        res.json(buildings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/buildings
export const addBuilding = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.body.orgId || 'bput_college';
        const { name, type = 'other', floors = 3, code } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Building name is required' });
        }

        const validTypes = [
            'hostel', 'academic', 'canteen', 'library', 'administrative',
            'sports', 'pump_house', 'street_lighting', 'other'
        ];
        const buildingType = validTypes.includes(type) ? type : 'other';

        const floorCount = Math.max(1, Math.min(30, parseInt(floors, 10) || 1));

        // Derive or validate code
        let buildingCode = code ? code.trim().toUpperCase() : deriveBuildingCode(name);
        if (!buildingCode) buildingCode = 'BLD';

        // Check if code already exists for this org
        const existing = await Building.findOne({ orgId, code: buildingCode });
        if (existing) {
            return res.status(400).json({ error: `Building code "${buildingCode}" already exists for this organization. Please specify a unique code.` });
        }

        const building = await Building.create({
            orgId,
            code: buildingCode,
            name: name.trim(),
            type: buildingType,
            floors: floorCount,
            active: true
        });

        res.status(201).json(building);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/buildings/:id (Soft delete)
export const deleteBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const building = await Building.findByIdAndUpdate(id, { active: false }, { returnDocument: 'after' });
        if (!building) return res.status(404).json({ error: 'Building not found' });

        // Soft-delete associated devices
        await Device.updateMany({ buildingId: building._id }, { active: false, status: 'offline' });

        res.json({ success: true, message: `Building ${building.name} archived (soft-deleted).`, building });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/buildings/:id/auto-meters (Auto-create one power meter per floor)
export const autoCreateBuildingMeters = async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.user?.orgId || req.user?.facilityId || req.body?.orgId || 'bput_college';

        const building = await Building.findById(id);
        if (!building) return res.status(404).json({ error: 'Building not found' });

        const createdDevices = [];
        const floorCount = building.floors || 1;

        for (let f = 1; f <= floorCount; f++) {
            const deviceId = `PWR-${building.code}-F${f}`;
            let device = await Device.findOne({ deviceId });

            if (!device) {
                device = await Device.create({
                    deviceId,
                    orgId,
                    buildingId: building._id,
                    floor: f,
                    type: 'power',
                    label: `${building.name} Floor ${f} Power`,
                    status: 'online',
                    active: true,
                    lastSeen: new Date()
                });
            } else {
                device.active = true;
                device.status = 'online';
                await device.save();
            }
            generateBaselineForDevice(deviceId, building.type, 'power');
            createdDevices.push(device);
        }

        res.status(201).json({
            success: true,
            buildingId: building._id,
            buildingCode: building.code,
            count: createdDevices.length,
            devices: createdDevices
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/devices (Add single sensor)
export const addDevice = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.body.orgId || 'bput_college';
        const { buildingId, floor, type = 'power', label } = req.body;

        if (!buildingId) return res.status(400).json({ error: 'buildingId is required' });

        const building = await Building.findOne({ _id: buildingId, orgId });
        if (!building) return res.status(404).json({ error: 'Building not found' });

        const isCampus = floor === 'campus' || floor === 'Campus';
        const targetFloor = isCampus ? 'campus' : Math.max(1, parseInt(floor, 10) || 1);
        const sensorType = (type === 'water_tank' || type === 'water') ? 'water_tank' : 'power';

        // Auto-generate deviceId based on Phase 1 rules
        let deviceId = '';
        if (sensorType === 'power') {
            deviceId = `PWR-${building.code}-F${targetFloor}`;
        } else {
            if (isCampus) {
                deviceId = 'WTR-CAMPUS-T1';
            } else {
                const countWater = await Device.countDocuments({ buildingId: building._id, type: { $in: ['water', 'water_tank'] } });
                deviceId = `WTR-${building.code}-T${countWater + 1}`;
            }
        }

        let device = await Device.findOne({ deviceId });
        if (device) {
            device.active = true;
            device.status = 'online';
            if (label) device.label = label;
            await device.save();
        } else {
            device = await Device.create({
                deviceId,
                orgId,
                buildingId: building._id,
                floor: targetFloor,
                type: sensorType,
                label: label || (sensorType === 'power' ? `${building.name} Floor ${targetFloor} Power` : `${building.name} Overhead Tank`),
                status: 'online',
                active: true,
                lastSeen: new Date()
            });
        }

        generateBaselineForDevice(deviceId, building.type, sensorType);

        const sampleBody = sensorType === 'power'
            ? { deviceId, kw: 8.5 }
            : { deviceId, tank_level_pct: 75, flow_lpm: 0.5 };

        res.status(201).json({
            success: true,
            device,
            deviceId,
            samplePostman: {
                method: 'POST',
                url: '/api/ingest/readings',
                headers: { 'x-device-token': 'demo-token', 'Content-Type': 'application/json' },
                body: sampleBody
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/devices/:id (Soft delete)
export const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await Device.findByIdAndUpdate(id, { active: false, status: 'offline' }, { returnDocument: 'after' });
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json({ success: true, message: `Sensor ${device.deviceId} archived (soft-deleted).`, device });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/setup/template (College, etc.)
export const applyFacilityTemplate = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.body.orgId || 'bput_college';
        const { template = 'college' } = req.body;

        const TEMPLATES = {
            college: [
                { name: 'Hostel Block A', type: 'hostel', floors: 4, code: 'HA' },
                { name: 'Hostel Block B', type: 'hostel', floors: 3, code: 'HB' },
                { name: 'Academic Block', type: 'academic', floors: 3, code: 'AB' },
                { name: 'Canteen & Mess', type: 'canteen', floors: 1, code: 'CANT' }
            ]
        };

        const chosen = TEMPLATES[template] || TEMPLATES.college;
        const createdBuildings = [];
        const createdDevices = [];

        for (const bDef of chosen) {
            let b = await Building.findOne({ orgId, code: bDef.code });
            if (!b) {
                b = await Building.create({ ...bDef, orgId, active: true });
            } else {
                b.active = true;
                await b.save();
            }
            createdBuildings.push(b);

            for (let f = 1; f <= b.floors; f++) {
                const pwrId = `PWR-${b.code}-F${f}`;
                let dev = await Device.findOne({ deviceId: pwrId });
                if (!dev) {
                    dev = await Device.create({
                        deviceId: pwrId,
                        orgId,
                        buildingId: b._id,
                        floor: f,
                        type: 'power',
                        label: `${b.name} Floor ${f} Power`,
                        status: 'online',
                        active: true,
                        lastSeen: new Date()
                    });
                } else {
                    dev.active = true;
                    await dev.save();
                }
                generateBaselineForDevice(pwrId, b.type, 'power');
                createdDevices.push(dev);
            }

            const wtrId = `WTR-${b.code}-T1`;
            let wDev = await Device.findOne({ deviceId: wtrId });
            if (!wDev) {
                wDev = await Device.create({
                    deviceId: wtrId,
                    orgId,
                    buildingId: b._id,
                    floor: b.floors,
                    type: 'water_tank',
                    label: `${b.name} Overhead Tank`,
                    status: 'online',
                    active: true,
                    lastSeen: new Date()
                });
            } else {
                wDev.active = true;
                await wDev.save();
            }
            generateBaselineForDevice(wtrId, b.type, 'water_tank');
            createdDevices.push(wDev);
        }

        res.json({
            success: true,
            template,
            buildingsCount: createdBuildings.length,
            devicesCount: createdDevices.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/setup/bulk-import
export const bulkImportFacility = async (req, res) => {
    try {
        const orgId = req.user?.orgId || req.user?.facilityId || req.body.orgId || 'bput_college';
        const { rows = [] } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'rows array is required' });
        }

        const results = [];
        for (const row of rows) {
            const bName = row.building?.trim();
            if (!bName) continue;
            const floors = Math.max(1, Math.min(30, parseInt(row.floors, 10) || 1));
            const bCode = (bName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)).toUpperCase();

            let b = await Building.findOne({ orgId, code: bCode });
            if (!b) {
                b = await Building.create({ orgId, code: bCode, name: bName, type: 'other', floors, active: true });
            }

            const sensorType = (row.sensorType === 'water' || row.sensorType === 'water_tank') ? 'water_tank' : 'power';
            const fl = row.floor != null ? parseInt(row.floor, 10) : 1;
            const deviceId = sensorType === 'power' ? `PWR-${b.code}-F${fl}` : `WTR-${b.code}-T1`;

            let dev = await Device.findOne({ deviceId });
            if (!dev) {
                dev = await Device.create({
                    deviceId,
                    orgId,
                    buildingId: b._id,
                    floor: fl,
                    type: sensorType,
                    label: `${b.name} Floor ${fl} ${sensorType}`,
                    status: 'online',
                    active: true,
                    lastSeen: new Date()
                });
            }
            generateBaselineForDevice(deviceId, b.type, sensorType);
            results.push(dev);
        }

        res.json({ success: true, imported: results.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
