import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const FacilityContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const FACILITY_PRESETS = [
    {
        id: 'bput_college',
        name: 'BPUT Engineering College Campus',
        type: 'engineering_college',
        badge: '🎓 College Campus',
        city: 'Rourkela',
        tariff: 7.50,
        emissionFactor: 0.71,
        color: '#10b981'
    },
    {
        id: 'district_hospital',
        name: 'Rourkela District General Hospital',
        type: 'government_hospital',
        badge: '🏥 Govt Hospital',
        city: 'Rourkela',
        tariff: 6.80,
        emissionFactor: 0.71,
        color: '#3b82f6'
    },
    {
        id: 'industrial_estate',
        name: 'Rourkela Industrial Hub & PSU',
        type: 'industrial_estate',
        badge: '🏭 Industrial Estate',
        city: 'Rourkela',
        tariff: 8.90,
        emissionFactor: 0.75,
        color: '#f59e0b'
    },
    {
        id: 'municipal_hq',
        name: 'RMC Municipal Corporation HQ',
        type: 'municipal_facility',
        badge: '🏛️ Municipal HQ',
        city: 'Rourkela',
        tariff: 7.20,
        emissionFactor: 0.71,
        color: '#8b5cf6'
    }
];

export const FacilityProvider = ({ children }) => {
    const [activeFacilityId, setActiveFacilityId] = useState(
        localStorage.getItem('greenloop_facility_id') || 'bput_college'
    );
    const [facilityData, setFacilityData] = useState(null);
    const [loading, setLoading] = useState(false);

    const activePreset = FACILITY_PRESETS.find(f => f.id === activeFacilityId) || FACILITY_PRESETS[0];

    const fetchFacilityData = async (id = activeFacilityId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/facility/active?id=${id}`);
            setFacilityData(res.data);
        } catch (err) {
            console.error('Failed to load facility data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFacilityData(activeFacilityId);
    }, [activeFacilityId]);

    const switchFacility = (id) => {
        setActiveFacilityId(id);
        localStorage.setItem('greenloop_facility_id', id);
        fetchFacilityData(id);
    };

    return (
        <FacilityContext.Provider value={{
            activeFacilityId,
            activePreset,
            facilityData,
            loading,
            switchFacility,
            presets: FACILITY_PRESETS,
            refreshFacility: fetchFacilityData
        }}>
            {children}
        </FacilityContext.Provider>
    );
};

export const useFacility = () => useContext(FacilityContext);
