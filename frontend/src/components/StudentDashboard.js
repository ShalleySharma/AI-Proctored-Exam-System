import React, { useEffect, useState } from 'react';
import axios from 'axios';

function StudentDashboard() {
  const [examResults, setExamResults] = useState(null);
  const [loading, setLoading] = useState(true);

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

      // Fetch the latest session for this student
      const res = await axios.get(`http://localhost:5000/api/exam/student-results/${studentId}`);
      const data = res.data;

      setExamResults(data);
    } catch (err) {
      console.error('Failed to fetch exam results:', err);
      // For demo purposes, show mock data if API fails
      setExamResults({
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
          internetDisconnects: 1
        },
        screenshots: [
          'https://via.placeholder.com/200x150?text=Violation+1',
          'https://via.placeholder.com/200x150?text=Violation+2',
          'https://via.placeholder.com/200x150?text=Violation+3'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your exam results...</p>
      </div>
    );
  }

  if (!examResults) {
    return (
      <div className="container mt-5 text-center">
        <h2>No Exam Results Found</h2>
        <p>You haven't completed any exams yet.</p>
      </div>
    );
  }

  const totalViolations = examResults.violations ? Object.values(examResults.violations).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="container-fluid mt-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', paddingBottom: '50px' }}>
      <div className="container">
        <h1 className="text-center mb-5 text-white" style={{ fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          📊 Your Exam Report
        </h1>

        {/* Score Overview */}
        <div className="row mb-5">
          <div className="col-lg-8 mx-auto">
            <div className="card shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="card-header bg-gradient-primary text-white text-center py-4" style={{ background: 'linear-gradient(45deg, #1e3c72, #2a5298)' }}>
                <h3 className="mb-0">🎯 Performance Summary</h3>
              </div>
              <div className="card-body text-center p-5">
                <div className="score-circle mb-4" style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: `conic-gradient(${examResults.percentage >= 70 ? '#28a745' : examResults.percentage >= 50 ? '#ffc107' : '#dc3545'} ${examResults.percentage * 3.6}deg, #e9ecef 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                  <div style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <h1 className="text-primary mb-0" style={{ fontSize: '3rem', fontWeight: 'bold' }}>{examResults.score}</h1>
                    <p className="text-muted mb-0">out of {examResults.totalQuestions}</p>
                  </div>
                </div>
                <h2 className="text-muted mb-4">{examResults.percentage}% Accuracy</h2>

                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card bg-light border-0" style={{ borderRadius: '15px' }}>
                      <div className="card-body">
                        <i className={`bi ${examResults.timeExpired ? 'bi-clock-history text-danger' : 'bi-check-circle-fill text-success'} fs-1 mb-2`}></i>
                        <h6>Status</h6>
                        <p className={`mb-0 fw-bold ${examResults.timeExpired ? 'text-danger' : 'text-success'}`}>
                          {examResults.timeExpired ? 'Time Expired' : 'Completed'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light border-0" style={{ borderRadius: '15px' }}>
                      <div className="card-body">
                        <i className="bi bi-calendar-check text-primary fs-1 mb-2"></i>
                        <h6>Completed At</h6>
                        <p className="mb-0 fw-bold">
                          {new Date(examResults.completedAt).toLocaleDateString()}
                        </p>
                        <small className="text-muted">
                          {new Date(examResults.completedAt).toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light border-0" style={{ borderRadius: '15px' }}>
                      <div className="card-body">
                        <i className={`bi ${totalViolations > 0 ? 'bi-exclamation-triangle-fill text-warning' : 'bi-shield-check text-success'} fs-1 mb-2`}></i>
                        <h6>Violations</h6>
                        <p className={`mb-0 fw-bold ${totalViolations > 0 ? 'text-warning' : 'text-success'}`}>
                          {totalViolations}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="progress mb-4" style={{ height: '25px', borderRadius: '15px' }}>
                  <div
                    className={`progress-bar ${examResults.percentage >= 70 ? 'bg-success' : examResults.percentage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                    role="progressbar"
                    style={{ width: `${examResults.percentage}%`, borderRadius: '15px' }}
                    aria-valuenow={examResults.percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <span className="fw-bold">{examResults.percentage}%</span>
                  </div>
                </div>

                <div className="text-center">
                  {examResults.percentage >= 70 ? (
                    <div className="alert alert-success border-0" style={{ borderRadius: '15px', background: 'linear-gradient(45deg, #d4edda, #c3e6cb)' }}>
                      <h5 className="mb-2">🎉 Excellent Performance!</h5>
                      <p className="mb-0">You aced the exam! Keep up the great work.</p>
                    </div>
                  ) : examResults.percentage >= 50 ? (
                    <div className="alert alert-warning border-0" style={{ borderRadius: '15px', background: 'linear-gradient(45deg, #fff3cd, #ffeaa7)' }}>
                      <h5 className="mb-2">⚠️ Good Job!</h5>
                      <p className="mb-0">You passed! Consider reviewing challenging topics for improvement.</p>
                    </div>
                  ) : (
                    <div className="alert alert-danger border-0" style={{ borderRadius: '15px', background: 'linear-gradient(45deg, #f8d7da, #f5c6cb)' }}>
                      <h5 className="mb-2">📚 Keep Studying!</h5>
                      <p className="mb-0">Don't give up! Review the material and try again.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Violations Section */}
        {examResults.violations && (
          <div className="row mb-5">
            <div className="col-lg-10 mx-auto">
              <div className="card shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div className="card-header bg-gradient-danger text-white text-center py-4" style={{ background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)' }}>
                  <h3 className="mb-0">🚨 Proctoring Violations Report</h3>
                </div>
                <div className="card-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <h5 className="text-center mb-4">Violation Counts</h5>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-arrow-repeat text-warning fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Tab Switches</h6>
                          <span className="badge bg-warning fs-6">{examResults.violations.tabSwitches}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-window text-danger fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Window Focus Loss</h6>
                          <span className="badge bg-danger fs-6">{examResults.violations.windowBlurs}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-people-fill text-info fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Multiple Faces Detected</h6>
                          <span className="badge bg-info fs-6">{examResults.violations.multipleFaces}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <h5 className="text-center mb-4">System Issues</h5>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-camera-video-off text-secondary fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Camera Issues</h6>
                          <span className="badge bg-secondary fs-6">{examResults.violations.noCamera}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-wifi-off text-danger fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Internet Disconnects</h6>
                          <span className="badge bg-danger fs-6">{examResults.violations.internetDisconnects}</span>
                        </div>
                      </div>
                      <div className="violation-summary text-center mt-4 p-3 bg-primary text-white rounded">
                        <h6>Total Violations</h6>
                        <h2 className="mb-0">{totalViolations}</h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screenshots Section */}
        {examResults.screenshots && examResults.screenshots.length > 0 && (
          <div className="row mb-5">
            <div className="col-lg-10 mx-auto">
              <div className="card shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div className="card-header bg-gradient-info text-white text-center py-4" style={{ background: 'linear-gradient(45deg, #17a2b8, #138496)' }}>
                  <h3 className="mb-0">📸 Violation Screenshots</h3>
                </div>
                <div className="card-body p-4">
                  <div className="row">
                    {examResults.screenshots.map((screenshot, index) => (
                      <div key={index} className="col-md-4 mb-4">
                        <div className="screenshot-card" style={{
                          borderRadius: '15px',
                          overflow: 'hidden',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                          transition: 'transform 0.3s ease'
                        }}>
                          <img
                            src={screenshot}
                            alt={`Violation Screenshot ${index + 1}`}
                            className="img-fluid"
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                          />
                          <div className="p-3 bg-white">
                            <h6 className="text-center mb-0">Violation #{index + 1}</h6>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-white">
          <p className="mb-0">Report generated on {new Date().toLocaleDateString()}</p>
          <small>ProctoAI - Advanced Proctoring System</small>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
