const express = require('express');
const { generateMedicalReport, extractMedicalInfo, generateFollowUpQuestions } = require('../utils/aiUtils');
const { authenticate } = require('../middleware/authMiddleware');
const Report = require('../models/Report');

const router = express.Router();

// Generate and save medical report
router.post('/', authenticate, async (req, res) => {
  try {
    const { appointmentId, transcript } = req.body;
    
    if (!appointmentId || !transcript) {
      return res.status(400).json({ message: 'Appointment ID and transcript required' });
    }
    
    // Generate report text
    const reportText = await generateMedicalReport(transcript);
    
    // Extract medical information
    const medicalInfo = await extractMedicalInfo(transcript);
    
    // Generate follow-up questions
    const followUpQuestions = await generateFollowUpQuestions(transcript);
    
    // Create and save report
    const report = new Report({
      appointmentId,
      doctor: req.user._id,
      report: reportText,
      medicalInfo,
      followUpQuestions
    });
    
    await report.save();
    
    res.json({ message: 'Report saved', report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch reports for an appointment
router.get('/:appointmentId', authenticate, async (req, res) => {
  try {
    const reports = await Report.find({ appointmentId: req.params.appointmentId })
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific report by ID
router.get('/detail/:reportId', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 