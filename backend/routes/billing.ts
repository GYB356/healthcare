import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import Invoice from "../models/Invoice";
import Stripe from "stripe";
import { sendNotification } from "../server";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-08-16" });

// Create an invoice
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { patientId, amount, description, status } = req.body;
    const invoice = new Invoice({ patientId, amount, description, status });
    await invoice.save();

    // Trigger notification
    sendNotification(`New invoice of $${amount} created for Patient ${patientId}`);

    res.json({ message: "Invoice created", invoice });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all invoices
router.get("/", authMiddleware, async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("patientId");
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Process Stripe payment
router.post("/pay", authMiddleware, async (req, res) => {
  try {
    const { amount, token } = req.body;
    const charge = await stripe.charges.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      source: token.id,
      description: "Healthcare Payment",
    });
    res.json({ message: "Payment successful", charge });
  } catch (error) {
    res.status(500).json({ message: "Payment failed", error });
  }
});

export default router; 