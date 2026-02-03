import request from "supertest";
import { createApp } from "../../../app";
import { prisma } from "@config/database";

const app = createApp();

describe("Dashboard Endpoints", () => {
  let authToken: string;
  let tenantId: string;
  let businessUnitId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Create test user with auth token
    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        tenantName: "Dashboard Test Company",
        email: `dashboard-test-${Date.now()}@example.com`,
        password: "Test1234!",
        firstName: "Test",
        lastName: "User",
      });

    authToken = registerResponse.body.data.token;
    tenantId = registerResponse.body.data.tenant.id;
    businessUnitId = registerResponse.body.data.businessUnits[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/v1/dashboard/tenant/stats", () => {
    it("should return tenant statistics", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/tenant/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("totalUsers");
      expect(response.body.data).toHaveProperty("activeUsers");
      expect(response.body.data).toHaveProperty("totalBusinessUnits");
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/v1/dashboard/tenant/stats");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/dashboard/business-unit/:id/stats", () => {
    it("should return business unit statistics", async () => {
      const response = await request(app)
        .get(`/api/v1/dashboard/business-unit/${businessUnitId}/stats`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("totalUsers");
    });

    it("should require authentication", async () => {
      const response = await request(app).get(
        `/api/v1/dashboard/business-unit/${businessUnitId}/stats`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/dashboard/activity", () => {
    it("should return recent activity", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/activity")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/activity?limit=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("GET /api/v1/dashboard/business-unit/:id/modules", () => {
    it("should return enabled modules", async () => {
      const response = await request(app)
        .get(`/api/v1/dashboard/business-unit/${businessUnitId}/modules`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
