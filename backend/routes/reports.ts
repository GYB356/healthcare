import express from "express";
import { generateMedicalReport, extractMedicalInfo, generateFollowUpQuestions } from "../utils/aiUtils";
import { authenticate } from "../middleware/authMiddleware";
import Report from "../models/Report";
import { protect, authorize } from "../middleware/auth";
import { AppError } from "../utils/errorHandler";

const router = express.Router();

// Generate and save medical report
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { appointmentId, transcript } = req.body;
    
    if (!appointmentId || !transcript) {
      throw new AppError("Appointment ID and transcript required", 400, "VALIDATION_ERROR");
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
      doctor: req.user.id,
      report: reportText,
      medicalInfo,
      followUpQuestions
    });
    
    await report.save();
    
    res.json({ message: "Report saved", report });
  } catch (error) {
    next(error); // Forward to error middleware
  }
});

// Fetch reports for an appointment
router.get("/:appointmentId", authenticate, async (req, res, next) => {
  try {
    const reports = await Report.find({ appointmentId: req.params.appointmentId })
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// Get a specific report by ID
router.get("/detail/:reportId", authenticate, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      throw new AppError("Report not found", 404, "NOT_FOUND");
    }
    
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Fetch reports for the authenticated patient
router.get("/my-reports", protect, authorize("patient"), async (req, res, next) => {
  try {
    const reports = await Report.find({ patientId: req.user.id });
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

export default router;