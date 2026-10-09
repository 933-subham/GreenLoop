// Future Heatmap AI Predictive Engine

export function getPredictiveHeatmapData() {
  // Hostel A historical and predicted trend timeline as detailed in prompt
  const hostelATrend = [
    { time: "5:00 PM", fillPercentage: 42, type: "historical" },
    { time: "6:00 PM", fillPercentage: 55, type: "historical" },
    { time: "7:00 PM", fillPercentage: 68, type: "historical" },
    { time: "8:00 PM", fillPercentage: 82, type: "predicted", isThresholdWarning: true },
    { time: "9:00 PM", fillPercentage: 95, type: "predicted", isCriticalAlert: true }
  ];

  const campusPredictions = [
    {
      location: "Hostel A",
      currentFill: 55,
      predictedFill9PM: 95,
      peakWindow: "8:00 PM - 9:00 PM",
      riskLevel: "HIGH",
      aiRecommendation: "Schedule cleanup before 7:45 PM to prevent 95% overflow spike during dinner peak hours."
    },
    {
      location: "Food Court",
      currentFill: 90,
      predictedFill9PM: 100,
      peakWindow: "1:00 PM - 3:00 PM & 8:00 PM - 10:00 PM",
      riskLevel: "CRITICAL",
      aiRecommendation: "IMMEDIATE DISCARD REQUIRED. Bin already exceeds 85% alert threshold."
    },
    {
      location: "Canteen",
      currentFill: 85,
      predictedFill9PM: 98,
      peakWindow: "12:30 PM - 2:30 PM & 7:30 PM - 9:00 PM",
      riskLevel: "CRITICAL",
      aiRecommendation: "Despatch team immediately. Reaching 98% by 9 PM."
    },
    {
      location: "Library",
      currentFill: 20,
      predictedFill9PM: 35,
      peakWindow: "4:00 PM - 6:00 PM",
      riskLevel: "LOW",
      aiRecommendation: "Normal accumulation pattern. Routine pickup tomorrow morning."
    },
    {
      location: "Hostel B",
      currentFill: 30,
      predictedFill9PM: 48,
      peakWindow: "8:30 PM - 10:00 PM",
      riskLevel: "LOW",
      aiRecommendation: "Safe level. Next check at 10 PM."
    }
  ];

  return {
    timeline: hostelATrend,
    predictions: campusPredictions,
    aiNotice: "AI detected pattern: Hostel A & Food Court experience 2.8x higher waste accumulation rates between 8:00 PM and 9:00 PM daily."
  };
}
