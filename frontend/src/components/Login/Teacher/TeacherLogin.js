import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TeacherLogin.css';

function TeacherLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [photo, setPhoto] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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
  };

  const validateForm = () => {
    const newErrors = {};
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
    data.append('email', formData.email);
    data.append('password', formData.password);
    if (photo) {
      data.append('photo', photo, 'login.jpg');
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/teacher/login', data);
      alert(res.data.msg);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('teacherId', res.data.teacherId);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.msg || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="teacher-login-container">
      <div className="teacher-login-card">
        <div className="teacher-login-left">
          <div style={{ textAlign: 'center' }}>
            <img src="/images/password.jpg" alt="Teacher Login" />
            <h3>Welcome Back Teacher!</h3>
            <p>Login to manage your exams and students.</p>
          </div>
        </div>
        <div className="teacher-login-right">
          <h2 className="teacher-login-title">Teacher Login</h2>
          <form className="teacher-login-form" onSubmit={handleSubmit}>
            <div className="teacher-login-input-group">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className={`teacher-login-input ${errors.email ? 'error' : ''}`}
              />
              {errors.email && <span className="teacher-login-error">{errors.email}</span>}
            </div>
            <div className="teacher-login-input-group">
              <div className="teacher-login-password">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`teacher-login-input ${errors.password ? 'error' : ''}`}
                />
                {errors.password && <span className="teacher-login-error">{errors.password}</span>}
              </div>
            </div>
            <button
              type="submit"
              className="teacher-login-submit-btn"
              disabled={!capturedImage || isLoading}
            >
              {isLoading ? (
                <>
                  <i className="bi bi-arrow-repeat me-2 spinning"></i>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login as Teacher
                </>
              )}
            </button>
          </form>
          <div className="teacher-login-camera-section">
            <div className="teacher-login-camera-controls">
              <div className="teacher-login-camera-buttons">
                <button
                  type="button"
                  onClick={startCamera}
                  className="teacher-login-btn teacher-login-btn-secondary"
                  disabled={!!stream || !!capturedImage}
                >
                  <i className="bi bi-camera-video me-2"></i>
                  Start Camera
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!stream || !!capturedImage}
                  className="teacher-login-btn teacher-login-btn-primary"
                >
                  <i className="bi bi-camera me-2"></i>
                  Capture Photo
                </button>
              </div>

              {capturedImage && (
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="teacher-login-retake-btn"
                >
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Retake Photo
                </button>
              )}
            </div>

            <div className="teacher-login-camera-display">
              {stream && !capturedImage && (
                <div className="teacher-login-video-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    className="teacher-login-video"
                  />
                  <div className="teacher-login-camera-overlay">
                    <div className="teacher-login-camera-frame"></div>
                    <p className="teacher-login-camera-instruction">
                      Position your face within the frame
                    </p>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div className="teacher-login-captured-container">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="teacher-login-captured-img"
                  />
                  <div className="teacher-login-capture-status">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Photo captured successfully
                  </div>
                </div>
              )}

              {!stream && !capturedImage && (
                <div className="teacher-login-camera-placeholder">
                  <i className="bi bi-camera"></i>
                  <p>Click "Start Camera" to begin verification</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="teacher-login-canvas" />
          </div>
          <p className="teacher-login-footer">
            Don't have an account? <a href="/teacher-signup">Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeacherLogin;
