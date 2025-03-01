const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");

const router = express.Router();

router.post(
  "/create-checkout-session",
  subscriptionController.createCheckoutSession,
);
router.get("/subscription-plan", subscriptionController.getSubscriptionPlan);
router.post("/cancel-subscription", subscriptionController.cancelSubscription);
router.get("/order/success", subscriptionController.successUrl);
router.post("/customer-portal", subscriptionController.customerPortal);
router.get("/is-customer", subscriptionController.isCustomer);
router.post("/update-api-keys", subscriptionController.updateApiKeys);
router.delete("/delete-api-key", subscriptionController.deleteApiKey);

module.exports = router;
