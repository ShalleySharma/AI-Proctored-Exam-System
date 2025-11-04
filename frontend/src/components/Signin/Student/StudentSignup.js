import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentSignup.css';

function StudentSignup() {
  const [formData, setFormData] = useState({ name: '', roll_no: '', course: '', year: '', email: '', password: '' });
  const [photo, setPhoto] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert('Camera access denied');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        setPhoto(blob);
      });
      setCapturedImage(canvas.toDataURL());

      // stop webcam stream
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setPhoto(null);
    startCamera();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Name is required';
        break;
      case 'roll_no':
        if (!value.trim()) error = 'Roll No is required';
        break;
      case 'course':
        if (!value.trim()) error = 'Course is required';
        break;
      case 'year':
        if (!value.trim()) error = 'Year is required';
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/@gmail\.com$/.test(value)) {
          error = 'Email must be a valid Gmail address (e.g., example@gmail.com)';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters long';
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
          error = 'Password must contain at least one special character';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.roll_no) newErrors.roll_no = 'Roll No is required';
    if (!formData.course) newErrors.course = 'Course is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/@gmail\.com$/.test(formData.email)) {
      newErrors.email = 'Email must be a valid Gmail address (e.g., example@gmail.com)';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }
    if (!capturedImage) newErrors.photo = 'Photo verification is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      for (let field in errors) {
        alert(errors[field]);
      }
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('rollNo', formData.roll_no);
    data.append('course', formData.course);
    data.append('year', formData.year);
    data.append('email', formData.email);
    data.append('password', formData.password);
    if (photo) {
      data.append('photo', photo, 'signup.jpg');
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', data);
      alert(res.data.msg);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('studentId', res.data.studentId);
      navigate('/student-login');
    } catch (err) {
      alert(err.response?.data?.msg || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="student-signup-container">
      <div className="student-signup-card">
        <div className="student-signup-left">
          <div style={{ textAlign: 'center' }}>
            <img src="/images/signup.jpg" alt="Student Signup" />
            <h3>Join Our Platform</h3>
            <p>Create your account and start your learning journey.</p>
          </div>
        </div>
        <div className="student-signup-right">
          <h2 className="student-signup-title">Student Sign Up</h2>
          <div className="student-signup-content">
            <form className="student-signup-form" onSubmit={handleSubmit} autoComplete="off">
              <input type="hidden" autoComplete="username" />
              <div className="student-signup-input-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`student-signup-input ${errors.name ? 'error' : ''}`}
                  autoComplete="off"
                />
                {errors.name && <span className="student-signup-error">{errors.name}</span>}
              </div>
              <div className="student-signup-input-group">
                <input
                  type="text"
                  name="roll_no"
                  placeholder="Roll No"
                  value={formData.roll_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`student-signup-input ${errors.roll_no ? 'error' : ''}`}
                  autoComplete="off"
                />
                {errors.roll_no && <span className="student-signup-error">{errors.roll_no}</span>}
              </div>
              <div className="student-signup-input-group">
                <input
                  type="text"
                  name="course"
                  placeholder="Course"
                  value={formData.course}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`student-signup-input ${errors.course ? 'error' : ''}`}
                  autoComplete="off"
                />
                {errors.course && <span className="student-signup-error">{errors.course}</span>}
              </div>
              <div className="student-signup-input-group">
                <input
                  type="text"
                  name="year"
                  placeholder="Year"
                  value={formData.year}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`student-signup-input ${errors.year ? 'error' : ''}`}
                  autoComplete="off"
                />
                {errors.year && <span className="student-signup-error">{errors.year}</span>}
              </div>
              <div className="student-signup-input-group">
                <div className="student-signup-password">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`student-signup-input ${errors.email ? 'error' : ''}`}
                    autoComplete="off"
                  />
                  <i className="bi bi-envelope student-signup-password-icon"></i>
                </div>
                {errors.email && <span className="student-signup-error">{errors.email}</span>}
              </div>
              <div className="student-signup-input-group">
                <div className="student-signup-password">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`student-signup-input ${errors.password ? 'error' : ''}`}
                    autoComplete="new-password"
                  />
                  <i className="bi bi-eye-slash student-signup-password-icon" onClick={() => {
                    const input = document.querySelector('input[name="password"]');
                    input.type = input.type === 'password' ? 'text' : 'password';
                    const icon = document.querySelector('.student-signup-password-icon');
                    icon.className = input.type === 'password' ? 'bi bi-eye-slash student-signup-password-icon' : 'bi bi-eye student-signup-password-icon';
                  }}></i>
                  {errors.password && <span className="student-signup-error">{errors.password}</span>}
                </div>
              </div>
              <button
                type="submit"
                className="student-signup-submit-btn"
                disabled={!capturedImage || isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="bi bi-arrow-repeat me-2 spinning"></i>
                    Signing up...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2"></i>
                    Sign Up as Student
                  </>
                )}
              </button>
            </form>
            <div className="student-signup-camera-section">
              <div className="student-signup-camera-controls">
                <div className="student-signup-camera-buttons">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="student-signup-btn student-signup-btn-secondary"
                    disabled={!!stream || !!capturedImage}
                  >
                    <i className="bi bi-camera-video me-2"></i>
                    Start Camera
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!stream || !!capturedImage}
                    className="student-signup-btn student-signup-btn-secondary"
                  >
                    <i className="bi bi-camera me-2"></i>
                    Capture Photo
                  </button>
                </div>

                {capturedImage && (
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="student-signup-retake-btn"
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Retake Photo
                  </button>
                )}
              </div>

              <div className="student-signup-camera-display">
                {stream && !capturedImage && (
                  <div className="student-signup-video-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      className="student-signup-video"
                    />
                    <div className="student-signup-camera-overlay">
                      <div className="student-signup-camera-frame"></div>
                      <p className="student-signup-camera-instruction">
                        Position your face within the frame
                      </p>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="student-signup-captured-container">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="student-signup-captured-img"
                    />
                    <div className="student-signup-capture-status">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Photo captured successfully
                    </div>
                  </div>
                )}

                {!stream && !capturedImage && (
                  <div className="student-signup-camera-placeholder">
                    <i className="bi bi-camera"></i>
                    <p>Click "Start Camera" to begin verification</p>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="student-signup-canvas" />
            </div>
          </div>
          <p className="student-signup-footer">
            Already have an account? <a href="/student-login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentSignup;
