import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateResultPDF = (session, snapshots) => {
  const doc = new PDFDocument();
  const pdfPath = path.join('uploads', `result_${session._id}.pdf`);
  doc.pipe(fs.createWriteStream(pdfPath));

  // Header
  doc.fontSize(20).text('Exam Result Report', { align: 'center' });
  doc.moveDown();

  // Student and Exam Info
  doc.fontSize(14).text(`Student: ${session.student_id?.name || 'Unknown'}`);
  doc.text(`Exam: ${session.exam_id?.title || 'Unknown'}`);
  doc.text(`Subject: ${session.exam_id?.subject || 'N/A'}`);
  doc.text(`Score: ${session.score}/${session.total_questions} (${session.total_questions ? Math.round((session.score / session.total_questions) * 100) : 0}%)`);
  doc.text(`Completed At: ${session.completed_at ? new Date(session.completed_at).toLocaleString() : 'N/A'}`);
  doc.text(`Time Expired: ${session.time_expired ? 'Yes' : 'No'}`);

  // Violations Summary
  doc.moveDown();
  doc.fontSize(16).text('Violations Summary:', { underline: true });
  doc.fontSize(12);
  const violationCounts = session.violation_counts || {};
  doc.text(`Tab Switches: ${violationCounts.tab_switches || 0}`);
  doc.text(`Window Focus Loss: ${violationCounts.window_focus_loss || 0}`);
  doc.text(`Multiple Faces Detected: ${violationCounts.multiple_faces_detected || 0}`);
  doc.text(`Camera Issues: ${violationCounts.camera_issues || 0}`);
  doc.text(`Audio Issues: ${violationCounts.audio_issues || 0}`);
  doc.text(`Internet Disconnects: ${violationCounts.internet_disconnects || 0}`);
  doc.text(`Page Refreshes: ${violationCounts.page_refreshes || 0}`);
  doc.text(`ML Face Mismatch: ${violationCounts.ml_face_mismatch || 0}`);
  doc.text(`ML No Face Detected: ${violationCounts.ml_no_face_detected || 0}`);
  doc.text(`ML Multiple Faces: ${violationCounts.ml_multiple_faces_detected || 0}`);
  doc.text(`ML Head Pose Away: ${violationCounts.ml_head_pose_away || 0}`);
  doc.text(`ML Gaze Away: ${violationCounts.ml_gaze_away || 0}`);
  doc.text(`ML Object Detected: ${violationCounts.ml_object_detected || 0}`);

  const totalViolations = Object.values(violationCounts).reduce((a, b) => a + b, 0);
  doc.text(`Total Violations: ${totalViolations}`);

  // Status
  doc.moveDown();
  doc.fontSize(14).text(`Status: ${session.status || 'Unknown'}`);

  // Screenshots
  if (snapshots && snapshots.length > 0) {
    doc.moveDown();
    doc.fontSize(16).text('Violation Screenshots:', { underline: true });
    doc.fontSize(10);

    snapshots.forEach((snap, index) => {
      if (snap.image_url) {
        try {
          // For Cloudinary URLs, we can't directly embed them in PDFKit
          // Instead, we'll add a note about the screenshot
          doc.text(`Screenshot ${index + 1}: ${snap.image_url}`);
          doc.moveDown();
        } catch (error) {
          console.error('Error adding screenshot to PDF:', error);
          doc.text(`Screenshot ${index + 1}: Unable to load`);
        }
      }
    });
  }

  // Footer
  doc.moveDown();
  doc.fontSize(10).text(`Report generated on ${new Date().toLocaleString()}`, { align: 'center' });
  doc.text('ProctoAI - Advanced Proctoring System', { align: 'center' });

  doc.end();
  return pdfPath;
};
