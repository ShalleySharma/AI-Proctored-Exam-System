import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../utils/auth';
import './TeacherSignup.css';

function TeacherSignin() {
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', school: '' });
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

  useEffect(() => {
    // Clear auto-filled values
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const fullNameInput = document.querySelector('input[name="full_name"]');
    const schoolInput = document.querySelector('input[name="school"]');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (fullNameInput) fullNameInput.value = '';
    if (schoolInput) schoolInput.value = '';
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

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === 'email') {
      if (!value) {
        newErrors.email = 'Email is required';
      } else if (!/@gmail\.com$/.test(value)) {
        newErrors.email = 'Email must be a valid Gmail address (e.g., example@gmail.com)';
      } else {
        delete newErrors.email;
      }
    } else if (name === 'password') {
      if (!value) {
        newErrors.password = 'Password is required';
      } else if (value.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        newErrors.password = 'Password must contain at least one special character';
      } else {
        delete newErrors.password;
      }
    } else if (name === 'full_name') {
      if (!value) {
        newErrors.full_name = 'Full name is required';
      } else {
        delete newErrors.full_name;
      }
    } else if (name === 'school') {
      if (!value) {
        newErrors.school = 'School is required';
      } else {
        delete newErrors.school;
      }
    }
    setErrors(newErrors);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
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
    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    }
    if (!formData.school) {
      newErrors.school = 'School is required';
    }
    if (!capturedImage) newErrors.photo = 'Photo is required';
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
    data.append('full_name', formData.full_name);
    data.append('school', formData.school);
    if (photo) {
      data.append('photo', photo, 'signup.jpg');
    }

    try {
      const res = await authService.signup('/api/auth/teacher-signup', data);
      alert(res.data.msg);
      navigate('/teacher-login');
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
          <h2 className="teacher-signin-title">Teacher SignUp</h2>
          <div className="teacher-signin-content">
            <form className="teacher-signin-form" onSubmit={handleSubmit} autoComplete="off">
              <div className="teacher-signin-input-group">
                <div className="teacher-signin-input-with-icon">
                  <i className="bi bi-envelope teacher-signin-input-icon"></i>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="off"
                    className={`teacher-signin-input ${errors.email ? 'error' : ''}`}
                  />
                </div>
                {errors.email && <span className="teacher-signin-error">{errors.email}</span>}
              </div>
              <div className="teacher-signin-input-group">
                <div className="teacher-signin-input-with-icon">
                  <i className="bi bi-lock teacher-signin-input-icon"></i>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="off"
                    className={`teacher-signin-input ${errors.password ? 'error' : ''}`}
                  />
                  <i className="bi bi-eye-slash teacher-signin-password-toggle" onClick={() => {
                    const input = document.querySelector('input[name="password"]');
                    input.type = input.type === 'password' ? 'text' : 'password';
                    const icon = document.querySelector('.teacher-signin-password-toggle');
                    icon.className = input.type === 'password' ? 'bi bi-eye-slash teacher-signin-password-toggle' : 'bi bi-eye teacher-signin-password-toggle';
                  }}></i>
                </div>
                {errors.password && <span className="teacher-signin-error">{errors.password}</span>}
              </div>
              <div className="teacher-signin-input-group">
                <div className="teacher-signin-input-with-icon">
                  <i className="bi bi-person-fill teacher-signin-input-icon"></i>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="off"
                    className={`teacher-signin-input ${errors.full_name ? 'error' : ''}`}
                  />
                </div>
                {errors.full_name && <span className="teacher-signin-error">{errors.full_name}</span>}
              </div>
              <div className="teacher-signin-input-group">
                <div className="teacher-signin-input-with-icon">
                  <i className="bi bi-building teacher-signin-input-icon"></i>
                  <input
                    type="text"
                    name="school"
                    placeholder="School"
                    value={formData.school}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="off"
                    className={`teacher-signin-input ${errors.school ? 'error' : ''}`}
                  />
                </div>
                {errors.school && <span className="teacher-signin-error">{errors.school}</span>}
              </div>
              <button
                type="submit"
                className="teacher-signin-submit-btn"
                disabled={isLoading}
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
              {errors.photo && <span className="teacher-signin-error">{errors.photo}</span>}
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
