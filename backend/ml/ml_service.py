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
            return jsonify({'error': 'No image provided'}), 400

        # Decode base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]

        # Remove any whitespace or newlines
        image_data = image_data.strip()
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({'error': 'Invalid image data'}), 400

        # Perform object detection
        labels_this_frame, processed_frame, person_count, detected_objects = detectObject(frame)

        # Perform facial detection
        face_count, face_annotated_frame = detectFace(frame)

        # Perform gaze tracking
        gaze_result = gaze_tracking(frame)

        # Prepare violations list
        violations = []

        logging.info(f"Face count: {face_count}")
        logging.info(f"Gaze result: {gaze_result}")
        logging.info(f"Person count: {person_count}")
        logging.info(f"Detected objects: {detected_objects}")

        # Facial detection violations - removed to avoid double counting with ML versions
        # if face_count > 1:
        #     violations.append('multiple_faces_detected')
        # if face_count == 0:
        #     violations.append('no_face_detected')

        # Gaze violations - only flag significant horizontal deviations, ignore up/down
        if gaze_result['gaze'] in ['left', 'right']:
            violations.append('gaze_away')

        # Object detection violations
        if person_count >= 2:
            violations.append('ml_multiple_persons_detected')

        if person_count == 0:
            violations.append('ml_no_face_detected')

        # Check for prohibited objects
        if 'cell phone' in detected_objects:
            violations.append('ml_cell phone')

        if 'book' in detected_objects:
            violations.append('ml_book')

        if 'laptop' in detected_objects:
            violations.append('ml_laptop')

        if 'remote' in detected_objects:
            violations.append('ml_remote')

        if 'keyboard' in detected_objects:
            violations.append('ml_keyboard')

        if 'mouse' in detected_objects:
            violations.append('ml_mouse')

        # Check for suspicious objects (any detected object that is not person)
        suspicious_objects = [obj for obj in detected_objects if obj not in ['person']]
        if suspicious_objects:
            violations.append('ml_suspicious_object')

        logging.info(f"Final violations list: {violations}")

        return jsonify({
            'violations': violations,
            'detected_objects': detected_objects,
            'person_count': person_count,
            'face_count': face_count,
            'gaze': gaze_result['gaze']
        })

    except Exception as e:
        logging.error(f"Error in ML processing: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
