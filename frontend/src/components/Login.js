import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '', testId: '' });
  const [photo, setPhoto] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="instructions-section">
      <div className="instructions-box">
        <h2 className="login-instruction-heading">Login Instructions</h2>
        <ol className="text-start mb-0">
          <li><i className="bi bi-camera me-2"></i>First click on "Start Camera" to access your camera.</li>
          <li><i className="bi bi-camera-fill me-2"></i>Click "Capture Photo" to take a snapshot.</li>
          <li><i className="bi bi-person me-2"></i>Enter your email and password in the login form.</li>
          <li><i className="bi bi-box-arrow-in-right me-2"></i>Click "Login" to authenticate.</li>
        </ol>
      </div>
      </div>
      <div className="login-card">
        <div className="login-image">
          <div className="login-image-content">
            <img src="/images/signup.jpg" alt="Login Illustration" className="login-img" />
            <h3>Welcome Back!</h3>
            <p>Login to access your account and continue your learning journey.</p>
          </div>
        </div>
        <div className="login-form-container">
          <div className="login-header">
            <h2>Student Login</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <i className="bi bi-envelope"></i>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <i className="bi bi-lock"></i>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <i className="bi bi-card-text"></i>
              <input
                type="text"
                name="testId"
                className="form-control"
                placeholder="Enter your test ID"
                value={formData.testId}
                onChange={handleChange}
                required
              />
            </div>
            <div className="photo-section">
              <div className="btn-group">
                <button type="button" className="btn btn-secondary-modern btn-modern" onClick={startCamera}>
                  <i className="bi bi-camera me-2"></i>Start Camera
                </button>
                <button type="button" className="btn btn-info-modern btn-modern" onClick={capturePhoto} disabled={!stream || !!capturedImage}>
                  <i className="bi bi-camera-fill me-2"></i>Capture Photo
                </button>
              </div>
              {stream && (
                <video ref={videoRef} autoPlay className="video-preview" />
              )}
              {capturedImage && (
                <>
                  <img src={capturedImage} alt="Captured" className="image-preview" />
                  <button type="button" className="btn btn-warning-modern btn-modern mt-3" onClick={retakePhoto}>
                    <i className="bi bi-arrow-repeat me-2"></i>Retake Photo
                  </button>
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <button type="submit" className="btn-submit">
              <i className="bi bi-box-arrow-in-right me-2"></i>Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
