import mongoose from 'mongoose';

const SnapshotSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  image_url: String,
  timestamp: { type: Date, default: Date.now },
  violations: [String] // e.g., ['face_spoof', 'multiple_faces']
});

export default mongoose.model('Snapshot', SnapshotSchema);
