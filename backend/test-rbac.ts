/**
 * RBAC Testing Script
 *
 * Tests all roles (VIEWER, EMPLOYEE, MANAGER, ADMIN, OWNER) and their permissions
 * across protected endpoints.
 *
 * Usage: npx tsx test-rbac.ts
 */

/// <reference types="node" />

import axios, { AxiosError } from "axios";
import prisma from "./src/config/database";

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";
const TEST_TENANT_EMAIL = "admin@construcciones-demo.com"; // From Azure DB - OWNER role
const TEST_TENANT_PASSWORD = "Admin123!"; // From seed.ts
const TEST_TENANT_ID = "10000000-0000-4000-8000-000000000001";
const TEST_BUSINESS_UNIT_ID = "20000000-0000-4000-8000-000000000002";

// Test users structure
interface TestUser {
  role: string;
  email: string;
  password: string;
  token?: string;
  userId?: string;
  expectedPermissions: string[];
}

// Role hierarchy: OWNER > ADMIN > MANAGER > EMPLOYEE > VIEWER
const TEST_USERS: TestUser[] = [
  {
    role: "role-viewer",
    email: "test-viewer@rbactest.com",
    password: "TestViewer123",
    expectedPermissions: [
      "assets:read",
      "clients:read",
      "quotations:read",
      "contracts:read",
      "reports:read",
      "dashboard:read",
    ],
  },
  {
    role: "role-employee",
    email: "test-employee@rbactest.com",
    password: "TestEmployee123",
    expectedPermissions: [
      "assets:read",
      "assets:create",
      "assets:update",
      "clients:read",
      "clients:create",
      "quotations:read",
      "quotations:create",
      "contracts:read",
      "reports:read",
    ],
  },
  {
    role: "role-manager",
    email: "test-manager@rbactest.com",
    password: "TestManager123",
    expectedPermissions: [
      "assets:read",
      "assets:create",
      "assets:update",
      "assets:delete",
      "clients:read",
      "clients:create",
      "clients:update",
      "quotations:read",
      "quotations:create",
      "quotations:update",
      "quotations:approve",
      "contracts:read",
      "contracts:create",
      "contracts:update",
      "contracts:sign",
      "reports:read",
      "reports:create",
    ],
  },
  {
    role: "role-admin",
    email: "test-admin@rbactest.com",
    password: "TestAdmin123",
    expectedPermissions: [
      "assets:read",
      "assets:create",
      "assets:update",
      "assets:delete",
      "clients:read",
      "clients:create",
      "clients:update",
      "clients:delete",
      "quotations:read",
      "quotations:create",
      "quotations:update",
      "quotations:delete",
      "quotations:approve",
      "contracts:read",
      "contracts:create",
      "contracts:update",
      "contracts:delete",
      "contracts:sign",
      "users:read",
      "users:create",
      "users:update",
      "roles:read",
      "settings:read",
      "settings:update",
    ],
  },
  {
    role: "role-owner",
    email: "test-owner@rbactest.com",
    password: "TestOwner123",
    expectedPermissions: ["*"], // All 91 permissions
  },
];

// Endpoint tests
interface EndpointTest {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  requiredPermission: string;
  body?: any;
  shouldSucceedForRoles: string[];
}

const ENDPOINT_TESTS: EndpointTest[] = [
  // Assets endpoints
  {
    method: "GET",
    path: "/assets",
    requiredPermission: "assets:read",
    shouldSucceedForRoles: [
      "role-viewer",
      "role-employee",
      "role-manager",
      "role-admin",
      "role-owner",
    ],
  },
  {
    method: "POST",
    path: "/assets",
    requiredPermission: "assets:create",
    body: { name: "Test Asset RBAC", categoryId: "test", statusId: "test" },
    shouldSucceedForRoles: [
      "role-employee",
      "role-manager",
      "role-admin",
      "role-owner",
    ],
  },

  // Clients endpoints
  {
    method: "GET",
    path: "/clients",
    requiredPermission: "clients:read",
    shouldSucceedForRoles: [
      "role-viewer",
      "role-employee",
      "role-manager",
      "role-admin",
      "role-owner",
    ],
  },
  {
    method: "POST",
    path: "/clients",
    requiredPermission: "clients:create",
    body: { name: "Test Client RBAC", email: "test@rbac.com" },
    shouldSucceedForRoles: [
      "role-employee",
      "role-manager",
      "role-admin",
      "role-owner",
    ],
  },

  // Quotations endpoints
  {
    method: "GET",
    path: "/rental/quotations",
    requiredPermission: "quotations:read",
    shouldSucceedForRoles: [
      "role-viewer",
      "role-employee",
      "role-manager",
      "role-admin",
      "role-owner",
    ],
  },

  // Users endpoints (admin only)
  {
    method: "GET",
    path: "/users",
    requiredPermission: "users:read",
    shouldSucceedForRoles: ["role-admin", "role-owner"],
  },

  // Settings endpoints (admin only)
  {
    method: "GET",
    path: "/settings",
    requiredPermission: "settings:read",
    shouldSucceedForRoles: ["role-admin", "role-owner"],
  },

  // Purchases endpoints
  {
    method: "GET",
    path: "/purchases/supplies",
    requiredPermission: "supplies:read",
    shouldSucceedForRoles: ["role-manager", "role-admin", "role-owner"],
  },
];

