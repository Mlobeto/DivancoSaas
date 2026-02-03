/**
 * Servicio de cola de eventos
 * Maneja el encolado y procesamiento de eventos offline (principalmente mobile)
 */

import { EventStatus, ChannelType } from "@prisma/client";
import { intentEngine } from "./intent-engine.service";
import { NormalizedEvent } from "../types/events";
import { prisma } from "@config/database";
import { buildPaginationMeta, toSkipTake } from "@core/utils/pagination";

class EventQueueService {
  async listEvents(
    tenantId: string,
    options: {
      businessUnitId?: string;
      status?: EventStatus;
      channel?: ChannelType;
      intent?: string;
      search?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 50;
    const { skip, take } = toSkipTake({ page, limit });

    const where: any = { tenantId };

    if (options.businessUnitId) where.businessUnitId = options.businessUnitId;
    if (options.status) where.status = options.status;
    if (options.channel) where.channel = options.channel;
    if (options.intent) {
      where.intent = { contains: options.intent, mode: "insensitive" };
    }

    if (options.from || options.to) {
      where.createdAt = {
        ...(options.from ? { gte: options.from } : {}),
        ...(options.to ? { lte: options.to } : {}),
      };
    }

    if (options.search) {
      const q = options.search.trim();
      if (q.length > 0) {
        where.OR = [
          { intent: { contains: q, mode: "insensitive" } },
          { userId: { contains: q, mode: "insensitive" } },
          { businessUnitId: { contains: q, mode: "insensitive" } },
        ];
      }
    }

    const [events, total] = await Promise.all([
      prisma.eventQueue.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          businessUnit: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.eventQueue.count({ where }),
    ]);

    return {
      data: events,
      pagination: buildPaginationMeta({ page, limit }, total),
    };
  }

  /**
   * Encola un evento para procesamiento asíncrono
   * Usado principalmente para eventos offline de mobile
   */
  async enqueue(
    tenantId: string,
    businessUnitId: string,
    userId: string,
    channel: ChannelType,
    intent: string,
    payload: Record<string, any>,
    metadata?: Record<string, any>,
  ) {
    const event = await prisma.eventQueue.create({
      data: {
        tenantId,
        businessUnitId,
        userId,
        channel,
        intent,
        payload,
        metadata: metadata || {},
        status: "PENDING",
        attempts: 0,
      },
    });

    console.log(
      `[EventQueue] Evento encolado: ${event.id} (intent: ${intent})`,
    );

    return event;
  }

  /**
   * Desencola y procesa eventos pendientes
   * @param limit - Número máximo de eventos a procesar
   */
  async dequeue(limit: number = 10) {
    // Obtener eventos pendientes ordenados por timestamp
    const events = await prisma.eventQueue.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
      include: {
        tenant: true,
        businessUnit: true,
        user: true,
      },
    });

    console.log(`[EventQueue] Procesando ${events.length} eventos pendientes`);

    const results = [];

