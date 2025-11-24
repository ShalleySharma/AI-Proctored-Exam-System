import fs from 'fs';
import path from 'path';
import Snapshot from '../../models/Snapshot.js';
import { uploadToCloudinary } from '../../config/cloudinary.js';

export const saveAnnotatedScreenshot = (imagePath, violations) => {
  const annotatedPath = path.join(path.dirname(imagePath), path.basename(imagePath, path.extname(imagePath)) + '_annotated' + path.extname(imagePath));
  // For now, just copy; in real, annotate with canvas
  fs.copyFileSync(imagePath, annotatedPath);
  return annotatedPath;
};

export const saveSnapshot = async (imageData) => {
  try {
    if (!imageData.startsWith("data:image"))
       throw new Error("Invalid image format");

    // Clean base64 by removing data URL prefix
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');

    // Upload clean base64 to Cloudinary
    const imageUrl = await uploadToCloudinary(base64);

    return imageUrl;
  } catch (error) {
    console.error('Error saving snapshot:', error);
    throw error;
  }
};
