import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: String,
  roll_no: String,
  course: String,
  year: String,
  email: { type: String, unique: true },
  password: String,
  photo_path: String
});

export default mongoose.model('Student', StudentSchema);
