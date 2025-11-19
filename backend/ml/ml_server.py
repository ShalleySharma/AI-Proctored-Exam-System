from flask import Flask, request, jsonify
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import io
from PIL import Image

app = Flask(__name__)

# Load YOLO model
model = YOLO("yolov8l.pt")  # Using the yolov8l.pt model

@app.route("/process-ml", methods=["POST"])
def process_ml():
    try:
        print("Received ML processing request")
        data = request.get_json()
        if not data or 'image' not in data or 'sessionId' not in data:
            print("Missing image or sessionId")
            return jsonify({"error": "Missing image or sessionId"}), 400

        base64_image = data['image']
        session_id = data['sessionId']
        print(f"Session ID: {session_id}, Image length: {len(base64_image)}")

        # Strip data URL prefix if present
        if base64_image.startswith('data:image'):
            base64_image = base64_image.split(',')[1]
            print("Stripped data URL prefix")

        # Decode base64 image
        try:
            image_data = base64.b64decode(base64_image)
            print(f"Decoded image data length: {len(image_data)}")
            image = Image.open(io.BytesIO(image_data))
            img_array = np.array(image)
            print(f"Image array shape: {img_array.shape}")

            # Convert RGB to BGR for OpenCV
            if img_array.shape[2] == 3:  # RGB
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                print("Converted to BGR")
        except Exception as e:
            print(f"Error decoding image: {e}")
            return jsonify({
                "violations": [],
                "detected_objects": [],
                "person_count": 0,
                "face_count": 0,
                "gaze": "center"
            })

        # Run YOLO detection
        print("Running YOLO detection")
        try:
            results = model(img_array)
            print("YOLO detection completed")
        except Exception as e:
            print(f"YOLO detection failed: {e}")
            return jsonify({
                "violations": [],
                "detected_objects": [],
                "person_count": 0,
                "face_count": 0,
                "gaze": "center"
            })

        violations = []
        detected_objects = []
        person_count = 0
        face_count = 0
        gaze = "center"

        # Process results
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    class_name = model.names[cls]

                    detected_objects.append({
                        "class": class_name,
                        "confidence": conf,
                        "bbox": box.xyxy[0].tolist()
                    })

                    # Count persons (assuming person class is 0)
                    if cls == 0:  # person
                        person_count += 1

                    # Simple face detection (using person as proxy for face)
                    if cls == 0:  # person
                        face_count += 1

                    # Detect potential cheating objects
                    cheating_objects = ['cell phone', 'book', 'laptop', 'tablet', 'bottle']
                    if any(obj in class_name.lower() for obj in cheating_objects):
                        violations.append(f"ml_object_detected")

        # Face-related violations
        if face_count == 0:
            violations.append("ml_no_face_detected")
        elif face_count > 1:
            violations.append("ml_multiple_faces_detected")

        # Head pose and gaze (simplified - would need proper head pose estimation)
        # For now, assume center gaze
        if len(violations) > 0:
            # If violations detected, assume head pose away or gaze away
            violations.extend(["ml_head_pose_away", "ml_gaze_away"])

        return jsonify({
            "violations": violations,
            "detected_objects": detected_objects,
            "person_count": person_count,
            "face_count": face_count,
            "gaze": gaze
        })

    except Exception as e:
        print(f"ML processing error: {e}")
        return jsonify({
            "violations": [],
            "detected_objects": [],
            "person_count": 0,
            "face_count": 0,
            "gaze": "center"
        })

if __name__ == "__main__":
    print("🚀 Starting Python ML Server on port 5001...")
    app.run(host="0.0.0.0", port=5001, debug=True)