    for (const event of events) {
      try {
        // Marcar como en procesamiento
        await prisma.eventQueue.update({
          where: { id: event.id },
          data: {
            status: "PROCESSING",
            processedAt: new Date(),
            attempts: event.attempts + 1,
          },
        });

        // Construir evento normalizado
        const normalizedEvent: NormalizedEvent = {
          tenant: event.tenantId,
          businessUnit: event.businessUnitId,
          user: event.userId,
          channel: event.channel,
          intent: event.intent,
          payload: event.payload as Record<string, any>,
          metadata: {
            ...((event.metadata as Record<string, any>) || {}),
            timestamp: event.createdAt,
            queuedEventId: event.id,
          },
        };

        // Procesar con el Intent Engine
        const result = await intentEngine.process(normalizedEvent);

        if (result.success) {
          // Marcar como completado
          await prisma.eventQueue.update({
            where: { id: event.id },
            data: {
              status: "COMPLETED",
              result: result.data as any,
            },
          });

          console.log(`[EventQueue] Evento ${event.id} procesado exitosamente`);

          results.push({ eventId: event.id, success: true, data: result.data });
        } else {
          // Manejar error
          await this.handleError(
            event.id,
            result.error?.message || "Unknown error",
          );

          results.push({
            eventId: event.id,
            success: false,
            error: result.error,
          });
        }
      } catch (error: any) {
        console.error(
          `[EventQueue] Error procesando evento ${event.id}:`,
          error,
        );

        // Manejar error
        await this.handleError(event.id, error.message);

        results.push({
          eventId: event.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Maneja errores en el procesamiento
   * Implementa estrategia de reintentos
   */
  private async handleError(eventId: string, errorMessage: string) {
    const event = await prisma.eventQueue.findUnique({
      where: { id: eventId },
    });

    if (!event) return;

    const maxAttempts = 3;

    if (event.attempts >= maxAttempts) {
      // Marcar como fallido
      await prisma.eventQueue.update({
        where: { id: eventId },
        data: {
          status: "FAILED",
          lastError: errorMessage,
        },
      });

      console.log(
        `[EventQueue] Evento ${eventId} marcado como FAILED después de ${event.attempts} intentos`,
      );
    } else {
      // Volver a estado pendiente para reintento
      await prisma.eventQueue.update({
        where: { id: eventId },
        data: {
          status: "PENDING",
          lastError: errorMessage,
        },
      });

      console.log(
        `[EventQueue] Evento ${eventId} reprogramado para reintento (intento ${event.attempts + 1}/${maxAttempts})`,
      );
    }
  }

  /**
   * Procesa todos los eventos pendientes
   * Útil para jobs programados
   */
  async processQueue() {
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      const results = await this.dequeue(50);
      totalProcessed += results.length;

      if (results.length === 0) {
        hasMore = false;
      }

      // Pequeña pausa entre lotes
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `[EventQueue] Procesamiento completo. Total: ${totalProcessed} eventos`,
    );

    return {
      processed: totalProcessed,
    };
  }

  /**
   * Reintenta eventos fallidos
   */
  async retryFailed(limit: number = 10) {
    const failedEvents = await prisma.eventQueue.findMany({
      where: {
        status: "FAILED",
      },
      take: limit,
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(
      `[EventQueue] Reintentando ${failedEvents.length} eventos fallidos`,
    );

    for (const event of failedEvents) {
      await prisma.eventQueue.update({
        where: { id: event.id },
        data: {
          status: "PENDING",
          attempts: 0, // Reset intentos
          lastError: null,
        },
      });
    }

    return {
      retried: failedEvents.length,
    };
  }

  /**
   * Cancela un evento encolado
   */
  async cancel(eventId: string) {
    const event = await prisma.eventQueue.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Evento ${eventId} no encontrado`);
    }

    if (event.status === "COMPLETED") {
      throw new Error(`Evento ${eventId} ya fue completado`);
    }

    await prisma.eventQueue.update({
      where: { id: eventId },
      data: {
        status: "CANCELLED",
      },
    });

    console.log(`[EventQueue] Evento ${eventId} cancelado`);

    return event;
  }

  /**
   * Obtiene el estado de un evento
   */
  async getEventStatus(eventId: string) {
    const event = await prisma.eventQueue.findUnique({
      where: { id: eventId },
      include: {
        tenant: {
          select: { name: true },
        },
        businessUnit: {
          select: { name: true },
        },
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!event) {
      throw new Error(`Evento ${eventId} no encontrado`);
    }

    return event;
  }

  /**
   * Obtiene estadísticas de la cola
   */
  async getStats(businessUnitId?: string) {
    const where = businessUnitId ? { businessUnitId } : {};

    const [pending, processing, completed, failed, cancelled] =
      await Promise.all([
        prisma.eventQueue.count({ where: { ...where, status: "PENDING" } }),
        prisma.eventQueue.count({ where: { ...where, status: "PROCESSING" } }),
        prisma.eventQueue.count({ where: { ...where, status: "COMPLETED" } }),
        prisma.eventQueue.count({ where: { ...where, status: "FAILED" } }),
        prisma.eventQueue.count({ where: { ...where, status: "CANCELLED" } }),
      ]);

    return {
      pending,
      processing,
      completed,
      failed,
      cancelled,
      total: pending + processing + completed + failed + cancelled,
    };
  }

  /**
   * Limpia eventos antiguos completados
   * @param daysOld - Eventos más antiguos que estos días
   */
  async cleanOldEvents(daysOld: number = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const deleted = await prisma.eventQueue.deleteMany({
      where: {
        status: "COMPLETED",
        processedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[EventQueue] Eliminados ${deleted.count} eventos antiguos`);

    return {
      deleted: deleted.count,
    };
  }
}

// Singleton
export const eventQueueService = new EventQueueService();
