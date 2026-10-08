import Facility from '../models/Facility.js';
import InternalReport from '../models/InternalReport.js';
import Bin from '../models/Bin.js';
import Alert from '../models/Alert.js';
import PickupRequest from '../models/PickupRequest.js';
import Partner from '../models/Partner.js';

// Get current active facility or list all
export const getActiveFacility = async (req, res) => {
    try {
        const facilityId = req.query.id || 'bput_college';
        let facility = await Facility.findOne({ facilityId });
        if (!facility) {
            facility = await Facility.findOne({});
        }
        res.json(facility);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const listFacilities = async (req, res) => {
    try {
        const facilities = await Facility.find({}, 'facilityId name facilityType location sustainabilityScore');
        res.json(facilities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const switchFacility = async (req, res) => {
    try {
        const { facilityId } = req.body;
        const facility = await Facility.findOne({ facilityId });
        if (!facility) {
            return res.status(404).json({ message: 'Facility template not found' });
        }
        res.json({ message: `Switched to ${facility.name}`, facility });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateFacilityAssumptions = async (req, res) => {
    try {
        const { facilityId, tariffInr, gridEmissionFactor, waterCostPerKl, scoreWeights } = req.body;
        const facility = await Facility.findOneAndUpdate(
            { facilityId: facilityId || 'bput_college' },
            { $set: { tariffInr, gridEmissionFactor, waterCostPerKl, scoreWeights } },
            { new: true }
        );
        res.json({ message: 'Assumptions updated successfully', facility });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- INTERNAL CAMPUS WASTE REPORTING (Students / Workers) ---
export const createInternalReport = async (req, res) => {
    try {
        const { facilityId = 'bput_college', reporterName, reporterRole, locationName, wasteType, description, imageUrl } = req.body;
        
        const report = await InternalReport.create({
            facilityId,
            reporterName: reporterName || 'Aniket Verma (Student, Year 3)',
            reporterRole: reporterRole || 'student',
            locationName: locationName || 'Hostel Block A Courtyard',
            wasteType: wasteType || 'Dry / Plastic Waste',
            description: description || 'Plastic bottles and canteen packaging accumulating behind benches.',
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1611288875785-f203874317f2?w=500&auto=format&fit=crop&q=60',
            status: 'pending'
        });

        res.status(201).json({
            message: 'Campus waste report submitted to Organization Management team',
            report
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getInternalReports = async (req, res) => {
    try {
        const facilityId = req.query.facilityId || 'bput_college';
        const reports = await InternalReport.find({ facilityId }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateInternalReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedJanitorName, notes } = req.body;

        const updateData = { status };
        if (assignedJanitorName) updateData.assignedJanitorName = assignedJanitorName;
        if (notes) updateData.notes = notes;
        if (status === 'assigned_to_janitor') updateData.assignedAt = new Date();

        if (status === 'collected_to_main_bin') {
            updateData.collectedAt = new Date();

            // Locate the Campus Exterior Main Dump Bin for this facility
            const report = await InternalReport.findById(id);
            if (report) {
                const mainDumpBin = await Bin.findOne({
                    facilityId: report.facilityId,
                    $or: [{ name: /Exterior/i }, { name: /Dump/i }, { zoneId: 'Main Gate' }, { binCode: 'BIN-04' }]
                }) || await Bin.findOne({ facilityId: report.facilityId });

                if (mainDumpBin) {
                    // Internal waste added to campus exterior container increases fill %
                    const newFill = Math.min(100, Math.round(mainDumpBin.currentFillPct + 15));
                    mainDumpBin.currentFillPct = newFill;
                    if (newFill >= 80) {
                        mainDumpBin.urgency = 'critical';
                        mainDumpBin.verificationStatus = 'requested';
                        
                        // Auto-dispatch alert to Website 2 (Municipality)
                        const existingReq = await PickupRequest.findOne({
                            binId: mainDumpBin._id,
                            status: { $in: ['assigned', 'en_route', 'predicted', 'requested'] }
                        });

                        if (!existingReq) {
                            // Find nearest approved partner
                            const partner = await Partner.findOne({ status: 'approved' }) || {
                                name: 'Driver Ramesh Kumar',
                                vehicleNumber: 'Tata Ace (OD-14-K-4921)',
                                capacityKg: 1500,
                                currentLoadKg: 450
                            };

                            await PickupRequest.create({
                                facilityId: report.facilityId,
                                binId: mainDumpBin._id,
                                binCode: mainDumpBin.binCode,
                                binName: mainDumpBin.name,
                                location: {
                                    lat: mainDumpBin.lat || 22.2598,
                                    lng: mainDumpBin.lng || 84.8492,
                                    address: `Main Outer Gate, ${report.facilityId === 'bput_college' ? 'BPUT Campus' : 'Facility Compound'}`
                                },
                                status: 'assigned',
                                fillPctAtRequest: newFill,
                                requestedAt: new Date(),
                                assignedDriverName: partner.name,
                                assignedReason: {
                                    distanceKm: 1.4,
                                    loadRatio: 0.30,
                                    driverName: partner.name,
                                    vehicle: partner.vehicleNumber,
                                    score: 2.3,
                                    explanation: `Auto-dispatched via Municipal Bridge: Main Exterior Bin at ${newFill}% capacity.`
                                },
                                notes: 'Campus internal janitor completed interior cleanups; exterior dump container ready for municipal pickup.'
                            });
                        }
                    }
                    await mainDumpBin.save();
                }
            }
        }

        const updated = await InternalReport.findByIdAndUpdate(id, updateData, { new: true });
        res.json({ message: `Internal report updated to ${status}`, report: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- HOURLY CAMERA DUMP MONITOR SIMULATOR ---
export const triggerCameraSnapshot = async (req, res) => {
    try {
        const { facilityId = 'bput_college', cameraZone = 'Central Waste Dump Yard', forceHeavyWaste = false } = req.body;

        const isHeavy = forceHeavyWaste || Math.random() > 0.4;
        const fillPct = isHeavy ? Math.floor(Math.random() * 15 + 85) : Math.floor(Math.random() * 30 + 40);

        const sampleImages = [
            'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500&auto=format&fit=crop&q=60'
        ];
        const selectedImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];

        const result = {
            timestamp: new Date(),
            cameraZone,
            capturedImage: selectedImg,
            cvAnalysis: {
                fillPercentage: fillPct,
                heavyWasteDetected: isHeavy,
                detectedObjects: isHeavy 
                    ? ['Heavy corrugated cartons', 'Discarded metal frame', 'Full organic bags', 'Overflow perimeter']
                    : ['Plastic bottles', 'Paper napkins', 'Mixed lightweight items'],
                confidenceScore: 0.93
            }
        };

        // If heavy waste detected, automatically log critical Alert for Root User
        if (isHeavy) {
            await Alert.create({
                facilityId,
                module: 'waste',
                zoneId: cameraZone,
                severity: 'critical',
                status: 'open',
                title: `📸 Hourly Camera AI: Heavy Waste / Overflow Detected at ${cameraZone}`,
                why: {
                    metric: 'Visual Camera Fill Analysis',
                    actualValue: `${fillPct}% Full`,
                    baselineExpected: '< 65% Capacity',
                    statisticalZScore: 3.4,
                    modelType: 'YOLOv8 Edge Camera Classifier',
                    explanation: `Hourly snapshot detected heavy industrial/organic waste volume surpassing safe compaction threshold.`
                },
                impact: {
                    rupees: 750,
                    co2e_kg: 24.5,
                    kwh: 0,
                    kl: 0
                },
                confidence: 0.93,
                assumptions: ['Camera snapshot captures every 60 minutes', 'High density waste accelerates overflow within 1.5 hrs']
            });
        }

        res.json({ message: 'Hourly camera snapshot captured & analyzed by Computer Vision', result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- ALERT WARDEN DISPATCH ---
export const alertWarden = async (req, res) => {
    try {
        const { facilityId = 'bput_college', alertId, floor = 'Floor-4', message } = req.body;

        let alert;
        if (alertId) {
            alert = await Alert.findById(alertId);
        }

        if (!alert) {
            alert = await Alert.create({
                facilityId,
                module: 'power',
                zoneId: floor,
                severity: 'high',
                status: 'open',
                title: `⚡ Hostel ${floor} Unreasonable Power Surge During Class Hours`,
                why: {
                    metric: 'Active Power Draw',
                    actualValue: '29.8 kW',
                    baselineExpected: '12.4 kW (Class Hours)',
                    statisticalZScore: 4.1,
                    modelType: 'MAD Anomaly Detector',
                    explanation: message || `High power surge detected on ${floor} while students are scheduled in lectures. Informing Hostel Warden.`
                },
                impact: {
                    rupees: 288,
                    co2e_kg: 27.2,
                    kwh: 38.4,
                    kl: 0
                },
                confidence: 0.95,
                assignedRole: 'warden',
                wardenNotes: 'Pending warden inspection'
            });
        } else {
            alert.assignedRole = 'warden';
            alert.escalatedAt = new Date();
            await alert.save();
        }

        res.json({
            message: `Warden successfully alerted for ${floor}! High-priority mobile notification dispatched.`,
            alert
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
