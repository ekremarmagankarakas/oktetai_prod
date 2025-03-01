const express = require('express');
const stripeAPI = process.env.STRIPE_API;
const stripe = require('stripe')(stripeAPI);
const User = require('../models/user');
const router = express.Router();

router.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    
    switch (event.type) {
        case 'customer.subscription.updated':
          handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          handleSubscriptionDeleted(event.data.object);
          break;
        default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
});

const handleSubscriptionUpdated = async (subscription, retries = 5) => {
  const customerId = subscription.customer;
  let userId = null;

  const user = await User.findOne({ customerId: customerId });
  if (!user) {
    if (retries > 0) {
      setTimeout(() => {
        handleSubscriptionUpdated(subscription, retries - 1);
      }, 2000);
    } else {
      console.error(`User with customerId ${customerId} not found after retries.`);
    }
    return;
  }
  userId = user.id;

  const price = subscription.items.data[0].price.id;

  if(price === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
    subscriptionPlan = 'professional';
  } else if(price === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    subscriptionPlan = 'enterprise';
  } else {
    subscriptionPlan = 'basic';
  }

  const status = subscription.status;

  try {
    switch (status) {
      case 'incomplete':
        await User.findByIdAndUpdate(userId, { subscriptionPlan: 'basic', subscriptionStatus: status });
        console.log(`User ${userId} subscription plan updated to ${subscriptionPlan} with status ${status}`);
        break;
      case 'incomplete_expired':
        await User.findByIdAndUpdate(userId, { subscriptionPlan: 'basic', subscriptionStatus: status });
        console.log(`User ${userId} subscription plan expired with status ${status}`);
        break;
      case 'trialing':
        await User.findByIdAndUpdate(userId, { subscriptionPlan: subscriptionPlan, subscriptionStatus: status });
        console.log(`User ${userId} subscription plan updated to ${subscriptionPlan} with status ${status}`);
        break;
      case 'active':
        await User.findByIdAndUpdate(userId, { subscriptionPlan: subscriptionPlan, subscriptionStatus: status });
        console.log(`User ${userId} subscription plan updated to ${subscriptionPlan} with status ${status}`);
        break;
      case 'past_due':
        await User.findByIdAndUpdate(userId, { subscriptionPlan: 'basic', subscriptionStatus: status });
        console.log(`User ${userId} subscription plan updated to ${subscriptionPlan} with status ${status}`);
        break;
      case 'canceled':
        await User.findByIdAndUpdate(userId, { subscriptionPlan: 'basic', subscriptionStatus: status });
        console.log(`User ${userId} subscription plan canceled with status ${status}`);
        break;
      case 'unpaid':
        await User.findByIdAndUpdate(userId, { subscriptionPlan: 'basic', subscriptionStatus: status });
        console.log(`User ${userId} subscription plan updated to ${subscriptionPlan} with status ${status}`);
        break;
      case 'paused':
        await User.findByIdAndUpdate(userId, { subscriptionPlan: 'basic', subscriptionStatus: status });
        console.log(`User ${userId} subscription plan paused with status ${status}`);
        break;
      default:
        console.log(`Unhandled subscription status ${status} for user ${userId}`);
    }
  } catch (error) {
    console.error(`Failed to update subscription plan for user ${userId}:`, error.message);
  }
};


const handleSubscriptionDeleted = async (subscription) => {
  const userId = subscription.metadata.user_id;

  try {
    await User.findByIdAndUpdate(userId, { subscriptionPlan: 'basic' });
    console.log(`User ${userId} subscription plan updated to basic with status ${status}`);
  }
  catch (error) {
    console.error(`Failed to update subscription plan for user ${userId}:`, error.message);
  }
}

module.exports = router;