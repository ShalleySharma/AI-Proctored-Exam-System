import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: String,
  roll_no: String,
  course: String,
  year: String,
  email: { type: String, unique: true },
  password: String,
  photo_path: String,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Student', StudentSchema);
