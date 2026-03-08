/**
 * SEED DE CLÁUSULAS DE CONTRATO - MASTER CONTRACT SYSTEM
 *
 * Este seed crea plantillas de cláusulas predeterminadas para contratos maestros:
 * - Cláusulas generales (responsabilidades, condiciones de uso)
 * - Cláusulas de seguridad (operación segura, EPP, capacitación)
 * - Cláusulas de mantenimiento (cuidado del equipo, inspecciones)
 * - Cláusulas de seguro (cobertura, daños, responsabilidad)
 * - Cláusulas de responsabilidad (daños a terceros, multas, sanciones)
 * - Cláusulas de terminación (devolución, condiciones de finalización)
 *
 * Ejecutar con: npm run prisma:seed:clauses
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de cláusulas de contrato...\n");

  // Buscar el Tenant y Business Unit de prueba
  const tenant = await prisma.tenant.findFirst({
    where: { slug: "construcciones-demo" },
    include: {
      businessUnits: {
        where: { slug: "alquiler" },
      },
    },
  });

  if (!tenant || tenant.businessUnits.length === 0) {
    console.error("❌ No se encontró Tenant o Business Unit de prueba.");
    console.log("💡 Ejecuta primero: npm run prisma:seed");
    process.exit(1);
  }

  const businessUnit = tenant.businessUnits[0];
  console.log(
    `📦 Creando cláusulas para: ${tenant.name} - ${businessUnit.name}\n`,
  );

  // ═══════════════════════════════════════════════════════════
  // CLÁUSULAS DE CONTRATO
  // ═══════════════════════════════════════════════════════════

  const clauses = [
    // ────────────────────────────────────────────────────────
    // 1. CLÁUSULAS GENERALES
    // ────────────────────────────────────────────────────────
    {
      name: "Responsabilidad del Cliente",
      category: "general",
      content: `El CLIENTE se compromete a utilizar el equipo arrendado única y exclusivamente para las actividades señaladas en este contrato, siguiendo todas las normas de seguridad y operación recomendadas por el fabricante y el ARRENDADOR. El CLIENTE es responsable de cualquier daño, pérdida o robo del equipo desde el momento de la entrega hasta su devolución.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 1,
    },
    {
      name: "Condiciones de Uso",
      category: "general",
      content: `El equipo debe ser operado por personal calificado y autorizado por el CLIENTE. Queda prohibido: (a) Usar el equipo para propósitos distintos a los acordados, (b) Subarrendar o ceder el equipo a terceros sin autorización escrita, (c) Realizar modificaciones o reparaciones sin autorización del ARRENDADOR, (d) Operar el equipo bajo condiciones inseguras o fuera de su capacidad nominal.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 2,
    },
    {
      name: "Periodo de Alquiler y Prorrogas",
      category: "general",
      content: `El periodo de alquiler inicia con la entrega del equipo según el addendum correspondiente y finaliza con su devolución documentada. Las prórrogas del periodo deben ser solicitadas con 48 horas de anticipación y están sujetas a disponibilidad del equipo. El CLIENTE acepta que cualquier retención del equipo más allá del periodo acordado generará cargos adicionales según las tarifas vigentes.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 3,
    },

    // ────────────────────────────────────────────────────────
    // 2. CLÁUSULAS DE SEGURIDAD
    // ────────────────────────────────────────────────────────
    {
      name: "Operación Segura de Maquinaria",
      category: "safety",
      content: `El CLIENTE se compromete a que toda maquinaria pesada sea operada únicamente por personal certificado y calificado. Es responsabilidad del CLIENTE verificar que los operadores cuenten con: (a) Licencia de conducción vigente según corresponda, (b) Capacitación específica en el tipo de equipo arrendado, (c) Conocimiento de las normas de seguridad industrial aplicables, (d) Condiciones físicas y mentales aptas para la operación.`,
      applicableAssetTypes: [
        "retroexcavadora",
        "excavadora",
        "minicargador",
        "grúa",
        "montacargas",
      ],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 10,
    },
    {
      name: "Elementos de Protección Personal",
      category: "safety",
      content: `El CLIENTE garantiza que todo el personal que opere o trabaje cerca del equipo arrendado utilizará los Elementos de Protección Personal (EPP) requeridos según la legislación vigente y las recomendaciones del fabricante. Como mínimo: casco de seguridad, calzado de seguridad, chaleco reflectivo, guantes de trabajo y protección auditiva cuando sea necesario. El incumplimiento de esta cláusula exime al ARRENDADOR de cualquier responsabilidad por accidentes.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 11,
    },
    {
      name: "Inspección Preoperacional",
      category: "safety",
      content: `El CLIENTE se compromete a realizar inspecciones preoperacionales diarias del equipo arrendado, verificando niveles de fluidos, estado de neumáticos o cadenas, sistemas de freno, luces, alarmas de reversa y cualquier otro sistema de seguridad. Cualquier anomalía debe ser reportada inmediatamente al ARRENDADOR antes de operar el equipo. El uso de equipo con fallas de seguridad es responsabilidad exclusiva del CLIENTE.`,
      applicableAssetTypes: [
        "retroexcavadora",
        "excavadora",
        "minicargador",
        "grúa",
        "montacargas",
        "camioneta",
      ],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 12,
    },
    {
      name: "Capacitación y Autorización",
      category: "safety",
      content: `El ARRENDADOR proporcionará al CLIENTE una inducción básica sobre el uso seguro del equipo al momento de la entrega. Sin embargo, es responsabilidad del CLIENTE asegurar que sus operadores cuenten con la capacitación completa y específica requerida para operar el equipo de manera profesional y segura. El ARRENDADOR puede solicitar evidencia de certificaciones o licencias en cualquier momento.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 13,
    },

    // ────────────────────────────────────────────────────────
    // 3. CLÁUSULAS DE MANTENIMIENTO
    // ────────────────────────────────────────────────────────
    {
      name: "Mantenimiento Preventivo",
      category: "maintenance",
      content: `El ARRENDADOR se compromete a entregar el equipo en óptimas condiciones de funcionamiento y con el mantenimiento preventivo al día. Durante el periodo de alquiler, el ARRENDADOR es responsable del mantenimiento preventivo programado según las especificaciones del fabricante, siempre que el equipo sea devuelto temporalmente para este propósito. El CLIENTE debe permitir el acceso al equipo para estas actividades con 48 horas de anticipación.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 20,
    },
    {
      name: "Mantenimiento Correctivo por Uso Normal",
      category: "maintenance",
      content: `El ARRENDADOR se hace responsable de cualquier mantenimiento correctivo derivado del uso normal y adecuado del equipo. En caso de falla, el CLIENTE debe notificar inmediatamente al ARRENDADOR y suspender el uso del equipo. El ARRENDADOR atenderá el reporte en un plazo máximo de 24 horas laborales. Durante el periodo de reparación, el cobro del alquiler se suspenderá si la falla es responsabilidad del ARRENDADOR.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 21,
    },
    {
      name: "Cuidado Diario del Equipo",
      category: "maintenance",
      content: `El CLIENTE es responsable del cuidado diario del equipo, incluyendo: limpieza regular, verificación de niveles de fluidos (aceite, combustible, refrigerante, hidráulico), inflado de neumáticos, engrase de puntos de lubricación cuando aplique, y almacenamiento en condiciones seguras y protegidas de la intemperie cuando sea posible. El descuido en estas tareas puede generar daños que serán responsabilidad del CLIENTE.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 22,
    },
    {
      name: "Reparaciones No Autorizadas",
      category: "maintenance",
      content: `El CLIENTE no está autorizado a realizar reparaciones, modificaciones o ajustes al equipo sin autorización escrita previa del ARRENDADOR. En caso de requerir una reparación de emergencia para evitar daños mayores, el CLIENTE debe obtener aprobación telefónica o por correo electrónico del ARRENDADOR antes de proceder. Las reparaciones no autorizadas pueden resultar en cargos adicionales y pérdida de garantías.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 23,
    },

    // ────────────────────────────────────────────────────────
    // 4. CLÁUSULAS DE SEGURO Y COBERTURA
    // ────────────────────────────────────────────────────────
    {
      name: "Seguro del Equipo",
      category: "insurance",
      content: `El ARRENDADOR mantiene seguro contra daños propios del equipo (todo riesgo). Sin embargo, el CLIENTE es responsable de cualquier daño causado por negligencia, mal uso, operación inadecuada, o caso fortuito. El CLIENTE debe notificar cualquier siniestro al ARRENDADOR en un plazo máximo de 12 horas. El deducible del seguro será asumido por el CLIENTE según lo establecido en el addendum correspondiente.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 30,
    },
    {
      name: "Responsabilidad por Robo",
      category: "insurance",
      content: `En caso de robo del equipo, el CLIENTE debe: (a) Presentar denuncia inmediata ante las autoridades competentes, (b) Notificar al ARRENDADOR dentro de las 12 horas siguientes al conocimiento del hecho, (c) Proporcionar copia de la denuncia formal. El CLIENTE será responsable del valor del equipo hasta que la aseguradora apruebe y pague la reclamación. Si el robo se debió a negligencia en el resguardo, el CLIENTE asumirá el costo total.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 31,
    },
    {
      name: "Daños a Terceros",
      category: "insurance",
      content: `El CLIENTE asume total responsabilidad por cualquier daño causado a terceras personas o propiedades durante el uso del equipo arrendado. El CLIENTE debe contar con su propia póliza de responsabilidad civil extracontractual que cubra este tipo de eventos. El ARRENDADOR no será responsable de reclamaciones de terceros derivadas del uso del equipo por parte del CLIENTE.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 32,
    },

    // ────────────────────────────────────────────────────────
    // 5. CLÁUSULAS DE RESPONSABILIDAD
    // ────────────────────────────────────────────────────────
    {
      name: "Daños por Mal Uso",
      category: "liability",
      content: `El CLIENTE será responsable económicamente de cualquier daño al equipo causado por: uso inadecuado, sobrecarga, operación por personal no calificado, negligencia, o incumplimiento de las normas de operación. Los costos de reparación serán determinados por el ARRENDADOR según cotizaciones de talleres certificados. El CLIENTE autoriza al ARRENDADOR a descontar estos valores de su cuenta o garantía.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 40,
    },
    {
      name: "Multas y Sanciones",
      category: "liability",
      content: `El CLIENTE será responsable de cualquier multa, sanción, comparendo, o penalidad impuesta por autoridades durante el periodo de alquiler del equipo. Esto incluye multas de tránsito, infracciones ambientales, sanciones por operación sin permisos, o cualquier otra penalidad administrativa. El CLIENTE debe notificar cualquier comparendo al ARRENDADOR dentro de las 48 horas siguientes.`,
      applicableAssetTypes: [
        "camioneta",
        "retroexcavadora",
        "excavadora",
        "minicargador",
      ],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 41,
    },
    {
      name: "Pérdida de Ingresos",
      category: "liability",
      content: `En caso de que el equipo sufra daños que impidan su uso, el CLIENTE será responsable del pago de alquiler durante el periodo de reparación, siempre que el daño haya sido causado por mal uso, negligencia, o incumplimiento de las condiciones del contrato. Adicionalmente, el CLIENTE deberá compensar al ARRENDADOR por la pérdida de ingresos si la reparación excede los 15 días calendario.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 42,
    },

    // ────────────────────────────────────────────────────────
    // 6. CLÁUSULAS DE TERMINACIÓN
    // ────────────────────────────────────────────────────────
    {
      name: "Devolución del Equipo",
      category: "termination",
      content: `Al finalizar el periodo de alquiler de cada addendum, el CLIENTE debe devolver el equipo en las mismas condiciones en que fue recibido (desgaste normal permitido), limpio, y con los mismos niveles de combustible e insumos. La devolución debe realizarse en el lugar acordado durante el horario laboral. El ARRENDADOR inspeccionará el equipo en presencia del CLIENTE y documentará su estado con fotografías.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 50,
    },
    {
      name: "Terminación Anticipada",
      category: "termination",
      content: `El CLIENTE puede terminar el alquiler de forma anticipada notificando al ARRENDADOR con 5 días calendario de anticipación. El ARRENDADOR puede terminar el contrato de forma inmediata si el CLIENTE: (a) Incumple las condiciones de pago, (b) Utiliza el equipo de forma inadecuada o peligrosa, (c) Subarrienda el equipo sin autorización, (d) Incumple cualquier cláusula fundamental del contrato.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: true,
      displayOrder: 51,
    },
    {
      name: "Inspección de Devolución",
      category: "termination",
      content: `Al momento de la devolución, el ARRENDADOR realizará una inspección completa del equipo, verificando: estado físico general, funcionamiento de todos los sistemas, niveles de fluidos, documentación (manuales, herramientas), y estado de limpieza. Si se detectan daños, faltantes, o desgaste anormal, se generará un informe que el CLIENTE deberá firmar. Los costos de reparación o reposición serán facturados según avalúo técnico.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 52,
    },
    {
      name: "Liquidación Final",
      category: "termination",
      content: `Una vez devuelto e inspeccionado el equipo, el ARRENDADOR elaborará una liquidación final del addendum correspondiente, incluyendo: días efectivos de alquiler, horas u kilómetros consumidos, cargos por operador (si aplica), cargos adicionales por daños o incumplimientos, y descuentos o bonificaciones acordadas. El CLIENTE tendrá un plazo de 5 días hábiles para objetar la liquidación, después del cual se considerará aceptada.`,
      applicableAssetTypes: [],
      applicableContractTypes: ["master", "specific"],
      isActive: true,
      isDefault: false,
      displayOrder: 53,
    },
  ];

  console.log("📝 Creando cláusulas de contrato...\n");

  let createdCount = 0;
  let skippedCount = 0;

  for (const clause of clauses) {
    try {
      // Verificar si ya existe
      const existing = await prisma.contractClauseTemplate.findFirst({
        where: {
          tenantId: tenant.id,
          name: clause.name,
        },
      });

      if (existing) {
        console.log(`   ⏭️  Ya existe: ${clause.name}`);
        skippedCount++;
        continue;
      }

      // Crear la cláusula
      await prisma.contractClauseTemplate.create({
        data: {
          tenantId: tenant.id,
          businessUnitId: businessUnit.id,
          ...clause,
        },
      });

      console.log(`   ✅ ${clause.name} (${clause.category})`);
      createdCount++;
    } catch (error) {
      console.error(`   ❌ Error creando ${clause.name}:`, error);
    }
  }

  console.log(`\n✨ Seed completado:`);
  console.log(`   📝 Cláusulas creadas: ${createdCount}`);
  console.log(`   ⏭️  Cláusulas existentes: ${skippedCount}`);
  console.log(`\n💡 Próximos pasos:`);
  console.log(`   1. Migrar contratos existentes a tipo 'specific'`);
  console.log(`   2. Probar creación de contratos maestros con addendums`);
  console.log(`   3. Implementar servicios backend para flujo de aprobación`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
