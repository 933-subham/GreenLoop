import React from 'react';
import { Leaf, Camera, MapPin, TrendingUp, Activity, Bell } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, alertCount, isConnected }) {
  return (
    <header className="bg-white border-b-2 border-green-600 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600 animate-pulse" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                Green<span className="text-green-600">Loop</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-400">
                AI Waste Intelligence
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === 'camera'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>AI Camera Detector</span>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === 'heatmap'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Campus Heatmap</span>
            </button>

            <button
              onClick={() => setActiveTab('predictive')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === 'predictive'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Future Heatmap AI</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === 'logs'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Live Analytics</span>
            </button>
          </nav>

          {/* Real-time Status Badge & Alert Bell */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-green-50 border border-green-300 px-3 py-1.5 rounded-full">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-xs font-semibold text-green-900">
                {isConnected ? 'Real-Time Sync (1s)' : 'Offline / Simulating'}
              </span>
            </div>

            {alertCount > 0 && (
              <div className="relative">
                <div className="p-2 bg-red-100 border border-red-500 rounded-full text-red-600 animate-bounce">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {alertCount}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
