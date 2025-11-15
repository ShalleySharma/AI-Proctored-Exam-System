import express from 'express';
const router = express.Router();
import Session from '../models/Session.js';
import Snapshot from '../models/Snapshot.js';
import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import auth from '../middleware/auth.js';
import { processSnapshot } from '../ml/utils/mlProcessor.js';
import { checkViolations } from '../ml/utils/violationCounter.js';
import { getFaceEmbedding } from '../ml/utils/faceDetection.js';
import { estimateGaze } from '../ml/utils/gazeEstimation.js';
import { compareFaces } from '../ml/utils/faceDetection.js';
import { detectObjects } from '../ml/utils/objectDetection.js';
import cloudinary from '../config/cloudinary.js';

const snapshotStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/snapshots/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadSnapshot = multer({ storage: snapshotStorage });

// Start exam session
router.post('/start', async (req, res) => {
  try {
    const { studentId, examId } = req.body;
    console.log("Start exam body:", req.body);

    if (!studentId || !examId || studentId === 'null' || examId === 'null') {
      return res.status(400).json({ msg: "Missing studentId or examId" });
    }

    let student;
    try {
      student = await Student.findById(studentId);
    } catch (err) {
      // If not a valid ObjectId, try finding by roll_no
      student = await Student.findOne({ roll_no: studentId });
    }
    if (!student) return res.status(404).json({ msg: "Student not found" });

    const exam = await Exam.findOne({ examCode: examId });
    if (!exam) return res.status(404).json({ msg: "Exam not found" });

    const session = new Session({
      student_id: student._id,
      exam_id: exam._id,
      login_time: new Date(),
    });

    await session.save();
    res.status(200).json({ sessionId: session._id });
  } catch (err) {
    console.error("Error starting exam session:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Invalid student or exam ID" });
    }
    res.status(500).json({ msg: err.message || "Server error" });
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
    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(image_path, {
      folder: 'exam_snapshots',
      public_id: `${sessionId}_${Date.now()}`,
      resource_type: 'image'
    });

    const snapshot = new Snapshot({
      session_id: sessionId,
      image_url: cloudinaryResult.secure_url,
      violations: violations ? JSON.parse(violations) : []
    });
    await snapshot.save();

    // ML Processing
    const session = await Session.findById(sessionId);
    const student = await Student.findById(session.student_id);
    const referenceEmbedding = student.face_embedding || null; // Assume stored during signup
    if (referenceEmbedding) {
      const mlResult = await processSnapshot(image_path, session, referenceEmbedding);
      await session.save();
      const check = checkViolations(session);
      if (check.endExam) {
        session.status = check.status;
        await session.save();
        // Signal frontend to end exam
      }
    }

    // Clean up local file
    fs.unlinkSync(image_path);

    res.status(201).json({
      ok: true,
      image_url: cloudinaryResult.secure_url,
      mlViolations: session.ml_violation_count,
      endExam: check?.endExam || false
    });
  } catch (err) {
    console.error('Snapshot upload error', err);
    // Clean up local file on error
    if (fs.existsSync(image_path)) {
      fs.unlinkSync(image_path);
    }
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

// Get sessions for a teacher's exams (teacher only)
router.get('/teacher-sessions', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    // Find exams created by the teacher
    const exams = await Exam.find({ createdBy: teacherId }).select('_id');
    const examIds = exams.map(exam => exam._id);

    // Find sessions for those exams
    const sessions = await Session.find({ exam_id: { $in: examIds } })
      .populate('student_id', 'name roll_no')
      .populate('exam_id', 'title subject')
      .sort({ completed_at: -1 });

    res.json(sessions);
  } catch (err) {
    console.error('Error fetching teacher sessions:', err);
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
    // Update session with exam results
    const session = await Session.findById(sessionId).populate('student_id').populate('exam_id');
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    session.answers = answers;
    session.score = score;
    session.total_questions = totalQuestions;
    session.time_expired = timeExpired;
    session.completed_at = completedAt;
    session.violations = violations || [];
    session.violation_counts = {
      tab_switches: violationCounts?.tab_switches || 0,
      window_focus_loss: violationCounts?.window_focus_loss || 0,
      camera_issues: violationCounts?.camera_issues || 0,
      audio_issues: violationCounts?.audio_issues || 0,
      internet_disconnects: violationCounts?.internet_disconnects || 0,
      multiple_faces_detected: violationCounts?.multiple_faces_detected || 0,
      page_refreshes: violationCounts?.page_refreshes || 0,
      ml_face_mismatch: violationCounts?.ml_face_mismatch || 0,
      ml_no_face_detected: violationCounts?.ml_no_face_detected || 0,
      ml_multiple_faces_detected: violationCounts?.ml_multiple_faces_detected || 0,
      ml_head_pose_away: violationCounts?.ml_head_pose_away || 0,
      ml_gaze_away: violationCounts?.ml_gaze_away || 0,
      ml_object_detected: violationCounts?.ml_object_detected || 0
    };

    // Generate PDF
    const snapshots = await Snapshot.find({ session_id: sessionId });
    const { generateResultPDF } = await import('../ml/services/pdfGenerator.js');
    const pdfPath = generateResultPDF(session, snapshots);

    // Update session with PDF path
    session.pdf_path = pdfPath;
    await session.save();

    res.json({ msg: 'Exam submitted successfully', pdfPath });
  } catch (err) {
    console.error('Error submitting exam:', err);
    res.status(500).send('Server error');
  }
});

