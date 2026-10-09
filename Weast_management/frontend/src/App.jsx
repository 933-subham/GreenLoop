import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CameraDetector from './components/CameraDetector';
import CampusHeatmap from './components/CampusHeatmap';
import PredictiveHeatmap from './components/PredictiveHeatmap';
import RealtimeLogs from './components/RealtimeLogs';

export default function App() {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'heatmap', 'predictive', 'logs'
  const [isConnected, setIsConnected] = useState(false);

  // Live Bin State
  const [binData, setBinData] = useState({
    id: "bin-cam-01",
    location: "Canteen Live Camera",
    fillPercentage: 0,
    status: "OK",
    logs: []
  });

  // 5 Campus Locations State
  const [campusLocations, setCampusLocations] = useState([
    { id: "loc-1", name: "Library", icon: "🏫", fillPercentage: 20, status: "LOW", color: "GREEN", coordinates: { x: 20, y: 30 } },
    { id: "loc-2", name: "Canteen (Live Camera)", icon: "🍱", fillPercentage: 0, status: "LOW", color: "GREEN", coordinates: { x: 70, y: 25 } },
    { id: "loc-3", name: "Hostel A", icon: "🏢", fillPercentage: 55, status: "MEDIUM", color: "YELLOW", coordinates: { x: 40, y: 65 } },
    { id: "loc-4", name: "Hostel B", icon: "🏡", fillPercentage: 30, status: "LOW", color: "GREEN", coordinates: { x: 80, y: 75 } },
    { id: "loc-5", name: "Food Court", icon: "🍔", fillPercentage: 90, status: "ALERT", color: "RED", coordinates: { x: 50, y: 20 } }
  ]);

  // Predictive Data State
  const [predictiveData, setPredictiveData] = useState({
    timeline: [
      { time: "5:00 PM", fillPercentage: 42, type: "historical" },
      { time: "6:00 PM", fillPercentage: 55, type: "historical" },
      { time: "7:00 PM", fillPercentage: 68, type: "historical" },
      { time: "8:00 PM", fillPercentage: 82, type: "predicted", isThresholdWarning: true },
      { time: "9:00 PM", fillPercentage: 95, type: "predicted", isCriticalAlert: true }
    ],
    predictions: [
      { location: "Hostel A", currentFill: 55, predictedFill9PM: 95, peakWindow: "8:00 PM - 9:00 PM", riskLevel: "HIGH", aiRecommendation: "Schedule cleanup before 7:45 PM to prevent 95% overflow spike." },
      { location: "Food Court", currentFill: 90, predictedFill9PM: 100, peakWindow: "1:00 PM - 3:00 PM & 8:00 PM - 10:00 PM", riskLevel: "CRITICAL", aiRecommendation: "IMMEDIATE DISCARD REQUIRED. Exceeding 85% threshold." },
      { location: "Canteen (Live)", currentFill: 0, predictedFill9PM: 50, peakWindow: "12:30 PM - 2:30 PM & 7:30 PM - 9:00 PM", riskLevel: "NORMAL", aiRecommendation: "Real-time AI camera streaming actively." },
      { location: "Library", currentFill: 20, predictedFill9PM: 35, peakWindow: "4:00 PM - 6:00 PM", riskLevel: "LOW", aiRecommendation: "Normal accumulation. Routine pickup tomorrow." },
      { location: "Hostel B", currentFill: 30, predictedFill9PM: 48, peakWindow: "8:30 PM - 10:00 PM", riskLevel: "LOW", aiRecommendation: "Safe level. Next check at 10 PM." }
    ],
    aiNotice: "AI Pattern Notice: Hostel A & Canteen experience rapid waste accumulation between 8:00 PM and 9:00 PM daily."
  });

  // Check Python AI backend status every 2 seconds
  useEffect(() => {
    const fetchPythonStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/campus/locations');
        if (res.ok) {
          const locs = await res.json();
          setCampusLocations(locs);
          setIsConnected(true);
        }

        const resPred = await fetch('http://localhost:5000/api/predictive/heatmap');
        if (resPred.ok) {
          const pred = await resPred.json();
          setPredictiveData(pred);
        }
      } catch (e) {
        setIsConnected(false);
      }
    };

    fetchPythonStatus();
    const interval = setInterval(fetchPythonStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDiscardManagement = async () => {
    try {
      await fetch('http://localhost:5000/api/bin/discard', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setBinData(prev => ({
      ...prev,
      fillPercentage: 5,
      status: "OK"
    }));
  };

  const handleUpdateLocation = (id, fillPercentage) => {
    setCampusLocations(prev => prev.map(loc => {
      if (loc.id === id) {
        const color = fillPercentage >= 80 ? 'RED' : fillPercentage >= 50 ? 'YELLOW' : 'GREEN';
        const status = fillPercentage >= 85 ? 'ALERT' : fillPercentage >= 50 ? 'MEDIUM' : 'LOW';
        return { ...loc, fillPercentage, color, status };
      }
      return loc;
    }));
  };

  const activeAlertCount = campusLocations.filter(loc => loc.fillPercentage >= 85).length;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={activeAlertCount}
        isConnected={isConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'camera' && (
          <CameraDetector
            binData={binData}
            setBinData={setBinData}
            onDiscardManagement={handleDiscardManagement}
          />
        )}

        {activeTab === 'heatmap' && (
          <CampusHeatmap
            locations={campusLocations}
            onUpdateLocation={handleUpdateLocation}
          />
        )}

        {activeTab === 'predictive' && (
          <PredictiveHeatmap
            predictiveData={predictiveData}
          />
        )}

        {activeTab === 'logs' && (
          <RealtimeLogs
            logs={binData.logs || []}
          />
        )}
      </main>

      <footer className="bg-white border-t-2 border-green-600 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-600 flex justify-between items-center">
          <div>
            <span className="font-bold text-gray-800">GreenLoop Python AI Waste Engine</span> © 2026 - College Campus Ecosystem
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-green-700 font-semibold">🟢 Green &lt;50%</span>
            <span className="text-amber-600 font-semibold">🟡 Yellow 50-80%</span>
            <span className="text-red-600 font-semibold">🔴 Red &gt;80%</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
