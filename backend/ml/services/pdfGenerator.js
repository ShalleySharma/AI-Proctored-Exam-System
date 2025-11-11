import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateResultPDF = (session, snapshots) => {
  const doc = new PDFDocument();
  const pdfPath = path.join('uploads', `result_${session._id}.pdf`);
  doc.pipe(fs.createWriteStream(pdfPath));

  doc.fontSize(20).text('Exam Result Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Student: ${session.student_id.name}`);
  doc.text(`Exam: ${session.exam_id.title}`);
  doc.text(`Score: ${session.score}/${session.total_questions}`);
  doc.text(`System Violations: ${Object.values(session.violation_counts).reduce((a,b)=>a+b,0)}`);
  doc.text(`ML Violations: ${session.ml_violation_count}`);
  doc.text(`Status: ${session.status}`);

  doc.moveDown();
  doc.text('Screenshots:');
  snapshots.forEach(snap => {
    doc.image(snap.image_path, { width: 200 });
  });

  doc.end();
  return pdfPath;
};
