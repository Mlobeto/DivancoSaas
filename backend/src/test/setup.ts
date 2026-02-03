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
