// Real-time AI Camera Detection & Waste Level Analytics Service

let liveBinData = {
  id: "bin-cam-01",
  location: "Canteen Camera #1",
  fillPercentage: 85, // Initial 85% alert state as requested
  capacityLiters: 100,
  currentWeightKg: 17.0,
  lastUpdated: new Date().toISOString(),
  status: "CRITICAL_ALERT", // OK, WARNING, CRITICAL_ALERT
  detectedObjects: ["plastic_bottle", "food_wrapper", "paper_cup"],
  isPersonDetected: false,
  isManagementCleaning: false,
  logs: [
    { time: new Date().toLocaleTimeString(), event: "System initialized. Bin at 85% capacity.", alert: true }
  ]
};

// 5 College Campus Locations Initialized
let campusLocations = [
  { id: "loc-1", name: "Library", icon: "🏫", fillPercentage: 20, status: "LOW", color: "GREEN", coordinates: { x: 20, y: 30 } },
  { id: "loc-2", name: "Canteen", icon: "🍱", fillPercentage: 85, status: "ALERT", color: "RED", coordinates: { x: 70, y: 25 } },
  { id: "loc-3", name: "Hostel A", icon: "🏢", fillPercentage: 55, status: "MEDIUM", color: "YELLOW", coordinates: { x: 40, y: 65 } },
  { id: "loc-4", name: "Hostel B", icon: "🏡", fillPercentage: 30, status: "LOW", color: "GREEN", coordinates: { x: 80, y: 75 } },
  { id: "loc-5", name: "Food Court", icon: "🍔", fillPercentage: 90, status: "ALERT", color: "RED", coordinates: { x: 50, y: 20 } }
];

export function getLiveBinData() {
  return liveBinData;
}

export function updateBinFill(percentage, actionReason = "Manual/AI Detection Update") {
  liveBinData.fillPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  liveBinData.lastUpdated = new Date().toISOString();
  
  if (liveBinData.fillPercentage >= 85) {
    liveBinData.status = "CRITICAL_ALERT";
  } else if (liveBinData.fillPercentage >= 50) {
    liveBinData.status = "WARNING";
  } else {
    liveBinData.status = "OK";
  }

  const newLog = {
    time: new Date().toLocaleTimeString(),
    event: `${actionReason}: Waste level now at ${liveBinData.fillPercentage}%`,
    alert: liveBinData.fillPercentage >= 85
  };
  liveBinData.logs.unshift(newLog);
  if (liveBinData.logs.length > 30) liveBinData.logs.pop();

  // Also update corresponding Canteen bin on campus map
  const canteenLoc = campusLocations.find(l => l.name === "Canteen");
  if (canteenLoc) {
    canteenLoc.fillPercentage = liveBinData.fillPercentage;
    canteenLoc.color = canteenLoc.fillPercentage >= 80 ? "RED" : canteenLoc.fillPercentage >= 50 ? "YELLOW" : "GREEN";
    canteenLoc.status = canteenLoc.fillPercentage >= 85 ? "ALERT" : canteenLoc.fillPercentage >= 50 ? "MEDIUM" : "LOW";
  }

  return liveBinData;
}

export function throwGarbage(amount = 5) {
  liveBinData.isPersonDetected = true;
  setTimeout(() => { liveBinData.isPersonDetected = false; }, 3000);
  return updateBinFill(liveBinData.fillPercentage + amount, "Person threw garbage");
}

export function discardByManagement() {
  liveBinData.isManagementCleaning = true;
  setTimeout(() => { liveBinData.isManagementCleaning = false; }, 3000);
  return updateBinFill(5, "Management team emptied dustbin");
}

export function getCampusLocations() {
  return campusLocations;
}

export function updateCampusLocation(id, fillPercentage) {
  const loc = campusLocations.find(l => l.id === id);
  if (loc) {
    loc.fillPercentage = Math.max(0, Math.min(100, Math.round(fillPercentage)));
    loc.color = loc.fillPercentage >= 80 ? "RED" : loc.fillPercentage >= 50 ? "YELLOW" : "GREEN";
    loc.status = loc.fillPercentage >= 85 ? "ALERT" : loc.fillPercentage >= 50 ? "MEDIUM" : "LOW";
  }
  return campusLocations;
}
