import cv2
import numpy as np
from ultralytics import YOLO
import mediapipe as mp
import logging
from collections import deque

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Initialize the YOLO model
model = YOLO("yolov8n.pt")  # Replace with your YOLO model file

# Confidence threshold
CONFIDENCE_THRESHOLD = 0.5  # Increased from 0.3 to reduce false positives

# Initialize MediaPipe Face Detection and Face Mesh
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils
mp_face_mesh = mp.solutions.face_mesh

# Initialize face detection and face mesh models
face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5)

# Gaze tracking history for stability
GAZE_HISTORY = deque(maxlen=5)  # Stores last 5 predictions

def detectObject(frame, confidence_threshold=CONFIDENCE_THRESHOLD, resize_width=640):
    """
    Perform object detection on a single frame, focusing on 'cell phone', 'book', and 'person'.

    Args:
        frame (ndarray): Input image frame in BGR format.
        confidence_threshold (float): Confidence threshold for object detection.
        resize_width (int): Width to resize the frame for faster processing. Aspect ratio is maintained.

    Returns:
        labels_this_frame (list): List of detected labels with their confidence scores.
        processed_frame (ndarray): Frame with detection results (bounding boxes and labels).
        person_count (int): Number of detected persons.
        detected_objects (list): List of detected objects ("cell phone", "book", "person").
    """
    labels_this_frame = []
    detected_objects = []  # Track objects of interest (cell phone, book, person)
    person_count = 0

    # Validate input frame
    if frame is None or not isinstance(frame, np.ndarray):
        raise ValueError("Invalid frame. Please provide a valid numpy array.")

    # Resize the frame to improve processing speed
    height, width = frame.shape[:2]
    if width > resize_width:
        aspect_ratio = height / width
        frame = cv2.resize(frame, (resize_width, int(resize_width * aspect_ratio)))

    try:
        # Perform object detection
        results = model(frame)

        for result in results:
            # SAFE box processing - check for None/empty boxes
            if result.boxes is None or result.boxes.data is None:
                continue

            boxes_data = result.boxes.data.cpu().numpy()
            if boxes_data is None or len(boxes_data) == 0:
                continue

            for box in boxes_data:
                try:
                    # SAFE unpacking - handle different box formats
                    if len(box) < 6:
                        continue  # Skip malformed boxes

                    x1, y1, x2, y2, score, class_id = box[:6]

                    # Calculate bounding box area to filter small objects
                    box_area = (x2 - x1) * (y2 - y1)
                    min_area_threshold = 0.01 * frame.shape[0] * frame.shape[1]  # 1% of frame area

                    if score > confidence_threshold and box_area > min_area_threshold:  # Apply confidence and size thresholds
                        # SAFE class ID handling - prevent IndexError
                        try:
                            class_id_int = int(class_id)
                            if class_id_int not in model.names:
                                label = "unknown"
                            else:
                                label = model.names[class_id_int]
                        except (ValueError, KeyError, IndexError):
                            label = "unknown"

                        labels_this_frame.append((label, float(score)))

                        # Check for specific objects (cell phone, book, person, laptop, remote, keyboard, mouse)
                        if label.lower() == "person":
                            person_count += 1
                            detected_objects.append("person")
                        elif label.lower() in ["cell phone", "cellphone", "mobile phone", "smartphone"]:
                            detected_objects.append("cell phone")
                        elif label.lower() == "book":
                            detected_objects.append("book")
                        elif label.lower() == "laptop":
                            detected_objects.append("laptop")
                        elif label.lower() == "remote":
                            detected_objects.append("remote")
                        elif label.lower() == "keyboard":
                            detected_objects.append("keyboard")
                        elif label.lower() == "mouse":
                            detected_objects.append("mouse")

                        # Draw bounding box in blue - SAFE coordinates
                        try:
                            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
                            # Draw label and confidence value in red
                            cv2.putText(frame, f"{label} {score:.2f}", (int(x1), int(y1) - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                        except (ValueError, OverflowError):
                            # Skip drawing if coordinates are invalid
                            pass

                except (ValueError, IndexError, TypeError) as e:
                    # Skip malformed boxes
                    logging.warning(f"Skipping malformed box: {e}")
                    continue

        logging.info(f"Detected objects: {labels_this_frame}")
        logging.info(f"Detected objects list: {detected_objects}")
        logging.info(f"Person count: {person_count}")

    except Exception as e:
        logging.error(f"Error during object detection: {e}")
        raise e

    # Return the required values
    return labels_this_frame, frame, person_count, detected_objects

def detectFace(frame):
    """
    Detects faces, landmarks, and alerts on suspicious activities (e.g., multiple faces or suspicious gaze).
    Returns: faceCount, annotated frame
    """
    # Convert the frame to RGB as required by MediaPipe
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    faceCount = 0

    # Detect faces in the frame
    detection_results = face_detection.process(rgb_frame)
    annotated_frame = frame.copy()

    if detection_results.detections:
        faceCount = len(detection_results.detections)

        # Draw bounding boxes and landmarks
        for detection in detection_results.detections:
            mp_drawing.draw_detection(annotated_frame, detection)

    # Alert for multiple faces
    if faceCount > 1:
        cv2.putText(annotated_frame, 'Alert: Multiple Faces Detected!', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    # Detect facial landmarks using Face Mesh
    mesh_results = face_mesh.process(rgb_frame)
    if mesh_results.multi_face_landmarks:
        for face_landmarks in mesh_results.multi_face_landmarks:
            # Draw the facial landmarks on the frame
            mp_drawing.draw_landmarks(
                image=annotated_frame,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1)
            )

    logging.info(f"Face count: {faceCount}")
    return faceCount, annotated_frame

def stable_gaze_label(new_label):
    """Return stable gaze direction using temporal smoothing."""
    GAZE_HISTORY.append(new_label)
    # Return the most frequent label from last N frames
    return max(set(GAZE_HISTORY), key=GAZE_HISTORY.count)

def gaze_tracking(frame):
    """Highly stable gaze tracking using iris landmarks + smoothing."""
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(frame_rgb)

    if not results.multi_face_landmarks:
        return {"gaze": stable_gaze_label("center")}

    landmarks = results.multi_face_landmarks[0].landmark

    # IRIS LANDMARK indexes for better accuracy
    LEFT_IRIS = [468, 469, 470, 471]
    RIGHT_IRIS = [473, 474, 475, 476]

    # Eye corner indexes (stable)
    LEFT_EYE_LEFT = 33
    LEFT_EYE_RIGHT = 133
    RIGHT_EYE_LEFT = 362
    RIGHT_EYE_RIGHT = 263

    # Calculate IRIS center
    left_iris_center = np.mean([(landmarks[i].x, landmarks[i].y) for i in LEFT_IRIS], axis=0)
    right_iris_center = np.mean([(landmarks[i].x, landmarks[i].y) for i in RIGHT_IRIS], axis=0)

    # Eye width (to normalize gaze movement)
    left_eye_width = abs(landmarks[LEFT_EYE_RIGHT].x - landmarks[LEFT_EYE_LEFT].x)
    right_eye_width = abs(landmarks[RIGHT_EYE_RIGHT].x - landmarks[RIGHT_EYE_LEFT].x)

    # Compute relative iris offset inside each eye
    left_ratio = (left_iris_center[0] - landmarks[LEFT_EYE_LEFT].x) / left_eye_width
    right_ratio = (right_iris_center[0] - landmarks[RIGHT_EYE_LEFT].x) / right_eye_width

    # Average both eyes
    iris_ratio = (left_ratio + right_ratio) / 2

    # Gaze decision with adaptive thresholds
    # 0.5 = center of eye
    # <0.35 → left, >0.65 → right
    if iris_ratio < 0.35:
        raw_gaze = "left"
    elif iris_ratio > 0.65:
        raw_gaze = "right"
    else:
        raw_gaze = "center"

    # STABILIZE
    gaze_final = stable_gaze_label(raw_gaze)

    logging.info(f"Gaze direction: {gaze_final} (iris_ratio: {iris_ratio:.3f})")
    return {"gaze": gaze_final, "ratio": round(float(iris_ratio), 3)}
