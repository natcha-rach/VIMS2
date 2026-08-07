import { Router } from "express";
import { lotsController } from "./lots.controller.js";
import { validate } from "../../common/middleware/validate.js";
import { createLotSchema, updateLotSchema } from "./lots.validation.js";
import { authMiddleware } from "../../common/middleware/auth.js";

const router = Router();

// ทุก endpoint ของ lots ต้อง login ก่อน (ข้อมูลต้นทุน/เงินทุนของร้าน)
router.use(authMiddleware);

router.post(
  "/",
  validate(createLotSchema),
  lotsController.create.bind(lotsController)
);

router.get(
  "/",
  lotsController.list.bind(lotsController)
);

router.get(
  "/:id",
  lotsController.getOne.bind(lotsController)
);

router.patch(
  "/:id",
  validate(updateLotSchema),
  lotsController.update.bind(lotsController)
);

router.delete(
  "/:id",
  lotsController.remove.bind(lotsController)
);

export default router;
