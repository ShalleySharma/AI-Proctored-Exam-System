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
    audio_issues: { type: Number, default: 0 },
    internet_disconnects: { type: Number, default: 0 },
    multiple_faces_detected: { type: Number, default: 0 },
    page_refreshes: { type: Number, default: 0 },
    ml_face_mismatch: { type: Number, default: 0 },
    ml_no_face_detected: { type: Number, default: 0 },
    ml_multiple_faces_detected: { type: Number, default: 0 },
    ml_head_pose_away: { type: Number, default: 0 },
    ml_gaze_away: { type: Number, default: 0 },
    ml_object_detected: { type: Number, default: 0 }
  },
  ml_violation_count: { type: Number, default: 0 },
  ml_screenshots: [{ type: String }], // paths to annotated SS
  pdf_path: { type: String } // path to generated PDF report
});

export default mongoose.model('Session', SessionSchema);
