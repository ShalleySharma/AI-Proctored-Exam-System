import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let model = null;

export const loadObjectModel = async () => {
  if (!model) {
    console.log("Loading COCO-SSD object detection model...");
    model = await cocoSsd.load();
    console.log("Object detection model loaded");
  }
  return model;
};

export const detectObjects = async (imageBuffer) => {
  try {
    const model = await loadObjectModel();
    if (!model) {
      console.error("❌ Object detection model not loaded");
      return [];
    }

    // Decode image buffer to tensor using Sharp
    const { data, info } = await sharp(imageBuffer)
      .resize(640, 480, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels]);
    const [height, width] = tensor.shape;

    // Resize for faster processing while maintaining aspect ratio
    const resizeWidth = 640;
    let resizedTensor = tensor;
    if (width > resizeWidth) {
      const aspectRatio = height / width;
      const newHeight = Math.round(resizeWidth * aspectRatio);
      resizedTensor = tf.image.resizeBilinear(tensor, [newHeight, resizeWidth]);
    }

    // Perform object detection
    const predictions = await model.detect(resizedTensor);

    const detectedObjects = [];
    let personCount = 0;

    // Filter predictions based on confidence and specific classes
    const confidenceThreshold = 0.5;
    for (const prediction of predictions) {
      if (prediction.score > confidenceThreshold) {
        const label = prediction.class.toLowerCase();

        // Focus on prohibited objects: cell phone, book, and multiple persons
        if (label === 'person') {
          personCount++;
          if (personCount >= 2) {
            detectedObjects.push('multiple_persons_detected');
          }
        } else if (label === 'cell phone' || label.includes('phone')) {
          detectedObjects.push('cell phone');
        } else if (label === 'book') {
          detectedObjects.push('book');
        }
        // Note: COCO-SSD may not detect 'cell phone' or 'book' accurately.
        // For better detection, a custom YOLO model would be needed.
      }
    }

    console.log(`🔍 Object detection completed - detected: ${detectedObjects.join(', ')}`);

    // Dispose tensors to free memory
    tensor.dispose();
    if (resizedTensor !== tensor) {
      resizedTensor.dispose();
    }

    return detectedObjects;

  } catch (err) {
    console.error("❌ Error detecting objects:", err);
    return [];
  }
};
