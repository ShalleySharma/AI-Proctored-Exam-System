import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TeacherSignin.css';

function TeacherSignin() {
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
      data.append('photo', photo, 'signup.jpg');
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/teacher-signup', data);
      alert(res.data.msg);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('teacherId', res.data.teacherId);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.msg || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="teacher-signin-container">
      <div className="teacher-signin-card">
        <div className="teacher-signin-left">
          <div style={{ textAlign: 'center' }}>
            <img src="/images/signup.jpg" alt="Teacher Signup" />
            <h3>Join Our Platform</h3>
            <p>Create your account and start teaching.</p>
          </div>
        </div>
        <div className="teacher-signin-right">
          <h2 className="teacher-signin-title">Teacher SignIn</h2>
          <div className="teacher-signin-content">
            <form className="teacher-signin-form" onSubmit={handleSubmit}>
              <div className="teacher-signin-input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`teacher-signin-input ${errors.email ? 'error' : ''}`}
                />
                {errors.email && <span className="teacher-signin-error">{errors.email}</span>}
              </div>
              <div className="teacher-signin-input-group">
                <div className="teacher-signin-password">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`teacher-signin-input ${errors.password ? 'error' : ''}`}
                  />
                  <i className="bi bi-eye-slash teacher-signin-password-icon" onClick={() => {
                    const input = document.querySelector('input[name="password"]');
                    input.type = input.type === 'password' ? 'text' : 'password';
                    const icon = document.querySelector('.teacher-signin-password-icon');
                    icon.className = input.type === 'password' ? 'bi bi-eye-slash teacher-signin-password-icon' : 'bi bi-eye teacher-signin-password-icon';
                  }}></i>
                  {errors.password && <span className="teacher-signin-error">{errors.password}</span>}
                </div>
              </div>
              <button
                type="submit"
                className="teacher-signin-submit-btn"
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
                    Sign Up as Teacher
                  </>
                )}
              </button>
            </form>
            <div className="teacher-signin-camera-section">
              <div className="teacher-signin-camera-controls">
                <div className="teacher-signin-camera-buttons">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="teacher-signin-btn teacher-signin-btn-secondary"
                    disabled={!!stream || !!capturedImage}
                  >
                    <i className="bi bi-camera-video me-2"></i>
                    Start Camera
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!stream || !!capturedImage}
                    className="teacher-signin-btn teacher-signin-btn-primary"
                  >
                    <i className="bi bi-camera me-2"></i>
                    Capture Photo
                  </button>
                </div>

                {capturedImage && (
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="teacher-signin-retake-btn"
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Retake Photo
                  </button>
                )}
              </div>

              <div className="teacher-signin-camera-display">
                {stream && !capturedImage && (
                  <div className="teacher-signin-video-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      className="teacher-signin-video"
                    />
                    <div className="teacher-signin-camera-overlay">
                      <div className="teacher-signin-camera-frame"></div>
                      <p className="teacher-signin-camera-instruction">
                        Position your face within the frame
                      </p>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="teacher-signin-captured-container">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="teacher-signin-captured-img"
                    />
                    <div className="teacher-signin-capture-status">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Photo captured successfully
                    </div>
                  </div>
                )}

                {!stream && !capturedImage && (
                  <div className="teacher-signin-camera-placeholder">
                    <i className="bi bi-camera"></i>
                    <p>Click "Start Camera" to begin verification</p>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="teacher-signin-canvas" />
            </div>
          </div>
          <p className="teacher-signin-footer">
            Already have an account? <a href="/teacher-login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeacherSignin;