// Get student exam results
router.get('/student-results/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    // Find all completed sessions for the student
    const sessions = await Session.find({
      student_id: studentId,
      completed_at: { $exists: true }
    })
    .populate('exam_id', 'title subject')
    .sort({ completed_at: -1 });

    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ msg: 'No completed exams found for this student' });
    }

    // Process each session
    const examResults = await Promise.all(sessions.map(async (session) => {
      // Get snapshots for the session
      const snapshots = await Snapshot.find({ session_id: session._id });
      // Calculate percentage
      const percentage = session.total_questions ? Math.round((session.score / session.total_questions) * 100) : 0;
      // Map violations
      const violations = {
        tabSwitches: session.violation_counts?.tab_switches || 0,
        windowBlurs: session.violation_counts?.window_focus_loss || 0,
        multipleFaces: session.violation_counts?.multiple_faces_detected || 0,
        noCamera: session.violation_counts?.camera_issues || 0,
        noAudio: session.violation_counts?.audio_issues || 0,
        internetDisconnects: session.violation_counts?.internet_disconnects || 0,
        pageRefreshes: session.violation_counts?.page_refreshes || 0,
        mlFaceMismatch: session.violation_counts?.ml_face_mismatch || 0,
        mlNoFaceDetected: session.violation_counts?.ml_no_face_detected || 0,
        mlMultipleFacesDetected: session.violation_counts?.ml_multiple_faces_detected || 0,
        mlHeadPoseAway: session.violation_counts?.ml_head_pose_away || 0,
        mlGazeAway: session.violation_counts?.ml_gaze_away || 0,
        mlObjectDetected: session.violation_counts?.ml_object_detected || 0
      };
      // Screenshots URLs
      const screenshots = snapshots.map(s => s.image_url);

      return {
        sessionId: session._id, // Add sessionId for PDF download
        score: session.score,
        totalQuestions: session.total_questions,
        percentage,
        completedAt: session.completed_at,
        timeExpired: session.time_expired,
        violations,
        screenshots,
        examTitle: session.exam_id?.title || 'Unknown Exam',
        examSubject: session.exam_id?.subject || 'Unknown Subject',
        pdfPath: session.pdf_path // Add PDF path for download
      };
    }));

    res.json(examResults);
  } catch (err) {
    console.error('Error fetching student results:', err);
    res.status(500).send('Server error');
  }
});

