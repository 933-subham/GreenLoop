import React, { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle, Info, Send, Building2 } from 'lucide-react';

export default function CampusHeatmap({ locations, onUpdateLocation }) {
  const [selectedLocation, setSelectedLocation] = useState(locations[1] || locations[0]);

  // Color mapping helper
  const getColorBadge = (color) => {
    switch (color) {
      case 'GREEN':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-500',
          pinBg: 'bg-green-500',
          indicator: '🟢 Green (Low Waste < 50%)'
        };
      case 'YELLOW':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          border: 'border-amber-500',
          pinBg: 'bg-amber-500',
          indicator: '🟡 Yellow (Medium Waste 50-80%)'
        };
      case 'RED':
      default:
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-600',
          pinBg: 'bg-red-600',
          indicator: '🔴 Red (High Waste / Alert > 80%)'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border-2 border-green-600 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center space-x-2">
              <span>🏫 College Campus Waste Heatmap</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time spatial visualization of 5 campus location dustbin capacities & overflow alerts.
            </p>
          </div>

          {/* Color Meaning Legend */}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-800 border border-green-400 flex items-center space-x-1">
              <span>🟢</span> <span>Green = Low Waste (&lt;50%)</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-400 flex items-center space-x-1">
              <span>🟡</span> <span>Yellow = Medium Waste (50-80%)</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 border border-red-500 flex items-center space-x-1 animate-pulse">
              <span>🔴</span> <span>Red = High Waste (&gt;80%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Map & Location Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Map View */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border-2 border-green-600 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 text-base">Campus Interactive Blueprint Map</h3>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-300">
              5 Key Locations
            </span>
          </div>

          {/* Simulated Graphical Campus Map Area */}
          <div className="relative w-full h-96 bg-gray-50 border-2 border-green-300 rounded-xl overflow-hidden p-4 shadow-inner">
            
            {/* Campus Background Markings & Roads */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Campus Buildings Visual Boxes */}
            <div className="absolute top-12 left-10 w-36 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-white/80 p-2 text-xs font-bold text-gray-400">
              Academic Zone
            </div>
            <div className="absolute top-12 right-10 w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg bg-white/80 p-2 text-xs font-bold text-gray-400">
              Student Mess & Canteen
            </div>
            <div className="absolute bottom-10 left-20 w-44 h-28 border-2 border-dashed border-gray-300 rounded-lg bg-white/80 p-2 text-xs font-bold text-gray-400">
              Residential Hostels
            </div>

            {/* 5 Location Pins rendered on coordinates */}
            {locations.map((loc) => {
              const style = getColorBadge(loc.color);
              const isSelected = selectedLocation.id === loc.id;

              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  style={{ top: `${loc.coordinates.y}%`, left: `${loc.coordinates.x}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  {/* Pin Ripple / Pulsing Effect for Alert */}
                  {loc.color === 'RED' && (
                    <div className="absolute -inset-2 rounded-full bg-red-500 opacity-75 animate-ping"></div>
                  )}

                  {/* Location Marker */}
                  <div className={`relative px-3 py-1.5 rounded-full shadow-lg border-2 flex items-center space-x-1.5 transition-all ${
                    isSelected ? 'ring-4 ring-green-600 scale-110 z-30' : 'hover:scale-105'
                  } ${style.bg} ${style.border}`}>
                    <span className="text-base">{loc.icon}</span>
                    <span className={`text-xs font-extrabold ${style.text}`}>{loc.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-black text-white ${style.pinBg}`}>
                      {loc.fillPercentage}%
                    </span>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Quick List under Map */}
          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
            {locations.map((loc) => {
              const style = getColorBadge(loc.color);
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-2 rounded-lg border font-bold transition ${
                    selectedLocation.id === loc.id ? 'border-green-600 bg-green-50 shadow' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-base">{loc.icon}</div>
                  <div className="truncate text-[11px] text-gray-800">{loc.name}</div>
                  <div className={`mt-0.5 font-extrabold ${style.text}`}>{loc.fillPercentage}%</div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Column: Selected Location Detail Card */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="p-5 bg-white rounded-2xl border-2 border-green-600 shadow-md">
            <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-200">
              <span className="text-3xl">{selectedLocation.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedLocation.name}</h3>
                <p className="text-xs text-gray-500">Campus Sector Bin #LOC-{selectedLocation.id}</p>
              </div>
            </div>

            {/* Waste Percentage Meter */}
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-gray-600">Current Waste Level</span>
                <span className={`text-3xl font-black ${
                  selectedLocation.color === 'RED' ? 'text-red-600' :
                  selectedLocation.color === 'YELLOW' ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {selectedLocation.fillPercentage}%
                </span>
              </div>

              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div
                  className={`h-full transition-all duration-500 ${
                    selectedLocation.color === 'RED' ? 'bg-red-600' :
                    selectedLocation.color === 'YELLOW' ? 'bg-amber-500' : 'bg-green-600'
                  }`}
                  style={{ width: `${selectedLocation.fillPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Status Breakdown Box */}
            <div className={`p-4 rounded-xl border mb-4 ${getColorBadge(selectedLocation.color).bg} ${getColorBadge(selectedLocation.color).border}`}>
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-gray-800" />
                <span className={`font-bold text-sm ${getColorBadge(selectedLocation.color).text}`}>
                  {getColorBadge(selectedLocation.color).indicator}
                </span>
              </div>
              <p className="text-xs text-gray-700 mt-2">
                {selectedLocation.fillPercentage >= 80 
                  ? '⚠️ Critical capacity threshold reached. Sanitation crew alert generated.'
                  : selectedLocation.fillPercentage >= 50
                  ? '⚡ Moderate fill level. Scheduled for pickup during next shift.'
                  : '✅ Clean status. Normal operational capacity.'}
              </p>
            </div>

            {/* Simulated Live Adjuster for this location */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-gray-700">
                Update {selectedLocation.name} Waste Level:
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedLocation.fillPercentage}
                  onChange={(e) => onUpdateLocation(selectedLocation.id, parseInt(e.target.value) || 0)}
                  className="w-24 p-2 text-sm font-bold border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => onUpdateLocation(selectedLocation.id, 5)}
                  className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow transition"
                >
                  🧹 Empty Location Bin
                </button>
              </div>
            </div>

          </div>

          {/* All 5 Locations Overview Table */}
          <div className="p-5 bg-white rounded-2xl border-2 border-green-600 shadow-md">
            <h4 className="font-bold text-gray-900 text-sm mb-3">Campus Locations Status Summary</h4>
            <div className="space-y-2">
              {locations.map((loc) => {
                const style = getColorBadge(loc.color);
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className="flex justify-between items-center p-2.5 rounded-lg border border-gray-200 hover:border-green-500 cursor-pointer transition bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{loc.icon}</span>
                      <span className="text-xs font-bold text-gray-800">{loc.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-black ${style.bg} ${style.text}`}>
                        {loc.fillPercentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
