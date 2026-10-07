import Report from '../models/Report.js';

// Nearest Neighbor Heuristic for TSP (Traveling Salesman Problem)
export const getOptimizedRoute = async (req, res) => {
    try {
        const { lat, lng } = req.query; // Partner's current location
        
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Partner current location (lat, lng) is required' });
        }

        const startLat = parseFloat(lat);
        const startLng = parseFloat(lng);

        // Fetch tasks assigned to partner that are NOT completed
        const tasks = await Report.find({
            partner: req.user._id,
            status: { $in: ['Assigned', 'Cleaning'] }
        });

        if (tasks.length === 0) {
            return res.json([]); // No route to build
        }

        // Helper: Haversine distance in meters
        const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3; // Earth radius in meters
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lon2-lon1) * Math.PI/180;

            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        };

        // Filter valid targets (must have GPS and not exactly 0,0 fallback)
        let unvisited = tasks
            .filter(t => {
                const hasLoc = t.location && t.location.lat && t.location.lng;
                const notZeroZero = t.location?.lat !== 0 && t.location?.lng !== 0;
                return hasLoc && notZeroZero;
            })
            .map(t => ({
                ...t.toObject(),
                originalIndex: t._id.toString() // track original ID
            }));

        const originalLength = unvisited.length;
        
        // If no tasks have GPS, return them as is, but unoptimized
        if (originalLength === 0) {
           return res.json(tasks); 
        }

        let route = [];
        let currentLat = startLat;
        let currentLng = startLng;

        // Nearest neighbor loop
        while (unvisited.length > 0) {
            let nearestIdx = 0;
            let minDiv = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const target = unvisited[i];
                const d = getDistance(currentLat, currentLng, target.location.lat, target.location.lng);
                
                if (d < minDiv) {
                    minDiv = d;
                    nearestIdx = i;
                }
            }

            // Move to nearest
            const nextStop = unvisited[nearestIdx];
            route.push(nextStop);
            currentLat = nextStop.location.lat;
            currentLng = nextStop.location.lng;

            // Remove from unvisited
            unvisited.splice(nearestIdx, 1);
        }

        // Append non-GPS tasks at the end
        const gpsIds = route.map(r => r._id.toString());
        const noGpsTasks = tasks.filter(t => !gpsIds.includes(t._id.toString()));

        res.json([...route, ...noGpsTasks]);

    } catch (err) {
        console.error('Route Optimization error:', err);
        res.status(500).json({ message: 'Failed to calculate optimized route' });
    }
};
