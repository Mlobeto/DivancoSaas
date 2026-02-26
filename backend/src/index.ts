import { createApp } from "./app";
import { config } from "@config/index";
import prisma from "@config/database";
import { execSync } from "child_process";

// Estado del servidor para health checks
export const serverState = {
  isReady: false,
  dbConnected: false,
  migrationsComplete: false,
  error: null as string | null,
};

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env,
      cwd: process.cwd(),
    });
    console.log("✅ Migrations completed successfully");
    serverState.migrationsComplete = true;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    serverState.error =
      error instanceof Error ? error.message : "Migration failed";
    throw error;
  }
}

async function main() {
  try {
    // Crear app PRIMERO para que health check responda inmediatamente
    const app = createApp();

    // Iniciar servidor ANTES de cualquier operación lenta
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      serverState.isReady = true; // Servidor listo INMEDIATAMENTE
    });

    // Conectar a DB en background (no bloquea health checks)
    connectDatabase();
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    serverState.error =
      error instanceof Error ? error.message : "Unknown error";
    process.exit(1);
  }
}

async function connectDatabase() {
  try {
    console.log("🔄 Connecting to database...");

    // Timeout de 10 segundos para conexión DB
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("DB connection timeout (10s)")),
          10000,
        ),
      ),
    ]);

    console.log("✅ Database connected");
    serverState.dbConnected = true;

    // Migraciones (si están habilitadas)
    if (
      config.nodeEnv === "production" &&
      process.env.AUTO_MIGRATE === "true"
    ) {
      await runMigrations();
    } else {
      console.log("⏭️  Auto-migrations disabled, skipping...");
      serverState.migrationsComplete = true;
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    serverState.error =
      error instanceof Error ? error.message : "DB connection failed";
    // NO hacemos process.exit() - dejamos que el servidor siga corriendo
    // El health check reportará el error de DB

    // Reintentar conexión después de 5 segundos
    console.log("🔄 Will retry DB connection in 5 seconds...");
    setTimeout(() => connectDatabase(), 5000);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

main();
