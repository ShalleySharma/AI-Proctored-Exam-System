import mongoose from "mongoose";
import crypto from "crypto";

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  totalMarks: { type: Number, required: true },
  questions: [
    {
      questionText: String,
      options: [String],
      correctAnswer: String,
      marks: Number,
    },
  ],
  examCode: { type: String, unique: true }, // unique code for students to join
});

// Generate exam code automatically
examSchema.pre("save", function (next) {
  if (!this.examCode) {
    this.examCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "A4B2C9"
  }
  next();
});

export default mongoose.model("Exam", examSchema);
