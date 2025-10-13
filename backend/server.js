import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exam.js";

dotenv.config();
const app = express();
connectDB();

// configure upload folder
const UPLOAD_DIR = 'uploads/snapshots';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use("/uploads", express.static("uploads"));
app.use(express.static('../'));
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
