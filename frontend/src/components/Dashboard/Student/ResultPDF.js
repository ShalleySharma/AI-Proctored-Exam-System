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
                  // Log exam_id from fetched data for debugging
                  console.log('Fetched session exam_id:', data.session.exam_id);
                  // Explicitly map only required fields from session instead of spreading entire object
                  setFullResult({
                    ...baseResult,
                    score: data.session.score,
                    total_questions: data.session.total_questions,
                    answers: data.session.answers,
                    violation_counts: data.session.violation_counts,
                    login_time: data.session.login_time,
                    logout_time: data.session.logout_time,
                    status: data.session.status,
                    student_id: data.session.student_id || baseResult.student_id,
                    exam_id: data.session.exam_id || baseResult.exam_id,
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
                // Replace invalid placeholder URLs with valid URLs to avoid image load errors
                image_url: url && url.startsWith('http') ? url : 'https://via.placeholder.com/200x150.png?text=No+Image',
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

  console.log("selectedResult.examDuration = ", selectedResult.examDuration);
  console.log("Exam duration from fullResult.exam_id:", exam?.duration);
  // Ensure totalMarks and duration come from exam_id for accuracy
  const examTotalMarks = exam && exam.totalMarks ? exam.totalMarks : total_questions;
  const examDuration = (exam && typeof exam.duration === 'number') ? exam.duration : 60;

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
                      <p className="mb-2"><strong>Duration:</strong> {examDuration ? `${examDuration} minutes` : 'N/A'}</p>
                      <p className="mb-0"><strong>Total Questions:</strong> {examTotalMarks || 'N/A'}</p>
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
                      <h3 className="text-center">{score || 0} / {examTotalMarks || 0}</h3>
                      <p className="text-center">Percentage: {examTotalMarks ? ((score / examTotalMarks) * 100).toFixed(2) : 0}%</p>
{totalViolations > 5 ? (
  <button style={{ backgroundColor: 'red', color: 'white', fontWeight: 'bold', fontSize: '18px', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'default' }}>Cheat</button>
) : (
  <button style={{ backgroundColor: 'green', color: 'white', fontWeight: 'bold', fontSize: '18px', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'default' }}>Not Cheat</button>
)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced cheat detection summary showing each violation count with professional styling */}
              <div className="violation-summary" style={{ backgroundColor: '#E6F4F1', borderRadius: '8px', padding: '15px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,165,90,0.15)' }}>
                <h6 style={{ color: '#00A85A', marginBottom: '15px' }}><i className="bi bi-exclamation-triangle me-2"></i>Cheat Detection Summary</h6>
                {violation_counts && Object.entries(violation_counts).length > 0 ? (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                      {Object.entries(violation_counts)
                        .filter(([key]) => key !== 'audio_issues' && key !== 'ml_face_mismatch' && key !== 'ml_multiple_faces_detected')
                        .map(([key, value]) => (
                        <div key={key} style={{ backgroundColor: '#fff', border: '1px solid #00A85A', borderRadius: '4px', padding: '6px 12px', minWidth: '130px', textAlign: 'center', boxShadow: 'inset 0 0 5px rgba(0,168,90,0.3)' }}>
                          <div style={{ fontWeight: '600', textTransform: 'capitalize', color: '#00733B' }}>
                            {key.startsWith('ml_') ? key.slice(3).replace(/_/g, ' ') : key.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: '1.1rem', color: '#00A85A' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontWeight: '700', fontSize: '1.2rem', color: '#00733B', borderTop: '1px solid #00A85A', paddingTop: '10px' }}>
                      Total Violations: {totalViolations}
                    </p>
                  </>
                ) : (
                  <p style={{ color: '#28a745', fontWeight: '600' }}>No violations detected.</p>
                )}
              </div>

              {/* Re-added cheating screenshots section with only images */}
              <div>
                <h6><i className="bi bi-camera me-2"></i>Violation Evidence Screenshots</h6>
                {snapshots && snapshots.length > 0 ? (
                  <div className="snapshot-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {snapshots.map((snapshot, idx) => (
                      <div className="snapshot-card" key={idx} style={{ width: '150px', height: '100px', overflow: 'hidden', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                        <img src={snapshot.image_url} alt={`Screenshot-${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No violation evidence screenshots available.</p>
                )}
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default ResultPDF;
