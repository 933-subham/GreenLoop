import sys
import io
import os

# Reconfigure stdout to UTF-8 for Windows compatibility
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import time
from werkzeug.utils import secure_filename
from detector import WasteDetectorAI

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ai_engine = WasteDetectorAI()
system_cap = None # Direct OpenCV VideoCapture instance

# Global campus state
campus_locations = [
    {"id": "loc-1", "name": "Library", "icon": "🏫", "fillPercentage": 20, "status": "LOW", "color": "GREEN", "coordinates": {"x": 20, "y": 30}},
    {"id": "loc-2", "name": "Canteen (Live AI)", "icon": "🍱", "fillPercentage": 0, "status": "LOW", "color": "GREEN", "coordinates": {"x": 70, "y": 25}},
    {"id": "loc-3", "name": "Hostel A", "icon": "🏢", "fillPercentage": 55, "status": "MEDIUM", "color": "YELLOW", "coordinates": {"x": 40, "y": 65}},
    {"id": "loc-4", "name": "Hostel B", "icon": "🏡", "fillPercentage": 30, "status": "LOW", "color": "GREEN", "coordinates": {"x": 80, "y": 75}},
    {"id": "loc-5", "name": "Food Court", "icon": "🍔", "fillPercentage": 90, "status": "ALERT", "color": "RED", "coordinates": {"x": 50, "y": 20}}
]

logs = [
    {"time": time.strftime("%H:%M:%S"), "event": "Python OpenCV Automatic AI Dustbin Detection Engine initialized.", "alert": False}
]

def update_campus_canteen(fill_pct, dustbin_detected=True):
    is_alert = fill_pct >= 85.0 and dustbin_detected
    for loc in campus_locations:
        if "Canteen" in loc["name"]:
            loc["fillPercentage"] = fill_pct if dustbin_detected else 0
            loc["color"] = "RED" if is_alert else "YELLOW" if fill_pct >= 50 and dustbin_detected else "GREEN"
            loc["status"] = "ALERT" if is_alert else "MEDIUM" if fill_pct >= 50 and dustbin_detected else "LOW"

    if is_alert and (len(logs) == 0 or not logs[0].get("alert", False)):
        logs.insert(0, {
            "time": time.strftime("%H:%M:%S"),
            "event": f"ALERT: Python AI Camera: Dustbin capacity exceeded 85% ({fill_pct}%)!",
            "alert": True
        })
        if len(logs) > 30: logs.pop()

