const stripeAPI = process.env.STRIPE_API;
const stripe = require("stripe")(stripeAPI);
const User = require("../models/user");
const domainUrl = process.env.DOMAIN_URL;

const createCheckoutSession = async (req, res, plan) => {
  const prices = {
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: prices[plan],
        quantity: 1,
      },
    ],
    success_url: `${domainUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domainUrl}/dashboard`,
  });

  res.json({ id: session.id });
};

exports.createCheckoutSession = async (req, res) => {
  const { plan } = req.body;
  if (["professional", "enterprise"].includes(plan)) {
    await createCheckoutSession(req, res, plan);
  } else {
    res.status(400).json({ error: "Invalid plan" });
  }
};

exports.successUrl = async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    const userId = req.user._id;

    if (!sessionId || sessionId.length > 66) {
      return res.status(400).send("Invalid session ID");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customer = await stripe.customers.retrieve(session.customer);

    await User.findByIdAndUpdate(
      userId,
      { customerId: customer.id },
      { new: true },
    );

    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="2;url=/dashboard" />
          <style>
            :root {
              --bg-color: #0B0B0B;
              --second-bg-color: #0B0B0B;
              --text-color: #ededed;
              --border-color: #2d2c30;
              --accent-color: #c17cea;
              --hover-color: #252527;
              --heading-font-family: 'Poppins', sans-serif;
              --body-font-family: 'Lato', sans-serif;
              --main-font-size: 14px;
              --padding-standard: 14px;
              --margin-standard: 14px;
            }

            body {
              background-color: var(--bg-color);
              color: var(--text-color);
              font-family: var(--body-font-family);
              font-size: var(--main-font-size);
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }

            h1 {
              font-family: var(--heading-font-family);
              color: var(--accent-color);
              margin-bottom: var(--margin-standard);
            }

            p {
              margin-top: 0;
              color: var(--text-color);
            }
          </style>
        </head>
        <body>
          <div>
            <h1>Thanks for your order, ${customer.name}!</h1>
            <p>You will be redirected to your dashboard shortly...</p>
            <script>
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 2000);
            </script>
          </div>
        </body>
      </html>
  `);
  } catch (error) {
    console.error("Error retrieving session:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.customerPortal = async (req, res) => {
  try {
    const returnUrl = `${domainUrl}/dashboard`;
    const userId = req.user._id;
    const user = await User.findById(userId);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: returnUrl,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getSubscriptionPlan = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    res.json({ subscriptionPlan: user.subscriptionPlan });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.isCustomer = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId).select("customerId");
    if (user && user.customerId) {
      res.json({ isCustomer: true });
    } else {
      res.json({ isCustomer: false });
    }
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.cancelSubscription = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user || !user.subscriptionPlan) {
      return res.status(404).json({ error: "Subscription not found for user" });
    }

    const customer = await stripe.customers.list({
      email: user.email,
    });

    if (!customer.data.length) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.data[0].id,
    });

    if (!subscriptions.data.length) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const subscription = subscriptions.data[0];

    await stripe.subscriptions.cancel(subscription.id);

    res.json({ message: "Subscription cancelled successfully" });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateApiKeys = async (req, res) => {
  const userId = req.user.id;
  const updates = req.body; // Contains only updated keys

  try {
    // Construct the update object dynamically
    const updateFields = {};
    for (const [key, value] of Object.entries(updates)) {
      updateFields[`apiKeys.${key}`] = value || null; // Set to null if value is empty
    }

    // Update the user document with dynamic fields
    await User.findByIdAndUpdate(userId, { $set: updateFields });

    res.sendStatus(200);
  } catch (error) {
    console.error("Error updating API keys:", error);
    res.sendStatus(500);
  }
};

exports.deleteApiKey = async (req, res) => {
  const userId = req.user.id;
  const { key } = req.body;

  console.log(key);
  console.log(userId);

  if (!key) return res.status(400).json({ error: "Key is required" });

  try {
    const update = {};
    update[`apiKeys.${key}`] = null;

    await User.findByIdAndUpdate(userId, update);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};
