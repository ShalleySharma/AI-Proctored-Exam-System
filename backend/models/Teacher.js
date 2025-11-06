import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  photo_path: String,
  full_name: String,
  school: String,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Teacher', TeacherSchema);
