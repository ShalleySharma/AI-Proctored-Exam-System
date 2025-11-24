import express from 'express';
const router = express.Router();
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import auth from '../middleware/auth.js';

const signupStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'proctoai/signup',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const loginStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'proctoai/login',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const uploadSignup = multer({ storage: signupStorage });
const uploadLogin = multer({ storage: loginStorage });

router.post('/signup', uploadSignup.single('photo'), async (req, res) => {
  console.log('Signup route hit');
  const { name, roll_no, course, year, email, password } = req.body;
  const photo_path = req.file ? req.file.path : null;
  console.log('Student signup attempt:', email, photo_path);

  try {
    if (await Student.findOne({ email })) return res.status(400).json({ msg: 'Email exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({ name, roll_no, course, year, email, password: hashedPassword, photo_path });
    await student.save();
    console.log('Student saved:', student.email);
    res.json({ msg: 'Signup successful' });
  } catch (err) {
    console.error('Student signup error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/teacher-signup', uploadSignup.single('photo'), async (req, res) => {
  const { email, password, full_name, school } = req.body;
  const photo_path = req.file ? req.file.path : null;
  console.log('Teacher signup attempt:', email, photo_path);

  try {
    if (await Teacher.findOne({ email })) return res.status(400).json({ msg: 'Email exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = new Teacher({ email, password: hashedPassword, photo_path, full_name, school });
    await teacher.save();
    console.log('Teacher saved:', teacher.email);
    res.json({ msg: 'Teacher signup successful' });
  } catch (err) {
    console.error('Teacher signup error:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.post('/login', uploadLogin.single('photo'), async (req, res) => {
  const { email, password } = req.body;
  const loginPhotoPath = req.file ? req.file.path : null;
  console.log('Login attempt:', email, loginPhotoPath);
  try {
    const student = await Student.findOne({ email });
    console.log('Student found:', student ? student.email : 'none');
    if (!student) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, student.password);
    console.log('Password match:', isMatch);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // TODO: Implement face recognition using loginPhotoPath and student.photo_path

    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '365d' });
    res.json({ msg: 'Login successful', token, studentId: student._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/teacher-login', uploadLogin.single('photo'), async (req, res) => {
  const { email, password } = req.body;
  const loginPhotoPath = req.file ? req.file.path : null;
  console.log('Teacher login attempt:', email, loginPhotoPath);
  try {
    const teacher = await Teacher.findOne({ email });
    console.log('Teacher found:', teacher ? teacher.email : 'none');
    if (!teacher) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, teacher.password);
    console.log('Password match:', isMatch);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // TODO: Implement face recognition using loginPhotoPath and teacher.photo_path

    const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '365d' });
    res.json({ msg: 'Teacher login successful', token, teacherId: teacher._id });
  } catch (err) {
    console.error('Teacher login error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/teacher-profile', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.userId).select('-password');
    if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    console.error('Get teacher profile error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/student-profile', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.userId).select('-password');
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error('Get student profile error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/verify-token', auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

export default router;
