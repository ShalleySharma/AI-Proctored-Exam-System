import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentLogin.css';

function StudentLogin() {
  const [formData, setFormData] = useState({ email: '', password: '', testId: '' });
  const [photo, setPhoto] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Clear form fields on component mount to prevent autofill
  useEffect(() => {
    setFormData({ email: '', password: '', testId: '' });
    // Force clear any browser autofill with multiple attempts
    const clearInputs = () => {
      const emailInput = document.querySelector('input[name="email"]');
      const passwordInput = document.querySelector('input[name="password"]');
      const testIdInput = document.querySelector('input[name="testId"]');
      if (emailInput) {
        emailInput.value = '';
        emailInput.defaultValue = '';
      }
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.defaultValue = '';
      }
      if (testIdInput) {
        testIdInput.value = '';
        testIdInput.defaultValue = '';
      }
    };
    setTimeout(clearInputs, 100);
    setTimeout(clearInputs, 500);
    setTimeout(clearInputs, 1000);
  }, []);

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
    }
    if (!formData.testId) newErrors.testId = 'Test ID is required';
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
    data.append('testId', formData.testId);
    if (photo) {
      data.append('photo', photo, 'login.jpg');
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', data);
      alert(res.data.msg);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('studentId', res.data.studentId);
      navigate('/instructions');
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'Login failed';
      alert(errorMessage); // Show error as alert instead of inline message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="student-login-container">
      <div className="student-login-card">
        <div className="student-login-left">
          <div style={{ textAlign: 'center' }}>
            <img src="/images/password.jpg" alt="Student Login" />
            <h3>Welcome Back Student!</h3>
            <p>Login to access your account and continue your learning journey.</p>
          </div>
        </div>
        <div className="student-login-right">
          <h2 className="student-login-title">Student Login</h2>
          <div className="student-login-content">
            <form className="student-login-form" onSubmit={handleSubmit} autoComplete="off" data-form="login">
              <input type="hidden" autoComplete="username" />
              <input type="hidden" autoComplete="new-password" />
              {apiError && <div className="student-login-api-error">{apiError}</div>}
              <div className="student-login-input-group">
                <div className="student-login-password">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`student-login-input ${errors.email ? 'error' : ''}`}
                    autoComplete="off"
                  />
                  <i className="bi bi-envelope student-login-password-icon"></i>
                </div>
                {errors.email && <span className="student-login-error">{errors.email}</span>}
              </div>
              <div className="student-login-input-group">
                <div className="student-login-password">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`student-login-input ${errors.password ? 'error' : ''}`}
                    autoComplete="off"
                  />
                  <i className="bi bi-eye-slash student-login-password-icon" onClick={() => {
                    const input = document.querySelector('input[name="password"]');
                    input.type = input.type === 'password' ? 'text' : 'password';
                    const icon = document.querySelector('.student-login-password-icon');
                    icon.className = input.type === 'password' ? 'bi bi-eye-slash student-login-password-icon' : 'bi bi-eye student-login-password-icon';
                  }}></i>
                  {errors.password && <span className="student-login-error">{errors.password}</span>}
                </div>
              </div>
              <div className="student-login-input-group">
                <div className="student-login-password">
                  <input
                    type="text"
                    name="testId"
                    placeholder="Exam ID"
                    value={formData.testId}
                    onChange={handleChange}
                    required
                    className={`student-login-input ${errors.testId ? 'error' : ''}`}
                    autoComplete="off"
                  />
                  <i className="bi bi-card-text student-login-password-icon"></i>
                </div>
                {errors.testId && <span className="student-login-error">{errors.testId}</span>}
              </div>
              <button
                type="submit"
                className="student-login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="bi bi-arrow-repeat me-2 spinning"></i>
                    Logging in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login as Student
                  </>
                )}
              </button>
            </form>
            <div className="student-login-camera-section">
              <div className="student-login-camera-controls">
                <div className="student-login-camera-buttons">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="student-login-btn student-login-btn-secondary"
                    disabled={!!stream || !!capturedImage}
                  >
                    <i className="bi bi-camera-video me-2"></i>
                    Start Camera
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!stream || !!capturedImage}
                    className="student-login-btn student-login-btn-primary"
                  >
                    <i className="bi bi-camera me-2"></i>
                    Capture Photo
                  </button>
                </div>

                {capturedImage && (
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="student-login-retake-btn"
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Retake Photo
                  </button>
                )}
              </div>

              <div className="student-login-camera-display">
                {stream && !capturedImage && (
                  <div className="student-login-video-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      className="student-login-video"
                    />
                    <div className="student-login-camera-overlay">
                      <div className="student-login-camera-frame"></div>
                      <p className="student-login-camera-instruction">
                        Position your face within the frame
                      </p>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="student-login-captured-container">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="student-login-captured-img"
                    />
                    <div className="student-login-capture-status">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Photo captured successfully
                    </div>
                  </div>
                )}

                {!stream && !capturedImage && (
                  <div className="student-login-camera-placeholder">
                    <i className="bi bi-camera"></i>
                    <p>Click "Start Camera" to begin verification</p>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="student-login-canvas" />
            </div>
            {errors.photo && <span className="student-login-error" style={{ display: 'block', marginTop: '10px' }}>{errors.photo}</span>}
          </div>
          <p className="student-login-footer">
            Don't have an account? <a href="/student-signup">Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
