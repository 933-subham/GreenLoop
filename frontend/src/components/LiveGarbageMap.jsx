import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { Layers, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Fix for default Leaflet markers missing in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored icons using pure CSS to avoid external image loading issues
const createDivIcon = (bgColor) => L.divIcon({
    html: `<div style="background-color: ${bgColor}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
    className: 'custom-color-icon',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
});

const redIcon = createDivIcon('#ef4444');    // Pending (Submitted)
const yellowIcon = createDivIcon('#eab308'); // Active (Assigned, Cleaning)
const greenIcon = createDivIcon('#10b981');  // Cleaned (Completed)

// Hotspot icon (Fire emoji)
const hotspotIcon = L.divIcon({
    html: '<div style="font-size: 24px; text-shadow: 0 0 10px red;">🔥</div>',
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Component to dynamically fit bounds of all markers or zoom to specific city
const BoundsFitter = ({ data, hotspots, userCity }) => {
    const map = useMap();
    useEffect(() => {
        // If we have actual marker data, bound to the markers
        if (data.length > 0 || hotspots.length > 0) {
            const bounds = L.latLngBounds();
            data.forEach(m => {
                if (m.geoLocation?.coordinates) {
                    bounds.extend([m.geoLocation.coordinates[1], m.geoLocation.coordinates[0]]); // [lat, lng]
                } else if (m.location?.lat && m.location?.lng) {
                    bounds.extend([m.location.lat, m.location.lng]);
                }
            });
            hotspots.forEach(h => {
                 bounds.extend([h.coordinates[1], h.coordinates[0]]);
            });
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        } 
        // If no markers, but we have a specific city assigned, fly to that city
        else if (userCity && userCity !== 'India') {
            fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(userCity)}&country=India&format=json`)
                .then(res => res.json())
                .then(results => {
                    if (results && results.length > 0) {
                        const { boundingbox } = results[0];
                        // Nominatim returns [latMin, latMax, lonMin, lonMax]
                        const cityBounds = L.latLngBounds(
                            [boundingbox[0], boundingbox[2]], 
                            [boundingbox[1], boundingbox[3]]
                        );
                        map.fitBounds(cityBounds, { padding: [20, 20], maxZoom: 13 });
                    }
                })
                .catch(err => console.error("Geocoding failed", err));
        }
    }, [data, hotspots, userCity, map]);
    return null;
};

const LiveGarbageMap = () => {
    const { user } = useAuth();
    const [markers, setMarkers] = useState([]);
    const [hotspots, setHotspots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    const [userCity, setUserCity] = useState(null);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const mapRes = await api.get(`/reports/map-data?t=${Date.now()}`);
                
                // Backend now returns { userCity, reports }
                const dataArray = Array.isArray(mapRes.data) ? mapRes.data : mapRes.data.reports || [];
                setUserCity(mapRes.data.userCity || null);

                // Filter out reports without ANY kind of valid coordinates
                const validMarkers = dataArray.filter(m => 
                    (m.geoLocation && m.geoLocation.coordinates && m.geoLocation.coordinates[0] !== 0) ||
                    (m.location && m.location.lat && m.location.lng)
                );
                setMarkers(validMarkers);

                // Fetch hotspots if admin
                if (user?.role === 'admin') {
                    const hsRes = await api.get('/admin/hotspots');
                    setHotspots(hsRes.data || []);
                }
            } catch (err) {
                console.error("Map data error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMapData();
    }, [user?.role]);

    const getMarkerIcon = (status) => {
        if (status === 'Completed') return greenIcon;
        if (status === 'Assigned' || status === 'Cleaning') return yellowIcon;
        return redIcon;
    };

    const displayMarkers = markers.filter(m => {
        if (filter === 'All') return true;
        if (filter === 'Pending' && m.status === 'Submitted') return true;
        if (filter === 'Active' && (m.status === 'Assigned' || m.status === 'Cleaning')) return true;
        if (filter === 'Cleaned' && m.status === 'Completed') return true;
        return false;
    });

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-success"></div></div>;

    const defaultCenter = [20.5937, 78.9629]; // India center default

    return (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100 d-flex flex-column">
            <div className="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                    <Layers className="text-primary" size={24} />
                    <h5 className="mb-0 fw-bold d-none d-sm-block">Live Garbage Map</h5>
                </div>
                
                <div className="d-flex gap-2 align-items-center">
                    {user?.role === 'admin' && hotspots.length > 0 && (
                        <span className="badge bg-danger d-flex align-items-center gap-1">
                            <AlertTriangle size={12}/> {hotspots.length} Hotspots
                        </span>
                    )}
                    <select 
                        className="form-select form-select-sm shadow-sm" style={{width: 'auto', borderRadius: '12px'}}
                        value={filter} onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending (Red)</option>
                        <option value="Active">Active (Yellow)</option>
                        <option value="Cleaned">Cleaned (Green)</option>
                    </select>
                </div>
            </div>

            <div className="card-body p-0 flex-grow-1 position-relative" style={{ minHeight: '500px' }}>
                <MapContainer 
                    center={defaultCenter} 
                    zoom={5} 
                    minZoom={5}
                    maxBounds={[[6.7535, 68.1623], [35.5042, 97.3955]]}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    
                    <BoundsFitter data={displayMarkers} hotspots={hotspots} userCity={userCity} />

                    {/* Report Markers */}
                    {displayMarkers.map(m => {
                        const validLat = m.geoLocation?.coordinates?.[1] || m.location?.lat;
                        const validLng = m.geoLocation?.coordinates?.[0] || m.location?.lng;
                        if (!validLat || !validLng) return null;

                        // Identify pending markers
                        const statusClass = m.status === 'Completed' ? 'bg-success' : 
                                            m.status === 'Submitted' ? 'bg-danger' : 'bg-warning text-dark';
                                            
                        return (
                        <Marker 
                            key={m._id} 
                            position={[validLat, validLng]} 
                            icon={getMarkerIcon(m.status)}
                        >
                            <Popup className="custom-popup">
                                <div className="text-center p-1">
                                    <span className={`badge mb-2 w-100 ${statusClass}`}>
                                        {m.status === 'Submitted' ? 'Pending' : m.status}
                                    </span>
                                    <h6 className="fw-bold mb-1">{m.wasteType}</h6>
                                    {m.location?.address && <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>{m.location.address}</small>}
                                </div>
                            </Popup>
                        </Marker>
                        );
                    })}

                    {/* Hotspot Markers (Admin Only) */}
                    {user?.role === 'admin' && hotspots.map((h, idx) => (
                        <Marker 
                            key={`hs-${idx}`} 
                            position={[h.coordinates[1], h.coordinates[0]]} 
                            icon={hotspotIcon}
                        >
                            <Popup>
                                <div className="text-center">
                                    <h6 className="fw-bold text-danger mb-1">🔥 Waste Hotspot</h6>
                                    <small className="text-muted">{h.reportCount} reports in this 100m area recently.</small>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default LiveGarbageMap;
