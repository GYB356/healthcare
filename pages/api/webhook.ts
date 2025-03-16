import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import User from "../../../models/User";
import dbConnect from "../../../lib/dbConnect";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret as string);
  } catch (err) {
    return res.status(400).json({ message: "Webhook error" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userEmail = session.customer_email;

    if (userEmail) {
      await User.updateOne({ email: userEmail }, { isSubscribed: true });
    }
  }

  res.status(200).json({ received: true });
}
