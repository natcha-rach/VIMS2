import { Router } from "express";
import { settingsController } from "./settings.controller.js";
import { validate } from "../../common/middleware/validate.js";
import { updateMoneyBucketsSchema, calculateMoneyBucketsSchema } from "./settings.validation.js";
import { authMiddleware } from "../../common/middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/money-buckets",
  settingsController.getMoneyBuckets.bind(settingsController)
);

router.put(
  "/money-buckets",
  validate(updateMoneyBucketsSchema),
  settingsController.updateMoneyBuckets.bind(settingsController)
);

router.post(
  "/money-buckets/calculate",
  validate(calculateMoneyBucketsSchema),
  settingsController.calculateMoneyBuckets.bind(settingsController)
);

export default router;
