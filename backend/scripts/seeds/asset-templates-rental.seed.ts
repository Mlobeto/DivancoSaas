/**
 * ASSET TEMPLATES SEED - RENTAL VERTICAL
 * Plantillas precargadas para tipos comunes de activos en rental
 * Se ejecuta al crear un nuevo BusinessUnit con vertical "rental"
 */

import { AssetCategory, AssetManagementType } from "@prisma/client";

interface CreateTemplateData {
  name: string;
  category: AssetCategory;
  description: string;
  icon: string;
  managementType: AssetManagementType;
  requiresPreventiveMaintenance: boolean;
  requiresDocumentation: boolean;
  technicalSpecs: Record<string, string>;
  maintenanceSchedule?: Array<{
    periodicity: string;
    description: string;
    requiredItems?: string;
  }>;
  rentalPricing: {
    requiresOperator: boolean;
    operatorBillingType?: "PER_DAY" | "PER_HOUR";
    allowsHourly: boolean;
    allowsDaily: boolean;
    allowsWeekly: boolean;
    allowsMonthly: boolean;
    chargesKm: boolean;
    minDailyHours?: number;
  };
  businessRules?: {
    requiresTransport: boolean;
    requiresOperator: boolean;
    requiresInsurance: boolean;
  };
}

export const RENTAL_ASSET_TEMPLATES: CreateTemplateData[] = [
  // ═══════════════════════════════════════════════════════════════
  // VEHÍCULOS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Vehículo Pesado",
    category: AssetCategory.VEHICLE,
    description: "Camión, volqueta, tractomula para transporte de carga pesada",
    icon: "🚛",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: true,
    requiresDocumentation: true,
    technicalSpecs: {
      "Placa/Patente": "",
      "VIN/Chasis": "",
      "Marca": "",
      "Modelo": "",
      "Año de fabricación": "",
      "Motor": "",
      "Cilindraje": "",
      "Tipo de transmisión": "",
      "Número de ejes": "",
      "Capacidad de carga": "",
      "Capacidad del tanque": "",
      "Tipo de llantas": "",
      "Horómetro inicial": "",
      "Kilometraje inicial": "",
      "Fecha SOAT": "",
      "Fecha tecnomecánica": "",
      "Fecha cert. gases": "",
      "Fecha venc. extintor": "",
      "Fecha venc. botiquín": "",
    },
    maintenanceSchedule: [
      {
        periodicity: "5,000 km",
        description: "Cambio de aceite de motor y filtros",
        requiredItems: "Aceite 15W-40 (18L), Filtro de aceite, Filtro de aire",
      },
      {
        periodicity: "10,000 km",
        description: "Revisión general del sistema",
        requiredItems:
          "Aceite, filtros, revisión de frenos, suspensión y dirección",
      },
      {
        periodicity: "20,000 km",
        description: "Cambio de aceite transmisión y diferencial",
        requiredItems: "Aceite transmisión SAE 80W-90 (8L)",
      },
      {
        periodicity: "Anual",
        description: "Inspección técnico-mecánica y certificación de gases",
        requiredItems: "Revisión en centro de diagnóstico autorizado",
      },
    ],
    rentalPricing: {
      requiresOperator: true,
      operatorBillingType: "PER_DAY",
      allowsHourly: false,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: true,
      minDailyHours: 8,
    },
    businessRules: {
      requiresTransport: false,
      requiresOperator: true,
      requiresInsurance: true,
    },
  },
  {
    name: "Vehículo Liviano",
    category: AssetCategory.VEHICLE,
    description: "Camioneta, automóvil, van para transporte liviano",
    icon: "🚗",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: true,
    requiresDocumentation: true,
    technicalSpecs: {
      "Placa/Patente": "",
      "VIN/Chasis": "",
      "Marca": "",
      "Modelo": "",
      "Año de fabricación": "",
      "Motor": "",
      "Cilindraje": "",
      "Tipo de transmisión": "",
      "Número de pasajeros": "",
      "Capacidad del tanque": "",
      "Color": "",
      "Kilometraje inicial": "",
      "Fecha SOAT": "",
      "Fecha tecnomecánica": "",
      "Fecha venc. extintor": "",
      "Fecha venc. botiquín": "",
    },
    maintenanceSchedule: [
      {
        periodicity: "5,000 km",
        description: "Cambio de aceite y filtros",
        requiredItems: "Aceite sintético 5W-30 (4L), Filtro de aceite",
      },
      {
        periodicity: "10,000 km",
        description: "Revisión de frenos y suspensión",
        requiredItems: "Revisión completa del sistema de frenos",
      },
      {
        periodicity: "Anual",
        description: "Revisión técnico-mecánica",
        requiredItems: "Centro de diagnóstico",
      },
    ],
    rentalPricing: {
      requiresOperator: false,
      allowsHourly: false,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: true,
    },
    businessRules: {
      requiresTransport: false,
      requiresOperator: false,
      requiresInsurance: true,
    },
  },
  {
    name: "Motocicleta",
    category: AssetCategory.VEHICLE,
    description: "Moto para transporte ágil y mensajería",
    icon: "🏍️",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: true,
    requiresDocumentation: true,
    technicalSpecs: {
      "Placa/Patente": "",
      "Marca": "",
      "Modelo": "",
      "Año de fabricación": "",
      "Cilindraje": "",
      "Color": "",
      "Kilometraje inicial": "",
      "Fecha SOAT": "",
      "Fecha tecnomecánica": "",
    },
    maintenanceSchedule: [
      {
        periodicity: "3,000 km",
        description: "Cambio de aceite",
        requiredItems: "Aceite 20W-50 (1L)",
      },
      {
        periodicity: "6,000 km",
        description: "Revisión general",
        requiredItems: "Cambio de filtros, revisión cadena y frenos",
      },
    ],
    rentalPricing: {
      requiresOperator: false,
      allowsHourly: false,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
    },
    businessRules: {
      requiresTransport: false,
      requiresOperator: false,
      requiresInsurance: true,
    },
  },
  {
    name: "Montacargas",
    category: AssetCategory.VEHICLE,
    description: "Montacargas eléctrico o a combustión para manejo de cargas",
    icon: "🏗️",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: true,
    requiresDocumentation: true,
    technicalSpecs: {
      "Número de serie": "",
      "Marca": "",
      "Modelo": "",
      "Año de fabricación": "",
      "Capacidad de carga": "",
      "Altura de elevación": "",
      "Tipo de combustible": "",
      "Motor": "",
      "Horómetro inicial": "",
      "Fecha cert. gases": "",
    },
    maintenanceSchedule: [
      {
        periodicity: "250 horas",
        description: "Servicio preventivo básico",
        requiredItems: "Aceite hidráulico, filtros, revisión cadenas",
      },
      {
        periodicity: "500 horas",
        description: "Servicio preventivo completo",
        requiredItems: "Cambio aceite motor, filtros, revisión sistema hidráulico",
      },
    ],
    rentalPricing: {
      requiresOperator: true,
      operatorBillingType: "PER_DAY",
      allowsHourly: true,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
      minDailyHours: 8,
    },
    businessRules: {
      requiresTransport: true,
      requiresOperator: true,
      requiresInsurance: true,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // MAQUINARIA PESADA
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Retroexcavadora",
    category: AssetCategory.MACHINERY,
    description: "Retroexcavadora para excavación y carga",
    icon: "🚜",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: true,
    requiresDocumentation: true,
    technicalSpecs: {
      "Número de serie": "",
      "Marca": "",
      "Modelo": "",
      "Año de fabricación": "",
      "Capacidad de carga": "",
      "Motor": "",
      "Potencia": "",
      "Capacidad hidráulica": "",
      "Peso (kg)": "",
      "Horómetro inicial": "",
    },
    maintenanceSchedule: [
      {
        periodicity: "250 horas",
        description: "Servicio A - Cambio aceite motor y filtros básicos",
        requiredItems: "Aceite 15W-40 (18L), Filtro aceite, Filtro combustible",
      },
      {
        periodicity: "500 horas",
        description: "Servicio B - Servicio completo con revisión hidráulica",
        requiredItems:
          "Aceite motor, filtros, aceite hidráulico, filtro hidráulico",
      },
      {
        periodicity: "1,000 horas",
        description:
          "Servicio C - Mantenimiento mayor con revisión transmisión",
        requiredItems:
          "Aceite motor, hidráulico, transmisión, todos los filtros, revisión diferencial",
      },
    ],
    rentalPricing: {
      requiresOperator: true,
      operatorBillingType: "PER_HOUR",
      allowsHourly: true,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
      minDailyHours: 8,
    },
    businessRules: {
      requiresTransport: true,
      requiresOperator: true,
      requiresInsurance: true,
    },
  },
  {
    name: "Miniexcavadora",
    category: AssetCategory.MACHINERY,
    description: "Miniexcavadora compacta para trabajos de precisión",
    icon: "🏗️",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: true,
    requiresDocumentation: true,
    technicalSpecs: {
      "Número de serie": "",
      "Marca": "",
      "Modelo": "",
      "Año de fabricación": "",
      "Peso (kg)": "",
      "Motor": "",
      "Potencia": "",
      "Capacidad hidráulica": "",
      "Horómetro inicial": "",
    },
    maintenanceSchedule: [
      {
        periodicity: "250 horas",
        description: "Cambio aceite y filtros",
        requiredItems: "Aceite 10W-30 (8L), Filtros",
      },
      {
        periodicity: "500 horas",
        description: "Servicio completo",
        requiredItems: "Aceite motor, hidráulico, todos los filtros",
      },
    ],
    rentalPricing: {
      requiresOperator: true,
      operatorBillingType: "PER_HOUR",
      allowsHourly: true,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
      minDailyHours: 8,
    },
    businessRules: {
      requiresTransport: true,
      requiresOperator: true,
      requiresInsurance: true,
    },
  },
  {
    name: "Vibrador/Compactador",
    category: AssetCategory.MACHINERY,
    description: "Vibrador de concreto o compactador de suelo",
    icon: "📳",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: true,
    requiresDocumentation: false,
    technicalSpecs: {
      "Número de serie": "",
      "Marca": "",
      "Modelo": "",
      "Tipo de combustible": "",
      "Motor": "",
      "Peso (kg)": "",
      "Horómetro inicial": "",
    },
    maintenanceSchedule: [
      {
        periodicity: "100 horas",
        description: "Cambio aceite motor",
        requiredItems: "Aceite 10W-30 (1L)",
      },
      {
        periodicity: "500 horas",
        description: "Revisión general",
        requiredItems: "Cambio aceite, filtros, revisión motor",
      },
    ],
    rentalPricing: {
      requiresOperator: true,
      operatorBillingType: "PER_DAY",
      allowsHourly: true,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: false,
      chargesKm: false,
      minDailyHours: 8,
    },
    businessRules: {
      requiresTransport: true,
      requiresOperator: true,
      requiresInsurance: false,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // IMPLEMENTOS (GESTIÓN POR CANTIDAD)
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Andamio Tubular",
    category: AssetCategory.IMPLEMENT,
    description: "Andamio tubular metálico modular",
    icon: "🔧",
    managementType: AssetManagementType.BULK,
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,
    technicalSpecs: {
      "Altura": "",
      "Longitud": "",
      "Ancho": "",
      "Capacidad de carga": "",
      "Material": "",
    },
    rentalPricing: {
      requiresOperator: false,
      allowsHourly: false,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
    },
    businessRules: {
      requiresTransport: true,
      requiresOperator: false,
      requiresInsurance: false,
    },
  },
  {
    name: "Formaleta Metálica",
    category: AssetCategory.IMPLEMENT,
    description: "Formaleta metálica para concreto",
    icon: "📐",
    managementType: AssetManagementType.BULK,
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,
    technicalSpecs: {
      "Altura": "",
      "Longitud": "",
      "Material": "",
      "Peso (kg)": "",
    },
    rentalPricing: {
      requiresOperator: false,
      allowsHourly: false,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
    },
    businessRules: {
      requiresTransport: true,
      requiresOperator: false,
      requiresInsurance: false,
    },
  },
  {
    name: "Planta Eléctrica",
    category: AssetCategory.IMPLEMENT,
    description: "Generador eléctrico portátil",
    icon: "⚡",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: true,
    requiresDocumentation: false,
    technicalSpecs: {
      "Número de serie": "",
      "Marca": "",
      "Modelo": "",
      "Potencia": "",
      "Tipo de combustible": "",
      "Capacidad del tanque": "",
      "Horómetro inicial": "",
    },
    maintenanceSchedule: [
      {
        periodicity: "100 horas",
        description: "Cambio aceite motor",
        requiredItems: "Aceite 10W-30 (2L)",
      },
      {
        periodicity: "500 horas",
        description: "Servicio completo",
        requiredItems: "Aceite, filtros, revisión sistema eléctrico",
      },
    ],
    rentalPricing: {
      requiresOperator: false,
      allowsHourly: false,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
    },
    businessRules: {
      requiresTransport: true,
      requiresOperator: false,
      requiresInsurance: false,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // HERRAMIENTAS (SEGUIMIENTO INDIVIDUAL)
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Taladro Profesional",
    category: AssetCategory.TOOL,
    description: "Taladro rotomartillo profesional",
    icon: "🔨",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,
    technicalSpecs: {
      "Número de serie": "",
      "Marca": "",
      "Modelo": "",
      "Potencia": "",
      "Voltaje": "",
    },
    rentalPricing: {
      requiresOperator: false,
      allowsHourly: false,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
    },
    businessRules: {
      requiresTransport: false,
      requiresOperator: false,
      requiresInsurance: false,
    },
  },
  {
    name: "Pulidora Industrial",
    category: AssetCategory.TOOL,
    description: "Pulidora angular industrial",
    icon: "⚙️",
    managementType: AssetManagementType.UNIT,
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,
    technicalSpecs: {
      "Número de serie": "",
      "Marca": "",
      "Modelo": "",
      "Potencia": "",
      "Diámetro disco": "",
    },
    rentalPricing: {
      requiresOperator: false,
      allowsHourly: false,
      allowsDaily: true,
      allowsWeekly: true,
      allowsMonthly: true,
      chargesKm: false,
    },
    businessRules: {
      requiresTransport: false,
      requiresOperator: false,
      requiresInsurance: false,
    },
  },
];

/**
 * Función para crear plantillas seed en un BusinessUnit
 * Se debe llamar al crear un nuevo BusinessUnit con vertical "rental"
 */
export async function seedRentalTemplates(
  prisma: any,
  businessUnitId: string,
) {
  console.log(
    `📋 Creando plantillas de activos para BusinessUnit: ${businessUnitId}`,
  );

  const created: string[] = [];

  for (const template of RENTAL_ASSET_TEMPLATES) {
    try {
      // Verificar si ya existe
      const existing = await prisma.assetTemplate.findFirst({
        where: {
          businessUnitId,
          name: template.name,
        },
      });

      if (existing) {
        console.log(`   ⏭️  Ya existe: ${template.name}`);
        continue;
      }

      // Crear plantilla
      await prisma.assetTemplate.create({
        data: {
          businessUnitId,
          name: template.name,
          category: template.category,
          description: template.description,
          icon: template.icon,
          managementType: template.managementType,
          requiresPreventiveMaintenance: template.requiresPreventiveMaintenance,
          requiresDocumentation: template.requiresDocumentation,
          technicalSpecs: template.technicalSpecs,
          maintenanceSchedule: template.maintenanceSchedule || [],
          rentalPricing: template.rentalPricing,
          businessRules: template.businessRules || {},
        },
      });

      created.push(template.name);
      console.log(`   ✅ Creada: ${template.name}`);
    } catch (error) {
      console.error(`   ❌ Error creando ${template.name}:`, error);
    }
  }

  console.log(
    `\n✨ Plantillas creadas: ${created.length}/${RENTAL_ASSET_TEMPLATES.length}`,
  );
  return created;
}
