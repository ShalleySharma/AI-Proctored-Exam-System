import * as tf from '@tensorflow/tfjs'; // Use CPU version
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let model = null;

export const loadGazeModel = async () => {
  if (!model) {
    model = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      { runtime: 'tfjs', refineLandmarks: true }
    );
  }
  return model;
};

export const estimateGaze = async (imageBuffer) => {
  const detector = await loadGazeModel();
  const tensor = tf.node.decodeImage(imageBuffer, 3);
  const predictions = await detector.estimateFaces(tensor);
  tensor.dispose();

  if (predictions.length === 0) return null;

  const lm = predictions[0].keypoints;
  const h = tensor.shape[0]; // image height
  const w = tensor.shape[1]; // image width

  // Calculate basic head pose from key points
  const nose = lm[1];
  const leftEye = lm[33];
  const rightEye = lm[263];
  const chin = lm[152];

  // Eye center
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  // Calculate yaw and pitch (simplified)
  const yaw = ((nose.x - eyeCenterX) / (rightEye.x - leftEye.x)) * 180 / Math.PI;
  const pitch = ((nose.y - eyeCenterY) / (chin.y - nose.y)) * 180 / Math.PI;

  // Determine gaze direction
  let gazeDirection = 'forward';

  if (Math.abs(yaw) > 25) {
    gazeDirection = yaw > 0 ? 'right' : 'left';
  } else if (Math.abs(pitch) > 20) {
    gazeDirection = pitch > 0 ? 'down' : 'up';
  }

  console.log(`👁️ Gaze estimation: yaw=${yaw.toFixed(1)}°, pitch=${pitch.toFixed(1)}°, direction=${gazeDirection}`);

  return gazeDirection;
};
