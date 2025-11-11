import * as tf from '@tensorflow/tfjs-node';
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
  const nose = lm[1]; // nose tip
  const leftEye = lm[33];
  const rightEye = lm[263];
  const chin = lm[152];

  // Simple gaze: check if eyes are looking away from center
  const eyeMid = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const faceCenter = { x: nose.x, y: (nose.y + chin.y) / 2 };

  const dx = eyeMid.x - faceCenter.x;
  const dy = eyeMid.y - faceCenter.y;

  if (Math.abs(dx) > 50 || Math.abs(dy) > 50) return 'away';
  return 'forward';
};