// Create a new exam (teacher only)
router.post('/create', auth, async (req, res) => {
  try {
    const { title, subject, description, date, duration, totalMarks, questions } = req.body;
    const teacherId = req.user.id; // Assuming auth middleware sets req.user

    const exam = new Exam({
      title,
      subject,
      description,
      createdBy: teacherId,
      date,
      duration,
      totalMarks,
      questions: questions || []
    });

    await exam.save();
    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      examCode: exam.examCode,
      exam
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all exams for a teacher
router.get('/teacher-exams', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const exams = await Exam.find({ createdBy: teacherId }).sort({ date: -1 });
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all exams for students
router.get('/student-exams', auth, async (req, res) => {
  try {
    const exams = await Exam.find().populate('createdBy', 'name').sort({ date: -1 });
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific exam by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('createdBy', 'name');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an exam (teacher only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, subject, description, date, duration, totalMarks, questions } = req.body;
    const teacherId = req.user.id;

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, createdBy: teacherId },
      { title, subject, description, date, duration, totalMarks, questions },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found or unauthorized' });
    }

    res.json({ message: 'Exam updated successfully', exam });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an exam (teacher only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, createdBy: teacherId });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found or unauthorized' });
    }

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join exam by code (for students)
router.get('/join/:code', auth, async (req, res) => {
  try {
    const exam = await Exam.findOne({ examCode: req.params.code }).populate('createdBy', 'name');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    console.error('Error joining exam:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Validate exam ID and roll number
router.post('/validate', async (req, res) => {
  try {
    const { examId, rollNo } = req.body;

    // Check if exam exists
    const exam = await Exam.findOne({ examCode: examId });
    if (!exam) {
      return res.status(400).json({ valid: false, error: 'invalid_exam' });
    }

    // Check if student exists with the roll number
    const student = await Student.findOne({ roll_no: rollNo });
    if (!student) {
      return res.status(400).json({ valid: false, error: 'invalid_rollno' });
    }

    // If both exist, validation successful
    res.json({ valid: true });
  } catch (error) {
    console.error('Error validating exam and roll number:', error);
    res.status(500).json({ valid: false, error: 'server_error' });
  }
});

// Save enter photo temporarily
const enterPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/enter_photos/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadEnterPhoto = multer({ storage: enterPhotoStorage });

router.post('/save-photo', uploadEnterPhoto.single('photo'), async (req, res) => {
  const { studentId, examId } = req.body;
  const image_path = req.file.path;
  try {
    // Generate face embedding for reference
    const faceResult = await getFaceEmbedding(fs.readFileSync(image_path));
    if (faceResult && faceResult.embedding) {
      await Student.findByIdAndUpdate(studentId, { face_embedding: faceResult.embedding });
    } else {
      return res.status(400).json({ ok: false, error: 'Could not generate face embedding from photo' });
    }

    // Save meta for demo
    const meta = {
      studentId,
      examId,
      filename: req.file.filename,
      originalname: req.file.originalname,
      savedAt: new Date().toISOString()
    };
    const metaFile = path.join('uploads/enter_photos', `${req.file.filename}.meta.json`);
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    res.status(201).json({ ok: true, meta });
  } catch (err) {
    console.error('Save photo error', err);
    res.status(500).json({ ok: false, error: 'Save failed' });
  }
});

router.post('/process-ml', async (req, res) => {
  try {
    const { image, sessionId, isReference } = req.body;

    if (!sessionId || !image) {
      return res.status(400).json({ error: 'Missing image or sessionId' });
    }

    // Demo mode
    if (sessionId === 'demo') {
      if (isReference) {
        return res.json({ ok: true, embedding: { embedding: Array(128).fill(0.1) } });
      }
      const violations = ['no_face_detected', 'multiple_faces_detected', 'face_mismatch', 'head_pose_away', 'gaze_away'];
      return res.json({
        ok: true,
        violations: violations,
        violationCount: violations.length,
        endExam: false
      });
    }

    // Base64 → buffer (image is already without prefix)
    const imageBuffer = Buffer.from(image, 'base64');

    // Temp save
    const tempPath = path.join('uploads', `temp_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imageBuffer);

    const session = await Session.findById(sessionId);
    if (!session) {
      fs.unlinkSync(tempPath);
      return res.status(404).json({ error: 'Session not found' });
    }

    const student = await Student.findById(session.student_id);

    // ----------- Reference Capture ------------
    if (isReference) {
      // Generate real face embedding for reference
      const faceResult = await getFaceEmbedding(imageBuffer);

      if (!faceResult || !faceResult.embedding) {
        fs.unlinkSync(tempPath);
        return res.status(400).json({ error: 'Could not generate face embedding from reference image' });
      }

      await Student.findByIdAndUpdate(session.student_id, {
        face_embedding: faceResult.embedding
      });

      fs.unlinkSync(tempPath);
      return res.json({ ok: true, embedding: faceResult.embedding });
    }

    // ----------- Normal ML snapshot ------------
    console.log('🔍 Processing ML snapshot for session:', sessionId);

    // Use real ML processing instead of random violations
    const violations = [];

    try {
      // 1. Face detection and analysis
      const faceResult = await getFaceEmbedding(imageBuffer);

      if (!faceResult) {
        violations.push('no_face_detected');
      } else {
        // Check for multiple faces
        if (faceResult.faceCount > 1) {
          violations.push('multiple_faces_detected');
        } else if (faceResult.faceCount === 1) {
          // Check face match with reference (only once per session)
          const student = await Student.findById(session.student_id);
          if (student && student.face_embedding && !compareFaces(faceResult.embedding, student.face_embedding)) {
            if (!session.faceMismatchDetected) {
              session.faceMismatchDetected = true;
              violations.push('face_mismatch');
            }
          }

          // Check head pose (more conservative thresholds)
          if (faceResult.headPose) {
            const { yaw, pitch } = faceResult.headPose;
            if (Math.abs(yaw) > 45 || Math.abs(pitch) > 45) {
              violations.push('head_pose_away');
            }
          }
        }
      }

      // 2. Gaze estimation
      const gazeResult = await estimateGaze(imageBuffer);
      if (gazeResult === 'away') {
        violations.push('gaze_away');
      }

      // 3. Object detection
      const detectedObjects = await detectObjects(imageBuffer);
      if (detectedObjects.length > 0) {
        violations.push(...detectedObjects);
      }

    } catch (mlError) {
      console.error('❌ ML processing error:', mlError);
      // Continue without adding violations on ML error
    }

    // Update session violation count
    session.ml_violation_count = (session.ml_violation_count || 0) + violations.length;
    await session.save();

    const check = checkViolations(session);

    console.log('✅ ML processing completed, violations:', violations.length, 'total ML violations:', session.ml_violation_count);

    fs.unlinkSync(tempPath);

    res.json({
      ok: true,
      violations: violations,
      violationCount: session.ml_violation_count,
      endExam: check.endExam || false
    });

  } catch (err) {
    console.error('ML processing error:', err);
    res.status(500).json({ error: 'ML processing failed' });
  }
});

// Download PDF report
router.get('/download-pdf/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session || !session.pdf_path) {
      return res.status(404).json({ msg: 'PDF not found' });
    }

    const pdfPath = path.resolve(session.pdf_path);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ msg: 'PDF file not found on server' });
    }

    res.download(pdfPath, `exam_result_${sessionId}.pdf`);
  } catch (err) {
    console.error('Error downloading PDF:', err);
    res.status(500).send('Server error');
  }
});

// health
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

export default router;
