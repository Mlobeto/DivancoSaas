import { createServer } from "http";
import { createApp } from "./app";
import { config } from "@config/index";
import prisma from "@config/database";
import { exec } from "child_process";
import { initializeSocketServer } from "./bootstrap/socket.bootstrap";

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
    await new Promise<void>((resolve, reject) => {
      exec(
        "npx prisma migrate deploy",
        { env: process.env, cwd: process.cwd() },
        (error, stdout, stderr) => {
          if (stdout) process.stdout.write(stdout);
          if (stderr) process.stderr.write(stderr);
          if (error) reject(error);
          else resolve();
        },
      );
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
    const startTime = Date.now();
    console.log(`[Startup] Starting at ${new Date().toISOString()}`);
    console.log(`[Startup] PORT=${config.port}, NODE_ENV=${config.nodeEnv}`);

    // Crear app PRIMERO para que health check responda inmediatamente
    console.log(`[Startup] Creating Express app...`);
    const app = createApp();
    console.log(`[Startup] App created in ${Date.now() - startTime}ms`);

    // Iniciar servidor ANTES de cualquier operación lenta
    const server = createServer(app);
    initializeSocketServer(server);
    server.listen(config.port, () => {
      console.log(
        `🚀 Server running on port ${config.port} (took ${Date.now() - startTime}ms)`,
      );
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

    // Timeout de 15 segundos para conexión DB
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("DB connection timeout (15s)")),
          15000,
        ),
      ),
    ]);

    console.log("✅ Database connected");
    serverState.dbConnected = true;

    // Ejecutar migraciones en producción
    if (config.nodeEnv === "production") {
      await runMigrations();
    } else {
      console.log("⏭️  Skipping migrations (not production)");
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
