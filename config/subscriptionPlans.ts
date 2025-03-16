export const subscriptionPlans = {
  basic: {
    priceId: process.env.STRIPE_BASIC_PLAN_ID!,
    name: "Basic Plan",
    price: 10,
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PLAN_ID!,
    name: "Pro Plan",
    price: 20,
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PLAN_ID!,
    name: "Enterprise Plan",
    price: 50,
  },
};
