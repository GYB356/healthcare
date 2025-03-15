const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateMedicalReport, extractMedicalInfo, generateFollowUpQuestions } = require('../utils/aiUtils');

// Generate a medical report from a consultation transcript
router.post('/generate-report', auth, async (req, res) => {
  try {
    const { transcript, appointmentId } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ message: 'Transcript is required' });
    }
    
    const report = await generateMedicalReport(transcript);
    
    // If you have a database model for reports, you could save it here
    // const savedReport = await Report.create({
    //   appointmentId,
    //   content: report,
    //   createdBy: req.user.id
    // });
    
    res.json({ report });
  } catch (error) {
    console.error('Error generating medical report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Extract key medical information from a transcript
router.post('/extract-info', auth, async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ message: 'Transcript is required' });
    }
    
    const medicalInfo = await extractMedicalInfo(transcript);
    
    res.json({ medicalInfo });
  } catch (error) {
    console.error('Error extracting medical information:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate follow-up questions based on a consultation transcript
router.post('/follow-up-questions', auth, async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ message: 'Transcript is required' });
    }
    
    const questions = await generateFollowUpQuestions(transcript);
    
    res.json({ questions });
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 