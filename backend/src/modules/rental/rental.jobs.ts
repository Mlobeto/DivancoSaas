/**
 * RENTAL CRON JOBS
 * Configuración de tareas programadas para el módulo de rentas
 */

import cron from "node-cron";
import { autoChargeService } from "./services/auto-charge.service";

export function initializeRentalJobs() {
  console.log("[RentalJobs] Inicializando tareas programadas...");

  /**
   * JOB 1: Cargo automático diario de herramientas
   * Cron: Todos los días a las 00:01 (1 minuto después de medianoche)
   * Expresión: "1 0 * * *" (minuto 1, hora 0, todos los días)
   */
  cron.schedule("1 0 * * *", async () => {
    console.log("\n=== CRON: Cargo automático de herramientas ===");
    try {
      const result = await autoChargeService.processToolCharges();
      console.log("[RentalJobs] ✓ Cargo automático completado:", result);
    } catch (error) {
      console.error("[RentalJobs] ✗ Error en cargo automático:", error);
    }
  });

  /**
   * JOB 2: Notificación de reportes pendientes
   * Cron: Todos los días a las 20:00 (8 PM)
   * Expresión: "0 20 * * *" (minuto 0, hora 20, todos los días)
   */
  cron.schedule("0 20 * * *", async () => {
    console.log("\n=== CRON: Notificación de reportes pendientes ===");
    try {
      const result = await autoChargeService.notifyMissingReports();
      console.log("[RentalJobs] ✓ Notificaciones enviadas:", result);
    } catch (error) {
      console.error(
        "[RentalJobs] ✗ Error en notificaciones de reportes:",
        error,
      );
    }
  });

  /**
   * JOB 3: Envío de estados de cuenta programados
   * Cron: Todos los días a las 08:00 (8 AM)
   * Expresión: "0 8 * * *" (minuto 0, hora 8, todos los días)
   */
  cron.schedule("0 8 * * *", async () => {
    console.log("\n=== CRON: Envío de estados de cuenta ===");
    try {
      const result = await autoChargeService.sendScheduledStatements();
      console.log("[RentalJobs] ✓ Estados de cuenta enviados:", result);
    } catch (error) {
      console.error(
        "[RentalJobs] ✗ Error en envío de estados de cuenta:",
        error,
      );
    }
  });

  /**
   * JOB 4: Alertas de saldo bajo
   * Cron: Cada hora
   * Expresión: "0 * * * *" (minuto 0, todas las horas)
   */
  cron.schedule("0 * * * *", async () => {
    console.log("\n=== CRON: Verificación de saldo bajo ===");
    try {
      const result = await autoChargeService.checkLowBalanceAlerts();
      console.log("[RentalJobs] ✓ Alertas procesadas:", result);
    } catch (error) {
      console.error("[RentalJobs] ✗ Error en alertas de saldo:", error);
    }
  });

  console.log("[RentalJobs] ✓ 4 tareas programadas activas");
  console.log("  - 00:01 → Cargo automático herramientas");
  console.log("  - 08:00 → Estados de cuenta");
  console.log("  - 20:00 → Notificación reportes pendientes");
  console.log("  - Cada hora → Alertas saldo bajo");
}

/**
 * Para testing: Ejecutar jobs manualmente
 */
export const manualJobs = {
  processToolCharges: () => autoChargeService.processToolCharges(),
  notifyMissingReports: () => autoChargeService.notifyMissingReports(),
  sendScheduledStatements: () => autoChargeService.sendScheduledStatements(),
  checkLowBalanceAlerts: () => autoChargeService.checkLowBalanceAlerts(),
};
