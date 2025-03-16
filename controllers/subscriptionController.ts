import { Request, Response } from "express";
import { stripe } from "../utils/stripe";
import { subscriptionPlans } from "../config/subscriptionPlans";
import User from "../models/User";

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const priceId = subscriptionPlans[plan]?.priceId;
    if (!priceId) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating subscription" });
  }
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.stripeCustomerId) {
      return res.json({ isActive: false });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
    });

    res.json({ isActive: subscriptions.data.length > 0 });
  } catch (error) {
    res.status(500).json({ message: "Error fetching subscription status" });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ message: "User not subscribed" });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
    });

    if (subscriptions.data.length === 0) {
      return res.json({ message: "No active subscription" });
    }

    await stripe.subscriptions.update(subscriptions.data[0].id, { cancel_at_period_end: true });

    res.json({ message: "Subscription canceled at period end" });
  } catch (error) {
    res.status(500).json({ message: "Error canceling subscription" });
  }
};
