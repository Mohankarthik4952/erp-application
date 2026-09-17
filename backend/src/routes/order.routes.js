import express from "express";

import {
  getOrders,
  getOrderById,
  confirmOrder,
  cancelOrder,
  dispatchOrder,
} from "../controllers/order.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// View orders
router.get("/", getOrders);

// View single order
router.get("/:id", getOrderById);

// ADMIN ONLY
router.post("/:id/confirm", authorizeRoles("ADMIN"), confirmOrder);

// ADMIN ONLY
router.post("/:id/cancel", authorizeRoles("ADMIN"), cancelOrder);

// ADMIN ONLY
router.post("/:id/dispatch", authorizeRoles("ADMIN"), dispatchOrder);

export default router;
