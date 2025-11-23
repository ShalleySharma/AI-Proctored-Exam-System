import React, { useState, useEffect } from 'react';

const ResultPDF = ({ selectedResult, onBack }) => {
  const [fullResult, setFullResult] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ResultPDF selectedResult:', selectedResult);
    if (selectedResult) {
      // Always use selectedResult as base data
      const baseResult = {
        student_id: {
          name: selectedResult.studentName || 'N/A',
          roll_no: selectedResult.studentRollNo || 'N/A',
          email: selectedResult.studentEmail || 'N/A',
          course: selectedResult.studentCourse || 'N/A',
          year: selectedResult.studentYear || 'N/A'
        },
        exam_id: {
          title: selectedResult.examTitle || 'Mock Exam',
          subject: selectedResult.examSubject || 'Mock Subject',
          date: new Date().toISOString(),
          duration: selectedResult.examDuration || 60,
          totalMarks: selectedResult.totalQuestions || 10
        },
        score: selectedResult.score || 0,
        total_questions: selectedResult.totalQuestions || 10,
        answers: [],
        violation_counts: {
          tab_switches: selectedResult.violations?.tabSwitches || 0,
          window_focus_loss: selectedResult.violations?.windowBlurs || 0,
          multiple_faces_detected: selectedResult.violations?.multipleFaces || 0,
          camera_issues: selectedResult.violations?.noCamera || 0,
          audio_issues: selectedResult.violations?.noAudio || 0,
          internet_disconnects: selectedResult.violations?.internetDisconnects || 0,
          page_refreshes: selectedResult.violations?.pageRefreshes || 0,
          ml_face_mismatch: selectedResult.violations?.mlFaceMismatch || 0,
          ml_no_face_detected: selectedResult.violations?.mlNoFaceDetected || 0,
          ml_multiple_faces_detected: selectedResult.violations?.mlMultipleFacesDetected || 0,
          ml_head_pose_away: selectedResult.violations?.mlHeadPoseAway || 0,
          ml_gaze_away: selectedResult.violations?.mlGazeAway || 0,
          ml_object_detected: selectedResult.violations?.mlObjectDetected || 0
        },
        login_time: selectedResult.loginTime || selectedResult.completedAt || new Date().toISOString(),
        logout_time: selectedResult.logoutTime || selectedResult.completedAt || new Date().toISOString(),
        status: 'completed'
      };

      // Try to fetch enhanced data from API if sessionId exists
      if (selectedResult.sessionId) {
        console.log('Fetching session data for:', selectedResult.sessionId);
        fetch(`http://localhost:5000/ml/session/${selectedResult.sessionId}`)
          .then(res => {
            console.log('Fetch response status:', res.status);
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log('Fetched data:', data);
            if (data.session) {
              // Merge API data with base data
              setFullResult({
                ...baseResult,
                ...data.session,
                student_id: data.session.student_id || baseResult.student_id,
                exam_id: data.session.exam_id || baseResult.exam_id
              });
              setSnapshots(data.snapshots || []);
            } else {
              // Use base data if API returns null session
              setFullResult(baseResult);
              setSnapshots([]);
            }
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching session details, using base data:', err);
            // Use base data if API fails
            setFullResult(baseResult);
            // Fallback to screenshots from selectedResult if available
            const fallbackSnapshots = selectedResult.screenshots ? selectedResult.screenshots.map((url, index) => ({
              image_url: url,
              violations: ['Screenshot captured'],
              detections: { person_count: 0, face_count: 0, gaze: 'unknown' },
              timestamp: selectedResult.completedAt || new Date().toISOString()
            })) : [];
            setSnapshots(fallbackSnapshots);
            setLoading(false);
          });
      } else {
        // No sessionId, use base data directly
        setFullResult(baseResult);
        setSnapshots([]);
        setLoading(false);
      }
    } else {
      console.log('No selectedResult:', selectedResult);
      setFullResult(null);
      setLoading(false);
    }
  }, [selectedResult]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your exam result...</p>
      </div>
    );
  }

  if (!fullResult) {
    return <div className="text-center mt-5">No result selected</div>;
  }

  const { student_id: student, exam_id: exam, score, total_questions, answers, violation_counts, login_time, logout_time, status, ml_screenshots } = fullResult;
  const attemptedQuestions = answers ? answers.length : 0;
  const totalViolations = violation_counts ? Object.values(violation_counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <style>{`
        .card:hover {
          box-shadow: none !important;
          transform: none !important;
        }
      `}</style>
      <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="bi bi-file-earmark-pdf me-2"></i>
                ProctorAI Exam Report
              </h4>
              <button className="btn btn-light" onClick={onBack}>
                <i className="bi bi-arrow-left me-1"></i>Back
              </button>
            </div>
            <div className="card-body">
              <div className="text-center mb-4">
                <p className="text-muted">
                  <i className="bi bi-shield-check me-2" style={{ color: '#00A85A' }}></i>
                  This report was generated by ProctorAI on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
                <h5 className="text-success fw-bold">ProctorAI - Advanced Proctoring System</h5>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#F8F9FA' }}>
                    <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #17A2B8 0%, #138496 100%)', borderRadius: '12px 12px 0 0' }}>
                      <h6 className="mb-0"><i className="bi bi-person-circle me-2"></i>Student Information</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-8">
                          <p className="mb-2"><strong>Name:</strong> {student?.name || 'N/A'}</p>
                          <p className="mb-2"><strong>Roll Number:</strong> {student?.roll_no || 'N/A'}</p>
                          <p className="mb-2"><strong>Email:</strong> {student?.email || 'N/A'}</p>
                          <p className="mb-2"><strong>Course:</strong> {student?.course || 'N/A'}</p>
                          <p className="mb-0"><strong>Year:</strong> {student?.year || 'N/A'}</p>
                        </div>
                        {student?.photo_path && (
                          <div className="col-4 text-center">
                            <img src={student.photo_path} alt="Student Photo" className="img-fluid rounded" style={{width: '80px', height: '80px', objectFit: 'cover', border: '2px solid #00A85A'}} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#F8F9FA' }}>
                    <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #00A85A 0%, #028E4B 100%)', borderRadius: '12px 12px 0 0' }}>
                      <h6 className="mb-0"><i className="bi bi-journal-text me-2"></i>Exam Information</h6>
                    </div>
                    <div className="card-body">
                      <p className="mb-2"><strong>Title:</strong> {exam?.title || 'N/A'}</p>
                      <p className="mb-2"><strong>Subject:</strong> {exam?.subject || 'N/A'}</p>
                      <p className="mb-2"><strong>Date:</strong> {exam?.date ? new Date(exam.date).toLocaleDateString() : 'N/A'}</p>
                      <p className="mb-2"><strong>Duration:</strong> {exam?.duration ? `${exam.duration} minutes` : 'N/A'}</p>
                      <p className="mb-0"><strong>Total Questions:</strong> {total_questions || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-header bg-warning text-dark">
                      <h6 className="mb-0"><i className="bi bi-clock me-2"></i>Session Details</h6>
                    </div>
                    <div className="card-body">
                      <p><strong>Login Time:</strong> {login_time ? new Date(login_time).toLocaleString() : 'N/A'}</p>
                      <p><strong>Logout Time:</strong> {logout_time ? new Date(logout_time).toLocaleString() : 'N/A'}</p>
                      <p><strong>Status:</strong> <span className={`badge ${status === 'completed' ? 'bg-success' : 'bg-warning'}`}>{status}</span></p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0"><i className="bi bi-trophy me-2"></i>Score</h6>
                    </div>
                    <div className="card-body">
                      <h3 className="text-center">{score || 0} / {exam?.totalMarks || total_questions || 0}</h3>
                      <p className="text-center">Percentage: {exam?.totalMarks ? ((score / exam.totalMarks) * 100).toFixed(2) : 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #DC3545 0%, #C82333 100%)', borderRadius: '12px 12px 0 0' }}>
                  <h6 className="mb-0"><i className="bi bi-shield-exclamation me-2"></i>Cheat Detection Summary</h6>
                </div>
                <div className="card-body">
                  <div className="text-center mb-3">
                    <h3 className="text-danger">{totalViolations}</h3>
                    <p className="text-muted mb-0">Total Violations</p>
                  </div>
                  <table className="table">
                    <thead className="table-light">
                      <tr>
                        <th>Violation Type</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(violation_counts || {})
                        .filter(([key]) => !['ml_face_mismatch', 'ml_multiple_faces_detected'].includes(key))
                        .map(([key, value]) => {
                          let formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          formattedKey = formattedKey.replace(/^Ml\s+/, '');
                          return (
                            <tr key={key}>
                              <td>{formattedKey}</td>
                              <td><span className="badge bg-danger">{value}</span></td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {(snapshots.length > 0 || (ml_screenshots && ml_screenshots.length > 0)) && (
                <div className="card mb-4">
                  <div className="card-header bg-danger text-white">
                    <h6 className="mb-0"><i className="bi bi-camera me-2"></i>Cheating Screenshots</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {snapshots.map((snapshot, index) => (
                        <div key={index} className="col-md-4 mb-3">
                          <img src={snapshot.image_url} alt={`Screenshot ${index + 1}`} className="img-fluid rounded" style={{width: '100%', height: '200px', objectFit: 'cover'}} />
                        </div>
                      ))}
                      {ml_screenshots && ml_screenshots.map((screenshot, index) => (
                        <div key={`ml-${index}`} className="col-md-4 mb-3">
                          <img src={`http://localhost:5000/uploads/${screenshot}`} alt={`ML Screenshot ${index + 1}`} className="img-fluid rounded" style={{width: '100%', height: '200px', objectFit: 'cover'}} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default ResultPDF;
