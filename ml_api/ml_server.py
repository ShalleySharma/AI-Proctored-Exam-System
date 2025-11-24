from flask import Flask, request, jsonify
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import io
from PIL import Image
import math
import os

app = Flask(__name__)

# Load YOLO model
current_dir = os.path.dirname(os.path.abspath(__file__))  # Get directory of current script
weights_path = os.path.join(current_dir, "yolov8l.pt")
model = YOLO(weights_path)  # Using the yolov8l.pt model

detector = None
predictor = None
predictor_path = "backend/ml/shape_predictor_68_face_landmarks.dat"

model_points_3D = np.array([
    (0.0, 0.0, 0.0),             # Nose tip
    (0.0, -330.0, -65.0),        # Chin
    (-225.0, 170.0, -135.0),     # Left eye left corner
    (225.0, 170.0, -135.0),      # Right eye right corner
    (-150.0, -150.0, -125.0),    # Left Mouth corner
    (150.0, -150.0, -125.0)      # Right mouth corner
], dtype=np.float64)

def get_2d_image_points(shape):
    image_points = np.array([
        (shape.part(30).x, shape.part(30).y),     # Nose tip
        (shape.part(8).x, shape.part(8).y),       # Chin
        (shape.part(36).x, shape.part(36).y),     # Left eye left corner
        (shape.part(45).x, shape.part(45).y),     # Right eye right corner
        (shape.part(48).x, shape.part(48).y),     # Left Mouth corner
        (shape.part(54).x, shape.part(54).y)      # Right mouth corner
    ], dtype=np.float64)
    return image_points

def calculate_head_pose(shape, size):
    image_points = get_2d_image_points(shape)
    focal_length = size[1]
    center = (size[1] / 2, size[0] / 2)
    camera_matrix = np.array(
        [[focal_length, 0, center[0]],
         [0, focal_length, center[1]],
         [0, 0, 1]], dtype="double"
    )
    dist_coeffs = np.zeros((4, 1))
    success, rotation_vector, translation_vector = cv2.solvePnP(model_points_3D, image_points, camera_matrix, dist_coeffs)
    if not success:
        return None
    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    proj_matrix = np.hstack((rotation_matrix, translation_vector))
    _, _, _, _, _, _, eulerAngles = cv2.decomposeProjectionMatrix(proj_matrix)
    pitch, yaw, roll = [angle[0] for angle in eulerAngles]
    return pitch, yaw, roll

def get_gaze_direction(shape):
    left_eye_points = [shape.part(i) for i in range(36, 42)]
    right_eye_points = [shape.part(i) for i in range(42, 48)]

    def eye_center(eye_points):
        x = sum([pt.x for pt in eye_points]) / len(eye_points)
        y = sum([pt.y for pt in eye_points]) / len(eye_points)
        return (x, y)

    left_center = eye_center(left_eye_points)
    right_center = eye_center(right_eye_points)
    avg_x = (left_center[0] + right_center[0]) / 2
    avg_y = (left_center[1] + right_center[1]) / 2

    nose_point = (shape.part(30).x, shape.part(30).y)
    dx = avg_x - nose_point[0]

    if abs(dx) < 5:
        return "center"
    elif dx > 5:
        return "right"
    else:
        return "left"

@app.route("/process-ml", methods=["POST"])
def process_ml():
    import sys
    try:
        import dlib
        dlib_available = True
    except ModuleNotFoundError:
        dlib_available = False
        print("Warning: dlib module not available. Face pose and gaze detection will be skipped.")

    global detector
    global predictor
    predictor_path = "backend/ml/shape_predictor_68_face_landmarks.dat"
    if dlib_available and detector is None and predictor is None:
        detector = dlib.get_frontal_face_detector()
        try:
            predictor = dlib.shape_predictor(predictor_path)
        except RuntimeError as e:
            print(f"Error loading shape predictor: {e}")
            predictor = None

    try:
        print("Received ML processing request")
        data = request.get_json()
        if not data or 'image' not in data:
            print("Missing image")
            return jsonify({"error": "Missing image"}), 400

        base64_image = data['image']
        session_id = data.get('sessionId', 'unknown')
        print(f"Session ID: {session_id}, Image length: {len(base64_image)}")

        if base64_image.startswith('data:image'):
            base64_image = base64_image.split(',')[1]
            print("Stripped data URL prefix")

        try:
            image_data = base64.b64decode(base64_image)
            print(f"Decoded image data length: {len(image_data)}")
            image = Image.open(io.BytesIO(image_data))
            img_array = np.array(image)
            print(f"Image array shape: {img_array.shape}")

            if img_array.shape[2] == 3:
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

        print("Running YOLO detection")
        try:
            results = model(img_array, imgsz=320, conf=0.25, iou=0.45)
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
        head_pose_angles = None

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

                    if cls == 0:  # person
                        person_count += 1
                        face_count += 1

                    cheating_objects = ['cell phone', 'book', 'laptop', 'tablet', 'bottle']
                    if any(obj in class_name.lower() for obj in cheating_objects):
                        violations.append(f"ml_object_detected")

        if face_count == 0:
            violations.append("ml_no_face_detected")
        elif face_count > 1:
            violations.append("ml_multiple_faces_detected")

        if dlib_available and detector is not None and predictor is not None:
            gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
            faces = detector(gray, 0)
            if len(faces) > 0:
                shape = predictor(gray, faces[0])
                head_pose_angles = calculate_head_pose(shape, gray.shape)
                if head_pose_angles:
                    pitch, yaw, roll = head_pose_angles
                    print(f"Head pose angles - Pitch: {pitch:.2f}, Yaw: {yaw:.2f}, Roll: {roll:.2f}")
                    if abs(pitch) > 15 or abs(yaw) > 15:
                        violations.append("ml_head_pose_away")

                gaze = get_gaze_direction(shape)
                print(f"Gaze direction: {gaze}")
                if gaze != "center":
                    violations.append("ml_gaze_away")
            else:
                print("No face detected by dlib for pose/gaze")
                gaze = "center"
        else:
            if not dlib_available:
                print("Warning: dlib module not available, skipping face pose and gaze detection.")
            elif detector is None or predictor is None:
                print("Warning: dlib detector or predictor not properly initialized.")
            gaze = "center"

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
