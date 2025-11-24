from flask import Flask, request, jsonify
import base64
import cv2
import numpy as np
from ml_detections import detectObject, detectFace, gaze_tracking
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

@app.route('/process-ml', methods=['POST'])
def process_ml():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            logging.error('No image provided in request')
            return jsonify({'error': 'No image provided'}), 400

        # Decode base64 image
        image_data = data['image']
        logging.info(f'Received image data length: {len(image_data)}')

        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]

        # Remove any whitespace or newlines
        image_data = image_data.strip()
        logging.info(f'Cleaned image data length: {len(image_data)}')

        try:
            image_bytes = base64.b64decode(image_data)
            logging.info(f'Decoded bytes length: {len(image_bytes)}')
        except Exception as e:
            logging.error(f'Base64 decode error: {e}')
            return jsonify({'error': f'Base64 decode failed: {str(e)}'}), 400

        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            logging.info(f'Frame shape: {frame.shape if frame is not None else "None"}')
        except Exception as e:
            logging.error(f'Image decode error: {e}')
            return jsonify({'error': f'Image decode failed: {str(e)}'}), 400

        if frame is None:
            logging.error('Decoded frame is None')
            return jsonify({'error': 'Invalid image data - frame is None'}), 400

        # Perform object detection with error handling
        try:
            labels_this_frame, processed_frame, person_count, detected_objects = detectObject(frame)
        except Exception as e:
            logging.error(f'Object detection error: {e}')
            # Return safe defaults instead of crashing
            labels_this_frame = []
            processed_frame = frame
            person_count = 0
            detected_objects = []

        # Perform facial detection with error handling
        try:
            face_count, face_annotated_frame = detectFace(frame)
        except Exception as e:
            logging.error(f'Face detection error: {e}')
            # Return safe defaults
            face_count = 0
            face_annotated_frame = frame

        # Perform gaze tracking with error handling
        try:
            gaze_result = gaze_tracking(frame)
        except Exception as e:
            logging.error(f'Gaze tracking error: {e}')
            # Return safe defaults
            gaze_result = {'gaze': 'center'}

        # Prepare violations list - CONDITIONAL CHEATING DETECTION
        violations = []

        logging.info(f"Face count: {face_count}")
        logging.info(f"Gaze result: {gaze_result}")
        logging.info(f"Person count: {person_count}")
        logging.info(f"Detected objects: {detected_objects}")

        # FACE VIOLATIONS - only when face detection is reliable
        if face_count == 0:
            violations.append('no_face_detected')
        elif face_count > 1:
            violations.append('multiple_faces_detected')

        # GAZE VIOLATIONS - only check if face is detected
        if face_count == 1:
            gaze_direction = gaze_result.get('gaze', 'center')
            if gaze_direction in ['left', 'right', 'up', 'down']:
                violations.append('gaze_away')

        # OBJECT VIOLATIONS - comprehensive list
        if person_count >= 2:
            violations.append('ml_multiple_persons')

        # Check each detected object against comprehensive list - SAFE iteration
        for obj in detected_objects:
            if not obj:  # Skip None or empty objects
                continue

            obj_lower = str(obj).lower()  # Safe string conversion

            if any(prohibited in obj_lower for prohibited in ['cell', 'phone', 'mobile', 'smartphone']):
                violations.append('ml_cell phone')
            elif 'book' in obj_lower:
                violations.append('ml_book')
            elif any(device in obj_lower for device in ['laptop', 'computer', 'notebook']):
                violations.append('ml_laptop')
            elif 'remote' in obj_lower:
                violations.append('ml_remote')
            elif 'keyboard' in obj_lower:
                violations.append('ml_keyboard')
            elif 'mouse' in obj_lower:
                violations.append('ml_mouse')
            elif 'bottle' in obj_lower:
                violations.append('ml_bottle')
            elif any(screen in obj_lower for screen in ['tv', 'monitor', 'screen']):
                violations.append('ml_screen')
            elif any(writing in obj_lower for writing in ['pen', 'pencil']):
                violations.append('ml_writing_tool')
            elif any(doc in obj_lower for doc in ['paper', 'clipboard']):
                violations.append('ml_paper')
            elif any(bag in obj_lower for bag in ['bag', 'backpack']):
                violations.append('ml_bag')
            elif any(audio in obj_lower for audio in ['headphone', 'earbud']):
                violations.append('ml_headphones')
            elif 'watch' in obj_lower:
                violations.append('ml_watch')
            elif any(glass in obj_lower for glass in ['glasses', 'sunglasses']):
                violations.append('ml_glasses')
            else:
                # Any other detected object is suspicious
                violations.append('ml_suspicious_object')

        # HEAD POSE VIOLATION - only if face is detected and other violations exist
        if face_count == 1 and len([v for v in violations if v not in ['gaze_away', 'no_face_detected', 'multiple_faces_detected']]) > 0:
            violations.append('head_pose_away')

        logging.info(f"COMPREHENSIVE violations list: {violations}")

        return jsonify({
            'violations': violations,
            'detected_objects': detected_objects,
            'person_count': person_count,
            'face_count': face_count,
            'gaze': gaze_result.get('gaze', 'center')
        })

    except Exception as e:
        logging.error(f"Unexpected error in ML processing: {e}")
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