@app.route('/api/detect', methods=['POST'])
def detect_frame():
    """Receive live webcam JPEG base64 frame from browser, run OpenCV AI analysis, return result"""
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"error": "No image payload"}), 400

        img_data = data['image']
        if ',' in img_data:
            img_data = img_data.split(',')[1]

        img_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Failed to decode image frame"}), 400

        annotated_frame, analysis = ai_engine.process_frame(frame)
        processed_b64 = ai_engine.frame_to_base64(annotated_frame)

        fill_pct = analysis.get("fill_percentage", 0)
        dustbin_detected = analysis.get("dustbin_detected", False)
        update_campus_canteen(fill_pct, dustbin_detected)

        return jsonify({
            "annotated_image": processed_b64,
            "analysis": analysis,
            "campus_locations": campus_locations,
            "logs": logs[:15]
        })

    except Exception as e:
        print(f"Detection Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/detect_system_cam', methods=['POST', 'GET'])
def detect_system_cam():
    """Capture directly from Python OpenCV VideoCapture(0) on hardware level"""
    global system_cap
    try:
        if system_cap is None or not system_cap.isOpened():
            system_cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if not system_cap.isOpened():
                system_cap = cv2.VideoCapture(0)

        ret, frame = system_cap.read()
        if not ret or frame is None:
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, "Python Camera Capture (No Hardware Device)", (50, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        annotated_frame, analysis = ai_engine.process_frame(frame)
        processed_b64 = ai_engine.frame_to_base64(annotated_frame)

        fill_pct = analysis.get("fill_percentage", 0)
        dustbin_detected = analysis.get("dustbin_detected", False)
        update_campus_canteen(fill_pct, dustbin_detected)

        return jsonify({
            "annotated_image": processed_b64,
            "analysis": analysis,
            "campus_locations": campus_locations,
            "logs": logs[:15]
        })
    except Exception as e:
        print(f"System Cam Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload_video', methods=['POST'])
def upload_video():
    """Upload video file for AI Dustbin & Garbage Fill level detection"""
    try:
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400

        file = request.files['video']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        # Inspect video using OpenCV
        cap = cv2.VideoCapture(save_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        duration_sec = round(total_frames / float(fps), 1)
        cap.release()

        logs.insert(0, {
            "time": time.strftime("%H:%M:%S"),
            "event": f"📹 Video file uploaded: {filename} ({duration_sec}s, {total_frames} frames)",
            "alert": False
        })

        return jsonify({
            "success": True,
            "filename": filename,
            "total_frames": total_frames,
            "fps": fps,
            "duration_sec": duration_sec
        })
    except Exception as e:
        print(f"Video upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/bin/discard', methods=['POST'])
def discard_bin():
    """Management team empties dustbin"""
    ai_engine.last_fill_percentage = 0.0
    for loc in campus_locations:
        if "Canteen" in loc["name"]:
            loc["fillPercentage"] = 5
            loc["color"] = "GREEN"
            loc["status"] = "LOW"
    
    logs.insert(0, {
        "time": time.strftime("%H:%M:%S"),
        "event": "Management team emptied dustbin. Fill level reset to 5%.",
        "alert": False
    })
    return jsonify({"success": True, "fill_percentage": 5})

@app.route('/api/campus/locations', methods=['GET'])
def get_campus_locations():
    return jsonify(campus_locations)

@app.route('/api/predictive/heatmap', methods=['GET'])
def get_predictive_heatmap():
    return jsonify({
        "timeline": [
            {"time": "5:00 PM", "fillPercentage": 42, "type": "historical"},
            {"time": "6:00 PM", "fillPercentage": 55, "type": "historical"},
            {"time": "7:00 PM", "fillPercentage": 68, "type": "historical"},
            {"time": "8:00 PM", "fillPercentage": 82, "type": "predicted", "isThresholdWarning": True},
            {"time": "9:00 PM", "fillPercentage": 95, "type": "predicted", "isCriticalAlert": True}
        ],
        "predictions": [
            {"location": "Hostel A", "currentFill": 55, "predictedFill9PM": 95, "peakWindow": "8:00 PM - 9:00 PM", "riskLevel": "HIGH", "aiRecommendation": "Schedule cleanup before 7:45 PM to prevent 95% overflow spike."},
            {"location": "Food Court", "currentFill": 90, "predictedFill9PM": 100, "peakWindow": "1:00 PM - 3:00 PM & 8:00 PM - 10:00 PM", "riskLevel": "CRITICAL", "aiRecommendation": "IMMEDIATE DISCARD REQUIRED. Bin exceeds 85% alert threshold."},
            {"location": "Canteen (Live)", "currentFill": int(ai_engine.last_fill_percentage), "predictedFill9PM": min(100, int(ai_engine.last_fill_percentage * 1.3)), "peakWindow": "12:30 PM - 2:30 PM & 7:30 PM - 9:00 PM", "riskLevel": "CRITICAL" if ai_engine.last_fill_percentage >= 85 else "NORMAL", "aiRecommendation": "Real-time AI camera streaming actively."},
            {"location": "Library", "currentFill": 20, "predictedFill9PM": 35, "peakWindow": "4:00 PM - 6:00 PM", "riskLevel": "LOW", "aiRecommendation": "Normal accumulation. Routine pickup tomorrow."},
            {"location": "Hostel B", "currentFill": 30, "predictedFill9PM": 48, "peakWindow": "8:30 PM - 10:00 PM", "riskLevel": "LOW", "aiRecommendation": "Safe level. Next check at 10 PM."}
        ],
        "aiNotice": "AI Pattern Notice: Hostel A & Canteen experience rapid waste accumulation between 8:00 PM and 9:00 PM daily."
    })

if __name__ == '__main__':
    print("=================================================================")
    print("Starting GreenLoop Automatic AI Dustbin Detection Engine on Port 5000")
    print("=================================================================")
    app.run(host='0.0.0.0', port=5000, debug=False)
