import express from 'express';
const router = express.Router();
import Session from '../models/Session.js';
import Snapshot from '../models/Snapshot.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const snapshotStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/snapshots/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadSnapshot = multer({ storage: snapshotStorage });

// Start exam session
router.post('/start', async (req, res) => {
  const { studentId, examId } = req.body;
  try {
    const session = new Session({ student_id: studentId, exam_id: examId, login_time: new Date() });
    await session.save();
    res.json({ sessionId: session._id });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// POST violation event
router.post('/violation', async (req, res) => {
  try {
    const { sessionId, studentId, message, timestamp } = req.body;
    const record = { sessionId, studentId, message, timestamp: timestamp || new Date().toISOString() };
    await Session.findByIdAndUpdate(sessionId, { $push: { violations: record } });
    res.status(201).json({ ok: true, record });
  } catch (err) {
    console.error('Violation save error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Upload snapshot
router.post('/snapshot', uploadSnapshot.single('image'), async (req, res) => {
  const { sessionId, violations } = req.body;
  const image_path = req.file.path;
  try {
    const snapshot = new Snapshot({ session_id: sessionId, image_path, violations: violations ? JSON.parse(violations) : [] });
    await snapshot.save();
    // Save meta to a file for demo:
    const meta = {
      sessionId,
      violations: violations ? JSON.parse(violations) : [],
      filename: req.file.filename,
      originalname: req.file.originalname,
      savedAt: new Date().toISOString()
    };
    const metaFile = path.join('uploads/snapshots', `${req.file.filename}.meta.json`);
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    res.status(201).json({ ok: true, meta });
  } catch (err) {
    console.error('Snapshot upload error', err);
    res.status(500).json({ ok: false, error: 'Upload failed' });
  }
});

// Get sessions for instructor
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().populate('student_id').populate('exam_id');
    res.json(sessions);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get snapshots for a session
router.get('/snapshots/:sessionId', async (req, res) => {
  try {
    const snapshots = await Snapshot.find({ session_id: req.params.sessionId });
    res.json(snapshots);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/submit', async (req, res) => {
  const { sessionId, studentId, examId, answers, score, totalQuestions, timeExpired, completedAt, violations, violationCounts } = req.body;
  try {
    await Session.findByIdAndUpdate(sessionId, {
      answers,
      score,
      total_questions: totalQuestions,
      time_expired: timeExpired,
      completed_at: completedAt,
      violations: violations || [],
      violation_counts: {
        tab_switches: violationCounts?.tab_switches || 0,
        window_focus_loss: violationCounts?.window_focus_loss || 0,
        camera_issues: violationCounts?.camera_issues || 0,
        internet_disconnects: violationCounts?.internet_disconnects || 0,
        multiple_faces_detected: violationCounts?.multiple_faces_detected || 0
      }
    });
    res.json({ msg: 'Exam submitted successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get student exam results
router.get('/student-results/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    // Find the latest completed session for the student
    const session = await Session.findOne({ student_id: studentId, completed_at: { $exists: true } }).sort({ completed_at: -1 });
    if (!session) {
      return res.status(404).json({ msg: 'No completed exam found for this student' });
    }
    // Get snapshots for the session
    const snapshots = await Snapshot.find({ session_id: session._id });
    // Calculate percentage
    const percentage = session.total_questions ? Math.round((session.score / session.total_questions) * 100) : 0;
    // Map violations
    const violations = {
      tabSwitches: session.violation_counts.tab_switches,
      windowBlurs: session.violation_counts.window_focus_loss,
      multipleFaces: session.violation_counts.multiple_faces_detected,
      noCamera: session.violation_counts.camera_issues,
      internetDisconnects: session.violation_counts.internet_disconnects
    };
    // Screenshots URLs
    const screenshots = snapshots.map(s => `http://localhost:5000/${s.image_path}`);
    res.json({
      score: session.score,
      totalQuestions: session.total_questions,
      percentage,
      completedAt: session.completed_at,
      timeExpired: session.time_expired,
      violations,
      screenshots
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// health
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

export default router;
