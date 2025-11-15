import * as tf from '@tensorflow/tfjs'; // Use CPU version to avoid native addon issues
import sharp from 'sharp';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let model = null;

/**
 * Loads the Face Mesh model (only once)
 */
export const loadFaceModel = async () => {
  if (!model) {
    console.log("🔄 Loading face landmarks model...");
    try {
      model = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
        }
      );
      console.log("✅ Face model loaded successfully.");
    } catch (error) {
      console.error("❌ Failed to load face model:", error);
      throw error;
    }
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
    const model = await loadFaceModel();
    if (!model) {
      console.error("❌ Face model not loaded");
      return null;
    }

    // Convert buffer to tensor using Sharp for proper decoding
    const { data, info } = await sharp(imageBuffer)
      .resize(640, 480, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels]);
    const predictions = await model.estimateFaces(tensor);

    if (!predictions || predictions.length === 0) {
      console.log("🔍 No faces detected");
      return { embedding: null, faceCount: 0, headPose: null };
    }

    if (predictions.length > 1) {
      console.log(`🔍 Multiple faces detected: ${predictions.length}`);
      return { embedding: null, faceCount: predictions.length, headPose: null };
    }

    // Get face landmarks
    const face = predictions[0];
    const landmarks = face.keypoints;

    // Calculate head pose
    const headPose = calculateHeadPose(landmarks);

    // Create embedding from all facial landmarks (improved accuracy)
    // Use all 468 landmarks for better face recognition - following Python implementation
    const embedding = [];
    landmarks.forEach(lm => {
      embedding.push(lm.x, lm.y, lm.z || 0);
    });

    // Don't normalize here - normalization happens during cosine similarity comparison
    // This matches the Python implementation approach

    console.log(`✅ Face embedding generated, ${embedding.length} dimensions`);

    tensor.dispose();

    return {
      embedding: embedding,
      faceCount: 1,
      headPose: headPose
    };
  } catch (err) {
    console.error("❌ Error generating face embedding:", err);
    return null;
  }
};

/**
 * Detects faces and returns face count and annotated frame info
 * @param {Buffer} imageBuffer - Raw image buffer
 * @returns {Promise<{faceCount: number, annotatedFrame?: object} | null>}
 */
export const detectFace = async (imageBuffer) => {
  try {
    const model = await loadFaceModel();
    if (!model) {
      console.error("❌ Face model not loaded");
      return null;
    }

    // Convert buffer to tensor using Sharp
    const { data, info } = await sharp(imageBuffer)
      .resize(640, 480, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels]);
    const predictions = await model.estimateFaces(tensor);

    const faceCount = predictions ? predictions.length : 0;

    console.log(`🔍 Face detection completed - ${faceCount} faces detected`);

    tensor.dispose();

    return {
      faceCount,
      annotatedFrame: null // Could add annotation logic if needed
    };
  } catch (err) {
    console.error("❌ Error detecting faces:", err);
    return null;
  }
};

/**
 * Compare two face embeddings using cosine similarity
 * @param {number[]} emb1
 * @param {number[]} emb2
 * @param {number} threshold - higher = stricter match (default: 0.5)
 * @returns {boolean} - true if faces match (similarity >= threshold)
 */
export const compareFaces = (emb1, emb2, threshold = 0.6) => {
  if (!emb1 || !emb2 || emb1.length !== emb2.length) {
    console.log("🔹 Face comparison failed: invalid embeddings");
    return false;
  }

  // Cosine similarity (better than Euclidean distance for face embeddings)
  const dotProduct = emb1.reduce((sum, val, i) => sum + val * emb2[i], 0);
  const norm1 = Math.sqrt(emb1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(emb2.reduce((sum, val) => sum + val * val, 0));
  const similarity = dotProduct / (norm1 * norm2);

  console.log(`🔹 Face similarity: ${similarity.toFixed(4)} (threshold: ${threshold})`);

  // Return true if similarity is above threshold (faces match)
  // Note: Current embedding method is basic landmark-based.
  // For production, use a proper face recognition model like FaceNet.
  return similarity >= threshold;
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
