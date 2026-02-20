#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");

async function start() {
  console.log("🚀 Starting production server...");

  // Ejecutar el servidor directamente con tsx
  // Las migraciones de Prisma se ejecutarán automáticamente en el código
  const tsxPath = path.join(__dirname, "..", "node_modules", ".bin", "tsx");
  const indexPath = path.join(__dirname, "..", "src", "index.ts");

  const app = spawn(tsxPath, [indexPath], {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  app.on("exit", (code) => {
    console.log(`Process exited with code ${code}`);
    process.exit(code || 0);
  });

  app.on("error", (error) => {
    console.error("❌ Error starting application:", error);
    process.exit(1);
  });
}

start();
