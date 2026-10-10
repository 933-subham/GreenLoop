import User from '../models/User.js';
import City from '../models/City.js';
import Facility from '../models/Facility.js';
import { seedCampusHierarchy } from '../services/campusSeeder.js';
import generateToken from '../utils/generateToken.js';
import { sendPartnerApplicationEmail, sendLoginWelcomeEmail } from '../utils/email.js';

// Helper to fetch city and build location payload
const resolveCityData = async (cityId) => {
    if (!cityId) return {};
    try {
        const cityDoc = await City.findById(cityId);
        if (!cityDoc) return {};
        return {
            city: cityDoc._id,
            state: cityDoc.state,
            district: cityDoc.district,
            cityName: cityDoc.city,
        };
    } catch {
        return {};
    }
};

// @desc    Register a Citizen
// @route   POST /api/auth/register-citizen
const registerCitizen = async (req, res) => {
    try {
        const { name, email, password, cityId } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Please fill in all fields' });
        if (password.length < 6)
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        if (!cityId)
            return res.status(400).json({ message: 'Please select your city' });
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'An account with this email already exists' });

        const locationData = await resolveCityData(cityId);
        const user = await User.create({ name, email, password, role: 'citizen', status: 'active', ...locationData });
        const token = generateToken(user._id);
        res.status(201).json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, status: user.status, ecoCoins: user.ecoCoins,
            state: user.state, district: user.district, cityName: user.cityName,
            token
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Register a Partner
// @route   POST /api/auth/register-partner
const registerPartner = async (req, res) => {
    try {
        const { name, email, password, cityId } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Please fill in all fields' });
        if (password.length < 6)
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        if (!cityId)
            return res.status(400).json({ message: 'Please select your city' });
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'An account with this email already exists' });

        const locationData = await resolveCityData(cityId);
        const user = await User.create({ name, email, password, role: 'partner', status: 'pending', ...locationData });

        // Find city's admin to notify (fallback to global ADMIN_EMAIL)
        const cityDoc = await City.findById(cityId).populate('admin');
        const adminEmail = cityDoc?.admin?.email || process.env.ADMIN_EMAIL;
        const adminName = cityDoc?.admin?.name || 'Municipality Admin';

        sendPartnerApplicationEmail({
            name: user.name,
            email: user.email,
            city: locationData.cityName || 'N/A',
            district: locationData.district || 'N/A',
            state: locationData.state || 'N/A',
            adminName,
            adminEmail,
        }).catch(e => console.error('Email error:', e.message));

        res.status(201).json({ message: 'Partner application submitted! The municipality admin will review and notify you by email.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Register a Municipality Admin (requires ADMIN_REGISTER_CODE)
// @route   POST /api/auth/register-admin
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, cityId, adminCode } = req.body;
        if (!name || !email || !password || !cityId || !adminCode)
            return res.status(400).json({ message: 'All fields including admin code are required' });
        if (adminCode !== process.env.ADMIN_REGISTER_CODE)
            return res.status(401).json({ message: 'Invalid admin registration code. Contact the system administrator.' });
        if (password.length < 8)
            return res.status(400).json({ message: 'Admin password must be at least 8 characters' });

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'An account with this email already exists' });

        // Check city doesn't already have an admin
        const cityDoc = await City.findById(cityId);
        if (!cityDoc) return res.status(404).json({ message: 'City not found' });
        
        if (cityDoc.admin) {
            // Verify the admin actually exists in the database
            const existingAdmin = await User.findById(cityDoc.admin);
            if (existingAdmin) {
                return res.status(400).json({ message: `${cityDoc.city} already has a municipality admin. Contact system support.` });
            }
        }

        const locationData = await resolveCityData(cityId);
        const user = await User.create({ name, email, password, role: 'admin', status: 'active', ...locationData });

        // Link admin to city
        await City.findByIdAndUpdate(cityId, { admin: user._id });

        const token = generateToken(user._id);
        res.status(201).json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, status: user.status,
            state: user.state, district: user.district, cityName: user.cityName,
            token
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Unified Register — dispatches by role
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { role } = req.body;
    if (role === 'partner') return registerPartner(req, res);
    if (role === 'admin' && req.body.adminCode) return registerAdmin(req, res);
    if (req.body.orgName || req.body.orgType) return registerOrg(req, res);
    return registerCitizen(req, res);
};

