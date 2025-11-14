import * as tf from '@tensorflow/tfjs'; // Use CPU version to avoid native addon issues
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let model = null;

/**
 * Loads the Face Mesh model (only once)
 */
export const loadFaceModel = async () => {
  if (!model) {
    console.log("Loading face landmarks model...");
    model = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'tfjs',
        refineLandmarks: true,
      }
    );
    console.log("✅ Face model loaded successfully.");
  }
  return model;
};

/**
 * Extracts a face embedding (a numeric representation of facial features)
 * @param {Buffer} imageBuffer - Raw image buffer (e.g., from multer upload)
 * @returns {Promise<{embedding: number[], faceCount: number, headPose?: object} | null>} - Embedding and additional face data
 */
export const getFaceEmbedding = async (imageBuffer) => {
  try {
    const detector = await loadFaceModel();

    // Decode image to tensor
    const tensor = tf.node.decodeImage(imageBuffer, 3);

    // Estimate face landmarks
    const predictions = await detector.estimateFaces(tensor);
    tensor.dispose();

    if (!predictions || predictions.length === 0) {
      console.log("⚠️ No face detected.");
      return null;
    }

    const faceCount = predictions.length;

    if (faceCount > 1) {
      console.log(`⚠️ Multiple faces detected: ${faceCount}`);
    }

    // Extract 3D keypoints (x, y, z) from first face
    const landmarks = predictions[0].keypoints;
    const embedding = landmarks.map(lm => [lm.x, lm.y, lm.z]).flat();

    // Normalize embedding for better comparison
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / norm);

    // Calculate head pose (simplified)
    const headPose = calculateHeadPose(landmarks);

    return {
      embedding: normalizedEmbedding,
      faceCount,
      headPose
    };
  } catch (err) {
    console.error("❌ Error generating face embedding:", err);
    return null;
  }
};

/**
 * Compare two face embeddings using cosine similarity
 * @param {number[]} emb1
 * @param {number[]} emb2
 * @param {number} threshold - higher = stricter match (default: 0.6)
 * @returns {boolean}
 */
export const compareFaces = (emb1, emb2, threshold = 0.7) => {
  if (!emb1 || !emb2) return false;

  // Cosine similarity (better than Euclidean distance for face embeddings)
  const dotProduct = emb1.reduce((sum, val, i) => sum + val * emb2[i], 0);
  const norm1 = Math.sqrt(emb1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(emb2.reduce((sum, val) => sum + val * val, 0));
  const similarity = dotProduct / (norm1 * norm2);

  console.log("🔹 Face similarity:", similarity.toFixed(4));
  return similarity > threshold;
};

/**
 * Calculate simplified head pose from facial landmarks
 * @param {Array} landmarks - Face landmarks array
 * @returns {object} - Head pose angles
 */
const calculateHeadPose = (landmarks) => {
  // Simplified head pose calculation using key landmarks
  // In a real implementation, this would use proper 3D pose estimation

  // Get key points (nose tip, left eye, right eye, chin)
  const nose = landmarks[1]; // Nose tip
  const leftEye = landmarks[33]; // Left eye center
  const rightEye = landmarks[263]; // Right eye center
  const chin = landmarks[152]; // Chin

  // Calculate basic angles (simplified)
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  // Yaw (left-right turn): based on nose position relative to eye center
  const yaw = (nose.x - eyeCenterX) / (rightEye.x - leftEye.x);

  // Pitch (up-down tilt): based on nose position relative to eye center
  const pitch = (nose.y - eyeCenterY) / (chin.y - eyeCenterY);

  return {
    yaw: yaw * 180 / Math.PI, // Convert to degrees
    pitch: pitch * 180 / Math.PI,
    roll: 0 // Simplified, would need more complex calculation
  };
};
