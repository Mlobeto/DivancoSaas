import { PrismaClient, ClientStatus, MovementDirection } from "@prisma/client";

interface Context {
  tenantId: string;
  businessUnitId: string;
  userId?: string;
}

interface ListClientsOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

interface ListMovementsOptions {
  clientId: string;
  page: number;
  limit: number;
}

export class ClientsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listClients(context: Context, options: ListClientsOptions) {
    const { page, limit, search, status } = options;

    const where: any = {
      tenantId: context.tenantId,
      businessUnitId: context.businessUnitId,
    };

    if (status) {
      where.status = status as ClientStatus;
    }

    if (search) {
      where.client = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.clientBusinessUnit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: true,
        },
      }),
      this.prisma.clientBusinessUnit.count({ where }),
    ]);

    // Aplanamos para devolver un objeto similar al frontend actual
    const mapped = items.map((item) => ({
      ...item.client,
      status: item.status,
      tags: item.tags,
      businessUnitId: item.businessUnitId,
    }));

    return {
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createClient(context: Context, payload: any) {
    const { contacts, taxProfile, rentalAccount, ...clientData } = payload;
    const created = await this.prisma.client.create({
      data: {
        tenantId: context.tenantId,
        name: clientData.name,
        displayName: clientData.displayName,
        type: clientData.type,
        countryCode: clientData.countryCode,
        email: clientData.email,
        phone: clientData.phone,
        contacts: contacts
          ? {
              create: contacts,
            }
          : undefined,
        taxProfiles: taxProfile
          ? {
              create: taxProfile,
            }
          : undefined,
        businessUnits: {
          create: {
            tenantId: context.tenantId,
            businessUnitId: context.businessUnitId,
            status: clientData.status ?? ClientStatus.ACTIVE,
            tags: clientData.tags ?? [],
          },
        },
      },
      include: {
        contacts: true,
        taxProfiles: true,
      },
    });

    // Si se proporciona información de rentalAccount, crear ClientAccount
    if (rentalAccount) {
      // Obtener currency de BusinessUnit
      const bu = await this.prisma.businessUnit.findUnique({
        where: { id: context.businessUnitId },
        select: { currency: true },
      });
      const currency = bu?.currency || "USD";

      await this.prisma.clientAccount.create({
        data: {
          tenantId: context.tenantId,
          clientId: created.id,
          balance: rentalAccount.initialBalance || 0,
          totalConsumed: 0,
          totalReloaded: rentalAccount.initialBalance || 0,
          creditLimit: rentalAccount.creditLimit || 0,
          timeLimit: rentalAccount.timeLimit || 30,
          activeDays: 0,
          alertAmount: rentalAccount.alertAmount || 0,
          statementFrequency: rentalAccount.statementFrequency,
          currency,
          notes: rentalAccount.notes,
        },
      });
    }

    return created;
  }

  async getClientById(context: Context, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: context.tenantId,
      },
      include: {
        contacts: true,
        taxProfiles: true,
        businessUnits: {
          where: {
            businessUnitId: context.businessUnitId,
          },
        },
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    const bu = client.businessUnits[0];

    const rentalCreditProfile =
      await this.prisma.rentalClientCreditProfile.findUnique({
        where: {
          tenantId_businessUnitId_clientId: {
            tenantId: context.tenantId,
            businessUnitId: context.businessUnitId,
            clientId,
          },
        },
      });

    // Buscar ClientAccount si existe
    const rentalAccount = await this.prisma.clientAccount.findUnique({
      where: {
        clientId,
      },
    });

    return {
      ...client,
      status: bu?.status ?? ClientStatus.ACTIVE,
      tags: bu?.tags ?? [],
      businessUnitId: context.businessUnitId,
      rentalCreditProfile,
      rentalAccount,
    };
  }

  async updateClient(context: Context, clientId: string, payload: any) {
    // Campos globales del cliente
    const { name, displayName, email, phone, status, tags, rentalAccount } =
      payload;

    const updated = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: {
          id: clientId,
        },
        data: {
          name,
          displayName,
          email,
          phone,
        },
      });

      if (status || tags) {
        await tx.clientBusinessUnit.upsert({
          where: {
            tenantId_businessUnitId_clientId: {
              tenantId: context.tenantId,
              businessUnitId: context.businessUnitId,
              clientId,
            },
          },
          create: {
            tenantId: context.tenantId,
            businessUnitId: context.businessUnitId,
            clientId,
            status: status ?? ClientStatus.ACTIVE,
            tags: tags ?? [],
          },
          update: {
            status: status ?? undefined,
            tags: tags ?? undefined,
          },
        });
      }

      // Actualizar o crear ClientAccount si se proporciona rentalAccount
      if (rentalAccount) {
        const existingAccount = await tx.clientAccount.findUnique({
          where: { clientId },
        });

        if (existingAccount) {
          // Actualizar cuenta existente
          await tx.clientAccount.update({
            where: { clientId },
            data: {
              creditLimit: rentalAccount.creditLimit ?? undefined,
              timeLimit: rentalAccount.timeLimit ?? undefined,
              alertAmount: rentalAccount.alertAmount ?? undefined,
              statementFrequency: rentalAccount.statementFrequency ?? undefined,
              notes: rentalAccount.notes ?? undefined,
            },
          });
        } else {
          // Crear nueva cuenta
          const bu = await tx.businessUnit.findUnique({
            where: { id: context.businessUnitId },
            select: { currency: true },
          });
          const currency = bu?.currency || "USD";

          await tx.clientAccount.create({
            data: {
              tenantId: context.tenantId,
              clientId,
              balance: rentalAccount.initialBalance || 0,
              totalConsumed: 0,
              totalReloaded: rentalAccount.initialBalance || 0,
              creditLimit: rentalAccount.creditLimit || 0,
              timeLimit: rentalAccount.timeLimit || 30,
              activeDays: 0,
              alertAmount: rentalAccount.alertAmount || 0,
              statementFrequency: rentalAccount.statementFrequency,
              currency,
              notes: rentalAccount.notes,
            },
          });
        }
      }

      return client;
    });

    return updated;
  }

  async deleteClient(context: Context, clientId: string) {
    const where = {
      tenantId_businessUnitId_clientId: {
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
        clientId,
      },
    };

    const existing = await this.prisma.clientBusinessUnit.findUnique({ where });

    // Si no existe la asignación en esta BU, consideramos la operación idempotente
    if (!existing) {
      return;
    }

    await this.prisma.clientBusinessUnit.delete({ where });
  }

  async searchGlobalClients(context: Context, query: string) {
    if (!query || query.length < 2) return [];

    // Buscar clientes en todo el tenant que coincidan con el término
    const clients = await this.prisma.client.findMany({
      where: {
        tenantId: context.tenantId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
          { taxProfiles: { some: { taxIdNumber: { contains: query } } } },
        ],
      },
      include: {
        businessUnits: {
          select: { businessUnitId: true },
        },
      },
      take: 10,
    });

    // Mapear resultado para indicar si ya está vinculado a esta BU
    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      displayName: c.displayName,
      email: c.email,
      phone: c.phone,
      isLinked: c.businessUnits.some(
        (bu) => bu.businessUnitId === context.businessUnitId,
      ),
    }));
  }

  async linkClientToBusinessUnit(context: Context, clientId: string) {
    // Verificar que el cliente exista en el tenant
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId: context.tenantId },
    });

    if (!client) {
      throw new Error("Client not found in this tenant");
    }

    // Crear la relación (si ya existe, falla por constraint unique, o usamos upsert/ignore)
    // Aquí usamos upsert para ser idempotentes pero preservando si ya existía
    const linked = await this.prisma.clientBusinessUnit.upsert({
      where: {
        tenantId_businessUnitId_clientId: {
          tenantId: context.tenantId,
          businessUnitId: context.businessUnitId,
          clientId,
        },
      },
      create: {
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
        clientId,
        status: ClientStatus.ACTIVE,
        tags: [],
      },
      update: {}, // No actualizar si ya existe
    });

    return linked;
  }

  async getClientSummary(context: Context, clientId: string) {
    const [client, movements, risk, rentalCreditProfile] =
      await this.prisma.$transaction([
        this.prisma.client.findFirst({
          where: {
            id: clientId,
            tenantId: context.tenantId,
          },
          include: {
            contacts: true,
            taxProfiles: true,
            businessUnits: {
              where: { businessUnitId: context.businessUnitId },
            },
          },
        }),
        this.prisma.clientAccountMovement.findMany({
          where: {
            clientId,
            tenantId: context.tenantId,
            businessUnitId: context.businessUnitId,
          },
          orderBy: { date: "desc" },
          take: 10,
        }),
        this.prisma.clientRiskSnapshot.findUnique({
          where: { clientId },
        }),
        this.prisma.rentalClientCreditProfile.findUnique({
          where: {
            tenantId_businessUnitId_clientId: {
              tenantId: context.tenantId,
              businessUnitId: context.businessUnitId,
              clientId,
            },
          },
        }),
      ]);

    if (!client) {
      throw new Error("Client not found");
    }

    const bu = client.businessUnits[0];

    return {
      client: {
        ...client,
        status: bu?.status ?? ClientStatus.ACTIVE,
        tags: bu?.tags ?? [],
        businessUnitId: context.businessUnitId,
      },
      recentMovements: movements,
      risk,
      rentalCreditProfile,
    };
  }

  async getRentalCreditProfile(context: Context, clientId: string) {
    const profile = await this.prisma.rentalClientCreditProfile.findUnique({
      where: {
        tenantId_businessUnitId_clientId: {
          tenantId: context.tenantId,
          businessUnitId: context.businessUnitId,
          clientId,
        },
      },
    });

    return (
      profile ?? {
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
        clientId,
        creditLimitAmount: 0,
        creditLimitDays: 0,
        requiresOwnerApprovalOnExceed: true,
        isActive: false,
      }
    );
  }

  async upsertRentalCreditProfile(
    context: Context,
    clientId: string,
    payload: any,
  ) {
    const {
      creditLimitAmount,
      creditLimitDays,
      requiresOwnerApprovalOnExceed,
      isActive,
      notes,
      metadata,
    } = payload;

    return this.prisma.rentalClientCreditProfile.upsert({
      where: {
        tenantId_businessUnitId_clientId: {
          tenantId: context.tenantId,
          businessUnitId: context.businessUnitId,
          clientId,
        },
      },
      create: {
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
        clientId,
        creditLimitAmount: Number(creditLimitAmount || 0),
        creditLimitDays: Number(creditLimitDays || 0),
        requiresOwnerApprovalOnExceed:
          requiresOwnerApprovalOnExceed !== undefined
            ? Boolean(requiresOwnerApprovalOnExceed)
            : true,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        notes,
        metadata,
        updatedBy: context.userId,
      },
      update: {
        creditLimitAmount:
          creditLimitAmount !== undefined
            ? Number(creditLimitAmount)
            : undefined,
        creditLimitDays:
          creditLimitDays !== undefined ? Number(creditLimitDays) : undefined,
        requiresOwnerApprovalOnExceed:
          requiresOwnerApprovalOnExceed !== undefined
            ? Boolean(requiresOwnerApprovalOnExceed)
            : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        notes: notes !== undefined ? notes : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
        updatedBy: context.userId,
      },
    });
  }

  async getClientRiskProfile(context: Context, clientId: string) {
    const snapshot = await this.prisma.clientRiskSnapshot.findUnique({
      where: { clientId },
    });

    // Por ahora devolvemos el snapshot tal cual; luego podremos calcular flags
    return snapshot;
  }

  async listAccountMovements(context: Context, options: ListMovementsOptions) {
    const { clientId, page, limit } = options;

    const where = {
      tenantId: context.tenantId,
      businessUnitId: context.businessUnitId,
      clientId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.clientAccountMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
      }),
      this.prisma.clientAccountMovement.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createAccountMovement(
    context: Context,
    clientId: string,
    payload: any,
  ) {
    const {
      date,
      amount,
      direction,
      currency,
      sourceModule,
      sourceType,
      sourceId,
      description,
      metadata,
    } = payload;

    const movement = await this.prisma.clientAccountMovement.create({
      data: {
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
        clientId,
        date: date ? new Date(date) : undefined,
        amount,
        direction: direction as MovementDirection,
        currency,
        sourceModule,
        sourceType,
        sourceId,
        description,
        metadata,
      },
    });

    return movement;
  }

  async getCurrentConfig(context: Context) {
    const config = await this.prisma.clientRankingConfig.findFirst({
      where: {
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
      },
    });

    return (
      config ?? {
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
        weights: {},
        thresholds: {},
        policies: {},
      }
    );
  }

  async updateCurrentConfig(context: Context, payload: any) {
    const existing = await this.prisma.clientRankingConfig.findFirst({
      where: {
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
      },
    });

    if (!existing) {
      return this.prisma.clientRankingConfig.create({
        data: {
          tenantId: context.tenantId,
          businessUnitId: context.businessUnitId,
          weights: payload.weights ?? {},
          thresholds: payload.thresholds ?? {},
          policies: payload.policies ?? {},
        },
      });
    }

    return this.prisma.clientRankingConfig.update({
      where: { id: existing.id },
      data: {
        weights: payload.weights ?? existing.weights,
        thresholds: payload.thresholds ?? existing.thresholds,
        policies: payload.policies ?? existing.policies,
      },
    });
  }
}
