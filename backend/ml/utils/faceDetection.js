import * as tf from '@tensorflow/tfjs-node';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let model = null;

export const loadFaceModel = async () => {
  if (!model) {
    model = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      { runtime: 'tfjs', refineLandmarks: true }
    );
  }
  return model;
};

export const getFaceEmbedding = async (imageBuffer) => {
  const detector = await loadFaceModel();
  const tensor = tf.node.decodeImage(imageBuffer, 3);
  const predictions = await detector.estimateFaces(tensor);
  tensor.dispose();

  if (predictions.length === 0) return null;

  const landmarks = predictions[0].keypoints;
  const embedding = landmarks.map(lm => [lm.x, lm.y, lm.z]).flat();
  return embedding;
};

export const compareFaces = (emb1, emb2, threshold = 0.6) => {
  if (!emb1 || !emb2) return false;
  const dist = Math.sqrt(emb1.reduce((sum, val, i) => sum + Math.pow(val - emb2[i], 2), 0));
  return dist < threshold;
};
