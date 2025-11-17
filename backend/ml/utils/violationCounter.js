export function checkViolations(session) {
  const threshold = 10; // Example threshold for ending exam
  if (session.ml_violation_count > threshold) {
    return { endExam: true, status: 'terminated_due_to_violations' };
  }
  return { endExam: false };
}
