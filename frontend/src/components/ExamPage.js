import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useToast } from './ToastContext';

import AdvancedSystemCompliance from './AdvancedSystemCompliance.jsx';

function ExamPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const examId = location.pathname.split('/exam/')[1]; // Extract examId from URL

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
    audio_issues: 0,
    internet_disconnects: 0,
    multiple_faces_detected: 0,
    page_refreshes: 0,
    ml_face_mismatch: 0,
    ml_gaze_away: 0,
    ml_object_detected: 0,
    ml_no_face_detected: 0,
    ml_multiple_faces_detected: 0,
    ml_head_pose_away: 0,
    ml_violations: 0
  });
  const [mlViolationCount, setMlViolationCount] = useState(0);
  const [mlViolations, setMlViolations] = useState([]);
  const [mlViolationCooldowns, setMlViolationCooldowns] = useState({
    gaze_away: 0,
    object_detected: 0,
    no_face_detected: 0,
    multiple_faces_detected: 0,
    head_pose_away: 0
  });
  const [totalCompliance, setTotalCompliance] = useState(0);
  const [backendViolationCount, setBackendViolationCount] = useState(0);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  const { add: toastAdd } = useToast();

  const handleViolation = (violationMsg) => {
    // Check for ML violation cooldowns to prevent double counting
    let skipViolation = false;
    if (violationMsg.includes('gaze_away') && mlViolationCooldowns.gaze_away > 0) {
      skipViolation = true;
    } else if (violationMsg.includes('ml_cell phone') && mlViolationCooldowns.object_detected > 0) {
      skipViolation = true;
    } else if (violationMsg.includes('ml_book') && mlViolationCooldowns.object_detected > 0) {
      skipViolation = true;
    } else if (violationMsg.includes('ml_laptop') && mlViolationCooldowns.object_detected > 0) {
      skipViolation = true;
    } else if (violationMsg.includes('ml_multiple_persons') && mlViolationCooldowns.multiple_faces_detected > 0) {
      skipViolation = true;
    } else if (violationMsg.includes('ml_suspicious_object') && mlViolationCooldowns.object_detected > 0) {
      skipViolation = true;
    } else if (violationMsg.includes('no_face_detected') && mlViolationCooldowns.no_face_detected > 0) {
      skipViolation = true;
    } else if (violationMsg.includes('multiple_faces_detected') && mlViolationCooldowns.multiple_faces_detected > 0) {
      skipViolation = true;
    } else if (violationMsg.includes('head_pose_away') && mlViolationCooldowns.head_pose_away > 0) {
      skipViolation = true;
    }

    if (skipViolation) {
      console.log(`Skipping violation due to cooldown: ${violationMsg}`);
      return; // Skip processing this violation
    }

    setViolations(prev => {
      const newViolations = [...prev, { message: violationMsg, timestamp: new Date().toISOString() }];
      return newViolations;
    });

    // Increment total compliance count once per violation
    setTotalCompliance(prev => prev + 1);

    // Update counts based on violation type
    setViolationCounts(prev => {
      const newCounts = { ...prev };
      let isMLViolation = false;
      if (violationMsg.includes('Tab switching')) {
        newCounts.tab_switches += 1;
      } else if (violationMsg.includes('Window') || violationMsg.includes('minimized')) {
        newCounts.window_focus_loss += 1;
      } else if (violationMsg.includes('Camera')) {
        newCounts.camera_issues += 1;
      } else if (violationMsg.includes('Microphone') || violationMsg.includes('Audio')) {
        newCounts.audio_issues += 1;
      } else if (violationMsg.includes('internet')) {
        newCounts.internet_disconnects += 1;
      } else if (violationMsg.includes('Page refresh')) {
        newCounts.page_refreshes += 1;
      } else if (violationMsg.includes('face_mismatch')) {
        newCounts.ml_face_mismatch += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        console.log('ML Cheat Detection: Face mismatch detected');
      } else if (violationMsg.includes('gaze_away')) {
        newCounts.ml_gaze_away += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, gaze_away: 5 })); // Set cooldown for 5 seconds
      } else if (violationMsg.includes('ml_cell phone')) {
        newCounts.ml_object_detected += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, object_detected: 5 }));
      } else if (violationMsg.includes('ml_book')) {
        newCounts.ml_object_detected += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, object_detected: 5 }));
      } else if (violationMsg.includes('ml_laptop')) {
        newCounts.ml_object_detected += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, object_detected: 5 }));
      } else if (violationMsg.includes('ml_multiple_persons')) {
        newCounts.ml_multiple_faces_detected += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, multiple_faces_detected: 5 }));
      } else if (violationMsg.includes('ml_suspicious_object')) {
        newCounts.ml_object_detected += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, object_detected: 5 }));
      } else if (violationMsg.includes('ml_person_detected')) {
        newCounts.ml_object_detected += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
      } else if (violationMsg.includes('no_face_detected')) {
        newCounts.ml_no_face_detected += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, no_face_detected: 5 }));
      } else if (violationMsg.includes('multiple_faces_detected')) {
        newCounts.ml_multiple_faces_detected += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, multiple_faces_detected: 5 }));
      } else if (violationMsg.includes('head_pose_away')) {
        newCounts.ml_head_pose_away += 1;
        newCounts.ml_violations += 1;
        setMlViolationCount(prev => prev + 1);
        isMLViolation = true;
        setMlViolationCooldowns(prev => ({ ...prev, head_pose_away: 5 }));
      }



      if (sessionId) {
        localStorage.setItem(`violationCounts_${sessionId}`, JSON.stringify(newCounts));
      }
      return newCounts;
    });
    // Capture snapshot with violation type
    captureSnapshot(violationMsg);
  };

  const handleBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = 'Refreshing or leaving this page will end your exam and submit it automatically. Are you sure?';

    // Attempt to submit exam synchronously on page unload
    if (sessionId) {
      const finalScore = calculateScore();
      const examResults = {
        sessionId,
        studentId: localStorage.getItem('studentId'),
        examId,
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

  const startExam = useCallback(async () => {
    if (examStarted || !examId) return; // Prevent multiple exam starts or if no examId

    const studentId = localStorage.getItem('studentId');
    console.log('Starting exam with studentId:', studentId, 'examId:', examId);

    if (!studentId || studentId === 'null') {
      toastAdd('Student ID not found. Please login again.', 'error');
      navigate('/login');
      return;
    }

    if (!examId || examId === 'null') {
      toastAdd('Exam ID not found. Please go back and select an exam.', 'error');
      navigate('/');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/exam/start`, { studentId, examId });
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

      // Listen for full screen changes
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
          handleViolation('Exited full screen mode');
          alert('Full screen removed! This is a violation. Please return to full screen mode to continue the exam.');
          // Attempt to re-enter full screen if possible
          setTimeout(() => {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else if (document.documentElement.webkitRequestFullscreen) {
              document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
              document.documentElement.msRequestFullscreen();
            }
          }, 1000);
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);

      // Capture reference snapshot for image capture
      setTimeout(async () => {
        if (!sessionId || !videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        if (!width || !height) return; // Ensure video has dimensions
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            // Image captured for reference, no further processing
          }
        }, 'image/png', 0.8);
      }, 2000); // Wait 2 seconds for video to stabilize

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
  }, [examStarted, examId, API_BASE, toastAdd]);

  const requestFullscreen = useCallback(() => {
    // Request full screen mode - must be called from user gesture
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
  }, []);

  // Add button to manually request fullscreen
  const handleStartExam = useCallback(async () => {
    await startExam();
    // Request fullscreen after exam starts
    setTimeout(() => {
      requestFullscreen();
    }, 1000);
  }, [startExam, requestFullscreen]);

  useEffect(() => {
    startExam();
  }, [startExam]);

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

  // Manage ML violation cooldowns
  useEffect(() => {
    if (!examStarted) return;
    const interval = setInterval(() => {
      setMlViolationCooldowns(prev => {
        const newCooldowns = { ...prev };
        Object.keys(newCooldowns).forEach(key => {
          if (newCooldowns[key] > 0) newCooldowns[key] -= 1;
        });
        return newCooldowns;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examStarted]);

  // Periodic screenshot capture every 3 seconds during exam
  useEffect(() => {
    if (!examStarted) {
      console.log('Screenshot capture not started: examStarted=', examStarted);
      return;
    }

    console.log('🚀 Starting periodic screenshot capture every 3 seconds');

    const interval = setInterval(async () => {
      console.log('🔍 Capturing periodic screenshot...');
      try {
        if (!videoRef.current || !canvasRef.current || !videoRef.current.srcObject) {
          console.log('❌ Video, canvas not ready, or no stream');
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        if (!width || !height) {
          console.log('❌ Video dimensions not ready');
          return;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.log('❌ Failed to create blob');
            return;
          }
          console.log('📸 Captured screenshot for ML processing');
          console.log('🚀 ML detection started - sending to backend');

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result.split(',')[1]; // Extract base64 data without prefix

            // Send base64 JSON to new process-snapshot endpoint
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/api/exam/process-snapshot`, {
              imageBase64: base64,
              sessionId: sessionId,
              studentId: localStorage.getItem('studentId'),
              examId: examId
            }, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              maxBodyLength: Infinity
            });

            console.log('📡 ML API response:', res.data);
            console.log('🔍 ML detection completed');

            // Update backend violation count
            if (res.data.violationCount !== undefined) {
              setBackendViolationCount(res.data.violationCount);
            }

            // Handle each ML violation with cooldowns to prevent continuous counting
            if (res.data.violations && res.data.violations.length > 0) {
              res.data.violations.forEach(violation => {
                handleViolation(violation);
              });
            }

            // ML violations are handled by the backend and counted in mlViolationCount
            // No need to process violations here as they are already counted on the backend
          };
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error('❌ Periodic screenshot capture failed:', err);
        // Do not interrupt exam on error
      }
    }, 7000); // 7 seconds

    return () => clearInterval(interval);
  }, [examStarted, sessionId, API_BASE]);

  const handleTimeUp = async () => {
    try {
      // Calculate final score
      const finalScore = calculateScore();

      // Prepare exam results data
      const examResults = {
        sessionId,
        studentId: localStorage.getItem('studentId'),
        examId,
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

      // Stop camera and microphone
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      // Exit full screen mode
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      // Navigate to home page
      toastAdd('Time is up! Your exam has been submitted automatically.');
      navigate('/');
    } catch (error) {
      console.error('Failed to submit exam on timeout:', error);
      // Stop camera and microphone even on error
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      // Exit full screen mode even on error
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      // Still navigate to home page even if backend submission fails
      toastAdd('Time is up! Your exam has been submitted automatically. (Note: There was an issue saving to server)');
      navigate('/');
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

    // Check if video has active stream
    if (!video.srcObject) {
      console.warn("Video stream not available for snapshot");
      return;
    }

    // Ensure video has dimensions
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (!width || !height) {
      console.warn("Video dimensions not ready for snapshot");
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

    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // TEMP DEBUG: Log image data info
    console.log("Frontend: Image data length:", imageData.length);
    console.log("Frontend: Image data starts with:", imageData.substring(0, 50));

    try {
      await axios.post(`${API_BASE}/api/exam/snapshot`, {
        image: imageData,
        sessionId,
        violations: [violationType]
      }, {
        headers: { 'Content-Type': 'application/json' },
        maxBodyLength: Infinity
      });
    } catch (err) {
      console.error('Snapshot upload failed:', err);
    }
  };

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Load exam data from navigation state or URL params
  useEffect(() => {
    const examData = location.state?.exam;
    if (examData) {
      setExam(examData);
      setQuestions(examData.questions.map(q => ({
        question: q.questionText,
        options: q.options,
        answer: q.correctAnswer
      })) || []);
      setTimeLeft(examData.duration * 60); // Convert minutes to seconds
    } else {
      // Try to fetch exam data from URL params
      const examId = location.pathname.split('/exam/')[1];
      if (examId) {
        const fetchExamData = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/api/exam/join/${examId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.data.success && response.data.exam) {
              setExam(response.data.exam);
              setQuestions(response.data.exam.questions.map(q => ({
                question: q.questionText,
                options: q.options,
                answer: q.correctAnswer
              })) || []);
              setTimeLeft(response.data.exam.duration * 60);
            }
          } catch (error) {
            console.error('Failed to fetch exam data:', error);
            // Fallback to hardcoded questions if fetch fails
            setQuestions([
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
            ]);
          }
        };
        fetchExamData();
      }
    }
  }, [location.pathname, API_BASE]);

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
        examId,
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

      // Stop camera and microphone
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      // Exit full screen mode
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      // Navigate to home page
      toastAdd('Exam submitted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to submit exam:', error);
      // Stop camera and microphone even on error
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      // Exit full screen mode even on error
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      // Still navigate to home page even if backend submission fails
      toastAdd('Exam submitted! (Note: There was an issue saving to server)');
      navigate('/');
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

  if (questions.length === 0) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '0',
      margin: '0',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'auto',
      zIndex: 9999
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
      <div style={{ width: '100%', padding: '0 20px' }}>
        {/* Top Section: Header and Video/Timer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          position: 'relative'
        }}>
          {/* Centered Test Heading */}
          <h1 className="display-5 fw-bold mb-4" style={{ color: '#333', textAlign: 'center', flex: 1, margin: '0' }}>
            {exam ? exam.title : 'Java Programming Certification Exam'}
          </h1>

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
                background: currentQuestionIndex === idx ? '#ffffff' : selectedOptions[idx] ? '#28a745' : '#6c757d',
                color: currentQuestionIndex === idx ? '#333' : selectedOptions[idx] ? '#fff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                border: currentQuestionIndex === idx ? '3px solid #28a745' : 'none'
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
            minHeight: '400px',
            position: 'relative'
          }}>
            {/* Minimized Cheat Detection Panel */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              background: 'linear-gradient(135deg, #dc3545, #ff6b6b)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              zIndex: 10
            }}>
              <i className="bi bi-shield-exclamation me-2"></i>
              CHEAT DETECTION ACTIVE
              <div style={{ marginTop: '5px', fontSize: '0.8rem', fontWeight: 'normal' }}>
                Violations: {totalCompliance} | Last: {mlViolations.length > 0 ? mlViolations[mlViolations.length - 1].message : 'None'}
              </div>
            </div>

            <div style={{ marginTop: '80px' }}>
              <h4 style={{ color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>Exam Details</h4>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555' }}>
              <p><strong>Total Questions:</strong> {questions.length}</p>
              <p><strong>Duration:</strong> {exam ? `${exam.duration} minutes` : '10 minutes'}</p>
              <p><strong>Instructions:</strong> {exam ? exam.instructions : 'Answer all questions. Each question carries equal marks.'}</p>
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

            {/* Removed Recent Violations section to hide it from student UI as requested */}
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
                  background: '#6c757d',
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
                  background: '#6c757d',
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
