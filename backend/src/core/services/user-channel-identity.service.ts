import { PrismaClient, ChannelType } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Servicio para gestionar identidades de usuarios en canales externos
 * Permite vincular usuarios del sistema con sus IDs en canales como WhatsApp, etc.
 */
class UserChannelIdentityService {
  /**
   * Vincula un usuario con su identidad en un canal externo
   * @param userId - ID del usuario en el sistema
   * @param businessUnitId - ID de la unidad de negocio
   * @param channel - Tipo de canal (WHATSAPP, MOBILE, etc.)
   * @param externalId - ID del usuario en el canal externo (ej: número de teléfono)
   * @param metadata - Metadata adicional (nombre del contacto, avatar, etc.)
   */
  async linkUser(
    userId: string,
    businessUnitId: string,
    channel: ChannelType,
    externalId: string,
    metadata?: Record<string, any>,
  ) {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }

    // Verificar que la unidad de negocio existe
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId },
    });

    if (!businessUnit) {
      throw new Error(`Unidad de negocio ${businessUnitId} no encontrada`);
    }

    // Verificar si ya existe una identidad para este canal
    const existing = await prisma.userChannelIdentity.findFirst({
      where: {
        userId,
        businessUnitId,
        channel,
      },
    });

    if (existing) {
      // Actualizar la identidad existente
      return prisma.userChannelIdentity.update({
        where: { id: existing.id },
        data: {
          externalId,
          metadata: (metadata as any) || existing.metadata,
          verified: false, // Requiere re-verificación si cambia el externalId
          verifiedAt:
            existing.externalId === externalId ? existing.verifiedAt : null,
        },
      });
    }

    // Crear nueva identidad
    return prisma.userChannelIdentity.create({
      data: {
        userId,
        businessUnitId,
        channel,
        externalId,
        metadata: metadata || {},
        verified: false,
      },
    });
  }

  /**
   * Desvincula un usuario de un canal externo
   */
  async unlinkUser(
    userId: string,
    businessUnitId: string,
    channel: ChannelType,
  ) {
    const identity = await prisma.userChannelIdentity.findFirst({
      where: {
        userId,
        businessUnitId,
        channel,
      },
    });

    if (!identity) {
      throw new Error(
        `No se encontró identidad para el usuario en el canal ${channel}`,
      );
    }

    return prisma.userChannelIdentity.delete({
      where: { id: identity.id },
    });
  }

  /**
   * Marca una identidad como verificada
   */
  async verifyIdentity(
    userId: string,
    businessUnitId: string,
    channel: ChannelType,
  ) {
    const identity = await prisma.userChannelIdentity.findFirst({
      where: {
        userId,
        businessUnitId,
        channel,
      },
    });

    if (!identity) {
      throw new Error(
        `No se encontró identidad para el usuario en el canal ${channel}`,
      );
    }

    return prisma.userChannelIdentity.update({
      where: { id: identity.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });
  }

  /**
   * Busca un usuario por su ID externo en un canal específico
   * Útil para resolver el usuario cuando llega un mensaje de WhatsApp, etc.
   */
  async getUserByExternalId(
    channel: ChannelType,
    externalId: string,
    businessUnitId: string,
  ) {
    const identity = await prisma.userChannelIdentity.findFirst({
      where: {
        channel,
        externalId,
        businessUnitId,
      },
      include: {
        user: {
          include: {
            businessUnits: {
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
            },
          },
        },
        businessUnit: true,
      },
    });

    return identity;
  }

  /**
   * Verifica si un usuario está vinculado a un canal
   */
  async isUserLinked(
    userId: string,
    businessUnitId: string,
    channel: ChannelType,
  ): Promise<boolean> {
    const identity = await prisma.userChannelIdentity.findFirst({
      where: {
        userId,
        businessUnitId,
        channel,
      },
    });

    return !!identity;
  }

  /**
   * Obtiene todas las identidades de un usuario
   */
  async getAllUserIdentities(userId: string) {
    return prisma.userChannelIdentity.findMany({
      where: { userId },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Actualiza la metadata de una identidad
   */
  async updateMetadata(
    userId: string,
    businessUnitId: string,
    channel: ChannelType,
    metadata: Record<string, any>,
  ) {
    const identity = await prisma.userChannelIdentity.findFirst({
      where: {
        userId,
        businessUnitId,
        channel,
      },
    });

    if (!identity) {
      throw new Error(
        `No se encontró identidad para el usuario en el canal ${channel}`,
      );
    }

    return prisma.userChannelIdentity.update({
      where: { id: identity.id },
      data: {
        metadata: {
          ...((identity.metadata as Record<string, any>) || {}),
          ...metadata,
        },
      },
    });
  }

  /**
   * Obtiene identidades no verificadas que requieren atención
   */
  async getUnverifiedIdentities(businessUnitId?: string) {
    return prisma.userChannelIdentity.findMany({
      where: {
        verified: false,
        ...(businessUnitId && { businessUnitId }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        businessUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Busca identidades por canal y BusinessUnit
   * Útil para administración y reportes
   */
  async getIdentitiesByChannel(channel: ChannelType, businessUnitId: string) {
    return prisma.userChannelIdentity.findMany({
      where: {
        channel,
        businessUnitId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

// Singleton
export const userChannelIdentityService = new UserChannelIdentityService();
