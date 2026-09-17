import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import masterRoutes from "./routes/master.routes.js";
import enquiryRoutes from "./routes/enquiry.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ERP backend is running",
  });
});

// ============================================================
// ROUTES
// ============================================================

app.use("/api/auth", authRoutes);

app.use("/api", masterRoutes);

app.use("/api/enquiries", enquiryRoutes);

app.use("/api/quotations", quotationRoutes);

app.use("/api/orders", orderRoutes);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
