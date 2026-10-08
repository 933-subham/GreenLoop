# 🎯 GreenLoop: 5-Minute Hackathon Winning Demo Script

Follow this exact flow during your pitch to judges at the BPUT Hackathon. This flow hits every single rubric criterion within 5 minutes.

---

### Pre-Demo Preparation (1 Minute Before Pitch)
1. Ensure servers are running (`start_all.bat` or `npm run dev` in frontend, backend, and `ai_service`).
2. Open Chrome to `http://localhost:5173/admin/dashboard`.
3. Open a second window to `http://localhost:5173/warden` (press F12 -> Toggle Device Toolbar to 390px iPhone/Android width).
4. Open a third tab to `http://localhost:5173/demo`.

---

### Minute 1: The Pitch & Campus Administrator Dashboard (20% Usability & Relevance)
- **Say**: *"Good morning, respected judges. Institutional campuses—whether university colleges like BPUT, district hospitals, or industrial estates—run on fragmented sensor data. Energy waste during off-hours, overhead tank leaks, and overflowing waste bins go unnoticed, wasting lakhs in public funds and generating unnecessary carbon emissions. We built GreenLoop: an AI-powered, closed-loop sustainability and facility intelligence platform designed specifically for Indian institutions."*
- **Show**: On `http://localhost:5173/admin/dashboard`:
  - Point to the **Facility Sustainability Score (82.4/100)** with breakdown across Power, Water, Waste, and Air Quality.
  - Show the **Top 5 Ranked Quantified Actions** with impact in **₹ INR, kg CO2e, kWh, and kL water**.
  - Click **"Why Flagged?"** on the Floor 3 Power Surge action to show the statistical MAD Z-score (+4.35) and Indian tariff assumptions.

---

### Minute 2: ML Rigour & Sustainability Officer View (20% ML Rubric)
- **Say**: *"Judges evaluate ML not on buzzwords, but on validation and error metrics. Let's inspect our analytics engine."*
- **Click**: Navigate to **Sustainability & AI (`/sustainability`)**:
  - Show the **24-Hour Energy Forecast** chart.
  - Point to the prominent **Backtest MAPE Badge**:
    *"Notice our honest backtest: our Gradient Boosting model achieves a 4.82% MAPE over an out-of-sample 48-hour backtest, outperforming the Seasonal-Naive baseline (15.34%) by over 10.5%."*
  - Show the **Live Ambient CPCB AQI Card**:
    *"Here is real-time ambient particulate data fetched via the 100% free Open-Meteo API for Rourkela coordinates, mapped directly to Indian Central Pollution Control Board categories."*

---

### Minute 3: Hostel Warden Operational Flow (10% Usability Rubric)
- **Say**: *"Insights are useless without operations. Let's switch to our hostel warden on mobile."*
- **Show**: Switch to the 390px mobile view on `/warden`:
  - Show the Floor 3 alert: *"High Power Surge on Floor 3 during class hours: 29.8 kW"*.
  - Tap **"Acknowledge"**, then tap **"Mark Resolved"**.
  - Type note: *"Inspected Room 214; turned off two 1.5kW appliances."*
  - Tap **Confirm**. Notice the alert immediately updates!

---

### Minute 4: Smart Waste Closed Loop & Municipal Dispatch (15% Actionability)
- **Say**: *"Now let's demonstrate our complete closed-loop waste dispatch workflow."*
- **Show**:
  1. In the Admin Dashboard, show **Canteen Food Court Bin #4** flagged at **92% fill** with an overflow ETA of 1.5 hours.
  2. Click **"Verify & Confirm Pickup"**.
  3. Switch to `/municipality`: Point to the live Leaflet map. The nearest municipal truck (Driver Ramesh Kumar) has been auto-assigned. Show the **"Why This Driver"** box explaining the algorithmic score (distance + load + shift).
  4. Switch to `/driver` on mobile: Tap **"Start Navigation"**, then tap **"Upload Cleanup Proof & Complete"**.
  5. The pickup closes and the bin resets to clean!

---

### Minute 5: Facility Switcher & Live Fault Injection (20% Multi-Facility & 5% Demo)
- **Say**: *"GreenLoop isn't just for colleges. With one click, we can reconfigure for any Indian facility."*
- **Click**: In the top Navbar, switch from **🎓 BPUT College** to **🏥 District Hospital** or **🏭 Industrial Estate**.
  - Show how the baselines, tariffs (₹8.90/kWh), and rules reconfigure immediately!
- **Show**: Open `/demo` and demonstrate the one-click fault injection buttons:
  - Click **"Inject Floor 3 Power Surge"** or **"Start Tank A Night Leak"**.
  - Show how alerts and numbers react in real-time.
  - Click **"Reset All Demo Faults"** to show a clean baseline.
- **Conclude**: *"GreenLoop provides complete transparency, zero paid API costs, and measurable financial and carbon savings for Indian institutions. Thank you!"*
