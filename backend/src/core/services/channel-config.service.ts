/**
 * Channel Configuration Service
 * Servicio para gestionar la configuración de canales por Business Unit
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type ChannelType = "WHATSAPP" | "WEB" | "MOBILE" | "API";

export interface ChannelConfig {
  businessUnitId: string;
  channel: ChannelType;
  enabled: boolean;
  allowedIntents: string[];
  config?: Record<string, any>;
}

export class ChannelConfigService {
  /**
   * Obtiene la configuración de un canal para una BU
   */
  async getChannelConfig(
    businessUnitId: string,
    channel: ChannelType,
  ): Promise<ChannelConfig | null> {
    const config = await prisma.businessUnitChannelConfig.findUnique({
      where: {
        businessUnitId_channel: {
          businessUnitId,
          channel,
        },
      },
    });

    if (!config) {
      return null;
    }

    return {
      businessUnitId: config.businessUnitId,
      channel: config.channel as ChannelType,
      enabled: config.enabled,
      allowedIntents: config.allowedIntents as string[],
      config: config.config as Record<string, any>,
    };
  }

  /**
   * Obtiene todas las configuraciones de canales de una BU
   */
  async getAllChannelConfigs(businessUnitId: string): Promise<ChannelConfig[]> {
    const configs = await prisma.businessUnitChannelConfig.findMany({
      where: { businessUnitId },
    });

    return configs.map((config) => ({
      businessUnitId: config.businessUnitId,
      channel: config.channel as ChannelType,
      enabled: config.enabled,
      allowedIntents: config.allowedIntents as string[],
      config: config.config as Record<string, any>,
    }));
  }

  /**
   * Crea o actualiza la configuración de un canal
   */
  async upsertChannelConfig(
    businessUnitId: string,
    channel: ChannelType,
    data: {
      enabled?: boolean;
      allowedIntents?: string[];
      config?: Record<string, any>;
    },
  ): Promise<ChannelConfig> {
    const config = await prisma.businessUnitChannelConfig.upsert({
      where: {
        businessUnitId_channel: {
          businessUnitId,
          channel,
        },
      },
      create: {
        businessUnitId,
        channel,
        enabled: data.enabled ?? true,
        allowedIntents: data.allowedIntents || [],
        config: data.config || {},
      },
      update: {
        enabled: data.enabled,
        allowedIntents: data.allowedIntents,
        config: data.config,
      },
    });

    return {
      businessUnitId: config.businessUnitId,
      channel: config.channel as ChannelType,
      enabled: config.enabled,
      allowedIntents: config.allowedIntents as string[],
      config: config.config as Record<string, any>,
    };
  }

  /**
   * Habilita o deshabilita un canal
   */
  async toggleChannel(
    businessUnitId: string,
    channel: ChannelType,
    enabled: boolean,
  ): Promise<void> {
    await prisma.businessUnitChannelConfig.update({
      where: {
        businessUnitId_channel: {
          businessUnitId,
          channel,
        },
      },
      data: { enabled },
    });
  }

  /**
   * Verifica si un canal está habilitado
   */
  async isChannelEnabled(
    businessUnitId: string,
    channel: ChannelType,
  ): Promise<boolean> {
    const config = await this.getChannelConfig(businessUnitId, channel);
    return config?.enabled ?? false;
  }

  /**
   * Verifica si una intención está permitida en un canal
   */
  async isIntentAllowed(
    businessUnitId: string,
    channel: ChannelType,
    intent: string,
  ): Promise<boolean> {
    const config = await this.getChannelConfig(businessUnitId, channel);

    if (!config || !config.enabled) {
      return false;
    }

    // Si allowedIntents contiene "*", todas las intenciones están permitidas
    if (config.allowedIntents.includes("*")) {
      return true;
    }

    return config.allowedIntents.includes(intent);
  }

  /**
   * Agrega una intención a la lista de permitidas
   */
  async addAllowedIntent(
    businessUnitId: string,
    channel: ChannelType,
    intent: string,
  ): Promise<void> {
    const config = await this.getChannelConfig(businessUnitId, channel);

    if (!config) {
      await this.upsertChannelConfig(businessUnitId, channel, {
        allowedIntents: [intent],
      });
      return;
    }

    if (config.allowedIntents.includes(intent)) {
      return; // Ya existe
    }

    const newIntents = [...config.allowedIntents, intent];

    await prisma.businessUnitChannelConfig.update({
      where: {
        businessUnitId_channel: {
          businessUnitId,
          channel,
        },
      },
      data: {
        allowedIntents: newIntents,
      },
    });
  }

  /**
   * Remueve una intención de la lista de permitidas
   */
  async removeAllowedIntent(
    businessUnitId: string,
    channel: ChannelType,
    intent: string,
  ): Promise<void> {
    const config = await this.getChannelConfig(businessUnitId, channel);

    if (!config) {
      return;
    }

    const newIntents = config.allowedIntents.filter((i) => i !== intent);

    await prisma.businessUnitChannelConfig.update({
      where: {
        businessUnitId_channel: {
          businessUnitId,
          channel,
        },
      },
      data: {
        allowedIntents: newIntents,
      },
    });
  }

  /**
   * Elimina la configuración de un canal
   */
  async deleteChannelConfig(
    businessUnitId: string,
    channel: ChannelType,
  ): Promise<void> {
    await prisma.businessUnitChannelConfig.delete({
      where: {
        businessUnitId_channel: {
          businessUnitId,
          channel,
        },
      },
    });
  }
}

export const channelConfigService = new ChannelConfigService();
