// Client-side live monitoring script adapted from Python code
// This runs in the browser using MediaPipe and TensorFlow.js

import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let faceModel = null;
let objectModel = null;
let referenceEmbedding = null;
let isMonitoring = false;

export const loadModels = async () => {
  if (!faceModel) {
    faceModel = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      { runtime: 'tfjs', refineLandmarks: true }
    );
  }
  if (!objectModel) {
    objectModel = await cocoSsd.load();
  }
  console.log('Models loaded for live monitoring');
};

export const takePhoto = () => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const streamPromise = navigator.mediaDevices.getUserMedia({ video: true });

    streamPromise.then(stream => {
      video.srcObject = stream;
      video.play().then(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        stream.getTracks().forEach(track => track.stop());
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      });
    }).catch(reject);
  });
};

export const getFaceEmbedding = async (imageData) => {
  const img = new Image();
  img.src = imageData;
  await new Promise(resolve => img.onload = resolve);

  const tensor = tf.browser.fromPixels(img);
  const predictions = await faceModel.estimateFaces(tensor);

  if (!predictions || predictions.length === 0) return null;

  const landmarks = predictions[0].keypoints;
  const embedding = [];
  landmarks.forEach(lm => {
    embedding.push(lm.x, lm.y, lm.z || 0);
  });

  tensor.dispose();
  return embedding;
};

export const estimateGaze = async (imageData) => {
  const img = new Image();
  img.src = imageData;
  await new Promise(resolve => img.onload = resolve);

  const tensor = tf.browser.fromPixels(img);
  const predictions = await faceModel.estimateFaces(tensor);

  if (!predictions || predictions.length === 0) return 'center';

  const landmarks = predictions[0].keypoints;

  // Simplified gaze estimation (similar to Python)
  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  const yaw = (nose.x - eyeCenterX) * 180 / Math.PI;
  const pitch = (nose.y - eyeCenterY) * 180 / Math.PI;

  let v_text = "Center";
  let h_text = "Center";

  if (pitch > 10) v_text = "Down";
  else if (pitch < -10) v_text = "Up";

  if (yaw > 10) h_text = "Right";
  else if (yaw < -10) h_text = "Left";

  const gaze_text = (v_text !== "Center" || h_text !== "Center") ? `${v_text}-${h_text}` : "Forward";

  tensor.dispose();
  return gaze_text === "Forward" ? "center" : "away";
};

export const detectObjects = async (imageData) => {
  const img = new Image();
  img.src = imageData;
  await new Promise(resolve => img.onload = resolve);

  const predictions = await objectModel.detect(img);
  const detected = [];

  predictions.forEach(pred => {
    if (pred.score > 0.5) {
      const label = pred.class.toLowerCase();
      if (label === 'cell phone' || label === 'book' || label === 'laptop') {
        detected.push(label);
      }
    }
  });

  return detected;
};

export const processFrame = async (frameData) => {
  const emb = await getFaceEmbedding(frameData);
  if (!emb) return { text: "No face detected", color: "red" };

  const cos_sim = tf.losses.cosineDistance(referenceEmbedding, emb, 0).dataSync()[0];
  const similarity = 1 - cos_sim; // Cosine similarity

  let text, color;
  if (similarity > 0.6) {
    text = `Verified (${similarity.toFixed(2)})`;
    color = "green";
  } else {
    text = `Unverified (${similarity.toFixed(2)})`;
    color = "red";
  }

  return { text, color, similarity };
};

export const startLiveMonitoring = async (onFrameProcessed) => {
  if (isMonitoring) return;
  isMonitoring = true;

  // Register face
  console.log("Capturing reference face...");
  const refData = await takePhoto();
  referenceEmbedding = await getFaceEmbedding(refData);
  if (!referenceEmbedding) {
    alert("No face detected in reference image.");
    return;
  }
  console.log("Face registered!");

  // Start monitoring loop
  const monitor = async () => {
    if (!isMonitoring) return;

    try {
      const frameData = await takePhoto();
      const [frameResult, gaze, objects] = await Promise.all([
        processFrame(frameData),
        estimateGaze(frameData),
        detectObjects(frameData)
      ]);

      const result = {
        verification: frameResult,
        gaze,
        objects,
        timestamp: Date.now()
      };

      onFrameProcessed(result);

      setTimeout(monitor, 1000); // Process every second
    } catch (err) {
      console.error("Monitoring error:", err);
      setTimeout(monitor, 1000);
    }
  };

  monitor();
};

export const stopLiveMonitoring = () => {
  isMonitoring = false;
  console.log("Monitoring stopped.");
};
