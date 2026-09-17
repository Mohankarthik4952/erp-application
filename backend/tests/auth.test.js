import request from "supertest";
import app from "../src/app.js";

describe("Authentication API", () => {
  test("should login with valid admin credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "admin@erp.com",
      password: "Admin@123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.role).toBe("ADMIN");
  });

  test("should reject invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "admin@erp.com",
      password: "WrongPassword",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