// @desc    Register an Organization (College, Hospital, Industry, School)
// @route   POST /api/auth/register-org
const registerOrg = async (req, res) => {
    try {
        const {
            orgName,
            orgType = 'college',
            adminName,
            email,
            password,
            city = 'Rourkela',
            state = 'Odisha',
            lat,
            lon,
            role = 'admin'
        } = req.body;

        if (!orgName || !adminName || !email || !password) {
            return res.status(400).json({ message: 'Organization name, administrator name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
        const orgId = `${slug}_${Date.now().toString().slice(-4)}`;

        const facilityType = orgType === 'hospital' ? 'government_hospital' :
                             orgType === 'college' ? 'engineering_college' :
                             orgType === 'industry' ? 'industrial_estate' : 'municipal_facility';

        await Facility.findOneAndUpdate(
            { facilityId: orgId },
            {
                $set: {
                    facilityId: orgId,
                    name: orgName,
                    facilityType,
                    location: {
                        lat: lat || (orgType === 'hospital' ? 20.2961 : 22.2585),
                        lng: lon || (orgType === 'hospital' ? 85.8245 : 84.8480),
                        address: `${orgName}, ${city}, ${state}`,
                        city,
                        state
                    },
                    tariffInr: orgType === 'hospital' ? 8.20 : 7.50,
                    gridEmissionFactor: 0.71,
                    waterCostPerKl: orgType === 'hospital' ? 22.0 : 18.0,
                    sustainabilityScore: 80.0
                }
            },
            { upsert: true }
        );

        const user = await User.create({
            name: adminName,
            email,
            password,
            role,
            status: 'active',
            orgId,
            orgName,
            orgType,
            cityName: city,
            state
        });

        // Trigger background seed for this organization
        seedCampusHierarchy(orgId, false, orgType).catch(e => console.error(`Background seed for ${orgId} error:`, e.message));

        const token = generateToken(user._id);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            orgId: user.orgId,
            orgName: user.orgName,
            orgType: user.orgType,
            cityName: user.cityName,
            state: user.state,
            lat: lat || (orgType === 'hospital' ? 20.2961 : 22.2585),
            lon: lon || (orgType === 'hospital' ? 85.8245 : 84.8480),
            token
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Please provide email and password' });

        let user = await User.findOne({ email });

        // Auto-provision demo accounts if missing
        if (!user) {
            if (email === 'dean.admin@bput.ac.in') {
                user = await User.create({
                    name: 'Prof. S. K. Nayak',
                    email: 'dean.admin@bput.ac.in',
                    password: password || 'demo123',
                    role: 'admin',
                    orgId: 'bput_college',
                    orgName: 'BPUT National Engineering College',
                    orgType: 'college',
                    cityName: 'Rourkela',
                    state: 'Odisha'
                });
            } else if (email === 'director.med@cityhospital.org') {
                user = await User.create({
                    name: 'Dr. A. K. Mohapatra',
                    email: 'director.med@cityhospital.org',
                    password: password || 'demo123',
                    role: 'admin',
                    orgId: 'city_hospital',
                    orgName: 'Apollo & AIIMS Super-Specialty Hospital',
                    orgType: 'hospital',
                    cityName: 'Bhubaneswar',
                    state: 'Odisha'
                });
            }
        }

        if (user && (email === 'dean.admin@bput.ac.in' || email === 'director.med@cityhospital.org') && password === 'demo123') {
            // Guarantee demo login success
            user.password = 'demo123';
            user.orgId = email.includes('hospital') ? 'city_hospital' : 'bput_college';
            user.orgName = email.includes('hospital') ? 'Apollo & AIIMS Super-Specialty Hospital' : 'BPUT National Engineering College';
            user.orgType = email.includes('hospital') ? 'hospital' : 'college';
            user.status = 'active';
            await user.save();
        } else {
            if (!user || !(await user.matchPassword(password)))
                return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (user.status === 'pending')
            return res.status(403).json({ message: 'Your partner application is pending approval by the Municipality Admin. You will be notified by email.' });
        if (user.status === 'blocked')
            return res.status(403).json({ message: 'Your account has been blocked. Contact the municipality administration.' });

        const token = generateToken(user._id);

        const resolvedOrgId = user.orgId || (user.email.includes('hospital') ? 'city_hospital' : 'bput_college');
        const resolvedOrgName = user.orgName || (resolvedOrgId === 'city_hospital' ? 'Apollo & AIIMS Super-Specialty Hospital' : 'BPUT National Engineering College');
        const resolvedOrgType = user.orgType || (resolvedOrgId === 'city_hospital' ? 'hospital' : 'college');

        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            ecoCoins: user.ecoCoins,
            stats: user.stats,
            state: user.state,
            district: user.district,
            cityName: user.cityName,
            city: user.city,
            orgId: resolvedOrgId,
            orgName: resolvedOrgName,
            orgType: resolvedOrgType,
            lat: resolvedOrgId === 'city_hospital' ? 20.2961 : 22.2585,
            lon: resolvedOrgId === 'city_hospital' ? 85.8245 : 84.8480,
            token
        };
        res.json(userData);

        sendLoginWelcomeEmail({ name: user.name, email: user.email, role: user.role, ecoCoins: user.ecoCoins })
            .catch(e => console.error('Login email error:', e.message));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get profile
// @route   GET /api/auth/profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('city', 'state district city');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete user account (Self-deletion)
// @route   DELETE /api/auth/delete-account
const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // If user is a municipality admin, free up the city slot
        if (user.role === 'admin' && user.city) {
            await City.findByIdAndUpdate(user.city, { $unset: { admin: 1 } });
        }

        await User.findByIdAndDelete(req.user._id);
        res.json({ message: 'Account successfully deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export { registerCitizen, registerPartner, registerAdmin, registerOrg, registerUser, loginUser, getUserProfile, deleteAccount };
