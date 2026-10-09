import cv2
import numpy as np
import base64
import time
import skfuzzy as fuzz

class FuzzyWasteInferenceEngine:
    """
    Fuzzy Logic Waste Inference System (FIS)
    Evaluates occupancy inside dustbin layers by combining pixel density,
    trash texture variance, and container wall subtraction.
    """
    def __init__(self):
        self.x_density = np.linspace(0, 1, 100)
        self.density_low = fuzz.trapmf(self.x_density, [0, 0, 0.15, 0.30])
        self.density_med = fuzz.trimf(self.x_density, [0.20, 0.45, 0.70])
        self.density_high = fuzz.trapmf(self.x_density, [0.55, 0.75, 1.0, 1.0])

    def evaluate_section(self, density, texture_variance, is_lower_filled=True):
        if not is_lower_filled:
            return 0.0, 'EMPTY'

        mu_low = fuzz.interp_membership(self.x_density, self.density_low, density)
        mu_med = fuzz.interp_membership(self.x_density, self.density_med, density)
        mu_high = fuzz.interp_membership(self.x_density, self.density_high, density)

        rule1_score = 0.0 * mu_low
        rule2_score = (0.2 if texture_variance < 0.25 else 0.5) * mu_med
        rule3_score = (1.0 if texture_variance > 0.30 else 0.7) * mu_high

        total_weight = mu_low + mu_med + mu_high
        fuzzy_score = (rule1_score + rule2_score + rule3_score) / total_weight if total_weight > 0 else 0.0

        if fuzzy_score >= 0.65:
            return fuzzy_score, 'FULL'
        elif fuzzy_score >= 0.35:
            return fuzzy_score, 'PARTIAL'
        else:
            return fuzzy_score, 'EMPTY'


