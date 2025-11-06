import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function InstructorDashboard() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/exam/sessions');
      setSessions(res.data);
    } catch (err) {
      alert('Failed to fetch sessions');
    }
  };

  const handleViewPDF = (sessionId) => {
    window.open(`http://localhost:5000/api/exam/result/${sessionId}`, '_blank');
  };

  const handleDownloadPDF = (sessionId) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/api/exam/result/${sessionId}`;
    link.download = `ExamResult_${sessionId}.pdf`;
    link.click();
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
                    <h5 className="mb-1 text-dark">{session.exam_name || 'Exam Name'}</h5>
                    <p className="mb-0 text-secondary">
                      Class: <strong>{session.student_id?.class || '6th'}</strong> |
                      Student: <strong>{session.student_id?.name || 'Unknown'}</strong>
                    </p>
                    <p className="mb-0 small text-muted mt-1">
                      Time: {session.start_time || '8:00 AM'} - {session.end_time || '8:30 AM'}
                    </p>
                  </div>

                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    <button
                      className="btn btn-outline-primary btn-sm px-3"
                      onClick={() => handleViewPDF(session._id)}
                    >
                      View
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
    </div>
  );
}

export default InstructorDashboard;