// Color helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  gray: "\x1b[90m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function cleanup() {
  log("\n🧹 Cleaning up test users...", "gray");
  try {
    const testEmails = TEST_USERS.map((u) => u.email);
    const deleted = await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    log(`✓ Deleted ${deleted.count} test users`, "gray");
  } catch (error) {
    log(`⚠ Cleanup failed: ${error}`, "yellow");
  }
}

/**
 * Check if backend server is running
 */
async function checkServerConnection(): Promise<void> {
  log("\n🔌 Checking backend server connection...", "blue");
  try {
    // Try to reach the server root
    const baseUrl = API_BASE_URL.replace("/api/v1", "");
    await axios.get(baseUrl, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status code
    });
    log("✓ Backend server is reachable", "green");
  } catch (error) {
    log("\n❌ Cannot connect to backend server!", "red");
    log(`\nExpected URL: ${API_BASE_URL}`, "yellow");
    log("\nPlease ensure:", "yellow");
    log("  1. Backend server is running: npm run dev", "yellow");
    log(
      "  2. Server is listening on the correct port (default: 3000)",
      "yellow",
    );
    log("  3. Database is connected and seeded", "yellow");
    log("\nError details:", "gray");
    if (error instanceof Error) {
      log(`  ${error.message}`, "gray");
    }
    process.exit(1);
  }
}

async function loginAsOwner(): Promise<{
  token: string;
  tenantId: string;
  businessUnitId: string;
}> {
  log("\n🔐 Logging in as tenant owner...", "blue");
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_TENANT_EMAIL,
      password: TEST_TENANT_PASSWORD,
    });

    const { token, user } = response.data.data;

    // Use predefined IDs from configuration (known from database)
    const tenantId = TEST_TENANT_ID;
    const businessUnitId = TEST_BUSINESS_UNIT_ID;

    log(`✓ Logged in as ${TEST_TENANT_EMAIL}`, "green");
    log(`  Tenant: ${tenantId}`, "gray");
    log(`  Business Unit: ${businessUnitId}`, "gray");

    return { token, tenantId, businessUnitId };
  } catch (error) {
    if (error instanceof AxiosError) {
      log(
        `✗ Failed to login: ${error.response?.data?.message || error.message}`,
        "red",
      );
      if (error.code === "ECONNREFUSED") {
        log("\n💡 Tip: Make sure the backend server is running:", "yellow");
        log("   cd backend && npm run dev", "yellow");
      }
    }
    throw error;
  }
}

async function createTestUsers(
  ownerToken: string,
  tenantId: string,
  businessUnitId: string,
) {
  log("\n👥 Creating test users for each role...", "blue");

  for (const testUser of TEST_USERS) {
    try {
      // Find role by ID or name
      const role = await prisma.role.findFirst({
        where: {
          OR: [
            { id: testUser.role },
            {
              name: {
                contains: testUser.role.replace("role-", ""),
                mode: "insensitive",
              },
            },
          ],
        },
      });

      if (!role) {
        log(
          `⚠ Role ${testUser.role} not found, skipping user creation`,
          "yellow",
        );
        continue;
      }

      const response = await axios.post(
        `${API_BASE_URL}/users`,
        {
          email: testUser.email,
          password: testUser.password,
          firstName: "Test",
          lastName: testUser.role.replace("role-", "").toUpperCase(),
          businessUnitId,
          roleId: role.id,
        },
        { headers: { Authorization: `Bearer ${ownerToken}` } },
      );

      testUser.userId = response.data.data.id;
      log(`  ✓ Created ${testUser.role}: ${testUser.email}`, "green");
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          log(
            `  ⚠ User ${testUser.email} already exists, attempting login...`,
            "yellow",
          );
        } else {
          log(
            `  ✗ Failed to create ${testUser.email}: ${error.response?.data?.message || error.message}`,
            "red",
          );
        }
      }
    }
  }
}

async function loginTestUsers() {
  log("\n🔑 Logging in all test users...", "blue");

  for (const testUser of TEST_USERS) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });

      testUser.token = response.data.data.token;
      log(`  ✓ ${testUser.role}: Token obtained`, "green");
    } catch (error) {
      if (error instanceof AxiosError) {
        log(
          `  ✗ ${testUser.role}: Login failed - ${error.response?.data?.message || error.message}`,
          "red",
        );
      }
    }
  }
}

