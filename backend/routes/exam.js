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
import { checkViolations } from '../ml/utils/violationCounter.js';
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

// Upload snapshot with ML detection (accepts base64 JSON)
router.post('/snapshot', auth, async (req, res) => {
  try {
    const { sessionId, image } = req.body;

    if (!sessionId || !image) {
      return res.status(400).json({ ok: false, error: "Missing sessionId or base64 image" });
    }

    // Find session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(400).json({ ok: false, error: 'Invalid session' });
    }

    // Extract base64 data from data URL if present
    let base64Data = image;
    if (image.startsWith('data:image/')) {
      base64Data = image.split(',')[1];
    }

    // TEMP DEBUG LOGS
    console.log("Base64 length:", base64Data?.length);
    console.log("Starts with:", base64Data?.substring(0, 30));

    // Call Python ML service with base64 image
    const axios = (await import('axios')).default;
    let mlResponse;
    try {
      mlResponse = await axios.post('http://localhost:5001/process-ml', {
        image: base64Data,
        sessionId: sessionId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
    } catch (mlError) {
      console.error('ML service error:', mlError.response?.data || mlError.message);
      // Return empty violations if ML fails
      res.json({
        ok: true,
        message: "Snapshot processed (ML service failed, using defaults)",
        violations: [],
        detections: {
          detected_objects: [],
          person_count: 0,
          face_count: 0,
          gaze: 'center'
        }
      });
      return;
    }

    const { violations, detected_objects, person_count, face_count, gaze } = mlResponse.data;

    // Only save snapshot if violations detected
    if (violations && violations.length > 0) {
      // Prepare detections object for DB storage
      const detections = {
        detected_objects: detected_objects || [],
        person_count: person_count || 0,
        face_count: face_count || 0,
        gaze: gaze || 'center'
      };

      // Save snapshot to database
      const snapshot = new Snapshot({
        session_id: sessionId,
        detections: detections,
        violations: violations || [],
        timestamp: new Date()
      });

      // Upload base64 to Cloudinary for violated snapshots
      const { uploadToCloudinary } = await import('../config/cloudinary.js');
      const cloudinaryResult = await uploadToCloudinary(base64Data, { resource_type: 'image' });
      snapshot.image_url = cloudinaryResult.secure_url;

      await snapshot.save();

      // Update violation count in session
      session.ml_violation_count = (session.ml_violation_count || 0) + violations.length;
      await session.save();
    }

    const message = violations && violations.length > 0 ? "Cheating detected and snapshot saved" : "No violations detected";
    const violationDetails = violations && violations.length > 0 ? ` - Violations: ${violations.join(', ')}` : '';
    console.log(`Detection result: ${message}${violationDetails}`);

    res.json({
      ok: true,
      message: "Snapshot processed with ML detection",
      violations: violations || [],
      detections: {
        detected_objects: detected_objects || [],
        person_count: person_count || 0,
        face_count: face_count || 0,
        gaze: gaze || 'center'
      }
    });

  } catch (err) {
    console.error("SNAPSHOT ERROR:", err);
    res.status(500).json({ ok: false, error: "Snapshot processing failed" });
  }
});

router.post('/process-snapshot', async (req, res) => {
  try {
    const { imageBase64, sessionId, studentId, examId } = req.body;

    if (!imageBase64 || !sessionId)
      return res.status(400).json({ error: "Image missing" });

    // Call Python ML service with base64 image
    const axios = (await import('axios')).default;
    let mlResponse;
    let violations = [];
    let imageUrl = null;

    try {
      mlResponse = await axios.post('http://localhost:5001/process-ml', {
        image: imageBase64,
        sessionId: sessionId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      violations = mlResponse.data.violations || [];
    } catch (mlError) {
      console.error('ML service error:', mlError.response?.data || mlError.message);
      // Continue without ML if service fails
    }

    // If violations detected, save snapshot to Cloudinary
    if (violations && violations.length > 0) {
      try {
        const { uploadToCloudinary } = await import('../config/cloudinary.js');
        const cloudinaryResult = await uploadToCloudinary(imageBase64, { resource_type: 'image' });
        imageUrl = cloudinaryResult.secure_url;

        // Save snapshot to database
        const snapshot = new Snapshot({
          session_id: sessionId,
          detections: {
            detected_objects: mlResponse?.data?.detected_objects || [],
            person_count: mlResponse?.data?.person_count || 0,
            face_count: mlResponse?.data?.face_count || 0,
            gaze: mlResponse?.data?.gaze || 'center'
          },
          violations: violations,
          image_url: imageUrl,
          timestamp: new Date()
        });

        await snapshot.save();

        // Update session violation count
        const session = await Session.findById(sessionId);
        if (session) {
          session.ml_violation_count = (session.ml_violation_count || 0) + violations.length;
          await session.save();
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
      }
    }

    const message = violations.length > 0 ? "Cheating detected and snapshot saved" : "No violations detected";
    const violationDetails = violations.length > 0 ? ` - Violations: ${violations.join(', ')}` : '';
    console.log(`Detection result: ${message}${violationDetails}`);
    res.json({
      success: true,
      violations: violations,
      imageUrl: imageUrl,
      message: message
    });
  } catch (err) {
    console.log("Process snapshot error:", err);
    res.status(500).json({ error: "Failed to process snapshot" });
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

    // Find sessions for those exams with full details
    const sessions = await Session.find({ exam_id: { $in: examIds } })
      .populate('student_id', 'name roll_no email course year photo_path')
      .populate('exam_id', 'title subject date duration totalMarks')
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
    session.logout_time = new Date(completedAt); // Use the same time as completed_at for consistency
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

    // Find student by ID or roll_no (similar to start endpoint)
    let student;
    try {
      student = await Student.findById(studentId);
    } catch (err) {
      // If not a valid ObjectId, try finding by roll_no
      student = await Student.findOne({ roll_no: studentId });
    }
    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // Find all completed sessions for the student
    const sessions = await Session.find({
      student_id: student._id,
      completed_at: { $exists: true }
    })
    .populate('exam_id', 'title subject date duration totalMarks questions')
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
        pdfPath: session.pdf_path, // Add PDF path for download
        // Add student details
        studentName: student.name,
        studentRollNo: student.roll_no,
        studentEmail: student.email,
        studentCourse: student.course,
        studentYear: student.year,
        studentPhoto: student.photo_path,
        // Add session times
        loginTime: session.login_time,
        logoutTime: session.logout_time || session.completed_at
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

// Join exam by code or ID (for students)
router.get('/join/:code', auth, async (req, res) => {
  try {
    // First try to find by examCode
    let exam = await Exam.findOne({ examCode: req.params.code }).populate('createdBy', 'name');

    // If not found by examCode, try to find by _id
    if (!exam) {
      exam = await Exam.findById(req.params.code).populate('createdBy', 'name');
    }

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
      fs.unlinkSync(tempPath);
      return res.json({ ok: true, embedding: { embedding: Array(128).fill(0.1) } });
    }

    // ----------- Normal ML snapshot ------------
    console.log('🔍 Processing ML snapshot for session:', sessionId);

    // Simplified: no ML processing, return empty violations
    const violations = [];

    // Update session violation count (always 0 now)
    session.ml_violation_count = (session.ml_violation_count || 0);
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























































