class WasteDetectorAI:
    def __init__(self):
        self.fuzzy_engine = FuzzyWasteInferenceEngine()
        self.yolo_model = None
        self.layer4_full_start_time = None # Timestamp when Layer 4 first detected full
        
        try:
            from ultralytics import YOLO
            self.yolo_model = YOLO('yolov8n.pt')
            print("YOLOv8 Neural Network Loaded for Container Detection")
        except Exception as e:
            print("YOLO init note:", e)

    def detect_dustbin_container(self, frame):
        h, w, _ = frame.shape
        dustbin_bbox = None
        
        if self.yolo_model:
            try:
                results = self.yolo_model(frame, verbose=False, conf=0.30)
                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        cls_name = r.names[cls_id].lower()
                        x1, y1, x2, y2 = map(int, box.xyxy[0])

                        if cls_name in ['person', 'man', 'woman', 'face']:
                            continue

                        container_targets = ['bucket', 'trash can', 'bin', 'box', 'bowl', 'vase', 'sink', 'cup', 'suitcase']
                        if cls_name in container_targets:
                            dustbin_bbox = [x1, y1, x2, y2]
                            return True, dustbin_bbox
            except Exception as e:
                pass

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 40, 130)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        best_bbox = None
        max_score = 0

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 6000 < area < (h * w * 0.75):
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = float(bh) / max(1, bw)
                if 0.55 <= aspect_ratio <= 2.2:
                    score = area / (aspect_ratio + 0.1)
                    if score > max_score:
                        max_score = score
                        best_bbox = [x, y, x + bw, y + bh]

        if best_bbox:
            return True, best_bbox

        return False, None

    def process_frame(self, frame, custom_roi=None):
        """
        1. Detect Dustbin (Mark "Dustbin").
        2. STRICT MASKING: Everything OUTSIDE dustbin is zeroed out.
        3. ALWAYS DRAW 4 LAYERS (Layer 1: 25%, Layer 2: 50%, Layer 3: 75%, Layer 4: 100%).
        4. 6-SECOND VERIFICATION RULE:
           When garbage touches/fills Layer 4 (top layer), WAIT FOR 6 SECONDS!
           If Layer 4 stays filled continuously for 6 full seconds, THEN RING ALARM!
           If Layer 4 clears before 6s (e.g. hand passing), reset timer and NO alarm!
        """
        if frame is None or frame.size == 0:
            frame = np.zeros((480, 640, 3), dtype=np.uint8)

        h, w, _ = frame.shape
        annotated_frame = frame.copy()

        # Step 1: Detect Dustbin
        dustbin_detected, bbox = self.detect_dustbin_container(frame)

        # If NO Dustbin detected: Reset timer and return 0% fill, NO ALARM!
        if not dustbin_detected or bbox is None:
            self.layer4_full_start_time = None
            cv2.rectangle(annotated_frame, (0, 0), (w, 40), (40, 40, 40), -1)
            cv2.putText(annotated_frame, "STATUS: NO DUSTBIN DETECTED IN CAMERA VIEW", (20, 26),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            return annotated_frame, {
                "dustbin_detected": False,
                "fill_percentage": 0.0,
                "parts_filled": 0,
                "total_parts": 4,
                "status": "NO_DUSTBIN_DETECTED",
                "is_alert": False,
                "verifying_sec": 0.0,
                "detected_objects_count": 0,
                "timestamp": time.time()
            }

        # DUSTBIN IS DETECTED!
        x1, y1, x2, y2 = bbox
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w - 1, x2), min(h - 1, y2)
        
        dustbin_h = max(1, y2 - y1)
        dustbin_w = max(1, x2 - x1)

        # Step 2: STRICT SPATIAL MASKING (Zero out everything OUTSIDE dustbin)
        dustbin_mask = np.zeros((h, w), dtype=np.uint8)
        dustbin_mask[y1:y2, x1:x2] = 255
        masked_frame = cv2.bitwise_and(frame, frame, mask=dustbin_mask)

        # Extract Dustbin interior ROI for Fuzzy FIS Evaluation
        roi = masked_frame[y1:y2, x1:x2]
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        # Container Inner Wall Color Subtraction
        corner1 = hsv_roi[:15, :15]
        dominant_hue = np.median(corner1[:, :, 0]) if corner1.size > 0 else 100
        
        lower_wall = np.array([max(0, dominant_hue - 25), 40, 40])
        upper_wall = np.array([min(180, dominant_hue + 25), 255, 255])
        wall_mask = cv2.inRange(hsv_roi, lower_wall, upper_wall)
        
        # Trash object mask inside dustbin interior ONLY
        edges_roi = cv2.Canny(cv2.GaussianBlur(gray_roi, (5, 5), 0), 45, 130)
        s_channel = hsv_roi[:, :, 1]
        _, s_thresh = cv2.threshold(s_channel, 50, 255, cv2.THRESH_BINARY)
        trash_mask = cv2.bitwise_and(cv2.bitwise_or(edges_roi, s_thresh), cv2.bitwise_not(wall_mask))

        # Step 3: Divide Dustbin Height into 4 LAYERS & Evaluate with Fuzzy Logic
        layer_h = dustbin_h / 4.0
        layers_fuzzy_states = []
        filled_layers_count = 0
        is_lower_filled = True

        for i in range(4):
            ly2 = int(dustbin_h - i * layer_h)
            ly1 = int(dustbin_h - (i + 1) * layer_h)
            ly1, ly2 = max(0, ly1), min(dustbin_h, ly2)

            layer_crop_mask = trash_mask[ly1:ly2, :]
            layer_crop_gray = gray_roi[ly1:ly2, :]

            if layer_crop_mask.size > 0:
                density = np.count_nonzero(layer_crop_mask) / float(layer_crop_mask.size)
                texture_variance = np.std(layer_crop_gray) / 128.0 if layer_crop_gray.size > 0 else 0.0
            else:
                density = 0.0
                texture_variance = 0.0

            fuzzy_score, state = self.fuzzy_engine.evaluate_section(density, texture_variance, is_lower_filled)
            
            if state == 'FULL':
                filled_layers_count += 1
                is_lower_filled = True
            elif state == 'PARTIAL':
                filled_layers_count += 1
                is_lower_filled = False
            else:
                is_lower_filled = False

            layers_fuzzy_states.append((state, fuzzy_score))

        fill_percentage = min(100.0, round((filled_layers_count / 4.0) * 100.0, 1))

        # Step 4: 6-SECOND SUSTAINED VERIFICATION RULE FOR LAYER 4 (TOP LAYER)
        is_layer4_full = (filled_layers_count == 4 and layers_fuzzy_states[3][0] == 'FULL')
        verifying_sec = 0.0
        is_alert = False

        if is_layer4_full:
            if self.layer4_full_start_time is None:
                self.layer4_full_start_time = time.time()
            
            verifying_sec = round(time.time() - self.layer4_full_start_time, 1)

            # Check if Layer 4 has stayed full continuously for 6 SECONDS
            if verifying_sec >= 6.0:
                is_alert = True
                verifying_sec = 6.0
        else:
            # Layer 4 cleared or not full -> Reset 6-second timer
            self.layer4_full_start_time = None

        # Draw Dustbin Bounding Box & "Dustbin" Header
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.rectangle(annotated_frame, (x1, y1 - 30), (x1 + 140, y1), (0, 255, 0), -1)
        cv2.putText(annotated_frame, "Dustbin", (x1 + 10, y1 - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

        # Draw 4 Horizontal Layer Lines
        layer_colors = [
            (0, 255, 0),   # Layer 1: Green (25%)
            (0, 230, 255), # Layer 2: Yellow (50%)
            (0, 165, 255), # Layer 3: Orange (75%)
            (0, 0, 255)    # Layer 4: Red (100%)
        ]

        for i in range(4):
            layer_y = int(y2 - (i + 1) * layer_h)
            layer_pct = (i + 1) * 25
            is_layer_full = (i < filled_layers_count)

            cv2.line(annotated_frame, (x1, layer_y), (x2, layer_y), (255, 255, 255), 2)
            color = layer_colors[i] if is_layer_full else (200, 200, 200)
            status_tag = "FULL" if is_layer_full else "EMPTY"
            layer_text = f"Layer {i+1} ({layer_pct}%): {status_tag}"

            (tw, th), _ = cv2.getTextSize(layer_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated_frame, (x1 + 5, layer_y + 4), (x1 + 15 + tw, layer_y + 22), (0, 0, 0), -1)
            cv2.putText(annotated_frame, layer_text, (x1 + 10, layer_y + 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

        # Header Status Bar
        if is_alert:
            cv2.rectangle(annotated_frame, (0, 0), (w, 40), (0, 0, 255), -1)
            cv2.putText(annotated_frame, f"🚨 ALARM: LAYER 4 FULL SUSTAINED FOR 6s! DISCARD NEEDED",
                        (15, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
        elif is_layer4_full and verifying_sec < 6.0:
            cv2.rectangle(annotated_frame, (0, 0), (w, 40), (0, 165, 255), -1)
            cv2.putText(annotated_frame, f"⏳ LAYER 4 FULL - VERIFYING FOR 6s... ({verifying_sec}s / 6.0s)",
                        (15, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
        else:
            cv2.rectangle(annotated_frame, (0, 0), (w, 40), (0, 180, 0), -1)
            cv2.putText(annotated_frame, f"DUSTBIN DETECTED: {filled_layers_count}/4 LAYERS FILLED ({fill_percentage}%)",
                        (15, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

        return annotated_frame, {
            "dustbin_detected": True,
            "fill_percentage": fill_percentage,
            "parts_filled": filled_layers_count,
            "total_parts": 4,
            "fuzzy_states": [st[0] for st in layers_fuzzy_states],
            "status": "CRITICAL_ALARM" if is_alert else "VERIFYING_6S" if (is_layer4_full and verifying_sec < 6.0) else "OK",
            "is_alert": is_alert,
            "verifying_sec": verifying_sec,
            "dustbin_height_px": dustbin_h,
            "dustbin_bbox": bbox,
            "timestamp": time.time()
        }

    def frame_to_base64(self, frame):
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{jpg_as_text}"
