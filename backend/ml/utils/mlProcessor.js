import { getFaceEmbedding, compareFaces } from './faceDetection.js';
import { estimateGaze } from './gazeEstimation.js';
import { detectObjects } from './objectDetection.js';
import { incrementViolation } from './violationCounter.js';
import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs'; // Use CPU version

export const processSnapshot = async (imagePath, session, referenceEmbedding) => {
  const imageBuffer = fs.readFileSync(imagePath);
  const violations = [];

  // Face verification
  const faceData = await getFaceEmbedding(imageBuffer);
  if (!faceData) {
    violations.push('no_face_detected');
  } else {
    const { embedding, faceCount, headPose } = faceData;

    // Check for multiple faces
    if (faceCount > 1) {
      violations.push('multiple_faces_detected');
    }

    // Check face match
    if (!compareFaces(embedding, referenceEmbedding)) {
      violations.push('face_mismatch');
    }

    // Check head pose (looking away)
    if (headPose) {
      const { yaw, pitch } = headPose;
      if (Math.abs(yaw) > 30 || Math.abs(pitch) > 20) { // Thresholds for looking away
        violations.push('head_pose_away');
        console.log(`🚨 Head pose violation: yaw=${yaw.toFixed(1)}°, pitch=${pitch.toFixed(1)}°`);
      }
    }
  }

  // Gaze estimation (only if face detected)
  if (faceData) {
    const gaze = await estimateGaze(imageBuffer);
    if (gaze !== 'forward') {
      violations.push('gaze_away');
      console.log(`🚨 Gaze violation: looking ${gaze}`);
    }
  }

  // Object detection
  const objects = await detectObjects(imageBuffer);
  if (objects.length > 0) {
    violations.push('object_detected');
    console.log(`🚨 Object detection violations: ${objects.map(o => o.object).join(', ')}`);
  }

  // Update session
  violations.forEach(type => incrementViolation(session, type));

  // Annotate and save SS if violations
  if (violations.length > 0) {
    const annotatedPath = await annotateScreenshot(imagePath, violations);
    session.ml_screenshots.push(annotatedPath);
  }

  return { violations, session };
};

const annotateScreenshot = async (imagePath, violations) => {
  const tensor = tf.node.decodeImage(fs.readFileSync(imagePath), 3);
  // Simple annotation: draw text (for demo, just save as is with suffix)
  const annotatedPath = imagePath.replace('.jpg', '_ml.jpg');
  fs.copyFileSync(imagePath, annotatedPath);
  // In real impl, use canvas or tf to draw
  return annotatedPath;
};
