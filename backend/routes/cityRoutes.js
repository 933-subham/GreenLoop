import express from 'express';
import City from '../models/City.js';
import User from '../models/User.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc  Get all states (distinct)
// @route GET /api/cities/states
router.get('/states', async (req, res) => {
    try {
        const states = await City.distinct('state');
        res.json(states.sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc  Get districts for a state
// @route GET /api/cities/districts?state=Odisha
router.get('/districts', async (req, res) => {
    try {
        const { state } = req.query;
        if (!state) return res.status(400).json({ message: 'state query param required' });
        const districts = await City.distinct('district', { state });
        res.json(districts.sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc  Get cities for a district
// @route GET /api/cities/cities?state=Odisha&district=Khordha
router.get('/cities', async (req, res) => {
    try {
        const { state, district } = req.query;
        if (!state || !district) return res.status(400).json({ message: 'state and district params required' });
        
        // Populate admin to verify if the user still actually exists in the DB
        const cities = await City.find({ state, district })
            .populate('admin', '_id')
            .sort('city');
            
        const formattedCities = cities.map(c => ({
            _id: c._id,
            city: c.city,
            district: c.district,
            state: c.state,
            // Only true if admin was populated successfully (user not deleted)
            admin: c.admin ? true : false 
        }));
        
        res.json(formattedCities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc  Add a new city (admin only OR open for super-admin — protected by role)
// @route POST /api/cities
router.post('/', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const { state, district, city } = req.body;
        if (!state || !district || !city)
            return res.status(400).json({ message: 'state, district, city are all required' });
        const created = await City.create({ state: state.trim(), district: district.trim(), city: city.trim() });
        res.status(201).json(created);
    } catch (err) {
        if (err.code === 11000)
            return res.status(400).json({ message: 'This city already exists' });
        res.status(500).json({ message: err.message });
    }
});

export default router;