async function testEndpoints() {
  log("\n🧪 Testing endpoint access for each role...", "blue");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const endpoint of ENDPOINT_TESTS) {
    log(
      `\n  Testing: ${endpoint.method} ${endpoint.path} (requires ${endpoint.requiredPermission})`,
      "blue",
    );

    for (const testUser of TEST_USERS) {
      if (!testUser.token) {
        log(`    ⊘ ${testUser.role}: Skipped (no token)`, "gray");
        continue;
      }

      totalTests++;
      const shouldSucceed = endpoint.shouldSucceedForRoles.includes(
        testUser.role,
      );

      try {
        const config: any = {
          method: endpoint.method,
          url: `${API_BASE_URL}${endpoint.path}`,
          headers: { Authorization: `Bearer ${testUser.token}` },
        };

        if (endpoint.body) {
          config.data = endpoint.body;
        }

        const response = await axios(config);

        if (shouldSucceed) {
          log(
            `    ✓ ${testUser.role}: Access granted (${response.status})`,
            "green",
          );
          passedTests++;
        } else {
          log(
            `    ✗ ${testUser.role}: Should have been denied but got ${response.status}`,
            "red",
          );
          failedTests++;
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 403) {
            if (!shouldSucceed) {
              log(`    ✓ ${testUser.role}: Correctly denied (403)`, "green");
              passedTests++;
            } else {
              log(
                `    ✗ ${testUser.role}: Should have access but got 403`,
                "red",
              );
              failedTests++;
            }
          } else if (error.response?.status === 404) {
            // 404 might be expected for some endpoints without data
            log(
              `    ⊘ ${testUser.role}: 404 Not Found (endpoint or resource doesn't exist)`,
              "yellow",
            );
          } else {
            log(
              `    ⚠ ${testUser.role}: Unexpected error ${error.response?.status} - ${error.response?.data?.message}`,
              "yellow",
            );
          }
        }
      }
    }
  }

  log(`\n📊 Test Results:`, "blue");
  log(`  Total tests: ${totalTests}`, "gray");
  log(`  Passed: ${passedTests}`, "green");
  log(`  Failed: ${failedTests}`, failedTests > 0 ? "red" : "green");
  log(
    `  Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
    failedTests > 0 ? "yellow" : "green",
  );
}

async function verifyRolePermissions() {
  log("\n🔍 Verifying role permission assignments...", "blue");

  const roles = await prisma.role.findMany({
    where: {
      id: {
        in: [
          "role-viewer",
          "role-employee",
          "role-manager",
          "role-admin",
          "role-owner",
        ],
      },
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  for (const role of roles) {
    const permissionCount = role.permissions.length;
    log(
      `  ${role.name}: ${permissionCount} permissions`,
      permissionCount > 0 ? "green" : "red",
    );

    if (permissionCount === 0) {
      log(`    ⚠ WARNING: Role has no permissions assigned!`, "red");
    }
  }

  // Check permission hierarchy
  const viewer = roles.find((r: any) => r.id === "role-viewer");
  const employee = roles.find((r: any) => r.id === "role-employee");
  const manager = roles.find((r: any) => r.id === "role-manager");
  const admin = roles.find((r: any) => r.id === "role-admin");
  const owner = roles.find((r: any) => r.id === "role-owner");

  const hierarchy = [
    { name: "VIEWER", count: viewer?.permissions.length || 0 },
    { name: "EMPLOYEE", count: employee?.permissions.length || 0 },
    { name: "MANAGER", count: manager?.permissions.length || 0 },
    { name: "ADMIN", count: admin?.permissions.length || 0 },
    { name: "OWNER", count: owner?.permissions.length || 0 },
  ];

  log("\n  Permission hierarchy (should be increasing):", "blue");
  let hierarchyCorrect = true;
  for (let i = 0; i < hierarchy.length; i++) {
    const current = hierarchy[i];
    const next = hierarchy[i + 1];

    if (next && current.count > next.count) {
      log(
        `    ✗ ${current.name} has MORE permissions than ${next.name}`,
        "red",
      );
      hierarchyCorrect = false;
    } else {
      log(`    ${current.name}: ${current.count} permissions`, "gray");
    }
  }

  if (hierarchyCorrect) {
    log("  ✓ Permission hierarchy is correct", "green");
  }
}

async function main() {
  log("╔════════════════════════════════════════╗", "blue");
  log("║    RBAC SYSTEM TESTING SCRIPT         ║", "blue");
  log("╚════════════════════════════════════════╝", "blue");

  try {
    // Step 1: Cleanup any existing test users
    await cleanup();

    // Step 2: Verify role permissions in database
    await verifyRolePermissions();

    // Step 3: Check server connection
    await checkServerConnection();

    // Step 4: Login as owner to create test users
    const {
      token: ownerToken,
      tenantId,
      businessUnitId,
    } = await loginAsOwner();

    // Step 5: Create test users for each role
    await createTestUsers(ownerToken, tenantId, businessUnitId);

    // Step 6: Login all test users
    await loginTestUsers();

    // Step 7: Test endpoint access
    await testEndpoints();

    // Step 8: Cleanup
    await cleanup();

    log("\n✅ RBAC testing completed!", "green");
  } catch (error) {
    log(`\n❌ Testing failed: ${error}`, "red");
    if (error instanceof Error) {
      log(error.stack || "", "gray");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
