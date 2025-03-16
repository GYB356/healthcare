import { Request, Response } from "express";
import { stripe } from "../utils/stripe";

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: "Error creating payment" });
  }
};

export const retrievePaymentIntent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    res.status(200).json(paymentIntent);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving payment" });
  }
};
