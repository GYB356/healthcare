const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  report: {
    type: String,
    required: true
  },
  medicalInfo: {
    symptoms: [String],
    diagnosis: String,
    recommendations: [String],
    medications: [String],
    followUpNeeded: Boolean
  },
  followUpQuestions: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', ReportSchema); 