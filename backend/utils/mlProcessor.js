import { detectObjects } from './pythonObjectDetection.js';
import fs from 'fs';
import path from 'path';

export const processSnapshot = async (imagePath, session, referenceEmbedding) => {
  console.log('🔍 Starting ML processing for snapshot...');
  const imageBuffer = fs.readFileSync(imagePath);
  const violations = [];

  try {
    console.log('🔍 Starting ML processing pipeline...');

    // Call Python ML service for all detections
    try {
      const mlResult = await detectObjects(imageBuffer);
      if (mlResult.violations && mlResult.violations.length > 0) {
        violations.push(...mlResult.violations);
        mlResult.violations.forEach(violation => {
          console.log(`🚨 Violation detected: ${violation}`);
        });
      }
    } catch (mlError) {
      console.error('❌ ML service error:', mlError);
      // Continue without violations
    }

    console.log(`📋 ML processing completed: ${violations.length} violations detected - ${violations.join(', ')}`);

    // Update session violation counts (simple increment)
    violations.forEach(type => {
      if (!session.violationCounts) session.violationCounts = {};
      session.violationCounts[type] = (session.violationCounts[type] || 0) + 1;
    });

    // Annotate and save screenshot if violations detected
    if (violations.length > 0) {
      try {
        const annotatedPath = await annotateScreenshot(imagePath, violations);
        session.ml_screenshots.push(annotatedPath);
      } catch (annotateError) {
        console.error('❌ Screenshot annotation error:', annotateError);
      }
    }

  } catch (err) {
    console.error('❌ Error in ML processing:', err);
    // On error, don't add violations but log the issue
  }

  return { violations, session };
};

const annotateScreenshot = async (imagePath, violations) => {
  // Simple annotation: just save as is with suffix
  const annotatedPath = imagePath.replace('.jpg', '_ml.jpg');
  fs.copyFileSync(imagePath, annotatedPath);
  return annotatedPath;
};
