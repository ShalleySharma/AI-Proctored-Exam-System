import { getFaceEmbedding, compareFaces } from './faceDetection.js';
import { estimateGaze } from './gazeEstimation.js';
import { detectObjects } from './objectDetection.js';
import { incrementViolation } from './violationCounter.js';
import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs'; // Use CPU version

export const processSnapshot = async (imagePath, session, referenceEmbedding) => {
  console.log('🔍 Starting ML processing for snapshot...');
  const imageBuffer = fs.readFileSync(imagePath);
  const violations = [];

  try {
    // 1. Face detection and analysis
    const faceResult = await getFaceEmbedding(imageBuffer);

    if (!faceResult) {
      console.log('❌ Face detection failed');
      violations.push('no_face_detected');
    } else {
      // Check for multiple faces
      if (faceResult.faceCount > 1) {
        violations.push('multiple_faces_detected');
      } else if (faceResult.faceCount === 1) {
        // Check face match with reference (only once per session)
        if (referenceEmbedding && !compareFaces(faceResult.embedding, referenceEmbedding)) {
          if (!session.faceMismatchDetected) {
            session.faceMismatchDetected = true;
            violations.push('face_mismatch');
          }
        }

        // Check head pose (more conservative thresholds)
        if (faceResult.headPose) {
          const { yaw, pitch } = faceResult.headPose;
          if (Math.abs(yaw) > 60 || Math.abs(pitch) > 60) { // Increased to 60 degrees threshold
            violations.push('head_pose_away');
          }
        }
      }
    }

    // 2. Gaze estimation
    const gazeResult = await estimateGaze(imageBuffer);
    if (gazeResult === 'away') {
      violations.push('gaze_away');
    }

    // 3. Object detection
    const detectedObjects = await detectObjects(imageBuffer);
    if (detectedObjects.length > 0) {
      violations.push('object_detected');
    }

    console.log(`📋 ML processing completed: ${violations.length} violations detected - ${violations.join(', ')}`);

    // Update session violation counts
    violations.forEach(type => incrementViolation(session, type));

    // Annotate and save screenshot if violations detected
    if (violations.length > 0) {
      const annotatedPath = await annotateScreenshot(imagePath, violations);
      session.ml_screenshots.push(annotatedPath);
    }

  } catch (err) {
    console.error('❌ Error in ML processing:', err);
    // On error, don't add violations but log the issue
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
