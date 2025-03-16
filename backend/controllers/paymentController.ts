import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { stripe } from "../lib/stripe";

// Create Stripe Checkout Session
export const createCheckoutSession = async (req: Request, res: Response) => {
  const { appointmentId } = req.body;
  const patientId = req.user?.id;

  const appointment = await prisma.appointment.findUnique({
    where: { id: Number(appointmentId) },
  });

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/payment-success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
    customer_email: req.user?.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Appointment Fee" },
          unit_amount: 5000, // $50.00
        },
        quantity: 1,
      },
    ],
    metadata: { appointmentId, patientId },
  });

  res.json({ url: session.url });
};

// Verify Payment Success
export const verifyPayment = async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string;
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return res.status(400).json({ message: "Payment not completed" });
  }

  await prisma.payment.create({
    data: {
      appointmentId: Number(session.metadata?.appointmentId),
      patientId: Number(session.metadata?.patientId),
      amount: 5000,
      status: "PAID",
      stripeSessionId: session.id,
    },
  });

  res.json({ message: "Payment verified successfully" });
};

// Get User Payment History
export const getUserPayments = async (req: Request, res: Response) => {
  const patientId = req.user?.id;

  const payments = await prisma.payment.findMany({
    where: { patientId },
  });

  res.json(payments);
};
