# How to Run Backend & Test on Mobile Device

## 1. Local Network Configuration
Your computer's LAN Wi-Fi IP is: **10.45.227.178**
Your mobile phone must be connected to the **same Wi-Fi network**.

---

## 2. Start the FastAPI Waste AI & LLM Service (Port 8000)
Run in a PowerShell terminal:
```powershell
cd "d:\waste management\ai_service"
python main.py
```
*(Optionally set your Gemini API key in environment or in `main.py`)*

---

## 3. Start the Node.js Express Backend (Port 5000)
Run in a second terminal:
```powershell
cd "d:\waste management\backend"
npm run dev
```

---

## 4. Run the React Native Mobile App (Expo)
Run in a third terminal:
```powershell
cd "d:\waste management\mobile"
npm install
npx expo start
```
1. Open the **Expo Go** app on your Android or iPhone.
2. Scan the terminal QR code.
3. The app loads instantly with:
   - Live camera snapshot mode
   - Integrated waste-only AI Chatbot
   - Google Maps live tracking with your API Key
   - Complete Citizen, Partner & Admin dashboards
