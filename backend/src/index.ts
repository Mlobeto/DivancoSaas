import { createApp } from "./app";
import { config } from "@config/index";
import prisma from "@config/database";
import { execSync } from "child_process";

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env,
      cwd: process.cwd(),
    });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

async function main() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log("✅ Database connected");

    // Ejecutar migraciones en producción
    if (config.nodeEnv === "production") {
      await runMigrations();
    }

    // Crear y arrancar servidor
    const app = createApp();

    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
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
