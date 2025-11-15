import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let model = null;

export const loadGazeModel = async () => {
  if (!model) {
    console.log("Loading Face Landmarks Detection model for gaze estimation...");
    model = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      { runtime: 'tfjs', refineLandmarks: true }
    );
    console.log("Gaze estimation model loaded");
  }
  return model;
};

export const estimateGaze = async (imageBuffer) => {
  try {
    const model = await loadGazeModel();
    if (!model) {
      console.error("❌ Gaze estimation model not loaded");
      return 'center';
    }

    // Decode image buffer to tensor using Sharp
    const { data, info } = await sharp(imageBuffer)
      .resize(640, 480, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels]);

    // Perform face landmarks detection
    const predictions = await model.estimateFaces(tensor);

    if (!predictions || predictions.length === 0) {
      console.log("👁️ No face detected for gaze estimation");
      tensor.dispose();
      return 'center';
    }

    const landmarks = predictions[0].keypoints;

    // Use 3D head pose estimation for gaze (based on the Python code approach)
    // Key facial landmarks for pose estimation
    const modelPoints = [
      [0.0, 0.0, 0.0],     // Nose tip (landmark 1)
      [0.0, -330.0, -65.0], // Chin (landmark 152)
      [-225.0, 170.0, -135.0], // Left eye left corner (landmark 33)
      [225.0, 170.0, -135.0],  // Right eye right corner (landmark 263)
      [-150.0, -150.0, -125.0], // Left mouth corner (landmark 61)
      [150.0, -150.0, -125.0]   // Right mouth corner (landmark 291)
    ];

    const imagePoints = [
      [landmarks[1].x * info.width, landmarks[1].y * info.height],    // Nose
      [landmarks[152].x * info.width, landmarks[152].y * info.height], // Chin
      [landmarks[33].x * info.width, landmarks[33].y * info.height],   // Left eye
      [landmarks[263].x * info.width, landmarks[263].y * info.height], // Right eye
      [landmarks[61].x * info.width, landmarks[61].y * info.height],   // Left mouth
      [landmarks[291].x * info.width, landmarks[291].y * info.height]  // Right mouth
    ];

    // Camera matrix (simplified pinhole model)
    const focalLength = info.width;
    const center = [info.width / 2, info.height / 2];
    const cameraMatrix = [
      [focalLength, 0, center[0]],
      [0, focalLength, center[1]],
      [0, 0, 1]
    ];

    // Solve for rotation and translation (simplified solvePnP equivalent)
    // This is a basic implementation - in production use proper computer vision library
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const chin = landmarks[152];

    // Calculate basic head pose angles
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;

    // Yaw: horizontal rotation (left-right turn)
    const yaw = (nose.x - eyeCenterX) * 180 / Math.PI;

    // Pitch: vertical rotation (up-down tilt)
    const pitch = (nose.y - eyeCenterY) * 180 / Math.PI;

    // Determine gaze direction based on head pose
    let gazeDirection = 'center';

    if (Math.abs(yaw) > 15) {
      gazeDirection = yaw > 0 ? 'right' : 'left';
    } else if (Math.abs(pitch) > 15) {
      gazeDirection = pitch > 0 ? 'down' : 'up';
    }

    console.log(`👁️ Gaze estimation completed - gaze: ${gazeDirection} (yaw: ${yaw.toFixed(1)}°, pitch: ${pitch.toFixed(1)}°)`);

    tensor.dispose();
    return gazeDirection === 'center' ? 'center' : 'away';

  } catch (err) {
    console.error("❌ Error estimating gaze:", err);
    return 'center';
  }
};

