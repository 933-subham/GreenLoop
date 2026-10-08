# 📜 GreenLoop: Grounding Assumptions & Indian Standards

This document records all baseline assumptions, regulatory citations, tariffs, and environmental factors incorporated into GreenLoop's decision-support engines.

---

### 1. Electricity Tariffs & Financial Metrics (₹ INR)
- **Higher Education Campuses (College)**:
  - Benchmark tariff: **₹7.50 / kWh** (reflecting state distribution company commercial/institutional two-part tariffs).
- **Government Hospitals**:
  - Subsidized public health utility tariff: **₹6.80 / kWh**.
- **Industrial Estates & PSUs**:
  - High Tension (HT) Industrial Tariff: **₹8.90 / kWh**, with maximum demand penalty calculations for peak hours (6 PM - 9 PM).
- **Municipal Corporations & Civic Centers**:
  - Public utility rate: **₹7.20 / kWh**.

*Note: All tariffs are fully editable in real-time via the Admin Settings and Facility Configurator.*

---

### 2. Carbon Accounting & Grid Emission Factor
- **Central Electricity Authority (CEA) Baseline Database for the Indian Power Sector**:
  - Emission Factor adopted: **0.71 kg CO2e / kWh** (weighted average of regional grid generation).
  - Used to quantify avoided greenhouse gas emissions for every energy reduction action.
- **Diesel Transport Factor for Municipal Fleet**:
  - Compactor truck optimization computes **2.68 kg CO2e / liter** of diesel saved per consolidated route.

---

### 3. Water Tariffs & Consumption Benchmarks
- **Municipal Water Supply Tariff**:
  - Benchmark cost: **₹18.00 / kL** (₹0.018 per liter).
- **Night-Flow Loss Assessment**:
  - Unrepaired overhead tank leak: **1,800 Liters / night** = **1.8 kL / day** = **54 kL / month**.
  - Direct financial waste: approx **₹972 / month** in water tariffs, plus pumping energy costs.

---

### 4. Indian Central Pollution Control Board (CPCB) AQI Bands
GreenLoop maps real-time ambient particulate telemetry into official CPCB 6-tier categories:

| AQI Range | CPCB Category | Health Advisory Stated |
|---|---|---|
| **0 – 50** | Good | Minimal impact on health. |
| **51 – 100** | Satisfactory | Minor breathing discomfort to sensitive people. |
| **101 – 200** | Moderate | Breathing discomfort to people with asthma and heart diseases. |
| **201 – 300** | Poor | Breathing discomfort to most people on prolonged exposure. |
| **301 – 400** | Very Poor | Respiratory illness on prolonged exposure. Minimize outdoor physical activity. |
| **401+** | Severe | Affects healthy people and seriously impacts those with existing conditions. |

---

### 5. Policy Hooks
- **Solid Waste Management Rules, 2016**: Segregation at source into wet (biodegradable), dry (recyclable), and domestic hazardous.
- **Bio-Medical Waste Management Rules, 2016**: Mandatory 48-hour clearance of color-coded containers in healthcare establishments.
- **BEE Energy Conservation Building Code (ECBC)**: Operational benchmarking for daytime institutional cooling loads.
