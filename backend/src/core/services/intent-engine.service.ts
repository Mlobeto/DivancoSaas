/**
 * Intent Engine Service
 * Motor central del sistema que procesa todas las intenciones
 * desde cualquier canal (WhatsApp, Web, Mobile, API)
 */

import { PrismaClient } from "@prisma/client";
import {
  NormalizedEvent,
  IntentResult,
  IntentContext,
  IntentAction,
} from "../types/events";
import { channelConfigService } from "./channel-config.service";

const prisma = new PrismaClient();

export class IntentEngineService {
  /**
   * Procesa un evento normalizado
   * Este es el punto de entrada único para todas las intenciones
   */
  async process(event: NormalizedEvent): Promise<IntentResult> {
    try {
      console.log(
        `[IntentEngine] Processing intent: ${event.intent} from ${event.channel}`,
      );

      // 1. Validar el evento completo
      const isValid = await this.validateEvent(event);
      if (!isValid) {
        return {
          success: false,
          error: {
            code: "INVALID_EVENT",
            message: "Event validation failed",
          },
        };
      }

      // 2. Obtener configuración de la intención para esta BU
      const intentAction = await this.getIntentAction(
        event.businessUnit,
        event.intent,
        event.channel,
      );

      if (!intentAction) {
        return {
          success: false,
          error: {
            code: "INTENT_NOT_CONFIGURED",
            message: `Intent ${event.intent} is not configured for this Business Unit`,
          },
        };
      }

      // 3. Validar permisos del usuario
      const context = await this.buildContext(event);
      const hasPermission = await this.checkPermission(
        context,
        intentAction.requiredPermission,
      );

      if (!hasPermission) {
        return {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "User does not have permission to perform this action",
          },
        };
      }

      // 4. Ejecutar la acción
      const result = await this.executeAction(
        intentAction,
        event.payload,
        context,
      );

      // 5. Registrar auditoría
      await this.auditIntent(event, result);

      return result;
    } catch (error: any) {
      console.error("[IntentEngine] Error processing intent:", error);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * Valida que el evento sea válido
   */
  private async validateEvent(event: NormalizedEvent): Promise<boolean> {
    // Validar tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: event.tenant },
    });

    if (!tenant || tenant.status !== "ACTIVE") {
      console.warn(
        `[IntentEngine] Invalid tenant: ${event.tenant} or tenant not active`,
      );
      return false;
    }

