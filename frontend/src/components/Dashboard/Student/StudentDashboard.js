// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import ResultPDF from './ResultPDF';

// function StudentDashboard() {
//   const [examResults, setExamResults] = useState([]);
//   const [selectedResult, setSelectedResult] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

//   useEffect(() => {
//     fetchExamResults();
//   }, []);

//   const fetchExamResults = async () => {
//     try {
//       let studentId = localStorage.getItem('studentId');
//       const token = localStorage.getItem('token');

//       if (!studentId) {
//         alert('Student ID not found. Please login again.');
//         setExamResults([]);
//         setLoading(false);
//         return;
//       }

//       if (!token) {
//         alert('Authentication token missing. Please login again.');
//         setExamResults([]);
//         setLoading(false);
//         return;
//       }



//       const config = {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       };

//       const res = await axios.get(`${API_BASE}/api/exam/student-results/${studentId}`, config);
//       const data = res.data;

//       if (!data || (Array.isArray(data) && data.length === 0)) {
//         setExamResults([]);
//         alert('No completed exams found for your account.');
//       } else {
//         setExamResults(data);
//       }
//     } catch (err) {
//       if (err.response && err.response.status === 404) {
//         alert('Student not found or no completed exams. Please login again with valid credentials.');
//         localStorage.removeItem('studentId');
//         setExamResults([]);
//       } else {
//         console.error('Failed to fetch exam results:', err);
//         alert('Failed to load exam results. Please try again later.');
//         setExamResults([]);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadPDF = async (result) => {
//     if (!result.sessionId) {
//       alert('Session ID not available for this exam result.');
//       return;
//     }
//     try {
//       const response = await axios.get(`${API_BASE}/api/exam/download-pdf/${result.sessionId}`, {
//         responseType: 'blob',
//       });

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `exam_result_${result.sessionId}.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error('Error downloading PDF:', error);
//       alert('Error downloading PDF. Please try again.');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="container mt-5 text-center">
//         <div className="spinner-border text-primary" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </div>
//         <p className="mt-3">Loading your exam results...</p>
//       </div>
//     );
//   }

//   if (!examResults || examResults.length === 0) {
//     return (
//       <div className="container mt-5 text-center">
//         <h2>No Exam Results Found</h2>
//         <p>You haven't completed any exams yet.</p>
//       </div>
//     );
//   }

//   if (!selectedResult) {
//     return (
//       <div className="container py-4">
//         <div className="d-flex justify-content-between align-items-center mb-4">
//           <div>
//             <h1 className="display-4 fw-bold mb-4" style={{ color: 'var(--text-dark)' }}>
//               Academic Results
//             </h1>
//             <p className="text-white-50 mb-0" style={{ fontSize: '1.1rem' }}>
//               Track your exam results and performance analytics
//             </p>
//           </div>
//         </div>

//         <div className="timetable-container">
//           {examResults.map((result, index) => {
//             const examDate = new Date(result.completedAt);
//             const dayName = examDate.toLocaleDateString('en-US', { weekday: 'long' });
//             const totalViolations = result.violations ? Object.values(result.violations).reduce((a, b) => a + b, 0) : 0;

//             return (
//               <div key={index} className="mb-4">
//                 <h6 className="text-muted fw-semibold mb-3">
//                   {examDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ({dayName})
//                 </h6>

//                 <div className="card shadow-sm border-0 rounded-4 mb-2 p-3 timetable-card">
//                   <div className="d-flex justify-content-between align-items-center flex-wrap">
//                     <div>
//                       <h5 className="mb-1 text-dark">{result.examTitle || 'Exam'}</h5>
//                       <p className="mb-0 text-secondary">
//                         Subject: <strong>{result.examSubject || 'N/A'}</strong> | Score:{' '}
//                         <strong>
//                           {result.score}/{result.totalQuestions} ({result.percentage}%)
//                         </strong>
//                       </p>
//                       <p className="mb-0 small text-muted mt-1">
//                         Status:{' '}
//                         <span className={`badge ${result.timeExpired ? 'bg-danger' : 'bg-success'}`}>
//                           {result.timeExpired ? 'Time Expired' : 'Completed'}
//                         </span>{' '}
//                         | Violations:{' '}
//                         <span className={`badge ${totalViolations > 0 ? 'bg-warning' : 'bg-success'}`}>
//                           {totalViolations}
//                         </span>
//                       </p>
//                       <p className="mb-0 small text-muted mt-1">
//                         Detailed Violations: 
//                         <br />
//                         Gaze Away: {result.violations.mlGazeAway || 0} &nbsp; | &nbsp;
//                         Head Rotation: {result.violations.mlHeadPoseAway || 0} &nbsp; | &nbsp;
//                         Multiple Faces: {result.violations.mlMultipleFacesDetected || 0} &nbsp; | &nbsp;
//                         No Face: {result.violations.mlNoFaceDetected || 0} &nbsp; | &nbsp;
//                         Object Detected: {result.violations.mlObjectDetected || 0}
//                       </p>
//                     </div>

//                     <div className="d-flex gap-2 mt-3 mt-md-0">
//                       <button className="btn btn-outline-primary btn-sm px-3" onClick={() => setSelectedResult(result)} disabled={!result.sessionId}>
//                         View Details
//                       </button>
//                       <button className="btn btn-outline-success btn-sm px-3" onClick={() => downloadPDF(result)} disabled={!result.sessionId}>
//                         <i className="bi bi-download me-1"></i>
//                         Download PDF
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   }

//   return <ResultPDF selectedResult={selectedResult} onBack={() => setSelectedResult(null)} />;
// }

// export default StudentDashboard;




































import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ResultPDF from './ResultPDF';

function StudentDashboard() {
  const [examResults, setExamResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    const fetchExamResults = async () => {
      const studentId = localStorage.getItem('studentId');
      const token = localStorage.getItem('token');

      if (!studentId || !token) {
        localStorage.clear();
        navigate('/student-login');
        return;
      }

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_BASE}/api/exam/student-results/${studentId}`, config);
        const data = res.data;
        setExamResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if ([401, 403, 404].includes(err.response?.status)) {
          localStorage.clear();
          navigate('/student-login');
        } else {
          console.error(err);
          alert('Failed to load exam results.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExamResults();
  }, [navigate]);

  const downloadPDF = async (result) => {
    if (!result.sessionId) {
      alert('Session ID not available for this exam result.');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE}/api/exam/download-pdf/${result.sessionId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam_result_${result.sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading your exam results...</p>
      </div>
    );
  }

  if (!examResults || examResults.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <h2>No Exam Results Found</h2>
        <p>You haven't completed any exams yet.</p>
      </div>
    );
  }

  if (!selectedResult) {
    return (
      <div className="container py-4">
        <h1 className="display-4 fw-bold mb-4">Academic Results</h1>
        <div className="timetable-container">
          {examResults.map((result, index) => {
            const examDate = new Date(result.completedAt);
            const dayName = examDate.toLocaleDateString('en-US', { weekday: 'long' });
            const totalViolations = result.violations
              ? Object.values(result.violations).reduce((a, b) => a + b, 0)
              : 0;

            return (
              <div key={index} className="mb-4">
                <h6 className="text-muted fw-semibold mb-3">
                  {examDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ({dayName})
                </h6>

                <div className="card shadow-sm border-0 rounded-4 mb-2 p-3 timetable-card">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <div>
                      <h5 className="mb-1 text-dark">{result.examTitle || 'Exam'}</h5>
                      <p className="mb-0 text-secondary">
                        Subject: <strong>{result.examSubject || 'N/A'}</strong> | Score:{' '}
                        <strong>{result.score}/{result.totalQuestions} ({result.percentage}%)</strong>
                      </p>
                      <p className="mb-0 small text-muted mt-1">
                        Status:{' '}
                        <span className={`badge ${result.timeExpired ? 'bg-danger' : 'bg-success'}`}>
                          {result.timeExpired ? 'Time Expired' : 'Completed'}
                        </span>{' '}
                        | Violations:{' '}
                        <span className={`badge ${totalViolations > 0 ? 'bg-warning' : 'bg-success'}`}>
                          {totalViolations}
                        </span>
                      </p>
                      <p className="mb-0 small text-muted mt-1">
                        Detailed Violations: <br />
                        Gaze Away: {result.violations.mlGazeAway || 0} &nbsp; | &nbsp;
                        Head Rotation: {result.violations.mlHeadPoseAway || 0} &nbsp; | &nbsp;
                        Multiple Faces: {result.violations.mlMultipleFacesDetected || 0} &nbsp; | &nbsp;
                        No Face: {result.violations.mlNoFaceDetected || 0} &nbsp; | &nbsp;
                        Object Detected: {result.violations.mlObjectDetected || 0}
                      </p>
                    </div>

                    <div className="d-flex gap-2 mt-3 mt-md-0">
                      <button
                        className="btn btn-outline-primary btn-sm px-3"
                        onClick={() => setSelectedResult(result)}
                        disabled={!result.sessionId}
                      >
                        View Details
                      </button>
                      <button
                        className="btn btn-outline-success btn-sm px-3"
                        onClick={() => downloadPDF(result)}
                        disabled={!result.sessionId}
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <ResultPDF selectedResult={selectedResult} onBack={() => setSelectedResult(null)} />;
}

export default StudentDashboard;
