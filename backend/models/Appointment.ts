import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  notes: { type: String },
});

const Appointment = mongoose.model("Appointment", AppointmentSchema);
export default Appointment; 