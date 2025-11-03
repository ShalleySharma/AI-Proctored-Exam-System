import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from './ToastContext';
import { enqueueSnapshot, blobToBase64 } from '../utils/retryQueue';
import AdvancedSystemCompliance from './AdvancedSystemCompliance';

function ExamPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [sessionId, setSessionId] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [violations, setViolations] = useState([]);
  const [violationCounts, setViolationCounts] = useState({
    tab_switches: 0,
    window_focus_loss: 0,
    camera_issues: 0,
    internet_disconnects: 0,
    multiple_faces_detected: 0
  });

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  const { add: toastAdd } = useToast();

  const handleBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = 'Refreshing or leaving this page will end your exam and submit it automatically. Are you sure?';

    // Attempt to submit exam synchronously on page unload
    if (sessionId) {
      const finalScore = calculateScore();
      const examResults = {
        sessionId,
        studentId: localStorage.getItem('studentId'),
        examId: 'java-exam-001',
        answers: selectedOptions,
        score: finalScore,
        totalQuestions: questions.length,
        timeExpired: false,
        completedAt: new Date().toISOString(),
        violations,
        violationCounts,
        interrupted: true
      };

      // Use sendBeacon for reliable delivery during page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${API_BASE}/api/exam/submit`, JSON.stringify(examResults));
      }
    }
  };

  useEffect(() => {
    const startExam = async () => {
      if (examStarted) return; // Prevent multiple exam starts

      const studentId = localStorage.getItem('studentId');
      console.log('Starting exam with studentId:', studentId);

      if (!studentId) {
        alert('Student ID not found. Please login again.');
        return;
      }

      try {
        const res = await axios.post(`${API_BASE}/api/exam/start`, { studentId, examId: 'java-exam-001' });
        console.log('Exam started successfully:', res.data);
        setSessionId(res.data.sessionId);
        setExamStarted(true);

        // Load saved violations and counts from localStorage
        const savedViolations = localStorage.getItem(`proctor_violations_${res.data.sessionId}`);
        const savedCounts = localStorage.getItem(`violationCounts_${res.data.sessionId}`);
        if (savedViolations) {
          setViolations(JSON.parse(savedViolations));
        }
        if (savedCounts) {
          setViolationCounts(JSON.parse(savedCounts));
        }

        // Add beforeunload listener to prevent refresh and auto-submit
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Request full screen mode
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(err => {
            console.warn('Failed to enter full screen:', err);
            handleViolation('Failed to enter full screen mode');
          });
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
        }

        // Listen for full screen changes
        const handleFullscreenChange = () => {
          if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            handleViolation('Exited full screen mode');
          }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        // Cleanup function
        return () => {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
          document.removeEventListener('msfullscreenchange', handleFullscreenChange);
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      } catch (err) {
        console.error('Failed to start exam:', err);
        toastAdd(`Failed to start exam: ${err.response?.data || err.message}. Please ensure the backend server is running.`);
      }
    };

    startExam();
  }, [examStarted, API_BASE, toastAdd]);



  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Auto-submit when time runs out
      handleTimeUp();
    }
  }, [examStarted, timeLeft]);

  const handleTimeUp = async () => {
    try {
      // Calculate final score
      const finalScore = calculateScore();

      // Prepare exam results data
      const examResults = {
        sessionId,
        studentId: localStorage.getItem('studentId'),
        examId: 'java-exam-001',
        answers: selectedOptions,
        score: finalScore,
        totalQuestions: questions.length,
        timeExpired: true,
        completedAt: new Date().toISOString(),
        violations,
        violationCounts
      };

      // Send results to backend
      await axios.post(`${API_BASE}/api/exam/submit`, examResults);

      // Navigate to dashboard
      toastAdd('Time is up! Your exam has been submitted automatically.');
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Failed to submit exam on timeout:', error);
      // Still navigate to dashboard even if backend submission fails
      toastAdd('Time is up! Your exam has been submitted automatically. (Note: There was an issue saving to server)');
      navigate('/student-dashboard');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const captureSnapshot = async (violationType) => {
    if (!videoRef.current || !canvasRef.current || !sessionId) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // ensure video has dimensions
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (!width || !height) {
      console.warn("Video not ready for snapshot");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(video, 0, 0, width, height);
    } catch (e) {
      console.error("drawImage failed", e);
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const base64Image = await blobToBase64(blob);
      enqueueSnapshot({
        endpoint: `${API_BASE}/api/exam/snapshot`,
        data: {
          image: base64Image,
          sessionId,
          violations: [violationType]
        },
        retries: 3
      });
    }, 'image/jpeg', 0.8);
  };

  const handleViolation = (violationMsg) => {
    setViolations(prev => {
      const newViolations = [...prev, { message: violationMsg, timestamp: new Date().toISOString() }];
      return newViolations;
    });
    // Update counts based on violation type
    setViolationCounts(prev => {
      const newCounts = { ...prev };
      if (violationMsg.includes('Tab switching')) {
        newCounts.tab_switches += 1;
      } else if (violationMsg.includes('Window') || violationMsg.includes('minimized')) {
        newCounts.window_focus_loss += 1;
      } else if (violationMsg.includes('Camera') || violationMsg.includes('Microphone')) {
        newCounts.camera_issues += 1;
      } else if (violationMsg.includes('internet')) {
        newCounts.internet_disconnects += 1;
      }
      if (sessionId) {
        localStorage.setItem(`violationCounts_${sessionId}`, JSON.stringify(newCounts));
      }
      return newCounts;
    });
    // Capture snapshot with violation type
    captureSnapshot(violationMsg);
  };

  const questions = [
    {
      id: 1,
      question: "Which of the following is not a primitive data type in Java?",
      options: [
        "int",
        "float",
        "String",
        "boolean"
      ],
      answer: "String"
    },
    {
      id: 2,
      question: "What is the correct file extension for Java source files?",
      options: [
        ".jav",
        ".java",
        ".class",
        ".jv"
      ],
      answer: ".java"
    },
    {
      id: 3,
      question: "Which method is the entry point for any Java program?",
      options: [
        "start()",
        "main()",
        "run()",
        "execute()"
      ],
      answer: "main()"
    },
    {
      id: 4,
      question: "Which keyword is used to inherit a class in Java?",
      options: [
        "implements",
        "extends",
        "inherits",
        "override"
      ],
      answer: "extends"
    },
    {
      id: 5,
      question: `What will be the output of the following code?\n\nint a = 10;\nint b = 20;\nSystem.out.println(a + b);`,
      options: [
        "30",
        "1020",
        "a + b",
        "Compilation error"
      ],
      answer: "30"
    },
    {
      id: 6,
      question: `What will be the output of this code?\n\nint x = 3;\nint y = 5;\nx += ++y + y++;\nSystem.out.println(x);`,
      options: [
        "10",
        "12",
        "14",
        "15"
      ],
      answer: "15"
    },
    {
      id: 7,
      question: "Which of the following statements about Java memory management is TRUE?",
      options: [
        "Java requires manual memory deallocation.",
        "Garbage collection in Java runs on demand.",
        "Java uses automatic garbage collection for unused objects.",
        "Java does not use heap memory."
      ],
      answer: "Java uses automatic garbage collection for unused objects."
    },
    {
      id: 8,
      question: `What will the following code print?\n\nclass A {\n    static void display() { System.out.println("A"); }\n}\nclass B extends A {\n    static void display() { System.out.println("B"); }\n}\npublic class Test {\n    public static void main(String[] args) {\n        A obj = new B();\n        obj.display();\n    }\n}`,
      options: [
        "A",
        "B",
        "AB",
        "Compilation Error"
      ],
      answer: "A"
    },
    {
      id: 9,
      question: `What is the output of the following code?\n\npublic class Test {\n    public static void main(String[] args) {\n        String s1 = "Java";\n        String s2 = "Ja" + "va";\n        System.out.println(s1 == s2);\n    }\n}`,
      options: [
        "true",
        "false",
        "Compilation error",
        "Runtime error"
      ],
      answer: "true"
    },
    {
      id: 10,
      question: `What will the code print?\n\npublic class Test {\n    public static void main(String[] args) {\n        int i = 0;\n        for(System.out.println("Hi"); i < 2; System.out.println(i++));\n    }\n}`,
      options: [
        "Hi 0 1",
        "HiHi",
        "Hi followed by 0 and 1",
        "Hi 0 1 (without space)"
      ],
      answer: "Hi followed by 0 and 1"
    }
  ];

  const handleOptionSelect = (option) => {
    setSelectedOptions({
      ...selectedOptions,
      [currentQuestionIndex]: option
    });
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit exam manually
      await handleSubmitExam();
    }
  };

  const handleSubmitExam = async () => {
    try {
      // Calculate final score
      const finalScore = calculateScore();

      // Prepare exam results data
      const examResults = {
        sessionId,
        studentId: localStorage.getItem('studentId'),
        examId: 'java-exam-001',
        answers: selectedOptions,
        score: finalScore,
        totalQuestions: questions.length,
        timeExpired: false,
        completedAt: new Date().toISOString(),
        violations,
        violationCounts
      };

      // Send results to backend
      await axios.post(`${API_BASE}/api/exam/submit`, examResults);

      // Navigate to dashboard
      toastAdd('Exam submitted successfully!');
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Failed to submit exam:', error);
      // Still navigate to dashboard even if backend submission fails
      toastAdd('Exam submitted! (Note: There was an issue saving to server)');
      navigate('/student-dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (selectedOptions[index] === q.answer) {
        score += 1;
      }
    });
    return score;
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'auto'
    }}>
      <style>
        {`
          @keyframes glow {
            0% { text-shadow: 3px 3px 6px rgba(0,0,0,0.7); }
            50% { text-shadow: 3px 3px 12px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.5); }
            100% { text-shadow: 3px 3px 6px rgba(0,0,0,0.7); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Top Section: Header and Video/Timer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          position: 'relative'
        }}>
          {/* Centered Test Heading */}
          <div style={{
            flex: 1,
            textAlign: 'center',
            color: '#fff',
            fontSize: '3rem',
            fontWeight: '900',
            textShadow: '3px 3px 6px rgba(0,0,0,0.7)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            background: 'linear-gradient(45deg, #fff, #f0f8ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'glow 2s ease-in-out infinite alternate'
          }}>
            <i className="bi bi-robot me-3" style={{ fontSize: '3.2rem' }}></i>
            Java Programming Certification Exam
          </div>

          {/* Top-Right: Timer and Circular Video */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            {/* Timer */}
            <div style={{
              background: timeLeft <= 60 ? 'linear-gradient(135deg, #dc3545, #ff6b6b)' : timeLeft <= 300 ? 'linear-gradient(135deg, #ffc107, #ffd60a)' : 'linear-gradient(135deg, #28a745, #20c997)',
              color: 'white',
              padding: '15px 25px',
              borderRadius: '30px',
              fontSize: '1.5rem',
              fontWeight: '900',
              boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none',
              border: '3px solid rgba(255,255,255,0.3)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              letterSpacing: '1px'
            }}>
              <i className="bi bi-clock-fill me-2" style={{ fontSize: '1.6rem' }}></i>
              {formatTime(timeLeft)}
            </div>

            {/* Circular Video */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid #fff',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        {/* Circular Question Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '30px'
        }}>
          {questions.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: currentQuestionIndex === idx ? '#007bff' : selectedOptions[idx] ? '#28a745' : '#e9ecef',
                color: currentQuestionIndex === idx || selectedOptions[idx] ? '#fff' : '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                border: currentQuestionIndex === idx ? '3px solid #fff' : 'none'
              }}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Main Content: Left (Exam Description) and Right (Questions) */}
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          {/* Left Side: Exam Description */}
          <div style={{
            flex: '1',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            minHeight: '400px'
          }}>
            <h4 style={{ color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>Exam Details</h4>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555' }}>
              <p><strong>Total Questions:</strong> {questions.length}</p>
              <p><strong>Aptitude Questions:</strong> 15</p>
              <p><strong>Technical Questions:</strong> 15</p>
              <p><strong>Duration:</strong> 10 minutes</p>
              <p><strong>Instructions:</strong> Answer all questions. Each question carries equal marks.</p>
            </div>
            <div style={{ marginTop: '20px' }}>
              <h5 style={{ color: '#333', marginBottom: '15px' }}>Live Proctoring</h5>
              <p className="text-muted">Webcam is active. Snapshots are taken when violations are detected.</p>
              <AdvancedSystemCompliance
                onViolation={handleViolation}
                isMonitoringActive={examStarted}
                sessionId={sessionId}
                onStreamReady={(stream) => {
                  if (videoRef.current) {
                    if (videoRef.current.srcObject !== stream) {
                      videoRef.current.srcObject = stream;
                      const playPromise = videoRef.current.play();
                      if (playPromise && playPromise.catch) {
                        playPromise.catch(() => {});
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Right Side: Questions and Options */}
          <div style={{
            flex: '2',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            minHeight: '400px'
          }}>
            <h4 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>Question {currentQuestionIndex + 1}</h4>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '25px',
              marginBottom: '30px'
            }}>
              <p style={{
                whiteSpace: 'pre-line',
                fontSize: '1.2rem',
                lineHeight: '1.6',
                color: '#212529',
                marginBottom: '20px'
              }}>
                {questions[currentQuestionIndex].question}
              </p>
              <div>
                {questions[currentQuestionIndex].options.map((option, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: '15px',
                      padding: '15px',
                      border: selectedOptions[currentQuestionIndex] === option ? '3px solid #007bff' : '2px solid #dee2e6',
                      borderRadius: '10px',
                      background: selectedOptions[currentQuestionIndex] === option ? '#e7f3ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '1.1rem'
                    }}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      id={`option-${idx}`}
                      checked={selectedOptions[currentQuestionIndex] === option}
                      onChange={() => handleOptionSelect(option)}
                      style={{ marginRight: '10px' }}
                    />
                    <label htmlFor={`option-${idx}`} style={{ cursor: 'pointer', margin: 0 }}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '15px'
            }}>
              <button
                style={{
                  flex: 1,
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => {
                  if (window.confirm('Are you sure you want to quit the exam? Your progress will be lost.')) {
                    navigate('/student-dashboard');
                  }
                }}
              >
                <i className="bi bi-x-circle me-2"></i>Quit
              </button>
              <button
                style={{
                  flex: 1,
                  background: '#ffc107',
                  color: 'white',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={handleNext}
              >
                <i className="bi bi-save me-2"></i>Save & Next
              </button>
              <button
                style={{
                  flex: 1,
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={handleSubmitExam}
              >
                <i className="bi bi-check-circle me-2"></i>Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;
