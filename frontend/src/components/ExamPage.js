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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          color: '#fff',
          fontSize: '2rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          <i className="bi bi-robot me-2"></i>
          AI Proctoring Exam System
        </div>

        {/* Exam Title */}
        <h2 style={{
          textAlign: 'center',
          color: '#fff',
          marginBottom: '20px',
          fontSize: '1.8rem',
          fontWeight: '600',
          textShadow: '1px 1px 3px rgba(0,0,0,0.3)'
        }}>
          Java Programming Certification Exam
        </h2>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '10px',
          height: '12px',
          marginBottom: '20px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            background: 'linear-gradient(90deg, #007bff, #28a745)',
            height: '100%',
            borderRadius: '10px',
            transition: 'width 0.5s ease-in-out',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}></div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
          {/* Video Section */}
          <div style={{
            flex: '1',
            minWidth: '300px',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Live Proctoring</h4>
            <video ref={videoRef} autoPlay muted className="w-100 border mb-3" style={{ maxHeight: '250px', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <p className="text-center text-muted">Webcam is active. Snapshots are taken when violations are detected.</p>

            {/* Add AdvancedSystemCompliance component here */}
            <AdvancedSystemCompliance
              onViolation={handleViolation}
              isMonitoringActive={examStarted}
              sessionId={sessionId}
              onStreamReady={(stream) => {
                if (videoRef.current) {
                  // only set if different stream or srcObject not set
                  if (videoRef.current.srcObject !== stream) {
                    videoRef.current.srcObject = stream;
                    // Ensure play is called safely
                    const playPromise = videoRef.current.play();
                    if (playPromise && playPromise.catch) {
                      playPromise.catch(() => { /* ignore autoplay blocking */ });
                    }
                  }
                }
              }}
            />
          </div>

          {/* Questions Section */}
          <div style={{
            flex: '2',
            minWidth: '400px',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Timer above questions */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              background: timeLeft <= 60 ? '#dc3545' : timeLeft <= 300 ? '#ffc107' : '#28a745',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '50px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              display: 'inline-block',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
            }}>
              <i className="bi bi-clock me-2"></i>
              Time Remaining: {formatTime(timeLeft)}
            </div>
            <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Exam Questions</h4>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h5 style={{ marginBottom: '15px', color: '#495057' }}>Question {currentQuestionIndex + 1} of {questions.length}</h5>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ whiteSpace: 'pre-line', fontSize: '1.1rem', lineHeight: '1.6', color: '#212529' }}>{questions[currentQuestionIndex].question}</p>
              </div>
              <div>
                {questions[currentQuestionIndex].options.map((option, idx) => (
                  <div key={idx} style={{
                    marginBottom: '10px',
                    padding: '10px',
                    border: selectedOptions[currentQuestionIndex] === option ? '2px solid #007bff' : '2px solid #dee2e6',
                    borderRadius: '8px',
                    background: selectedOptions[currentQuestionIndex] === option ? '#e7f3ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }} onClick={() => handleOptionSelect(option)}>
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      id={`option-${idx}`}
                      checked={selectedOptions[currentQuestionIndex] === option}
                      onChange={() => handleOptionSelect(option)}
                      style={{ marginRight: '10px' }}
                    />
                    <label htmlFor={`option-${idx}`} style={{ fontSize: '1rem', cursor: 'pointer', margin: 0 }}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentQuestionIndex === 0 ? 0.5 : 1
              }} onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                <i className="bi bi-arrow-left me-2"></i>Previous
              </button>
              <button style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }} onClick={handleNext}>
                {currentQuestionIndex === questions.length - 1 ? 'Submit Exam' : 'Next'}
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;