    // Validar BusinessUnit
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: event.businessUnit },
    });

    if (!businessUnit || businessUnit.tenantId !== event.tenant) {
      console.warn(
        `[IntentEngine] Invalid business unit: ${event.businessUnit}`,
      );
      return false;
    }

    // Validar usuario
    const user = await prisma.user.findUnique({
      where: { id: event.user },
    });

    if (!user || user.tenantId !== event.tenant || user.status !== "ACTIVE") {
      console.warn(`[IntentEngine] Invalid user: ${event.user}`);
      return false;
    }

    // Validar canal habilitado
    const channelEnabled = await channelConfigService.isChannelEnabled(
      event.businessUnit,
      event.channel.toUpperCase() as any,
    );

    if (!channelEnabled) {
      console.warn(
        `[IntentEngine] Channel ${event.channel} is not enabled for BU: ${event.businessUnit}`,
      );
      return false;
    }

    // Validar intención permitida en este canal
    const intentAllowed = await channelConfigService.isIntentAllowed(
      event.businessUnit,
      event.channel.toUpperCase() as any,
      event.intent,
    );

    if (!intentAllowed) {
      console.warn(
        `[IntentEngine] Intent ${event.intent} is not allowed from channel ${event.channel}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Obtiene la configuración de la intención para una BU
   */
  private async getIntentAction(
    businessUnitId: string,
    intent: string,
    channel: string,
  ): Promise<IntentAction | null> {
    // TODO: Implementar cuando exista BusinessUnitIntent en Prisma
    // Por ahora, retornar configuración por defecto basada en el intent

    // Mapeo temporal de intenciones a acciones
    const intentMap: Record<string, IntentAction> = {
      UPLOAD_IMAGE: {
        module: "storage",
        action: "uploadFile",
        requiredPermission: "files.upload",
      },
      PROJECT_UPDATE: {
        module: "projects",
        action: "updateStatus",
        requiredPermission: "projects.update",
      },
      SEND_MESSAGE: {
        module: "communications",
        action: "sendMessage",
        requiredPermission: "messages.send",
      },
      CREATE_INVOICE: {
        module: "billing",
        action: "createInvoice",
        requiredPermission: "invoices.create",
      },
    };

    return intentMap[intent] || null;
  }

  /**
   * Construye el contexto de ejecución
   */
  private async buildContext(event: NormalizedEvent): Promise<IntentContext> {
    // Obtener permisos del usuario en esta BU
    const userBU = await prisma.userBusinessUnit.findFirst({
      where: {
        userId: event.user,
        businessUnitId: event.businessUnit,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions =
      userBU?.role.permissions.map(
        (rp) => `${rp.permission.resource}.${rp.permission.action}`,
      ) || [];

    return {
      tenant: event.tenant,
      businessUnit: event.businessUnit,
      user: event.user,
      channel: event.channel,
      permissions,
    };
  }

  /**
   * Verifica si el usuario tiene el permiso necesario
   */
  private async checkPermission(
    context: IntentContext,
    requiredPermission?: string,
  ): Promise<boolean> {
    if (!requiredPermission) {
      return true; // No se requiere permiso específico
    }

    // Verificar si el usuario tiene el permiso
    return context.permissions.includes(requiredPermission);
  }

  /**
   * Ejecuta la acción asociada a la intención
   */
  private async executeAction(
    intentAction: IntentAction,
    payload: any,
    context: IntentContext,
  ): Promise<IntentResult> {
    // TODO: Aquí es donde se llamaría al módulo correspondiente
    // Por ahora, simular ejecución exitosa

    console.log(
      `[IntentEngine] Executing action: ${intentAction.module}.${intentAction.action}`,
    );
    console.log(`[IntentEngine] Payload:`, payload);
    console.log(`[IntentEngine] Context:`, context);

    // En el futuro, esto sería algo como:
    // const module = await moduleRegistry.getModule(intentAction.module);
    // return await module[intentAction.action](payload, context);

    return {
      success: true,
      data: {
        module: intentAction.module,
        action: intentAction.action,
        message: "Action executed successfully (simulated)",
      },
    };
  }

  /**
   * Registra la auditoría de la intención procesada
   */
  private async auditIntent(
    event: NormalizedEvent,
    result: IntentResult,
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: event.tenant,
          userId: event.user,
          entity: result.audit?.entity || "intent",
          entityId: result.audit?.entityId,
          action: event.intent,
          oldData: result.audit?.oldData,
          newData: result.audit?.newData,
          metadata: {
            channel: event.channel,
            intent: event.intent,
            success: result.success,
            ...event.metadata,
          },
          ipAddress: event.metadata.ipAddress,
          userAgent: event.metadata.userAgent,
        },
      });

      console.log(
        `[IntentEngine] Audit log created for intent: ${event.intent}`,
      );
    } catch (error) {
      console.error("[IntentEngine] Error creating audit log:", error);
      // No fallar el proceso si la auditoría falla
    }
  }

  /**
   * Obtiene estadísticas de procesamiento de intenciones
   */
  async getStats(
    businessUnitId: string,
    options?: {
      from?: Date;
      to?: Date;
      channel?: string;
      intent?: string;
    },
  ): Promise<any> {
    const where: any = {
      entity: "intent",
    };

    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options.from) where.createdAt.gte = options.from;
      if (options.to) where.createdAt.lte = options.to;
    }

    if (options?.channel) {
      where.metadata = {
        path: ["channel"],
        equals: options.channel,
      };
    }

    if (options?.intent) {
      where.action = options.intent;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      select: {
        action: true,
        metadata: true,
        createdAt: true,
      },
    });

    // Agrupar por intención
    const stats = logs.reduce(
      (acc, log) => {
        const intent = log.action;
        if (!acc[intent]) {
          acc[intent] = {
            total: 0,
            success: 0,
            failed: 0,
            byChannel: {},
          };
        }

        acc[intent].total++;
        const metadata = log.metadata as any;
        if (metadata?.success) {
          acc[intent].success++;
        } else {
          acc[intent].failed++;
        }

        const channel = metadata?.channel || "unknown";
        acc[intent].byChannel[channel] =
          (acc[intent].byChannel[channel] || 0) + 1;

        return acc;
      },
      {} as Record<string, any>,
    );

    return stats;
  }
}

export const intentEngine = new IntentEngineService();
