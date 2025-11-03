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

  const handleStartExam = () => {
    if (cameraAccessible === true) {
      navigate('/exam');
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
          <h5 style={{ color: '#007bff', fontWeight: '600', marginBottom: '1rem' }}>Important Rules for Online Exam</h5>
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
          <h5 style={{ color: '#6366f1', marginBottom: '1rem', fontWeight: '700', fontSize: '1.5rem' }}>Test Your Setup</h5>
          <button
            onClick={testCameraAndMicrophone}
            disabled={testingCamera}
            style={{
              background: testingCamera ? '#ccc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '0.7rem 1.8rem',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: testingCamera ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 15px 30px rgba(99, 102, 241, 0.4)',
              margin: '0.5rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}
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

          <div style={{ marginTop: '2rem', marginLeft: '-2rem', marginRight: '-2rem', width: 'calc(100% + 4rem)', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'nowrap' }}>
            <button
              onClick={testCameraAndMicrophone}
              disabled={testingCamera}
              style={{
                flex: 1,
                maxWidth: '150px',
                background: testingCamera ? '#ccc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: testingCamera ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }}
            >
              {testingCamera ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '0.8rem',
                    height: '0.8rem',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.3rem'
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
                flex: 1,
                maxWidth: '150px',
                opacity: cameraAccessible !== true ? 0.5 : 1,
                cursor: cameraAccessible !== true ? 'not-allowed' : 'pointer',
                pointerEvents: cameraAccessible !== true ? 'none' : 'auto',
                background: cameraAccessible === true ? 'linear-gradient(135deg, #28a745, #20c997)' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 10px rgba(40, 167, 69, 0.4)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }}
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
