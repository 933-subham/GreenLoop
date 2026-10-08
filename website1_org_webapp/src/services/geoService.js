/**
 * Free Geocoding & Open-Meteo GPS Location Service
 * Zero API keys required. Fetches real coordinates for ANY city in India and globally.
 */

import axios from 'axios';

// Fast fallback coordinates for top Indian industrial, health, and campus hubs
export const PRESET_HUBS = [
    { city: 'Rourkela', state: 'Odisha', lat: 22.2585, lon: 84.8480, desc: 'BPUT & Rourkela Steel Plant Hub' },
    { city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245, desc: 'AIIMS & Smart City Tech Park' },
    { city: 'Jharsuguda', state: 'Odisha', lat: 21.8550, lon: 84.0062, desc: 'Vedanta & Western Mining Estate' },
    { city: 'Cuttack', state: 'Odisha', lat: 20.4625, lon: 85.8830, desc: 'SCB Medical College & Judiciary Hub' },
    { city: 'Sambalpur', state: 'Odisha', lat: 21.4669, lon: 83.9812, desc: 'VSSUT Burla & Hirakud Complex' },
    { city: 'Angul', state: 'Odisha', lat: 20.8400, lon: 85.1000, desc: 'Jindal Steel & Nalco Smelter Area' },
    { city: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lon: 86.2029, desc: 'Tata Steel Industrial Township' },
    { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, desc: 'Eastern Metro Health & Campus Zone' },
    { city: 'New Delhi', state: 'Delhi NCR', lat: 28.6139, lon: 77.2090, desc: 'National Capital Institutional Area' },
    { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, desc: 'Electronic City & Tech Campuses' }
];

export async function searchCityCoordinates(query) {
    if (!query || query.trim().length === 0) return [];
    
    // Check preset hubs first for instant local responsiveness
    const trimmed = query.trim().toLowerCase();
    const localMatches = PRESET_HUBS.filter(h => 
        h.city.toLowerCase().includes(trimmed) || 
        h.state.toLowerCase().includes(trimmed)
    );

    try {
        // Query Open-Meteo free geocoding API
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
        const res = await axios.get(url, { timeout: 4500 });
        
        if (res.data && res.data.results && res.data.results.length > 0) {
            const apiResults = res.data.results.map(r => ({
                city: r.name,
                state: r.admin1 || r.country,
                country: r.country || 'India',
                lat: parseFloat(r.latitude.toFixed(4)),
                lon: parseFloat(r.longitude.toFixed(4)),
                elevation: r.elevation || 150,
                desc: `${r.name}, ${r.admin1 || ''} (${r.country})`
            }));
            return apiResults;
        }
    } catch (err) {
        console.warn('Geocoding API network note (using local cache):', err.message);
    }

    return localMatches.length > 0 ? localMatches : [PRESET_HUBS[0]];
}

export function detectBrowserGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Browser geolocation not supported on this device'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = parseFloat(position.coords.latitude.toFixed(4));
                const lon = parseFloat(position.coords.longitude.toFixed(4));
                resolve({
                    city: 'Auto-Detected GPS',
                    state: 'Local Station',
                    lat,
                    lon,
                    desc: `Browser GPS: ${lat}°N, ${lon}°E`
                });
            },
            (err) => {
                reject(err);
            },
            { timeout: 7000, enableHighAccuracy: false }
        );
    });
}
