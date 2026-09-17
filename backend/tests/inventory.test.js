import request from "supertest";
import app from "../src/app.js";

describe("Inventory API", () => {
  let token;

  beforeAll(async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "admin@erp.com",
      password: "Admin@123",
    });

    token = response.body.data.token;
  });

  test("should return inventory for authenticated admin", async () => {
    const response = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("should reject inventory request without authentication", async () => {
    const response = await request(app).get("/api/inventory");

    expect(response.statusCode).toBe(401);
  });
});
