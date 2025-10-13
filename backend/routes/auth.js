import express from 'express';
const router = express.Router();
import Student from '../models/Student.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';

const signupStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/signup/'),
  filename: (req, file, cb) => cb(null, Date.now()+'-'+file.originalname)
});

const loginStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/login/'),
  filename: (req, file, cb) => cb(null, Date.now()+'-'+file.originalname)
});

const uploadSignup = multer({ storage: signupStorage });
const uploadLogin = multer({ storage: loginStorage });

router.post('/signup', uploadSignup.single('photo'), async (req, res) => {
  const { name, roll_no, course, year, email, password } = req.body;
  const photo_path = req.file ? req.file.path : null;

  try {
    if (await Student.findOne({ email })) return res.status(400).json({ msg: 'Email exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({ name, roll_no, course, year, email, password: hashedPassword, photo_path });
    await student.save();
    res.json({ msg: 'Signup successful' });
  } catch (err) { res.status(500).send('Server error'); }
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

    const token = jwt.sign({ id: student._id }, 'secret', { expiresIn: '1h' });
    res.json({ msg: 'Login successful', token, studentId: student._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

export default router;
