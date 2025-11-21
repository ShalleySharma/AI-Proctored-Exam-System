import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import ResultPDF from '../Student/ResultPDF';

function InstructorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/exam/teacher-sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      alert('Failed to fetch sessions');
    }
  };

  const handleViewPDF = (sessionId) => {
    window.open(`http://localhost:5000/api/exam/download-pdf/${sessionId}`, '_blank');
  };

  const handleDownloadPDF = (sessionId) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/api/exam/download-pdf/${sessionId}`;
    link.download = `exam_result_${sessionId}.pdf`;
    link.click();
  };

  const handleViewDetails = (session) => {
    // Map session data to the format expected by ResultPDF
    const resultData = {
      sessionId: session._id,
      score: session.score || 0,
      totalQuestions: session.total_questions || 0,
      percentage: session.total_questions ? Math.round((session.score / session.total_questions) * 100) : 0,
      completedAt: session.completed_at,
      timeExpired: session.time_expired,
      violations: {
        tabSwitches: session.violation_counts?.tab_switches || 0,
        windowBlurs: session.violation_counts?.window_focus_loss || 0,
        multipleFaces: session.violation_counts?.multiple_faces_detected || 0,
        noCamera: session.violation_counts?.camera_issues || 0,
        noAudio: session.violation_counts?.audio_issues || 0,
        internetDisconnects: session.violation_counts?.internet_disconnects || 0,
        pageRefreshes: session.violation_counts?.page_refreshes || 0,
        mlFaceMismatch: session.violation_counts?.ml_face_mismatch || 0,
        mlNoFaceDetected: session.violation_counts?.ml_no_face_detected || 0,
        mlMultipleFacesDetected: session.violation_counts?.ml_multiple_faces_detected || 0,
        mlHeadPoseAway: session.violation_counts?.ml_head_pose_away || 0,
        mlGazeAway: session.violation_counts?.ml_gaze_away || 0,
        mlObjectDetected: session.violation_counts?.ml_object_detected || 0
      },
      screenshots: [], // Will be fetched by ResultPDF component
      examTitle: session.exam_id?.title || 'Unknown Exam',
      examSubject: session.exam_id?.subject || 'Unknown Subject',
      studentName: session.student_id?.name || 'Unknown',
      studentRollNo: session.student_id?.roll_no || 'N/A',
      studentEmail: session.student_id?.email || 'N/A',
      studentCourse: session.student_id?.course || 'N/A',
      studentYear: session.student_id?.year || 'N/A',
      studentPhoto: session.student_id?.photo_path || null,
      loginTime: session.login_time,
      logoutTime: session.logout_time || session.completed_at,
      pdfPath: session.pdf_path
    };

    setSelectedSession(resultData);
    setShowResultModal(true);
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    setSelectedSession(null);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formatted = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${formatted} (${day})`;
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">📘 Instructor Dashboard</h2>
      </div>

      {sessions.length === 0 ? (
        <p className="text-center text-muted">No sessions found.</p>
      ) : (
        <div className="timetable-container">
          {sessions.map((session, index) => (
            <div key={index} className="mb-4">
              {/* Date Header */}
              <h6 className="text-muted fw-semibold mb-3">
                {formatDate(session.date || new Date())}
              </h6>

              {/* Exam Card */}
              <div className="card shadow-sm border-0 rounded-4 mb-2 p-3 timetable-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <div>
                    <h5 className="mb-1 text-dark">{session.exam_id?.title || 'Exam Title'}</h5>
                    <p className="mb-0 text-secondary">
                      Subject: <strong>{session.exam_id?.subject || 'N/A'}</strong> |
                      Student: <strong>{session.student_id?.name || 'Unknown'}</strong> |
                      Roll No: <strong>{session.student_id?.roll_no || 'N/A'}</strong>
                    </p>
                    <p className="mb-0 small text-muted mt-1">
                      Completed At: {new Date(session.completed_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    <button
                      className="btn btn-outline-info btn-sm px-3"
                      onClick={() => handleViewDetails(session)}
                    >
                      View Details
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm px-3"
                      onClick={() => handleViewPDF(session._id)}
                    >
                      View PDF
                    </button>
                    <button
                      className="btn btn-outline-success btn-sm px-3"
                      onClick={() => handleDownloadPDF(session._id)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && selectedSession && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Student Exam Results</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <ResultPDF selectedResult={selectedSession} onBack={handleCloseModal} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorDashboard;
