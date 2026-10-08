# 🤖 GreenLoop: Model Card & Analytics Methodology

## 1. Energy Forecasting Model
- **Algorithm**: `GradientBoostingRegressor` (Scikit-Learn).
- **Features Used**: Hour of day (0-23), Day of week (0-6), Weekend indicator, Academic schedule flag, Ambient dry bulb temperature (°C).
- **Forecast Horizon**: 24 hours ahead, producing central prediction, upper bound (112%), and lower bound (90%).
- **Backtesting & Validation**:
  - Evaluated on a 48-hour out-of-sample test split.
  - **Model MAPE**: **4.82%**
  - **Seasonal-Naive Baseline MAPE**: **15.34%**
  - **Accuracy Gain**: **+10.52%** improvement over naive persistence.

---

## 2. Power Anomaly Detection Model
- **Algorithm**: Dual-Layer Anomaly Filter:
  1. **Robust Z-Score (MAD)**:
     $$\text{Robust } Z = 0.6745 \times \frac{x - \text{median}}{\text{MAD} + \epsilon}$$
     Anomalies flagged if $\text{Robust } Z > 3.5$ for $\ge 2$ consecutive hours.
  2. **Multivariate Isolation Forest**:
     Trained on $[kW, \text{hour}, \text{temperature}]$ with $4\%$ contamination rate to flag multidimensional anomalies.
- **Facility Domain Rule**:
  In engineering college hostels, weekday class hours (09:00 - 16:00) have low expected occupancy. Usage $>2.2 \text{ MAD}$ above baseline is flagged aggressively to identify unoccupied rooms with running ACs or heating rods.

---

## 3. Water Intelligence & Night Leak Detection
- **Algorithm**: Night Flow Depletion Rule (01:00 AM – 04:00 AM).
- **Logic**: Baseline student/ward tap activity between 1 AM - 4 AM is $<5$ L/hr. Continuous level reduction $>1.8\%$ per hour with the pump off indicates physical leakage (pipe fracture, flush tank valve failure).
- **Refill Detection**: Sudden jump $\ge +8\%$ in level while pump is active marks an intentional refill cycle.

---

## 4. Waste Bin Fill & ETA Estimation
- **Algorithm**: Moving slope derivative over the recent 12-hour window.
- **Hours-to-Full Calculation**:
  $$\text{ETA (hours)} = \frac{100 - \text{Current Fill \%}}{\text{Fill Rate (\% / hr)}}$$
- **Mode Badge**: "Simulated slope estimator (transparent physics heuristic)".

---

## 5. Known Limitations & Safe Decision Support
- Outputs are intended as **decision-support insights, not official statutory measurements**.
- Injected synthetic faults represent simulated sensor telemetry designed to demonstrate algorithmic detection without placing physical campus infrastructure at risk.
- Camera feeds respect privacy: vision models inspect bin interior volumes only, without facial recognition or personal tracking.
