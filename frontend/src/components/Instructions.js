import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Instructions.css';

function Instructions() {
  const navigate = useNavigate();
  const [cameraAccessible, setCameraAccessible] = useState(null);
  const [testingCamera, setTestingCamera] = useState(false);

  const testCameraAndMicrophone = async () => {
    setTestingCamera(true);
    setCameraAccessible(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraAccessible(true);
      // Do not stop the stream to keep permission active
      // stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Camera/Microphone access denied:', err);
      setCameraAccessible(false);
    } finally {
      setTestingCamera(false);
    }
  };

  const handleStartExam = async () => {
    if (cameraAccessible === true) {
      const examId = localStorage.getItem('examId');
      if (examId) {
        try {
          // Fetch exam data based on examId
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/exam/join/${examId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              navigate(`/exam/${examId}`, { state: { exam: data.exam } });
            } else {
              // If exam not found, navigate without state (will use fallback questions)
              navigate(`/exam/${examId}`);
            }
          } else {
            // If fetch fails, navigate without state
            navigate(`/exam/${examId}`);
          }
        } catch (error) {
          console.error('Failed to fetch exam data:', error);
          // Navigate without state if fetch fails
          navigate(`/exam/${examId}`);
        }
      } else {
        navigate('/exam');
      }
    } else if (cameraAccessible === false) {
      alert('Please grant access to your webcam and microphone to start the exam.');
    } else {
      alert('Please test your webcam and microphone first.');
    }
  };

  return (
    <div className="instructions-container">
      <div className="instructions-card">
        <div className="instructions-header">
          <h2 className="instructions-heading">Instructions</h2>
        </div>
        <div style={{ padding: '1rem 2rem', textAlign: 'left' }}>
          <h5 style={{ color: '#28a745', fontWeight: '600', marginBottom: '1rem' }}>Important Rules for Online Exam</h5>
          <ol style={{ paddingLeft: '1.2rem' }}>
            <li><strong>Device and Internet:</strong> Ensure your device is fully charged or connected to a reliable power source and has a stable, high-speed internet connection for the entire duration of the exam.</li>
            <li><strong>Webcam and Microphone:</strong> Keep your webcam and microphone turned on at all times. These are mandatory for real-time monitoring during the exam.</li>
            <li><strong>No Unauthorized Tabs or Devices:</strong> Refrain from opening additional browser tabs, applications, or using external devices such as phones, smartwatches, or notes during the session.</li>
            <li><strong>Stay in Frame:</strong> Ensure your face is clearly visible in the webcam frame throughout the exam. Avoid looking away from the screen frequently.</li>
            <li><strong>Quiet and Distraction-Free Environment:</strong> Select a quiet location where you won't be interrupted. Background noise or distractions may lead to your session being flagged.</li>
            <li><strong>Individual Effort Only:</strong> The examination is strictly individual. Any form of collaboration or communication with others is prohibited.</li>
            <li><strong>Behavior Monitoring:</strong> Be aware that AI systems and live proctors may monitor your activity, including webcam and microphone feeds. Suspicious activities will be flagged for review.</li>
            <li><strong>Consequences of Rule Violations:</strong> Any violation of these rules, including misconduct or suspicious behavior, may lead to immediate termination of your exam session, invalidation of your results, and possible disciplinary action.</li>
          </ol>
        </div>

        {/* Camera and Microphone Test Section */}
        <div className="test-section" style={{ padding: '1rem 2rem', textAlign: 'center', borderTop: '1px solid #ddd', marginTop: '1rem' }}>
          <h5 style={{ color: '#28a745', marginBottom: '1rem', fontWeight: '700', fontSize: '1.5rem' }}>Test Your Setup</h5>

          {cameraAccessible !== null && (
            <div style={{
              display: 'inline-block',
              padding: '1rem 1.5rem',
              marginTop: '1rem',
              borderRadius: '15px',
              background: cameraAccessible ? '#d4edda' : '#f8d7da',
              color: cameraAccessible ? '#155724' : '#721c24',
              border: `1px solid ${cameraAccessible ? '#c3e6cb' : '#f5c6cb'}`,
              fontWeight: '600',
              fontSize: '1rem'
            }}>
              <i className={`bi ${cameraAccessible ? 'bi-check-circle' : 'bi-x-circle'}`} style={{ marginRight: '0.5rem' }}></i>
              {cameraAccessible ? 'Webcam and microphone are accessible!' : 'Webcam or microphone access denied. Please allow permissions.'}
            </div>
          )}

          {cameraAccessible === true && (
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
              Note: When you start the exam, your browser may ask for camera/microphone permission again. Please allow it to proceed.
            </p>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={testCameraAndMicrophone}
              disabled={testingCamera}
              style={{
                width: '250px',
                background: testingCamera ? '#6c757d' : 'linear-gradient(135deg, #28a745, #20c997)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 20px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: testingCamera ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 15px rgba(40, 167, 69, 0.5)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                transform: testingCamera ? 'scale(0.98)' : 'scale(1)',
                outline: 'none'
              }}
              onMouseEnter={(e) => !testingCamera && (e.target.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => !testingCamera && (e.target.style.transform = 'scale(1)')}
            >
              {testingCamera ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.5rem'
                  }}></span>
                  Testing...
                </>
              ) : (
                'Test Webcam & Microphone'
              )}
            </button>
            <button
              className="start-exam-btn"
              onClick={handleStartExam}
              disabled={cameraAccessible !== true}
              style={{
                width: '250px',
                opacity: cameraAccessible !== true ? 0.5 : 1,
                cursor: cameraAccessible !== true ? 'not-allowed' : 'pointer',
                pointerEvents: cameraAccessible !== true ? 'none' : 'auto',
                background: cameraAccessible === true ? 'linear-gradient(135deg, #28a745, #20c997)' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 20px',
                fontSize: '1rem',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 15px rgba(40, 167, 69, 0.5)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                transform: cameraAccessible === true ? 'scale(1)' : 'scale(0.98)',
                outline: 'none'
              }}
              onMouseEnter={(e) => cameraAccessible === true && (e.target.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => cameraAccessible === true && (e.target.style.transform = 'scale(1)')}
            >
              Start Exam
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', paddingBottom: '1rem' }}>
          © 2025 FuturProctor. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default Instructions;
