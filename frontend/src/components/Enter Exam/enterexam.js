import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../ToastContext';
import './enterexam.css';

const EnterExam = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [examId, setExamId] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [photo, setPhoto] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const { add: toastAdd } = useToast();

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Ensure video is ready and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video not ready for capture');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setPhoto(blob);
    });

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));

    // Stop camera after capture
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const retakePhoto = () => {
    setPhotoCaptured(false);
    setPhotoData(null);
    startCamera();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!examId.trim()) {
      newErrors.examId = 'All fields are mandatory';
    }
    if (!rollNo.trim()) {
      newErrors.rollNo = 'All fields are mandatory';
    }
    if (!photoCaptured) {
      newErrors.photo = 'Photo is required for verification';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Validate exam ID and roll number against database
      const response = await axios.post(`${API_BASE}/api/exam/validate`, {
        examId: examId.trim(),
        rollNo: rollNo.trim()
      });

      if (response.data.valid) {
        // Store student info in localStorage
        localStorage.setItem('studentId', rollNo.trim());
        localStorage.setItem('examId', examId.trim());

        // Optionally send photo to backend for verification
        if (photoData) {
          // You can implement photo upload here if needed
          console.log('Photo captured for student:', rollNo);
        }

        toastAdd('Exam entry successful! Starting exam...');
        navigate('/instructions');
      } else {
        if (response.data.error === 'invalid_exam') {
          setErrors({ examId: 'Invalid exam ID' });
        } else if (response.data.error === 'invalid_rollno') {
          setErrors({ rollNo: 'Invalid roll number' });
        } else {
          toastAdd('Validation failed. Please check your details.');
        }
      }
    } catch (error) {
      console.error('Error entering exam:', error);
      if (error.response?.status === 400) {
        if (error.response.data.error === 'invalid_exam') {
          setErrors({ examId: 'Invalid exam ID' });
        } else if (error.response.data.error === 'invalid_rollno') {
          setErrors({ rollNo: 'Invalid roll number' });
        } else {
          toastAdd('Validation failed. Please check your details.');
        }
      } else {
        toastAdd('Failed to enter exam. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };



  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="enter-exam-container">
      <div className="enter-exam-card">
        <h2 className="enter-exam-title">
          <i className="bi bi-person-check-fill me-2"></i>
          Enter Exam
        </h2>

        <p className="enter-exam-subtitle">
          Please provide your exam details and capture your photo for identity verification.
        </p>

        <div className="enter-exam-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="examId">Exam ID</label>
              <input
                type="text"
                id="examId"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                placeholder="Enter exam ID"
                className={`exam-input ${errors.examId ? 'error' : ''}`}
                required
              />
              {errors.examId && <span className="error-message">{errors.examId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="rollNo">Roll Number</label>
              <input
                type="text"
                id="rollNo"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="Enter your roll number"
                className={`exam-input ${errors.rollNo ? 'error' : ''}`}
                required
              />
              {errors.rollNo && <span className="error-message">{errors.rollNo}</span>}
            </div>
          </div>

          <div className="photo-capture-section">
            <div className="photo-capture-controls">
              <div className="photo-capture-buttons">
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn-start-camera"
                  disabled={!!stream || !!photoCaptured}
                >
                  <i className="bi bi-camera-video me-2"></i>
                  Start Camera
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!stream || !!photoCaptured}
                  className="btn-capture"
                >
                  <i className="bi bi-camera me-2"></i>
                  Capture Photo
                </button>
              </div>

              {photoCaptured && (
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="btn-retake"
                >
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Retake Photo
                </button>
              )}
            </div>

            <div className="photo-capture-display">
              {stream && !photoCaptured && (
                <div className="video-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="video-preview"
                  />
                  <div className="camera-overlay">
                    <div className="camera-frame"></div>
                    <p className="camera-instruction">
                      Position your face within the frame
                    </p>
                  </div>
                </div>
              )}

              {photoCaptured && (
                <div className="photo-captured-container">
                  <img
                    src={photoData}
                    alt="Captured"
                    className="photo-captured-img"
                  />
                  <div className="photo-capture-status">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Photo captured successfully
                  </div>
                </div>
              )}

              {!stream && !photoCaptured && (
                <div className="photo-capture-placeholder">
                  <i className="bi bi-camera"></i>
                  <p>Click "Start Camera" to begin verification</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="photo-canvas" />
          </div>

          {errors.photo && <span className="error-message" style={{ display: 'block', marginTop: '10px' }}>{errors.photo}</span>}

          <button
            type="button"
            className="btn-enter-exam"
            onClick={handleSubmit}
            disabled={loading || !examId.trim() || !rollNo.trim() || !photoCaptured}
          >
            {loading ? (
              <>
                <i className="bi bi-hourglass-split me-2"></i>
                Entering Exam...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill me-2"></i>
                Enter Exam
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnterExam;
