import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ResultPDF from './ResultPDF';

function StudentDashboard() {
  const [examResults, setExamResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    fetchExamResults();
  }, []);

  const fetchExamResults = async () => {
    try {
      const studentId = localStorage.getItem('studentId');
      if (!studentId) {
        alert('Student ID not found. Please login again.');
        return;
      }

      // Fetch all completed exams for this student
      const res = await axios.get(`${API_BASE}/api/exam/student-results/${studentId}`);
      const data = res.data;

      setExamResults(data);
    } catch (err) {
      console.error('Failed to fetch exam results:', err);
      // For demo purposes, show mock data if API fails
      setExamResults([{
        sessionId: 'mock-session-123',
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        completedAt: new Date().toISOString(),
        timeExpired: false,
        violations: {
          tabSwitches: 3,
          windowBlurs: 2,
          multipleFaces: 1,
          noCamera: 0,
          internetDisconnects: 1,
          mlFaceMismatch: 0,
          mlNoFaceDetected: 0,
          mlMultipleFacesDetected: 0,
          mlHeadPoseAway: 0,
          mlGazeAway: 0,
          mlObjectDetected: 0
        },
        screenshots: [
          'https://via.placeholder.com/200x150?text=Violation+1',
          'https://via.placeholder.com/200x150?text=Violation+2',
          'https://via.placeholder.com/200x150?text=Violation+3'
        ],
        examTitle: 'Java Programming Certification Exam',
        examSubject: 'Computer Science'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (result) => {
    if (!result.sessionId) {
      alert('Session ID not available for this exam result.');
      return;
    }
    try {
      // Download PDF from backend using the new endpoint
      const response = await axios.get(`${API_BASE}/api/exam/download-pdf/${result.sessionId}`, {
        responseType: 'blob'
      });

      // Create download link
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
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
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

  // If no specific result is selected, show the list of exams
  if (!selectedResult) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="display-4 fw-bold mb-4" style={{ color: 'var(--text-dark)' }}>Academic Results</h1>
            <p className="text-white-50 mb-0" style={{ fontSize: '1.1rem' }}>Track your exam results and performance analytics</p>
          </div>
        </div>

        <div className="timetable-container">
          {examResults.map((result, index) => {
            const examDate = new Date(result.completedAt);
            const dayName = examDate.toLocaleDateString('en-US', { weekday: 'long' });
            const totalViolations = result.violations ? Object.values(result.violations).reduce((a, b) => a + b, 0) : 0;

            return (
              <div key={index} className="mb-4">
                {/* Date Header */}
                <h6 className="text-muted fw-semibold mb-3">
                  {examDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ({dayName})
                </h6>

                {/* Exam Card */}
                <div className="card shadow-sm border-0 rounded-4 mb-2 p-3 timetable-card">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <div>
                      <h5 className="mb-1 text-dark">{result.examTitle || 'Exam'}</h5>
                      <p className="mb-0 text-secondary">
                        Subject: <strong>{result.examSubject || 'N/A'}</strong> |
                        Score: <strong>{result.score}/{result.totalQuestions} ({result.percentage}%)</strong>
                      </p>
                      <p className="mb-0 small text-muted mt-1">
                        Status: <span className={`badge ${result.timeExpired ? 'bg-danger' : 'bg-success'}`}>
                          {result.timeExpired ? 'Time Expired' : 'Completed'}
                        </span> |
                        Violations: <span className={`badge ${totalViolations > 0 ? 'bg-warning' : 'bg-success'}`}>
                          {totalViolations}
                        </span>
                      </p>
                    </div>

                    <div className="d-flex gap-2 mt-3 mt-md-0">
                      <button
                        className="btn btn-outline-primary btn-sm px-3"
                        onClick={() => setSelectedResult(result)}
                      >
                        View Details
                      </button>
                      <button
                        className="btn btn-outline-success btn-sm px-3"
                        onClick={() => downloadPDF(result)}
                        disabled={!result.sessionId}
                      >
                        <i className="bi bi-download me-1"></i>
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

  // Show detailed view for selected result
  return <ResultPDF selectedResult={selectedResult} onBack={() => setSelectedResult(null)} />;
}

export default StudentDashboard;
