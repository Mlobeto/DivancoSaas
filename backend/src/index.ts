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

    // Iniciar servidor ANTES de migraciones para que Azure vea health check
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    });

    // Verificar conexión a la base de datos
    console.log("🔄 Connecting to database...");
    await prisma.$connect();
    console.log("✅ Database connected");
    serverState.dbConnected = true;

    // Ejecutar migraciones en producción (después de que el servidor esté escuchando)
    // TEMPORAL: Deshabilitado para evitar timeout en Azure
    // Ejecutar manualmente: DATABASE_URL="..." npx prisma migrate deploy
    if (config.nodeEnv === "production" && process.env.AUTO_MIGRATE === "true") {
      await runMigrations();
    } else {
      console.log("⏭️  Auto-migrations disabled, skipping...");
      serverState.migrationsComplete = true; // En dev, no hay migraciones automáticas
    }

    serverState.isReady = true;
    console.log("✅ Server fully initialized and ready");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    serverState.error =
      error instanceof Error ? error.message : "Unknown error";
    process.exit(1);
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
