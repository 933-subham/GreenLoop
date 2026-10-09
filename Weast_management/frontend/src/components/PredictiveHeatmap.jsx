import React from 'react';
import { TrendingUp, Sparkles, Clock, AlertTriangle, CheckCircle2, Cpu, Calendar } from 'lucide-react';

export default function PredictiveHeatmap({ predictiveData }) {
  const { timeline, predictions, aiNotice } = predictiveData;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border-2 border-green-600 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-green-600 animate-pulse" />
              <span>🔮 Future Predictive Waste Heatmap (AI Analysis)</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Machine Learning waste accumulation forecasting based on historical campus usage patterns.
            </p>
          </div>

          <div className="bg-green-50 border border-green-400 px-4 py-2 rounded-xl flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-green-700" />
            <span className="text-xs font-bold text-green-900">
              AI Forecasting Engine: ACTIVE (LSTM Time-Series)
            </span>
          </div>
        </div>
      </div>

      {/* Main Focus Card: Hostel A Timeline as specified in prompt */}
      <div className="bg-white p-6 rounded-2xl border-2 border-green-600 shadow-md">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏢</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Hostel A - Predictive Hourly Timeline</h3>
              <p className="text-xs text-gray-500">Current Status: 55% Filled at 6:00 PM</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-400 font-extrabold text-xs rounded-full">
            🟡 Medium Waste (55%)
          </span>
        </div>

        {/* Timeline Visualization */}
        <div className="mt-6 mb-8">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span>AI Projected Growth (6 PM to 9 PM Timeline):</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {timeline.map((item, idx) => {
              const isPast = item.type === 'historical';
              const isAlert = item.fillPercentage >= 85;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 transition-all shadow-sm ${
                    isAlert ? 'border-red-600 bg-red-50' : 
                    item.fillPercentage >= 80 ? 'border-amber-500 bg-amber-50' : 
                    'border-green-600 bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black text-gray-800">{item.time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      isPast ? 'bg-gray-200 text-gray-700' : 'bg-green-600 text-white'
                    }`}>
                      {isPast ? 'Recorded' : 'AI Predicted'}
                    </span>
                  </div>

                  <div className="text-3xl font-black my-2">
                    <span className={isAlert ? 'text-red-600 animate-pulse' : item.fillPercentage >= 50 ? 'text-amber-600' : 'text-green-600'}>
                      {item.fillPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                    <div
                      className={`h-full ${
                        isAlert ? 'bg-red-600' : item.fillPercentage >= 50 ? 'bg-amber-500' : 'bg-green-600'
                      }`}
                      style={{ width: `${item.fillPercentage}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] font-semibold text-gray-600 mt-2">
                    {idx === 0 && 'Base evening level'}
                    {idx === 1 && 'Hostel A current baseline (55%)'}
                    {idx === 2 && '⚠️ Approaching 82% threshold'}
                    {idx === 3 && '🚨 95% CRITICAL OVERFLOW SPIKE'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insight Highlight Box */}
        <div className="p-4 bg-green-50 rounded-xl border-2 border-green-600 flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-green-900 text-sm">🤖 AI Pattern Insight & Key Notice</h4>
            <p className="text-xs text-green-800 mt-1 font-medium leading-relaxed">
              {aiNotice}
            </p>
            <div className="mt-3 flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-600 text-white font-bold text-xs rounded-lg shadow">
                💡 Recommended Action: Dispatch Sanitation Team at 7:45 PM
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Predictive Matrix for All 5 Campus Locations */}
      <div className="bg-white p-6 rounded-2xl border-2 border-green-600 shadow-md">
        <h3 className="text-base font-bold text-gray-900 mb-4">
          All Campus Locations - AI Peak Forecast Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-extrabold">
              <tr>
                <th className="p-3">Location</th>
                <th className="p-3">Current Fill</th>
                <th className="p-3">Predicted 9 PM Fill</th>
                <th className="p-3">Peak Hours</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">AI Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold">
              {predictions.map((p, idx) => (
                <tr key={idx} className="hover:bg-green-50/50">
                  <td className="p-3 font-bold text-gray-900">{p.location}</td>
                  <td className="p-3 font-extrabold text-gray-700">{p.currentFill}%</td>
                  <td className="p-3 font-black text-red-600">{p.predictedFill9PM}%</td>
                  <td className="p-3 text-gray-600">{p.peakWindow}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-black ${
                      p.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-400' :
                      p.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-400' :
                      'bg-green-100 text-green-700 border border-green-400'
                    }`}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700 font-normal">{p.aiRecommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
