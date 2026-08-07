import { Router } from "express";
import { itemsController } from "./items.controller.js";
import { validate } from "../../common/middleware/validate.js";
import { createItemSchema, updateItemSchema, bulkCreateItemsSchema } from "./items.validation.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { salesController } from "../sales/sales.controller.js";
import { sellItemSchema } from "../sales/sales.validation.js";

const router = Router();

router.use(authMiddleware);

// ==========================================
// Sell / Cancel Sale
// ==========================================
//
// อยู่ภายใต้ /api/items/:id/... เพราะเป็นการเปลี่ยนสถานะของ Item
// แต่ตรรกะจริงอยู่ใน sales module (แยก concern: items ดูแลตัวสินค้า,
// sales ดูแลธุรกรรมการขาย)
//

router.post(
  "/:id/sell",
  validate(sellItemSchema),
  salesController.sell.bind(salesController)
);

router.post(
  "/:id/cancel-sale",
  salesController.cancelSale.bind(salesController)
);

// วางก่อน "/:id" เพื่อไม่ให้ Express จับ "bulk" เป็นค่า :id
router.post(
  "/bulk",
  validate(bulkCreateItemsSchema),
  itemsController.bulkCreate.bind(itemsController)
);

router.post(
  "/",
  validate(createItemSchema),
  itemsController.create.bind(itemsController)
);

router.get(
  "/",
  itemsController.list.bind(itemsController)
);

router.get(
  "/:id",
  itemsController.getOne.bind(itemsController)
);

router.patch(
  "/:id",
  validate(updateItemSchema),
  itemsController.update.bind(itemsController)
);

router.delete(
  "/:id",
  itemsController.remove.bind(itemsController)
);

export default router;
