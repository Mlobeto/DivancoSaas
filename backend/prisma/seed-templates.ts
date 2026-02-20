/**
 * SEED DE PLANTILLAS DE ACTIVOS - RENTAL VERTICAL
 *
 * Este seed crea plantillas de ejemplo para todos los tipos de activos:
 * - Maquinaria (Retroexcavadora)
 * - Implementos (Andamio Tubular)
 * - Vehículos (Camioneta 4x4)
 * - Herramientas (Taladro Percutor)
 * - Combustibles (Diesel)
 * - Lubricantes (Aceite Hidráulico)
 * - Insumos Construcción (Cemento Gris)
 * - Químicos (Aditivo Concreto)
 * - EPP (Casco de Seguridad)
 * - Otros Insumos (Geotextil)
 *
 * Ejecutar con: npm run prisma:seed:templates
 */

import { PrismaClient, AssetCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de plantillas de activos...\n");

  // Buscar el Business Unit de prueba
  const businessUnit = await prisma.businessUnit.findFirst({
    where: { slug: "alquiler" },
  });

  if (!businessUnit) {
    console.error("❌ No se encontró Business Unit de prueba.");
    console.log("💡 Ejecuta primero: npm run prisma:seed");
    process.exit(1);
  }

  console.log(`📦 Creando plantillas para: ${businessUnit.name}\n`);

  // ═══════════════════════════════════════════════════════════
  // PLANTILLAS DE ACTIVOS
  // ═══════════════════════════════════════════════════════════

  const templates = [
    // ────────────────────────────────────────────────────────
    // 1. MAQUINARIA PESADA
    // ────────────────────────────────────────────────────────
    {
      name: "Retroexcavadora",
      category: AssetCategory.MACHINERY,
      description: "Maquinaria pesada para excavación y carga de materiales",
      icon: "🚜",
      managementType: "UNIT" as const,
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
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "unidad",
      },

      customFields: [
        {
          key: "brand",
          label: "Marca",
          type: "TEXT",
          section: "general",
          order: 1,
          required: true,
          placeholder: "Ej: CAT, JCB, CASE",
        },
        {
          key: "model",
          label: "Modelo",
          type: "TEXT",
          section: "general",
          order: 2,
          required: true,
          placeholder: "Ej: 416F",
        },
        {
          key: "serialNumber",
          label: "Número de Serie",
          type: "TEXT",
          section: "general",
          order: 3,
          required: true,
        },
        {
          key: "year",
          label: "Año",
          type: "NUMBER",
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
          type: "NUMBER",
          section: "technical",
          order: 5,
          required: false,
        },
      ],

      hasExpiryDate: false,
      requiresLotTracking: false,
      isDangerous: false,
    },

    // ────────────────────────────────────────────────────────
    // 2. IMPLEMENTOS
    // ────────────────────────────────────────────────────────
    {
      name: "Andamio Tubular",
      category: AssetCategory.IMPLEMENT,
      description: "Andamio metálico modular para trabajos en altura",
      icon: "🏗️",
      managementType: "UNIT" as const,
      requiresPreventiveMaintenance: true,
      requiresDocumentation: true,

      technicalSpecs: {
        material: "Acero galvanizado",
        maxHeight: "12 m",
        loadCapacity: "250 kg/m²",
        moduleSize: "2m x 1m",
      },

      businessRules: {
        requiresTransport: true,
        requiresOperator: false,
        requiresInsurance: true,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "módulo",
      },

      customFields: [
        {
          key: "modules",
          label: "Cantidad de Módulos",
          type: "NUMBER",
          section: "general",
          order: 1,
          required: true,
        },
        {
          key: "certification",
          label: "Certificación de Seguridad",
          type: "TEXT",
          section: "documentation",
          order: 2,
          required: false,
        },
      ],

      hasExpiryDate: false,
      requiresLotTracking: false,
      isDangerous: false,
    },

    // ────────────────────────────────────────────────────────
    // 3. VEHÍCULOS
    // ────────────────────────────────────────────────────────
    {
      name: "Camioneta 4x4",
      category: AssetCategory.VEHICLE,
      description: "Vehículo de transporte para personal y materiales",
      icon: "🚙",
      managementType: "UNIT" as const,
      requiresPreventiveMaintenance: true,
      requiresDocumentation: true,

      technicalSpecs: {
        fuelType: "Diesel",
        motorSize: "2.5L",
        transmission: "Manual",
        capacity: "5 pasajeros + 1000kg carga",
      },

      businessRules: {
        requiresTransport: false,
        requiresOperator: true,
        requiresInsurance: true,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "unidad",
      },

      customFields: [
        {
          key: "plate",
          label: "Placa",
          type: "TEXT",
          section: "general",
          order: 1,
          required: true,
        },
        {
          key: "brand",
          label: "Marca",
          type: "TEXT",
          section: "general",
          order: 2,
          required: true,
        },
        {
          key: "model",
          label: "Modelo",
          type: "TEXT",
          section: "general",
          order: 3,
          required: true,
        },
        {
          key: "year",
          label: "Año",
          type: "NUMBER",
          section: "general",
          order: 4,
          required: true,
        },
        {
          key: "mileage",
          label: "Kilometraje",
          type: "NUMBER",
          section: "technical",
          order: 5,
          required: false,
        },
      ],

      hasExpiryDate: false,
      requiresLotTracking: false,
      isDangerous: false,
    },

    // ────────────────────────────────────────────────────────
    // 4. HERRAMIENTAS
    // ────────────────────────────────────────────────────────
    {
      name: "Taladro Percutor",
      category: AssetCategory.TOOL,
      description: "Herramienta eléctrica para perforación",
      icon: "🔨",
      managementType: "UNIT" as const,
      requiresPreventiveMaintenance: false,
      requiresDocumentation: false,

      technicalSpecs: {
        power: "850W",
        voltage: "110V",
        maxDrillDiameter: "13mm",
      },

      businessRules: {
        requiresTransport: false,
        requiresOperator: false,
        requiresInsurance: false,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "unidad",
      },

      customFields: [
        {
          key: "brand",
          label: "Marca",
          type: "TEXT",
          section: "general",
          order: 1,
          required: true,
        },
        {
          key: "model",
          label: "Modelo",
          type: "TEXT",
          section: "general",
          order: 2,
          required: false,
        },
      ],

      hasExpiryDate: false,
      requiresLotTracking: false,
      isDangerous: false,
    },

    // ────────────────────────────────────────────────────────
    // 5. COMBUSTIBLES
    // ────────────────────────────────────────────────────────
    {
      name: "Diesel",
      category: AssetCategory.SUPPLY_FUEL,
      description: "Combustible diesel para maquinaria",
      icon: "⛽",
      managementType: "BULK" as const,
      requiresPreventiveMaintenance: false,
      requiresDocumentation: true,

      technicalSpecs: {
        grade: "Diesel B10",
        cetaneNumber: "48 min",
        sulfurContent: "10 ppm max",
      },

      businessRules: {
        requiresTransport: true,
        requiresOperator: false,
        requiresInsurance: true,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "galones",
        containerSize: 55,
        containerType: "Tambor",
      },

      compatibleWith: {
        equipmentCategories: ["MACHINERY", "VEHICLE"],
        equipmentIds: [],
      },

      hasExpiryDate: false,
      requiresLotTracking: true,
      isDangerous: true,
      hazardClass: "FLAMMABLE",
    },

    // ────────────────────────────────────────────────────────
    // 6. LUBRICANTES
    // ────────────────────────────────────────────────────────
    {
      name: "Aceite Hidráulico",
      category: AssetCategory.SUPPLY_OIL,
      description: "Aceite hidráulico para sistemas de maquinaria",
      icon: "🛢️",
      managementType: "BULK" as const,
      requiresPreventiveMaintenance: false,
      requiresDocumentation: true,

      technicalSpecs: {
        viscosity: "ISO VG 68",
        type: "Sintético",
        grade: "AW",
      },

      businessRules: {
        requiresTransport: false,
        requiresOperator: false,
        requiresInsurance: false,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "litros",
        containerSize: 20,
        containerType: "Caneca",
      },

      compatibleWith: {
        equipmentCategories: ["MACHINERY"],
        equipmentIds: [],
      },

      hasExpiryDate: true,
      requiresLotTracking: true,
      isDangerous: false,
    },

    // ────────────────────────────────────────────────────────
    // 7. PINTURAS Y SOLVENTES
    // ────────────────────────────────────────────────────────
    {
      name: "Pintura Anticorrosiva",
      category: AssetCategory.SUPPLY_PAINT,
      description: "Pintura epóxica anticorrosiva para estructuras metálicas",
      icon: "🎨",
      managementType: "BULK" as const,
      requiresPreventiveMaintenance: false,
      requiresDocumentation: true,

      technicalSpecs: {
        type: "Epóxica",
        finish: "Mate",
        coverage: "8-10 m²/L",
      },

      businessRules: {
        requiresTransport: false,
        requiresOperator: false,
        requiresInsurance: false,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "litros",
        containerSize: 4,
        containerType: "Galón",
      },

      hasExpiryDate: true,
      requiresLotTracking: true,
      isDangerous: true,
      hazardClass: "FLAMMABLE",
    },

    // ────────────────────────────────────────────────────────
    // 8. REPUESTOS
    // ────────────────────────────────────────────────────────
    {
      name: "Filtro de Aceite",
      category: AssetCategory.SUPPLY_SPARE_PART,
      description: "Filtro de aceite universal para maquinaria",
      icon: "🔧",
      managementType: "BULK" as const,
      requiresPreventiveMaintenance: false,
      requiresDocumentation: false,

      technicalSpecs: {
        type: "Filtro de aceite",
        thread: "3/4-16 UNF",
        compatibility: "Motores diesel",
      },

      businessRules: {
        requiresTransport: false,
        requiresOperator: false,
        requiresInsurance: false,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "unidades",
        containerSize: 1,
        containerType: "Individual",
      },

      hasExpiryDate: false,
      requiresLotTracking: true,
      isDangerous: false,
    },

    // ────────────────────────────────────────────────────────
    // 9. CONSUMIBLES
    // ────────────────────────────────────────────────────────
    {
      name: "Guantes de Seguridad",
      category: AssetCategory.SUPPLY_CONSUMABLE,
      description: "Guantes de nitrilo desechables",
      icon: "🧤",
      managementType: "BULK" as const,
      requiresPreventiveMaintenance: false,
      requiresDocumentation: false,

      technicalSpecs: {
        material: "Nitrilo",
        thickness: "5 mil",
        size: "M",
      },

      businessRules: {
        requiresTransport: false,
        requiresOperator: false,
        requiresInsurance: false,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "pares",
        containerSize: 100,
        containerType: "Caja",
      },

      hasExpiryDate: true,
      requiresLotTracking: true,
      isDangerous: false,
    },

    // ────────────────────────────────────────────────────────
    // 10. EQUIPOS DE SEGURIDAD
    // ────────────────────────────────────────────────────────
    {
      name: "Arnés de Seguridad",
      category: AssetCategory.SUPPLY_SAFETY,
      description: "Arnés de cuerpo completo para trabajo en alturas",
      icon: "🦺",
      managementType: "BULK" as const,
      requiresPreventiveMaintenance: false,
      requiresDocumentation: true,

      technicalSpecs: {
        type: "Cuerpo completo",
        maxWeight: "140 kg",
        certification: "ANSI Z359.11",
      },

      businessRules: {
        requiresTransport: false,
        requiresOperator: false,
        requiresInsurance: false,
        autoSuggestSupplies: [],
      },

      presentation: {
        unit: "unidades",
        containerSize: 1,
        containerType: "Individual",
      },

      hasExpiryDate: true,
      requiresLotTracking: true,
      isDangerous: false,
    },
  ];

  // Crear plantillas
  let created = 0;
  let skipped = 0;

  for (const template of templates) {
    try {
      const existing = await prisma.assetTemplate.findUnique({
        where: {
          businessUnitId_name: {
            businessUnitId: businessUnit.id,
            name: template.name,
          },
        },
      });

      if (existing) {
        console.log(`⏭️  ${template.name} ya existe, saltando...`);
        skipped++;
        continue;
      }

      await prisma.assetTemplate.create({
        data: {
          ...template,
          businessUnitId: businessUnit.id,
        },
      });

      console.log(`✅ ${template.name} (${template.category})`);
      created++;
    } catch (error) {
      console.error(`❌ Error creando ${template.name}:`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RESUMEN
  // ═══════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(50));
  console.log("✨ Seed de plantillas completado!");
  console.log("=".repeat(50));
  console.log(`\n📊 Resultados:`);
  console.log(`   ✅ Creadas: ${created}`);
  console.log(`   ⏭️  Saltadas: ${skipped}`);
  console.log(`   📦 Total plantillas: ${templates.length}`);
  console.log("\n" + "=".repeat(50));
  console.log("\n🎯 Plantillas disponibles por categoría:\n");
  console.log("   🚜 MAQUINARIA: Retroexcavadora");
  console.log("   🏗️  IMPLEMENTOS: Andamio Tubular");
  console.log("   🚙 VEHÍCULOS: Camioneta 4x4");
  console.log("   🔨 HERRAMIENTAS: Taladro Percutor");
  console.log("   ⛽ COMBUSTIBLES: Diesel");
  console.log("   🛢️  LUBRICANTES: Aceite Hidráulico");
  console.log("   � PINTURAS: Pintura Anticorrosiva");
  console.log("   🔧 REPUESTOS: Filtro de Aceite");
  console.log("   🧤 CONSUMIBLES: Guantes de Seguridad");
  console.log("   🦺 SEGURIDAD: Arnés de Seguridad");
  console.log("\n" + "=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Error en seed de plantillas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
