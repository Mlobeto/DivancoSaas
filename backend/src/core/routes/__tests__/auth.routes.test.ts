import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "@config/database";

const app = createApp();

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    // Ensure test database is clean
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new tenant and user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          tenantName: "Test Company",
          email: `test-${Date.now()}@example.com`,
          password: "Test1234!",
          firstName: "John",
          lastName: "Doe",
          country: "US",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toContain("test-");
    });

    it("should reject weak password", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        tenantName: "Test Company",
        email: "weak@example.com",
        password: "weak",
        firstName: "John",
        lastName: "Doe",
      });

      expect(response.status).toBe(400);
    });

    it("should reject duplicate email in same tenant", async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      // First registration
      await request(app).post("/api/v1/auth/register").send({
        tenantName: "Test Company",
        email,
        password: "Test1234!",
        firstName: "John",
        lastName: "Doe",
      });

      // Second registration with same email (different tenant name)
      const response = await request(app).post("/api/v1/auth/register").send({
        tenantName: "Another Company",
        email,
        password: "Test1234!",
        firstName: "Jane",
        lastName: "Smith",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    const testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = "Test1234!";

    beforeAll(async () => {
      // Create test user
      await request(app).post("/api/v1/auth/register").send({
        tenantName: "Login Test Company",
        email: testEmail,
        password: testPassword,
        firstName: "Test",
        lastName: "User",
      });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it("should reject invalid password", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: "WrongPassword123!",
      });

      expect(response.status).toBe(401);
    });

    it("should reject non-existent user", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "nonexistent@example.com",
        password: "Test1234!",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let authToken: string;

    beforeAll(async () => {
      const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send({
          tenantName: "Me Test Company",
          email: `me-test-${Date.now()}@example.com`,
          password: "Test1234!",
          firstName: "Test",
          lastName: "User",
        });

      authToken = registerResponse.body.data.token;
    });

    it("should return authenticated user info", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toContain("me-test-");
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/v1/auth/me");

      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });
});
