export const checkViolations = (session) => {
  const total = session.ml_violation_count || 0;
  if (total > 5) {
    return { endExam: true, status: 'cheated' };
  }
  return { endExam: false };
};

export const incrementViolation = (session, type) => {
  session.ml_violation_count = (session.ml_violation_count || 0) + 1;
  if (type === 'face_mismatch') session.violation_counts.ml_face_mismatch += 1;
  else if (type === 'gaze_away') session.violation_counts.ml_gaze_away += 1;
  else if (type === 'object_detected') session.violation_counts.ml_object_detected += 1;
  return session;
};
