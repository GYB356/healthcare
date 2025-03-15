import mongoose from "mongoose";

const PrescriptionSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Appointment" },
    doctor: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    patient: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    signedByDoctor: { type: Boolean, default: false },
    signature: { type: String }, // Store digital signature
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", PrescriptionSchema); 