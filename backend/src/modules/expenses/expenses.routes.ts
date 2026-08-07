import { Router } from "express";
import { expensesController } from "./expenses.controller.js";
import { validate } from "../../common/middleware/validate.js";
import { createExpenseSchema, updateExpenseSchema } from "./expenses.validation.js";
import { authMiddleware } from "../../common/middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validate(createExpenseSchema),
  expensesController.create.bind(expensesController)
);

router.get(
  "/",
  expensesController.list.bind(expensesController)
);

router.patch(
  "/:id",
  validate(updateExpenseSchema),
  expensesController.update.bind(expensesController)
);

router.delete(
  "/:id",
  expensesController.remove.bind(expensesController)
);

export default router;
