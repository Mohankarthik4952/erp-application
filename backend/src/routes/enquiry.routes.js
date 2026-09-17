import express from "express";

import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
} from "../controllers/enquiry.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getEnquiries);

router.get("/:id", getEnquiryById);

router.post("/", authorizeRoles("ADMIN", "SALES_USER"), createEnquiry);

export default router;
