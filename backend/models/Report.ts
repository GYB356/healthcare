import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Appointment" },
    doctor: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    report: { type: String, required: true },
    medicalInfo: {
      symptoms: [{ type: String }],
      diagnosis: { type: String }, // Fixed: removed stray bracket
      recommendations: [{ type: String }],
      medications: [{ type: String }],
      followUpNeeded: { type: Boolean, default: false }
    },
    followUpQuestions: { type: String },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);