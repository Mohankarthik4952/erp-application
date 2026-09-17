import express from "express";

import {
  createCustomer,
  getCustomers,
  getProducts,
  createProduct,
  getInventory,
} from "../controllers/master.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// CUSTOMERS
// ============================================================

router.get("/customers", getCustomers);

router.post(
  "/customers",
  authorizeRoles("ADMIN", "SALES_USER"),
  createCustomer,
);

// ============================================================
// PRODUCTS
// ============================================================

router.get("/products", getProducts);

router.post("/products", authorizeRoles("ADMIN"), createProduct);

// ============================================================
// INVENTORY
// ============================================================

router.get("/inventory", authorizeRoles("ADMIN", "SALES_USER"), getInventory);

export default router;
