import React, { useEffect, useState } from 'react';
import axios from 'axios';

function InstructorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

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

  const fetchSnapshots = async (sessionId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/exam/snapshots/${sessionId}`);
      setSnapshots(res.data);
    } catch (err) {
      alert('Failed to fetch snapshots');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Instructor Dashboard</h2>
      <div className="row">
        <div className="col-md-6">
          <h4>Sessions</h4>
          <ul className="list-group">
            {sessions.map(session => (
              <li key={session._id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>{session.student_id.name} - {session.status}</span>
                  <button className="btn btn-sm btn-primary" onClick={() => fetchSnapshots(session._id)}>
                    View Snapshots
                  </button>
                </div>
                <div className="row text-center">
                  <div className="col-6 col-md-4 mb-2">
                    <div className="p-2 bg-light rounded">
                      <i className="bi bi-arrow-repeat me-2" style={{ color: '#f0ad4e' }}></i>
                      Tab Switches
                      <span className="badge bg-warning text-dark ms-2">{session.violation_counts?.tab_switches || 0}</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-4 mb-2">
                    <div className="p-2 bg-light rounded">
                      <i className="bi bi-window-dock me-2" style={{ color: '#d9534f' }}></i>
                      Window Focus Loss
                      <span className="badge bg-danger ms-2">{session.violation_counts?.window_focus_loss || 0}</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-4 mb-2">
                    <div className="p-2 bg-light rounded">
                      <i className="bi bi-camera-video-off me-2" style={{ color: '#6c757d' }}></i>
                      Camera Issues
                      <span className="badge bg-secondary ms-2">{session.violation_counts?.camera_issues || 0}</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-4 mb-2">
                    <div className="p-2 bg-light rounded">
                      <i className="bi bi-wifi-off me-2" style={{ color: '#d9534f' }}></i>
                      Internet Disconnects
                      <span className="badge bg-danger ms-2">{session.violation_counts?.internet_disconnects || 0}</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-4 mb-2">
                    <div className="p-2 bg-light rounded">
                      <i className="bi bi-people-fill me-2" style={{ color: '#5bc0de' }}></i>
                      Multiple Faces Detected
                      <span className="badge bg-info ms-2">{session.violation_counts?.multiple_faces_detected || 0}</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-4 mb-2">
                    <div className="p-2 bg-primary text-white rounded">
                      Total Violations
                      <span className="badge bg-primary ms-2">
                        {(session.violation_counts?.tab_switches || 0) +
                          (session.violation_counts?.window_focus_loss || 0) +
                          (session.violation_counts?.camera_issues || 0) +
                          (session.violation_counts?.internet_disconnects || 0) +
                          (session.violation_counts?.multiple_faces_detected || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <h4>Snapshots</h4>
          {snapshots.map(snapshot => (
            <div key={snapshot._id} className="card mb-3">
              <img src={`http://localhost:5000/${snapshot.image_path}`} className="card-img-top" alt="Snapshot" />
              <div className="card-body">
                <p>Timestamp: {new Date(snapshot.timestamp).toLocaleString()}</p>
                <p>Violations: {snapshot.violations.join(', ') || 'None'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboard;
