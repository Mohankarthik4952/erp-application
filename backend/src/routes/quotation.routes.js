import express from "express";

import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
  convertQuotation,
} from "../controllers/quotation.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// GET quotations
router.get("/", getQuotations);

// GET quotation by ID
router.get("/:id", getQuotationById);

// CREATE quotation
router.post("/", authorizeRoles("ADMIN", "SALES_USER"), createQuotation);

// UPDATE quotation status
router.patch(
  "/:id/status",
  authorizeRoles("ADMIN", "SALES_USER"),
  updateQuotationStatus,
);

// CONVERT accepted quotation to sales order
router.post(
  "/:id/convert",
  authorizeRoles("ADMIN", "SALES_USER"),
  convertQuotation,
);

export default router;
