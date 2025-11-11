import { getFaceEmbedding, compareFaces } from './faceDetection.js';
import { estimateGaze } from './gazeEstimation.js';
import { detectObjects } from './objectDetection.js';
import { incrementViolation } from './violationCounter.js';
import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs-node';

export const processSnapshot = async (imagePath, session, referenceEmbedding) => {
  const imageBuffer = fs.readFileSync(imagePath);
  const violations = [];

  // Face verification
  const emb = await getFaceEmbedding(imageBuffer);
  if (!emb || !compareFaces(emb, referenceEmbedding)) {
    violations.push('face_mismatch');
  }

  // Gaze estimation
  const gaze = await estimateGaze(imageBuffer);
  if (gaze === 'away') {
    violations.push('gaze_away');
  }

  // Object detection
  const objects = await detectObjects(imageBuffer);
  if (objects.length > 0) {
    violations.push('object_detected');
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
