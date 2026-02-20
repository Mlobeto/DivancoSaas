/**
 * EXAMPLE TEMPLATES
 * Templates de ejemplo prellenados para cada categoría
 */

import {
  AssetCategory,
  CreateTemplateInput,
  FieldType,
} from "../services/asset-template.service";

export const EXAMPLE_TEMPLATES: Record<AssetCategory, CreateTemplateInput> = {
  // ═══════════════════════════════════════
  // MAQUINARIA PESADA
  // ═══════════════════════════════════════
  [AssetCategory.MACHINERY]: {
    name: "Retroexcavadora",
    category: AssetCategory.MACHINERY,
    icon: "construction",
    requiresPreventiveMaintenance: true,
    requiresDocumentation: true,

    technicalSpecs: {
      power: "75 HP",
      fuelType: "Diesel",
      weight: "7500 kg",
      maxDigDepth: "4.5 m",
      bucketCapacity: "0.9 m³",
    },

    businessRules: {
      requiresTransport: true,
      requiresOperator: true,
      requiresInsurance: true,
      autoSuggestSupplies: [], // IDs de diesel, aceite hidráulico
    },

    presentation: {
      unit: "unidad",
    },

    customFields: [
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: true,
        placeholder: "Ej: CAT, JCB, CASE",
      },
      {
        key: "model",
        label: "Modelo",
        type: FieldType.TEXT,
        section: "general",
        order: 2,
        required: true,
        placeholder: "Ej: 416F",
      },
      {
        key: "serialNumber",
        label: "Número de Serie",
        type: FieldType.TEXT,
        section: "general",
        order: 3,
        required: true,
      },
      {
        key: "year",
        label: "Año",
        type: FieldType.NUMBER,
        section: "general",
        order: 4,
        required: false,
        validations: {
          min: 1990,
          max: new Date().getFullYear() + 1,
        },
      },
      {
        key: "engineHours",
        label: "Horas de Motor",
        type: FieldType.NUMBER,
        section: "technical",
        order: 5,
        required: false,
      },
    ],

    hasExpiryDate: false,
    requiresLotTracking: false,
    isDangerous: false,
  },

  // ═══════════════════════════════════════
  // IMPLEMENTOS
  // ═══════════════════════════════════════
  [AssetCategory.IMPLEMENT]: {
    name: "Andamio Tubular",
    category: AssetCategory.IMPLEMENT,
    icon: "fence",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: true,

    technicalSpecs: {
      height: "6 m",
      width: "2 m",
      loadCapacity: "250 kg/m²",
      material: "Acero galvanizado",
    },

    businessRules: {
      requiresTransport: true,
      requiresOperator: false,
      requiresInsurance: false,
    },

    presentation: {
      unit: "módulo",
    },

    customFields: [
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: true,
      },
      {
        key: "certificationNumber",
        label: "Número de Certificación",
        type: FieldType.TEXT,
        section: "documentation",
        order: 2,
        required: true,
        helperText: "Certificación ANSI o similar",
      },
      {
        key: "certificationExpiry",
        label: "Vencimiento de Certificación",
        type: FieldType.DATE,
        section: "documentation",
        order: 3,
        required: true,
      },
      {
        key: "componentCount",
        label: "Número de Componentes",
        type: FieldType.NUMBER,
        section: "technical",
        order: 4,
        required: false,
        helperText: "Total de tubos, crucetas, bases, etc.",
      },
    ],

    hasExpiryDate: false,
    requiresLotTracking: false,
    isDangerous: false,
  },

  // ═══════════════════════════════════════
  // VEHÍCULOS
  // ═══════════════════════════════════════
  [AssetCategory.VEHICLE]: {
    name: "Camioneta 4x4",
    category: AssetCategory.VEHICLE,
    icon: "truck",
    requiresPreventiveMaintenance: true,
    requiresDocumentation: true,

    technicalSpecs: {
      fuelType: "Diesel",
      engine: "2.5L Turbo",
      transmission: "Manual 6 velocidades",
      loadCapacity: "1000 kg",
    },

    businessRules: {
      requiresTransport: false,
      requiresOperator: true,
      requiresInsurance: true,
    },

    customFields: [
      {
        key: "licensePlate",
        label: "Placa",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: true,
      },
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 2,
        required: true,
      },
      {
        key: "model",
        label: "Modelo",
        type: FieldType.TEXT,
        section: "general",
        order: 3,
        required: true,
      },
      {
        key: "year",
        label: "Año",
        type: FieldType.NUMBER,
        section: "general",
        order: 4,
        required: true,
      },
      {
        key: "soatExpiry",
        label: "Vencimiento SOAT",
        type: FieldType.DATE,
        section: "documentation",
        order: 5,
        required: true,
      },
      {
        key: "techReviewExpiry",
        label: "Vencimiento Revisión Técnico-Mecánica",
        type: FieldType.DATE,
        section: "documentation",
        order: 6,
        required: true,
      },
    ],

    hasExpiryDate: false,
    requiresLotTracking: false,
    isDangerous: false,
  },

  // ═══════════════════════════════════════
  // HERRAMIENTAS
  // ═══════════════════════════════════════
  [AssetCategory.TOOL]: {
    name: "Taladro Percutor",
    category: AssetCategory.TOOL,
    icon: "drill",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,

    technicalSpecs: {
      power: "850W",
      maxDrillCapacity: "13mm",
      weight: "2.5 kg",
      powerSource: "Eléctrico 110V",
    },

    businessRules: {
      requiresTransport: false,
      requiresOperator: false,
      requiresInsurance: false,
    },

    customFields: [
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: true,
      },
      {
        key: "model",
        label: "Modelo",
        type: FieldType.TEXT,
        section: "general",
        order: 2,
        required: false,
      },
      {
        key: "condition",
        label: "Estado",
        type: FieldType.SELECT,
        section: "general",
        order: 3,
        required: true,
        validations: {
          options: ["Nuevo", "Usado - Excelente", "Usado - Bueno", "Regular"],
        },
      },
    ],

    hasExpiryDate: false,
    requiresLotTracking: false,
    isDangerous: false,
  },

  // ═══════════════════════════════════════
  // COMBUSTIBLES
  // ═══════════════════════════════════════
  [AssetCategory.SUPPLY_FUEL]: {
    name: "Diesel",
    category: AssetCategory.SUPPLY_FUEL,
    icon: "package",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: true,

    technicalSpecs: {
      grade: "Diesel ACPM",
      cetaneNumber: "≥ 45",
      sulphurContent: "< 50 ppm",
      flashPoint: "52°C",
    },

    compatibleWith: {
      equipmentCategories: [AssetCategory.MACHINERY, AssetCategory.VEHICLE],
    },

    presentation: {
      unit: "galón",
      containerSize: 55,
      containerType: "Tambor",
    },

    businessRules: {
      requiresTransport: true,
      requiresOperator: false,
      requiresInsurance: false,
    },

    customFields: [
      {
        key: "supplier",
        label: "Proveedor",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: false,
      },
      {
        key: "storageLocation",
        label: "Ubicación de Almacenamiento",
        type: FieldType.TEXT,
        section: "general",
        order: 2,
        required: false,
      },
    ],

    hasExpiryDate: true,
    requiresLotTracking: true,
    isDangerous: true,
    hazardClass: "FLAMMABLE",
  },

  // ═══════════════════════════════════════
  // ACEITES Y LUBRICANTES
  // ═══════════════════════════════════════
  [AssetCategory.SUPPLY_OIL]: {
    name: "Aceite Hidráulico ISO 68",
    category: AssetCategory.SUPPLY_OIL,
    icon: "packageopen",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: true,

    technicalSpecs: {
      viscosity: "ISO 68",
      grade: "AW (Anti-Wear)",
      baseOil: "Mineral",
      pourPoint: "-15°C",
    },

    compatibleWith: {
      equipmentCategories: [AssetCategory.MACHINERY],
    },

    presentation: {
      unit: "litro",
      containerSize: 20,
      containerType: "Caneca",
    },

    customFields: [
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: true,
      },
      {
        key: "batchNumber",
        label: "Número de Lote",
        type: FieldType.TEXT,
        section: "quality",
        order: 2,
        required: false,
      },
    ],

    hasExpiryDate: true,
    requiresLotTracking: true,
    isDangerous: false,
  },

  // ═══════════════════════════════════════
  // PINTURAS Y QUÍMICOS
  // ═══════════════════════════════════════
  [AssetCategory.SUPPLY_PAINT]: {
    name: "Pintura Epóxica Industrial",
    category: AssetCategory.SUPPLY_PAINT,
    icon: "box",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: true,

    technicalSpecs: {
      type: "Epóxica 2 componentes",
      finish: "Semi-brillante",
      coverage: "8-10 m²/litro",
      dryTime: "4-6 horas",
    },

    presentation: {
      unit: "galón",
      containerSize: 1,
      containerType: "Galón",
    },

    customFields: [
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: true,
      },
      {
        key: "color",
        label: "Color",
        type: FieldType.TEXT,
        section: "general",
        order: 2,
        required: false,
      },
      {
        key: "batchNumber",
        label: "Número de Lote",
        type: FieldType.TEXT,
        section: "quality",
        order: 3,
        required: false,
      },
    ],

    hasExpiryDate: true,
    requiresLotTracking: true,
    isDangerous: true,
    hazardClass: "CORROSIVE",
  },

  // ═══════════════════════════════════════
  // REPUESTOS
  // ═══════════════════════════════════════
  [AssetCategory.SUPPLY_SPARE_PART]: {
    name: "Filtro de Aceite",
    category: AssetCategory.SUPPLY_SPARE_PART,
    icon: "package",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,

    technicalSpecs: {
      partNumber: "LF3000",
      threadSize: "3/4-16 UNF",
      outerDiameter: "93.5 mm",
      height: "95 mm",
    },

    compatibleWith: {
      equipmentCategories: [AssetCategory.MACHINERY, AssetCategory.VEHICLE],
    },

    presentation: {
      unit: "unidad",
    },

    customFields: [
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: true,
      },
      {
        key: "partNumber",
        label: "Número de Parte",
        type: FieldType.TEXT,
        section: "technical",
        order: 2,
        required: true,
      },
      {
        key: "compatibleModels",
        label: "Modelos Compatibles",
        type: FieldType.TEXTAREA,
        section: "technical",
        order: 3,
        required: false,
        placeholder: "Ej: CAT 416F, CAT 420F, etc.",
      },
    ],

    hasExpiryDate: false,
    requiresLotTracking: true,
    isDangerous: false,
  },

  // ═══════════════════════════════════════
  // CONSUMIBLES
  // ═══════════════════════════════════════
  [AssetCategory.SUPPLY_CONSUMABLE]: {
    name: "Guantes de Nitrilo (Caja x100)",
    category: AssetCategory.SUPPLY_CONSUMABLE,
    icon: "package",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,

    presentation: {
      unit: "caja",
      containerSize: 100,
      containerType: "Caja",
    },

    customFields: [
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: false,
      },
      {
        key: "size",
        label: "Talla",
        type: FieldType.SELECT,
        section: "general",
        order: 2,
        required: true,
        validations: {
          options: ["S", "M", "L", "XL"],
        },
      },
    ],

    hasExpiryDate: true,
    requiresLotTracking: false,
    isDangerous: false,
  },

  // ═══════════════════════════════════════
  // EQUIPOS DE SEGURIDAD
  // ═══════════════════════════════════════
  [AssetCategory.SUPPLY_SAFETY]: {
    name: "Casco de Seguridad Clase G",
    category: AssetCategory.SUPPLY_SAFETY,
    icon: "hardhat",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: true,

    technicalSpecs: {
      standard: "ANSI Z89.1-2014 Clase G",
      material: "Polietileno de alta densidad",
      protectionType: "Impacto y penetración",
      voltageRating: "2,200V",
    },

    customFields: [
      {
        key: "brand",
        label: "Marca",
        type: FieldType.TEXT,
        section: "general",
        order: 1,
        required: true,
      },
      {
        key: "certificationNumber",
        label: "Número de Certificación",
        type: FieldType.TEXT,
        section: "certification",
        order: 2,
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: FieldType.SELECT,
        section: "general",
        order: 3,
        required: false,
        validations: {
          options: ["Blanco", "Amarillo", "Naranja", "Azul", "Rojo"],
        },
      },
    ],

    hasExpiryDate: true,
    requiresLotTracking: false,
    isDangerous: false,
  },
};
