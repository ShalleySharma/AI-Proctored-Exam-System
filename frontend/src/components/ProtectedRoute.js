import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../utils/auth';

const ProtectedRoute = ({ children, teacherOnly = false }) => {
  const isAuthenticated = authService.isAuthenticated();
  const teacherId = authService.getTeacherId();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (teacherOnly && !teacherId) {
    return <Navigate to="/student-dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
