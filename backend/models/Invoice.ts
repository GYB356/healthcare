import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Paid", "Cancelled"], default: "Pending" },
});

export default mongoose.model("Invoice", InvoiceSchema); 