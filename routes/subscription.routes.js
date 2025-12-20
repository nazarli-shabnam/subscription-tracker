import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import {
  createSubscription,
  getUserSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  cancelSubscription,
  getUpcomingRenewals,
  getAllSubscriptions,
} from "../controllers/subscription.controller.js";
import { getSubscriptionAnalytics } from "../controllers/analytics.controller.js";
import { exportSubscriptions } from "../controllers/export.controller.js";
import { getPriceHistory } from "../controllers/priceHistory.controller.js";
import {
  getSubscriptionHealthScore,
  getAllHealthScores,
} from "../controllers/healthScore.controller.js";
import {
  getTrialSubscriptions,
  convertTrialToPaid,
} from "../controllers/trial.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/analytics", authorize, getSubscriptionAnalytics);
subscriptionRouter.get("/export", authorize, exportSubscriptions);
subscriptionRouter.get("/upcoming-renewals", authorize, getUpcomingRenewals);
subscriptionRouter.get("/trials", authorize, getTrialSubscriptions);
subscriptionRouter.get("/health-scores", authorize, getAllHealthScores);
subscriptionRouter.get(
  "/:id/health-score",
  authorize,
  getSubscriptionHealthScore
);
subscriptionRouter.get("/:id/price-history", authorize, getPriceHistory);
subscriptionRouter.put("/:id/convert-trial", authorize, convertTrialToPaid);
subscriptionRouter.get("/user/:id", authorize, getUserSubscriptions);
subscriptionRouter.get("/", authorize, getAllSubscriptions);

subscriptionRouter.get("/:id", authorize, getSubscriptionById);

subscriptionRouter.post("/", authorize, createSubscription);

subscriptionRouter.put("/:id", authorize, updateSubscription);
subscriptionRouter.put("/:id/cancel", authorize, cancelSubscription);

subscriptionRouter.delete("/:id", authorize, deleteSubscription);

export default subscriptionRouter;
