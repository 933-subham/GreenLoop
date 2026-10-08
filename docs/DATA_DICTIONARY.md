# 📖 GreenLoop: Data Dictionary & Telemetry Schema

This document specifies all data models, columns, measurement units, sampling intervals, and data sources utilized across GreenLoop.

---

### 1. `SensorReading` (Power & Water Telemetry)

| Field | Type | Unit | Interval | Description | Example / Allowed Values |
|---|---|---|---|---|---|
| `facilityId` | String | – | – | Scoped facility identifier | `'bput_college'`, `'district_hospital'` |
| `module` | String | – | – | Sensor domain | `'power'`, `'water'` |
| `zoneId` | String | – | – | Physical campus zone | `'Floor-1'`, `'Floor-3'`, `'Tank-A'` |
| `timestamp` | DateTime | ISO 8601 | Hourly | Telemetry acquisition time | `2026-10-08T11:00:00.000Z` |
| `value` | Number | kW / % | Hourly | Power draw in kW or Tank Level % | `29.8` (kW) or `68.5` (%) |
| `pumpOn` | Boolean | – | Hourly | Status of tank refill pump | `true` / `false` |
| `isClassHours`| Boolean | – | Hourly | Campus schedule flag (09:00-16:00) | `true` / `false` |
| `isWeekend` | Boolean | – | Hourly | Weekend occupancy flag | `true` / `false` |
| `temperature` | Number | °C | Hourly | Ambient facility temperature | `31.2` |
| `qualityFlag` | String | – | – | Ingestion data hygiene indicator | `'valid'`, `'injected_fault'`, `'interpolated'` |

---

### 2. `Bin` (Smart Waste Containers)

| Field | Type | Unit | Description | Example / Allowed Values |
|---|---|---|---|---|
| `binCode` | String | – | Unique hardware identifier | `'BIN-04'` |
| `name` | String | – | Physical location description | `'Central Canteen Food Court'` |
| `zoneId` | String | – | Campus micro-zone | `'Canteen-Area'` |
| `capacityL` | Number | Liters | Total bin volume | `240` |
| `wasteType` | String | – | Segregation category | `'Organic'`, `'Recyclable'`, `'Hazardous'`, `'Mixed'` |
| `currentFillPct` | Number | % | Real-time estimated fill level | `92.0` |
| `fillRatePerHour`| Number | %/hr | Linear rate of accumulation | `8.2` |
| `hoursToFull` | Number | Hours | Forecaster time until overflow | `1.5` |
| `urgency` | String | – | Operational priority | `'low'`, `'medium'`, `'critical'` |
| `verificationStatus` | String | – | State machine status | `'unverified'`, `'verified'`, `'requested'`, `'assigned'`, `'collected'` |

---

### 3. `Alert` (Explainable Decision Insights)

| Field | Type | Description |
|---|---|---|
| `module` | String | Domain: `'power'`, `'water'`, `'waste'`, `'air_quality'` |
| `zoneId` | String | Flagged zone (e.g. `'Floor-3'`, `'Tank-A'`) |
| `severity` | String | `'low'`, `'medium'`, `'high'`, `'critical'` |
| `status` | String | Lifecycle: `'open'`, `'acknowledged'`, `'resolved'`, `'false_alarm'` |
| `why.metric` | String | Telemetry metric observed |
| `why.actualValue` | String | Observed value (e.g. `'29.8 kW'`) |
| `why.baselineExpected`| String | Historical median (e.g. `'12.4 kW'`) |
| `why.statisticalZScore`| Number | Robust Z-score (MAD multiples, e.g. `4.35`) |
| `impact.rupees` | Number | Financial impact in Indian Rupees (₹) |
| `impact.kwh` | Number | Electrical energy impact in kWh |
| `impact.co2e_kg` | Number | Avoided carbon emissions in kg CO2e |
| `impact.kl` | Number | Conserved water in kilo-Liters (kL) |
| `confidence` | Number | Statistical confidence (0.0 to 1.0, e.g. `0.94`) |

---

### 4. `Open-Meteo Weather & AQI Feed`

| Metric | Source | Unit | Indian Standard / CPCB Category |
|---|---|---|---|
| `temperature_c` | Open-Meteo Forecast | °C | Ambient 2m dry bulb temperature |
| `relative_humidity_2m` | Open-Meteo Forecast | % | Ambient relative humidity |
| `pm25` | Open-Meteo Air Quality | µg/m³ | CPCB Breakpoints (0-30 Good, 31-60 Satisfactory, 61-90 Moderate, 91-120 Poor, 121-250 Very Poor, 250+ Severe) |
| `pm10` | Open-Meteo Air Quality | µg/m³ | CPCB Breakpoints (0-50 Good, 51-100 Satisfactory, 101-250 Moderate, 251-350 Poor, 351-430 Very Poor, 430+ Severe) |
