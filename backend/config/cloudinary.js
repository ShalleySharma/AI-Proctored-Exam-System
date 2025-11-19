import { v2 as cloudinary } from 'cloudinary';
import { config } from "@dotenvx/dotenvx";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary Configured Successfully!');

export const uploadToCloudinary = async (imageData, options = {}) => {
  try {
    if (Buffer.isBuffer(imageData)) {
      // For buffer, use upload_stream
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: "proctor_snapshots",
            ...options
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(imageData);
      });
      return result;
    } else if (typeof imageData === 'string') {
      // For string input, ensure it's a data URL
      let dataUrl = imageData;
      if (!imageData.startsWith('data:image/')) {
        // Assume it's base64 without prefix, create data URL
        dataUrl = `data:image/jpeg;base64,${imageData}`;
      }
      const result = await cloudinary.uploader.upload(dataUrl, {
        resource_type: 'image',
        folder: "proctor_snapshots",
        ...options
      });
      return result;
    } else {
      throw new Error('Invalid image data format');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export default cloudinary;
