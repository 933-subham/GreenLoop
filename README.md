# 🌿 GreenLoop: Sustainable Facility & Estate Intelligence Platform
### AI-Powered Decision Support Dashboard for Indian Institutions & Municipal Logistics
**Prepared for BPUT Hackathon — Problem Statement PS-4**

[![React](https://img.shields.io/badge/Frontend-Strictly_React_19_+_Vite-61DAFB?logo=react)](https://react.dev/)
[![Node](https://img.shields.io/badge/Backend-Node.js_+_Express-339933?logo=node.js)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/AI_Microservice-FastAPI_+_Scikit--Learn-3776AB?logo=python)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Local-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Open-Meteo](https://img.shields.io/badge/Live_AQI-Open--Meteo_Free_API-008080)](https://open-meteo.com/)

---

## 🎯 Winning Rubric Alignment (100% PS-4 Coverage)

| Evaluation Rubric | Weight | Implementation in GreenLoop React App |
|---|:---:|---|
| **Sustainability & Relevance across Indian Facilities** | **20%** | **4 Configurable Indian Facility Templates** (Engineering College, Government Hospital, Industrial Estate, DPS School). Solves real hostel power surges, overhead tank leaks, Indian tariffs (₹7.50/kWh), and CEA grid emission factor (`0.71 kg CO2e/kWh`). |
| **Data Engineering & Visualization** | **20%** | Clean schema, simulated IoT sensor streaming (50 Hz, 230 V), interactive Leaflet OpenStreetMap (100% free), animated water tanks, 24h load heatmaps, and **free live Open-Meteo ambient air quality & CPCB bands**. |
| **AI/ML: Forecasting & Anomaly Detection** | **20%** | **Gradient Boosting 24h Energy Forecaster** with an explicit **Backtest MAPE (4.82% vs Seasonal-Naive: 15.34%)** shown on screen! Robust Z-Score (MAD) and Isolation Forest for class-hour hostel surges; 01:00–04:00 AM water night-leak detection. |
| **Actionability of Recommendations** | **15%** | Unified ranked actions list where every recommendation is quantified in **₹ INR savings, kg CO2e avoided, kWh energy saved, and kL water conserved** with assigned owners. |
| **Usability for Facility Administrators & Roles** | **10%** | Role-tailored React views: **Website 1: OrgPortal** (`/org`), **Hostel Warden** (`/warden` mobile 390px view), **Website 2: MunicipalPortal** (`/municipality`), and **Municipal Driver** (`/driver` mobile 390px view). |
| **Explainability & Assumptions** | **10%** | **"Why was this flagged?"** drawer on every alert and action explaining baseline math, MAD z-scores, confidence, and regulatory assumptions. |
| **Demo Quality & Live Fault Injection** | **5%** | **Live Demo Console (`/demo`)** with 1-click buttons to inject faults live (*Floor 3/4 surge, Tank A leak, Bin 4 88% overflow, camera heavy scrap*) and instant reset. |

---

## 🏛️ Two Dedicated React Websites & Closed-Loop Architecture

### 🏢 Website 1: Organization Estate Portal (`/org`)
- **Target Institutions:** Engineering Colleges, Hospitals, Industrial Estates, Schools.
- **Power SCADA:** Multi-floor monitoring (Hostel Floors 1–4). Daytime lecture hours schedule filter (09:30–16:30). Detects Floor 4 surge ($29.8\text{ kW}$) and provides **"⚡ 1-Click Alert Warden"** button.
- **Water SCADA:** Overhead Tank A level with continuous night-leak detection ($1.25\text{ L/min}$ drop between 01:00–04:00 AM, wasting $1,800\text{ L/night}$). Plumber dispatch button.
- **Hourly Camera Waste AI:** Automated 1-hour camera snapshot simulation at central yard with YOLOv8 heavy waste detection.
- **Internal Campus Waste Reporting:** Students/employees inside campus upload photo, campus location, and note $\rightarrow$ Management assigns janitor $\rightarrow$ Janitor clears waste into the **Campus Main Exterior Dump Bin**.
- **Exterior Dump Bin & Municipal Bridge:** When the main exterior dump bin crosses $\ge 80\%$, an automated collection alert is routed to **Website 2 (Municipality)**!
- **Warden Cockpit (`/warden`):** Mobile 390px view where Warden Manoj Dash reviews Floor 4 surge, inspects rooms, and marks **"Checked & Resolved"**, returning draw to normal baseline.

### 🚛 Website 2: Municipality Logistics Portal (`/municipality`)
- **City Administration View:** Interactive Leaflet city map showing registered organizations' exterior bins and citizen street hotspots.
- **Partner Approval Workflow:** Review pending contractor applications (vehicle number, vehicle type, phone, coverage zone, capacity) with **"✅ Approve"** and **"❌ Reject"** buttons. Only approved partners receive tasks!
- **Auto-Dispatch Engine:** Automatically assigns nearest approved partner (Driver Ramesh) based on distance, load ratio, and shift time.
- **Driver Cockpit (`/driver`):** Mobile 390px view with turn-by-turn route navigation, start trip, arrived, and **"📸 Upload Proof Photo & Complete"**. Completing pickup **instantly resets the organization's exterior bin on Website 1 back to 6% (Clean)**!
- **Public Citizen Street Report:** For garbage spotted on public streets/roads outside any organization boundary $\rightarrow$ citizen uploads photo and location $\rightarrow$ routes directly to Municipality and auto-dispatches nearest partner!

---

## 🚀 How to Run in 1 Click

### Option 1: 1-Click Full-Stack Launcher (Recommended)
Double-click or run from root:
```cmd
start_all.bat
```
*(or in PowerShell: `.\start_all.ps1`)*

This starts:
1. Local MongoDB verification
2. Python AI & Analytics Microservice (`http://localhost:8000`)
3. Node.js Express Backend API (`http://localhost:5000/api`)
4. React + Vite Frontend (`http://localhost:5173`)
5. Automatically opens **Website 1 (`/org`)** and **Website 2 (`/municipality`)** in your browser tabs!

---

### Option 2: Manual Terminal Execution

#### Terminal 1 — Python AI Microservice
```bash
cd ai_service
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Terminal 2 — Node.js Express API
```bash
cd backend
npm run seed-greenloop   # Seeds facilities, 6,624 sensor records, bins, partners, and accounts
npm start               # Runs API on port 5000
```

#### Terminal 3 — React + Vite Frontend
```bash
cd frontend
npm run dev             # Launches React on http://localhost:5173
```

---

## 🔐 Seeded Accounts (Password: `Demo@1234`)

| Role | Email | Password | Primary Portal |
|---|---|---|---|
| **Campus Admin** | `head@college.demo` | `Demo@1234` | `http://localhost:5173/org` |
| **Hostel Warden** | `warden@college.demo` | `Demo@1234` | `http://localhost:5173/warden` (Mobile 390px) |
| **Sustainability Officer** | `officer@college.demo` | `Demo@1234` | `http://localhost:5173/sustainability` |
| **Municipal Head** | `admin@municipal.demo` | `Demo@1234` | `http://localhost:5173/municipality` |
| **Municipal Driver** | `driver1@municipal.demo` | `Demo@1234` | `http://localhost:5173/driver` (Mobile 390px) |
| **Student / Citizen** | `student@college.demo` | `Demo@1234` | `http://localhost:5173/citizen/dashboard` |

---

## 📁 Evaluation Documentation in `docs/`
- **[System Architecture & Mermaid Diagrams](docs/ARCHITECTURE.md)**
- **[Data Dictionary & Telemetry Schema](docs/DATA_DICTIONARY.md)**
- **[Model Card & ML Validation](docs/MODEL_CARD.md)**
- **[Grounding Assumptions & Tariffs](docs/ASSUMPTIONS.md)**
- **[5-Minute Pitch & Demo Script](docs/DEMO_SCRIPT.md)**
