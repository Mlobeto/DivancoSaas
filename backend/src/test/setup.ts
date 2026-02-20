// Setup environment variables for testing BEFORE any imports
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test_db";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
process.env.PORT = process.env.PORT || "3000";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Mock sharp module for testing (native dependencies not needed in tests)
jest.mock("sharp", () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("mock-image")),
    toFile: jest.fn().mockResolvedValue({}),
  }));
});

import { prisma } from "@config/database";

// Setup before all tests
beforeAll(async () => {
  // Ensure test database is using TEST_DATABASE_URL
  if (process.env.NODE_ENV !== "test") {
    console.warn("⚠️  Tests should run with NODE_ENV=test");
  }
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Set test timeout
jest.setTimeout(30000);
