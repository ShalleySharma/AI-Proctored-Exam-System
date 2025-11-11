# TODO: Integrate ML Cheating Detection with System Compliance

## Completed Tasks
- [ ] Analyze existing code (exam.js, AdvancedSystemCompliance.jsx, Session.js, ExamPage.js)
- [ ] Brainstorm plan for ML integration

## Pending Tasks
- [ ] Install TensorFlow.js dependencies in backend
- [ ] Create backend/ml/ folder structure
- [ ] Download and place ML models in backend/ml/models/
- [ ] Implement backend/ml/utils/faceDetection.js (face verification)
- [ ] Implement backend/ml/utils/gazeEstimation.js (gaze detection)
- [ ] Implement backend/ml/utils/objectDetection.js (object detection)
- [ ] Implement backend/ml/utils/violationCounter.js (count violations, check >5)
- [ ] Implement backend/ml/utils/mlProcessor.js (main processor)
- [ ] Implement backend/ml/services/screenshotHandler.js (annotate/save SS on violations)
- [ ] Implement backend/ml/services/pdfGenerator.js (generate result PDF)
- [ ] Implement backend/ml/routes/mlRoutes.js (API endpoints)
- [ ] Update backend/models/Session.js (add ml_violation_count, status)
- [ ] Integrate ML into backend/routes/exam.js (call mlProcessor on snapshot)
- [ ] Update frontend/src/components/ExamPage.js (poll for exam end on violations)
- [ ] Test integration (run exam, trigger violations, check counts/SS/PDF)
