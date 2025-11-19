const violationCounts = new Map(); // sessionId -> { total: count, ... }

class ViolationCounter {
  initializeSession(sessionId, examId, studentId) {
    violationCounts.set(sessionId, {
      sessionId,
      examId,
      studentId,
      total: 0
    });
  }

  incrementViolation(sessionId) {
    const session = violationCounts.get(sessionId);
    if (session) {
      session.total++;
    }
  }

  getViolations(sessionId) {
    return violationCounts.get(sessionId) || { total: 0 };
  }

  resetSession(sessionId) {
  }

  getAllSessions() {
    return Array.from(violationCounts.values());
  }

  checkViolations(session) {
    // Check if exam should end based on violation count
    const violations = this.getViolations(session._id || session.id);
    const totalViolations = violations.total || 0;
    // End exam if more than 5 violations (adjust threshold as needed)
    const endExam = totalViolations > 5;
    if (endExam) {
      console.log(`Exam ending for session ${session._id || session.id} due to ${totalViolations} violations`);
    }
    return { endExam };
  }
}

export const violationCounter = new ViolationCounter();

export function checkViolations(session) {
  return violationCounter.checkViolations(session);
}
