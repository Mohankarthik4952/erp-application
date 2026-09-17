import request from "supertest";
import app from "../src/app.js";

describe("Quotation API", () => {
  let token;

  beforeAll(async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "admin@erp.com",
      password: "Admin@123",
    });

    token = response.body.data.token;
  });

  test("should return quotations for authenticated user", async () => {
    const response = await request(app)
      .get("/api/quotations")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("should reject quotation request without authentication", async () => {
    const response = await request(app).get("/api/quotations");

    expect(response.statusCode).toBe(401);
  });

  test("should reject invalid quotation status", async () => {
    const response = await request(app)
      .patch("/api/quotations/999999/status")
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "INVALID_STATUS",
      });

    expect([400, 404]).toContain(response.statusCode);
  });
});
