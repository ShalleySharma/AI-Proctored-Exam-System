import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  photo_path: String
});

export default mongoose.model('Teacher', TeacherSchema);
