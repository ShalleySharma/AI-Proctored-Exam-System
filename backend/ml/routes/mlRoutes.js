import express from 'express';
const router = express.Router();
import Session from '../../models/Session.js';
import Snapshot from '../../models/Snapshot.js';
import { processSnapshot } from '../utils/mlProcessor.js';
import { checkViolations } from '../utils/violationCounter.js';
import { generateResultPDF } from '../services/pdfGenerator.js';

// Analyze snapshot (called from exam.js)
router.post('/analyze', async (req, res) => {
  const { sessionId, imagePath, referenceEmbedding } = req.body;
  const session = await Session.findById(sessionId);
  const result = await processSnapshot(imagePath, session, referenceEmbedding);
  await session.save();
  const check = checkViolations(session);
  if (check.endExam) {
    session.status = check.status;
    await session.save();
  }
  res.json({ violations: result.violations, endExam: check.endExam });
});

// Get session details with populated data
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('student_id')
      .populate('exam_id');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    console.log('Session exam duration:', session.exam_id?.duration);
    const snapshots = await Snapshot.find({ session_id: req.params.sessionId });
    res.json({ session, snapshots });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate PDF
router.get('/report/:sessionId', async (req, res) => {
  const session = await Session.findById(req.params.sessionId).populate('exam_id').populate('student_id');
  const snapshots = await Snapshot.find({ session_id: req.params.sessionId });
  const pdfPath = generateResultPDF(session, snapshots);
  res.download(pdfPath);
});

export default router;
