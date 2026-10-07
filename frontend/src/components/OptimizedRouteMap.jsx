import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { Navigation, Loader, AlertCircle } from 'lucide-react';
import LoaderSpinner from './LoaderSpinner';

// Custom colored icons
const createIcon = (color, text) => L.divIcon({
    html: `
        <div style="background-color: ${color}; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
            ${text}
        </div>`,
    className: 'custom-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

const currentIcon = createIcon('#3b82f6', '📍'); // Blue for me
const stopIcon = (num) => createIcon('#10b981', num); // Green for stops

// Fit bounds to show route
const RouteFitter = ({ route, currentLoc }) => {
    const map = useMap();
    useEffect(() => {
        if (!route.length && !currentLoc) return;
        
        const bounds = L.latLngBounds();
        if (currentLoc) bounds.extend([currentLoc.lat, currentLoc.lng]);
        
        route.forEach(r => {
            if (r.location?.lat && r.location?.lng) {
                bounds.extend([r.location.lat, r.location.lng]);
            }
        });
        
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [route, currentLoc, map]);
    return null;
};

const OptimizedRouteMap = () => {
    const [route, setRoute] = useState([]);
    const [currentLoc, setCurrentLoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 1. Get Partner's current location via Browser Geolocation API
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCurrentLoc({ lat, lng });

                // 2. Fetch optimized route from backend
                try {
                    const res = await api.get(`/partners/optimized-route?lat=${lat}&lng=${lng}&t=${Date.now()}`);
                    setRoute(res.data);
                } catch (err) {
                    console.error("Optimization error", err);
                    setError("Failed to calculate route");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.warn(`ERROR(${err.code}): ${err.message}`);
                setError("Please allow location access to calculate your optimized route.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }, []);

    if (loading) return (
        <div className="card shadow-sm border-0 rounded-4 p-5 text-center h-100 d-flex align-items-center justify-content-center">
            <LoaderSpinner message="Analyzing tasks via Nearest Neighbor TSP..." />
        </div>
    );

    if (error) return (
        <div className="card shadow-sm border-0 rounded-4 p-5 text-center h-100 d-flex align-items-center justify-content-center bg-danger-subtle">
            <div className="d-flex flex-column align-items-center gap-2">
                <AlertCircle className="text-danger" size={40} />
                <h5 className="text-danger fw-bold">{error}</h5>
                <small className="text-muted">Ensure geolocation permissions are granted.</small>
            </div>
        </div>
    );

    // Extract valid coordinates for the Polyline (connect the dots)
    const polylinePositions = [];
    if (currentLoc) polylinePositions.push([currentLoc.lat, currentLoc.lng]);
    
    route.forEach(r => {
        if (r.location?.lat && r.location?.lng) {
            polylinePositions.push([r.location.lat, r.location.lng]);
        }
    });

    return (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100 d-flex flex-column">
            <div className="card-header bg-white border-0 pt-4 pb-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <Navigation className="text-success" size={24} />
                    <h5 className="mb-0 fw-bold">Optimized Route (Nearest Neighbor)</h5>
                </div>
                <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
                    {route.filter(r => r.location?.lat).length} Stops
                </span>
            </div>

            <div className="alert alert-info border-0 rounded-0 m-0 py-2 px-4 d-flex align-items-center gap-2" style={{fontSize: '0.85rem'}}>
                <AlertCircle size={16}/> 
                <span>Route starts at your current blue location marker and connects nearest tasks sequentially.</span>
            </div>

            <div className="card-body p-0 flex-grow-1 position-relative" style={{ minHeight: '500px' }}>
                <MapContainer 
                    center={currentLoc ? [currentLoc.lat, currentLoc.lng] : [20.5937, 78.9629]} 
                    zoom={13} 
                    minZoom={5}
                    maxBounds={[[6.7535, 68.1623], [35.5042, 97.3955]]}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    
                    <RouteFitter route={route} currentLoc={currentLoc} />

                    {/* Polyline connecting the stops */}
                    {polylinePositions.length > 1 && (
                        <Polyline 
                            positions={polylinePositions} 
                            pathOptions={{ color: '#10b981', weight: 4, opacity: 0.7, dashArray: '10, 10' }} 
                        />
                    )}

                    {/* Partner's Current Location */}
                    {currentLoc && (
                        <Marker position={[currentLoc.lat, currentLoc.lng]} icon={currentIcon}>
                            <Popup><span className="fw-bold">You are here</span><br/><small className="text-muted">Starting Point</small></Popup>
                        </Marker>
                    )}

                    {/* Task Stops */}
                    {route.map((task, idx) => {
                        if (!task.location?.lat || !task.location?.lng) return null;
                        return (
                            <Marker 
                                key={task._id} 
                                position={[task.location.lat, task.location.lng]} 
                                icon={stopIcon((idx + 1).toString())}
                            >
                                <Popup className="custom-popup">
                                    <div className="text-center p-1">
                                        <div className="badge bg-success mb-2 w-100 fs-6">Stop #{idx + 1}</div>
                                        <h6 className="fw-bold mb-1 border-bottom pb-2">{task.wasteType}</h6>
                                        <small className="text-muted d-block mt-2">{task.location?.address || 'No address provided'}</small>
                                        <div className="mt-2 text-start bg-light p-2 rounded">
                                            <small className="fw-bold text-dark d-block mb-1">Status: {task.status}</small>
                                            {task.description && <small className="text-muted d-block">{task.description}</small>}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
};

export default OptimizedRouteMap;
