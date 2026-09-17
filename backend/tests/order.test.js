import request from "supertest";
import app from "../src/app.js";

describe("Sales Order API", () => {
  let adminToken;
  let salesToken;

  beforeAll(async () => {
    const adminResponse = await request(app).post("/api/auth/login").send({
      email: "admin@erp.com",
      password: "Admin@123",
    });

    adminToken = adminResponse.body.data.token;

    const salesResponse = await request(app).post("/api/auth/login").send({
      email: "sales@erp.com",
      password: "Sales@123",
    });

    salesToken = salesResponse.body.data.token;
  });

  test("should return orders for authenticated user", async () => {
    const response = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("should reject orders request without authentication", async () => {
    const response = await request(app).get("/api/orders");

    expect(response.statusCode).toBe(401);
  });

  test("sales user should not be allowed to confirm an order", async () => {
    const response = await request(app)
      .post("/api/orders/999999/confirm")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("sales user should not be allowed to dispatch an order", async () => {
    const response = await request(app)
      .post("/api/orders/999999/dispatch")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({
        vehicleNumber: "KA01AB1234",
        driverName: "Test Driver",
      });

    expect(response.statusCode).toBe(403);
  });
});
