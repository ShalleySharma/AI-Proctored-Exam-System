import * as tf from '@tensorflow/tfjs-node';
import { YOLO } from 'yolov5-tfjs'; // Assuming yolov5-tfjs provides YOLO class

let model = null;

export const loadObjectModel = async () => {
  if (!model) {
    model = new YOLO('backend/ml/models/yolov8n.onnx'); // Adjust path if needed
  }
  return model;
};

export const detectObjects = async (imageBuffer) => {
  const detector = await loadObjectModel();
  const tensor = tf.node.decodeImage(imageBuffer, 3);
  const results = await detector.predict(tensor);
  tensor.dispose();

  const suspicious = ['cell phone', 'book', 'laptop'];
  const detected = results.map(r => r.class).filter(cls => suspicious.includes(cls));
  return detected.length > 0 ? detected : [];
};
