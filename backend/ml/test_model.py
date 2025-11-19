import cv2
import numpy as np
from ultralytics import YOLO
import base64
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Initialize the YOLO model
model = YOLO("yolov8l.pt")  # Replace with your YOLO model file

# Confidence threshold - SAME AS PRODUCTION
CONFIDENCE_THRESHOLD = 0.5  # Increased from 0.3 to reduce false positives

def test_model_on_image(image_path, confidence_threshold=CONFIDENCE_THRESHOLD, resize_width=640):
    """Test the YOLO model on a single image."""
    # Load the image
    frame = cv2.imread(image_path)
    if frame is None:
        logging.error(f"Could not load image from {image_path}")
        return None, None, None, None

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
        results = model(frame, conf=confidence_threshold)  # Use the confidence threshold

        labels_this_frame = []

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

                    if score > confidence_threshold:  # Apply confidence threshold
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

                        # Draw bounding box in blue - SAFE coordinates
                        try:
                            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
                            # Draw label and confidence value in red
                            cv2.putText(frame, f"{label} {score:.2f}", (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                        except (ValueError, OverflowError):
                            # Skip drawing if coordinates are invalid
                            pass

                except (ValueError, IndexError, TypeError) as e:
                    # Skip malformed boxes
                    logging.warning(f"Skipping malformed box: {e}")
                    continue

        logging.info(f"Detected objects: {labels_this_frame}")

    except Exception as e:
        logging.error(f"Error during object detection: {e}")
        raise e

    # Return the required values
    return labels_this_frame, frame, None, None  # person_count and detected_objects not implemented in test

def test_model_on_base64(base64_string, confidence_threshold=CONFIDENCE_THRESHOLD, resize_width=640):
    """Test the YOLO model on a base64 encoded image."""
    try:
        # Decode base64 image
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]

        # Remove any whitespace or newlines
        base64_string = base64_string.strip()

        image_bytes = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            logging.error("Decoded frame is None")
            return None, None, None, None

        # Call the main detection function
        return test_model_on_image_from_frame(frame, confidence_threshold, resize_width)

    except Exception as e:
        logging.error(f"Error in base64 test: {e}")
        return None, None, None, None

def test_model_on_image_from_frame(frame, confidence_threshold=CONFIDENCE_THRESHOLD, resize_width=640):
    """Test the YOLO model on a frame (numpy array)."""
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
        results = model(frame, conf=confidence_threshold)  # Use the confidence threshold

        labels_this_frame = []

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

                    if score > confidence_threshold:  # Apply confidence threshold
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

                        # Draw bounding box in blue - SAFE coordinates
                        try:
                            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
                            # Draw label and confidence value in red
                            cv2.putText(frame, f"{label} {score:.2f}", (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                        except (ValueError, OverflowError):
                            # Skip drawing if coordinates are invalid
                            pass

                except (ValueError, IndexError, TypeError) as e:
                    # Skip malformed boxes
                    logging.warning(f"Skipping malformed box: {e}")
                    continue

        logging.info(f"Detected objects: {labels_this_frame}")

    except Exception as e:
        logging.error(f"Error during object detection: {e}")
        raise e

    # Return the required values - person_count and detected_objects not implemented in test
    return labels_this_frame, frame, None, None

if __name__ == "__main__":
    # Example usage
    # Test on an image file
    # labels, processed_frame, _, _ = test_model_on_image("path/to/image.jpg")
    # print("Detected labels:", labels)

    # Test on base64 string (you can provide your own base64 string here or load from file)
    # with open("test_b64.txt", "r") as f:
    #     base64_string = f.read().strip()
    # labels, processed_frame, _, _ = test_model_on_base64(base64_string)
    # print("Detected labels:", labels)
    pass
