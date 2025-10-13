const mongoose = require('mongoose');
const ExamSchema = new mongoose.Schema({
  name: String,
  test_id: String,
  start_time: Date,
  end_time: Date
});
module.exports = mongoose.model('Exam', ExamSchema);
