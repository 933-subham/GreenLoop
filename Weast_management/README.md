# ♻️ GreenLoop - Real-Time AI Camera Waste Management & Campus Heatmap

A real-time AI-powered waste management dashboard built inside `D:\BPUT_HAC-PS04\Weast_management`.

---

## 🎨 Theme & Visual Design
- **Background Color**: White (`#ffffff`)
- **Borders & Accents**: Green (`#16a34a` / `#22c55e` theme borders)
- **Logo**: **GreenLoop** AI Waste Intelligence

---

## 🚀 Key Features

### 1. 📷 Real-Time AI Camera Waste Fill Detector
- Uses camera stream (physical webcam or real-time AI canvas stream).
- **Bounding Box ROI & Percentage Fill Calculation**: Real-time per-second visual analysis of dustbin capacity.
- **Real-Time Throw Detection**: Detects when someone throws garbage into the dustbin in real time (`+5%` / `+15%` increase).
- **Real-Time Discard Detection**: Detects when management team cleans/discards garbage (`empties dustbin to 5%`).
- **🚨 85%+ CRITICAL OVERFLOW ALERT**: Automatically triggers a high-priority red alert banner and sound notification when dustbin capacity exceeds **85%**.

### 2. 🏫 College Campus Waste Heatmap (5 Locations)
Interactive map visualizing 5 campus locations with color coding:
- 🟢 **Library** → `20% waste` (Low waste)
- 🔴 **Canteen** → `85% waste` (High waste / **ALERT THRESHOLD**)
- 🟡 **Hostel A** → `55% waste` (Medium waste)
- 🟢 **Hostel B** → `30% waste` (Low waste)
- 🔴 **Food Court** → `90% waste` (High waste / **ALERT THRESHOLD**)

#### Color Legend:
- 🟢 **Green** = Low waste (`< 50%`)
- 🟡 **Yellow** = Medium waste (`50% - 80%`)
- 🔴 **Red** = High waste / Attention needed (`> 80%`, alert at `85%+`)

### 3. 🔮 Future Heatmap AI Predictive Engine
- **Hostel A Example Timeline**:
  - `6:00 PM` → 55%
  - `7:00 PM` → 68%
  - `8:00 PM` → 82% (Warning)
  - `9:00 PM` → 95% (Critical Alert)
- **AI Pattern Recognition**: Detects peak waste accumulation window (**8:00 PM - 9:00 PM**) and recommends proactive team dispatch before overflow.

---

## 🛠️ How to Run Frontend and Backend

### Option A: Automatic 1-Click Launch (Windows)
Double-click `start_all.bat` or run in PowerShell:
```powershell
.\start_all.ps1
```

### Option B: Manual Terminal Launch

#### Step 1: Start Backend (Node.js + Express + WebSocket)
Open Terminal 1:
```bash
cd D:\BPUT_HAC-PS04\Weast_management\backend
npm install
npm start
```
- Backend runs at: `http://localhost:5000`
- WebSocket server runs at: `ws://localhost:5000`

#### Step 2: Start Frontend (React + Vite + Tailwind CSS)
Open Terminal 2:
```bash
cd D:\BPUT_HAC-PS04\Weast_management\frontend
npm install
npm run dev
```
- Frontend runs at: `http://localhost:5173`

---

## 📁 File Structure in `Weast_management/`
- `backend/`: Node.js, Express, WebSockets, AI detection service & predictive heatmap engine
- `frontend/`: React, Tailwind CSS, Lucide icons, Canvas camera detector, Heatmap UI
- `start_all.bat` / `start_all.ps1`: Launch scripts
