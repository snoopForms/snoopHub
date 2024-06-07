import Stripe from "stripe";

import { STRIPE_API_VERSION } from "@formbricks/lib/constants";
import { env } from "@formbricks/lib/env";

import { handleCheckoutSessionCompleted } from "../handlers/checkoutSessionCompleted";
import { handleSubscriptionUpdatedOrCreated } from "../handlers/subscriptionCreatedOrUpdated";
import { handleSubscriptionDeleted } from "../handlers/subscriptionDeleted";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});

const webhookSecret: string = env.STRIPE_WEBHOOK_SECRET;

export const webhookHandler = async (requestBody: string, stripeSignature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(requestBody, stripeSignature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    if (err! instanceof Error) console.error(err);
    return { status: 400, message: `Webhook Error: ${errorMessage}` };
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutSessionCompleted(event);
  } else if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    await handleSubscriptionUpdatedOrCreated(event);
  } else if (event.type === "customer.subscription.deleted") {
    await handleSubscriptionDeleted(event);
  }
  return { status: 200, message: { received: true } };
};
