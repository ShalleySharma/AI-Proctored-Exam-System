import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function StudentDashboard() {
  const [examResults, setExamResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const reportRef = useRef(null);

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
      const res = await axios.get(`http://localhost:5000/api/exam/student-results/${studentId}`);
      const data = res.data;

      setExamResults(data);
    } catch (err) {
      console.error('Failed to fetch exam results:', err);
      // For demo purposes, show mock data if API fails
      setExamResults([{
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
          <h2 className="fw-bold text-primary">📊 Student Dashboard</h2>
          <button
            onClick={() => window.location.href = '/join-exam'}
            className="btn btn-primary px-4 py-2"
            style={{
              borderRadius: '25px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              border: 'none'
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Join Exam
          </button>
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
  const totalViolations = selectedResult.violations ? Object.values(selectedResult.violations).reduce((a, b) => a + b, 0) : 0;

  const generatePDF = async () => {
    setPdfGenerating(true);
    try {
      // Download PDF from backend using the new endpoint
      const response = await axios.get(`http://localhost:5000/api/exam/download-pdf/${selectedResult.sessionId}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam_result_${selectedResult.sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (backendError) {
      console.warn('Backend PDF download failed, falling back to frontend generation:', backendError);

      // Fallback to frontend PDF generation
      try {
        const element = reportRef.current;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#667eea'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Add header information
        pdf.setFontSize(16);
        pdf.setTextColor(40, 40, 40);
        pdf.text(selectedResult.examTitle || 'Exam', 105, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Subject: ${selectedResult.examSubject || 'N/A'}`, 105, 30, { align: 'center' });
        pdf.text(`Exam Date: ${new Date(selectedResult.completedAt).toLocaleDateString()}`, 105, 40, { align: 'center' });
        pdf.text(`Score: ${selectedResult.score}/${selectedResult.totalQuestions} (${selectedResult.percentage}%)`, 105, 50, { align: 'center' });

        pdf.save(`Exam_Report_${selectedResult.examTitle}_${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (frontendError) {
        console.error('Frontend PDF generation also failed:', frontendError);
        alert('Error generating PDF. Please try again.');
      }
    } finally {
      setPdfGenerating(false);
    }
  };

  const viewPDF = async () => {
    setPdfGenerating(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#667eea'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Add header information
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text(selectedResult.examTitle || 'Exam', 105, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Subject: ${selectedResult.examSubject || 'N/A'}`, 105, 30, { align: 'center' });
      pdf.text(`Exam Date: ${new Date(selectedResult.completedAt).toLocaleDateString()}`, 105, 40, { align: 'center' });
      pdf.text(`Score: ${selectedResult.score}/${selectedResult.totalQuestions} (${selectedResult.percentage}%)`, 105, 50, { align: 'center' });

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert('Error viewing PDF. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="container-fluid mt-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', paddingBottom: '50px' }}>
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="text-white mb-3" style={{ fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            📊 Your Exam Report
          </h1>
          <div className="d-flex justify-content-center gap-3 mb-4">
            <button
              onClick={viewPDF}
              disabled={pdfGenerating}
              className="btn btn-primary btn-lg px-4 py-2"
              style={{
                borderRadius: '25px',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                border: 'none'
              }}
            >
              <i className="bi bi-eye me-2"></i>
              {pdfGenerating ? 'Generating...' : 'View PDF'}
            </button>
            <button
              onClick={generatePDF}
              disabled={pdfGenerating}
              className="btn btn-success btn-lg px-4 py-2"
              style={{
                borderRadius: '25px',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                border: 'none'
              }}
            >
              <i className="bi bi-download me-2"></i>
              {pdfGenerating ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div ref={reportRef} style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>

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
                  background: `conic-gradient(${selectedResult.percentage >= 70 ? '#28a745' : selectedResult.percentage >= 50 ? '#ffc107' : '#dc3545'} ${selectedResult.percentage * 3.6}deg, #e9ecef 0deg)`,
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
                    <h1 className="text-primary mb-0" style={{ fontSize: '3rem', fontWeight: 'bold' }}>{selectedResult.score}</h1>
                    <p className="text-muted mb-0">out of {selectedResult.totalQuestions}</p>
                  </div>
                </div>
                <h2 className="text-muted mb-4">{selectedResult.percentage}% Accuracy</h2>

                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card bg-light border-0" style={{ borderRadius: '15px' }}>
                      <div className="card-body">
                        <i className={`bi ${selectedResult.timeExpired ? 'bi-clock-history text-danger' : 'bi-check-circle-fill text-success'} fs-1 mb-2`}></i>
                        <h6>Status</h6>
                        <p className={`mb-0 fw-bold ${selectedResult.timeExpired ? 'text-danger' : 'text-success'}`}>
                          {selectedResult.timeExpired ? 'Time Expired' : 'Completed'}
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
                          {new Date(selectedResult.completedAt).toLocaleDateString()}
                        </p>
                        <small className="text-muted">
                          {new Date(selectedResult.completedAt).toLocaleTimeString()}
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
                    className={`progress-bar ${selectedResult.percentage >= 70 ? 'bg-success' : selectedResult.percentage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                    role="progressbar"
                    style={{ width: `${selectedResult.percentage}%`, borderRadius: '15px' }}
                    aria-valuenow={selectedResult.percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <span className="fw-bold">{selectedResult.percentage}%</span>
                  </div>
                </div>

                <div className="text-center">
                  {selectedResult.percentage >= 70 ? (
                    <div className="alert alert-success border-0" style={{ borderRadius: '15px', background: 'linear-gradient(45deg, #d4edda, #c3e6cb)' }}>
                      <h5 className="mb-2">🎉 Excellent Performance!</h5>
                      <p className="mb-0">You aced the exam! Keep up the great work.</p>
                    </div>
                  ) : selectedResult.percentage >= 50 ? (
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
        {selectedResult.violations && (
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
                          <span className="badge bg-warning fs-6">{selectedResult.violations.tabSwitches}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-window text-danger fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Window Focus Loss</h6>
                          <span className="badge bg-danger fs-6">{selectedResult.violations.windowBlurs}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-people-fill text-info fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Multiple Faces Detected</h6>
                          <span className="badge bg-info fs-6">{selectedResult.violations.multipleFaces + selectedResult.violations.mlMultipleFacesDetected}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-eye-slash text-warning fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Face Mismatch</h6>
                          <span className="badge bg-warning fs-6">{selectedResult.violations.mlFaceMismatch}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-person-slash text-danger fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">No Face Detected</h6>
                          <span className="badge bg-danger fs-6">{selectedResult.violations.mlNoFaceDetected}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-arrows-move text-secondary fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Head Pose Away</h6>
                          <span className="badge bg-secondary fs-6">{selectedResult.violations.mlHeadPoseAway}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-eye text-primary fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Gaze Away</h6>
                          <span className="badge bg-primary fs-6">{selectedResult.violations.mlGazeAway}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-phone text-danger fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Prohibited Objects</h6>
                          <span className="badge bg-danger fs-6">{selectedResult.violations.mlObjectDetected}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <h5 className="text-center mb-4">System Issues</h5>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-camera-video-off text-secondary fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Camera Issues</h6>
                          <span className="badge bg-secondary fs-6">{selectedResult.violations.noCamera}</span>
                        </div>
                      </div>
                      <div className="violation-item d-flex align-items-center mb-3 p-3 bg-light rounded">
                        <i className="bi bi-wifi-off text-danger fs-2 me-3"></i>
                        <div>
                          <h6 className="mb-1">Internet Disconnects</h6>
                          <span className="badge bg-danger fs-6">{selectedResult.violations.internetDisconnects}</span>
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
        {selectedResult.screenshots && selectedResult.screenshots.length > 0 && (
          <div className="row mb-5">
            <div className="col-lg-10 mx-auto">
              <div className="card shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div className="card-header bg-gradient-info text-white text-center py-4" style={{ background: 'linear-gradient(45deg, #17a2b8, #138496)' }}>
                  <h3 className="mb-0">📸 Violation Screenshots</h3>
                </div>
                <div className="card-body p-4">
                  <div className="row">
                    {selectedResult.screenshots.map((screenshot, index) => (
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
    </div>
  );
}

export default StudentDashboard;
