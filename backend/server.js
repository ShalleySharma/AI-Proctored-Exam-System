import express from "express";
import connectDB from "./config/db.js";
import { config } from "@dotenvx/dotenvx";
import cors from "cors";
import fs from "fs";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exam.js";
import axios from 'axios';
import FormData from 'form-data';
import mlRoutes from "./routes/mlRoutes.js";

config();
const app = express();
connectDB();

// configure upload folders
const UPLOAD_DIR = 'uploads/snapshots';
const ENTER_PHOTOS_DIR = 'uploads/enter_photos';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(ENTER_PHOTOS_DIR)) fs.mkdirSync(ENTER_PHOTOS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use("/uploads", express.static("uploads"));
app.use(express.static('../'));
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/ml", mlRoutes);


/**
 * Sends image buffer to external ML API and returns detection result.
 * @param {Buffer} imageBuffer - Image data buffer.
 * @returns {Promise<Object>} - ML detection response.
 */
export const sendToML = async (imageBuffer) => {
  const form = new FormData();
  form.append("image", imageBuffer, "frame.jpg");

  const response = await axios.post(`${process.env.ML_API}/process-ml`, form, {
    headers: form.getHeaders(),
  });
  return response.data;
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
