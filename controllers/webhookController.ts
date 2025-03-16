import { Request, Response } from "express";
import { stripe } from "../utils/stripe";
import User from "../models/User";

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const user = await User.findOne({ stripeCustomerId: subscription.customer });

    if (user) {
      user.isSubscribed = false;
      await user.save();
    }
  }

  res.json({ received: true });
};
