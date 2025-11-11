import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  login_time: Date,
  logout_time: Date,
  status: { type: String, default: 'in-progress' },
  answers: [Object],
  score: Number,
  total_questions: Number,
  time_expired: Boolean,
  completed_at: Date,
  violations: [Object],
  violation_counts: {
    tab_switches: { type: Number, default: 0 },
    window_focus_loss: { type: Number, default: 0 },
    camera_issues: { type: Number, default: 0 },
    internet_disconnects: { type: Number, default: 0 },
    multiple_faces_detected: { type: Number, default: 0 }
  }
});

export default mongoose.model('Session', SessionSchema);
