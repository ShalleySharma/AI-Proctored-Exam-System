import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    roll_no: '',
    course: '',
    year: '',
    email: '',
    password: ''
  });
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      let errorMessage = 'Camera access failed.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera device found. Please connect a camera.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other apps.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints cannot be satisfied.';
      } else {
        errorMessage = 'An unexpected error occurred with the camera.';
      }
      alert(errorMessage);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      alert('Please capture a photo');
      return;
    }
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('photo', photo, 'photo.jpg');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', data);
      alert(res.data.msg);
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.msg || 'Signup failed');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-image">
          <div className="signup-image-content">
            <img src="/images/signup.jpg" alt="Signup Illustration" className="signup-img" />
            <h3>Welcome!</h3>
            <p>Join our community of learners and start your journey towards academic excellence.</p>
          </div>
        </div>
        <div className="signup-form-container">
          <div className="signup-header">
            <h2>Student Signup</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <i className="bi bi-person"></i>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <i className="bi bi-hash"></i>
              <input
                type="text"
                name="roll_no"
                className="form-control"
                placeholder="Roll Number"
                value={formData.roll_no}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <i className="bi bi-book"></i>
              <input
                type="text"
                name="course"
                className="form-control"
                placeholder="Course"
                value={formData.course}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <i className="bi bi-calendar"></i>
              <input
                type="text"
                name="year"
                className="form-control"
                placeholder="Year"
                value={formData.year}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <i className="bi bi-envelope"></i>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Email Address"
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
                placeholder="Password"
                autocomplete="current-password"
                value={formData.password}
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
              <i className="bi bi-person-plus me-2"></i>Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
