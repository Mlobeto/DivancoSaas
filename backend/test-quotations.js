/**
 * Script de prueba para verificar el módulo de Cotizaciones
 * Uso: node test-quotations.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

async function main() {
  console.log(
    `\n${colors.blue}🔍 Verificando Sistema de Cotizaciones${colors.reset}\n`,
  );

  try {
    // 1. Verificar conexión a BD
    console.log(
      `${colors.yellow}1. Verificando conexión a Azure PostgreSQL...${colors.reset}`,
    );
    await prisma.$connect();
    console.log(`${colors.green}   ✓ Conexión exitosa${colors.reset}\n`);

    // 2. Verificar tablas existen
    console.log(
      `${colors.yellow}2. Verificando tablas del módulo...${colors.reset}`,
    );

    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Template', 'Quotation', 'QuotationItem', 'QuotationContract')
      ORDER BY table_name;
    `;

    console.log(`   Tablas encontradas (mayúsculas): ${tables.length}`);

    // Si no encuentra con mayúsculas, buscar en minúsculas/snake_case
    if (tables.length === 0) {
      console.log(
        `   ${colors.yellow}Buscando con nombres alternativos...${colors.reset}`,
      );

      const allTables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (
          table_name LIKE '%quotation%' OR 
          table_name LIKE '%Quotation%' OR
          table_name LIKE '%template%' OR 
          table_name LIKE '%Template%' OR
          table_name LIKE '%contract%' OR
          table_name LIKE '%Contract%'
        )
        ORDER BY table_name;
      `;

      console.log(`   Tablas relacionadas encontradas: ${allTables.length}`);
      allTables.forEach((t) => {
        console.log(`   ${colors.green}✓${colors.reset} ${t.table_name}`);
      });

      if (allTables.length === 0) {
        throw new Error(
          "No se encontraron tablas del módulo de cotizaciones. Ejecuta: npx prisma migrate deploy",
        );
      }
    } else {
      tables.forEach((t) => {
        console.log(`   ${colors.green}✓${colors.reset} ${t.table_name}`);
      });
    }
    console.log("");

    // 3. Verificar Tenant y BusinessUnit existentes
    console.log(
      `${colors.yellow}3. Buscando datos de prueba...${colors.reset}`,
    );

    const tenants = await prisma.tenant.findMany({
      take: 1,
      include: {
        businessUnits: {
          take: 1,
        },
      },
    });

    if (tenants.length === 0) {
      console.log(
        `${colors.red}   ⚠ No hay tenants en la BD. Necesitas crear uno primero.${colors.reset}\n`,
      );
      return;
    }

    const tenant = tenants[0];
    const businessUnit = tenant.businessUnits[0];

    if (!businessUnit) {
      console.log(
        `${colors.red}   ⚠ El tenant no tiene business units. Necesitas crear una primero.${colors.reset}\n`,
      );
      return;
    }

    console.log(
      `   ${colors.green}✓${colors.reset} Tenant: ${tenant.name} (${tenant.id})`,
    );
    console.log(
      `   ${colors.green}✓${colors.reset} BusinessUnit: ${businessUnit.name} (${businessUnit.id})\n`,
    );

    // 4. Verificar Templates
    console.log(`${colors.yellow}4. Verificando Templates...${colors.reset}`);
    const templatesCount = await prisma.template.count({
      where: {
        tenantId: tenant.id,
      },
    });
    console.log(`   Templates encontrados: ${templatesCount}`);
    if (templatesCount === 0) {
      console.log(
        `   ${colors.yellow}ℹ No hay templates. Puedes crear uno con el endpoint POST /api/v1/rental/templates${colors.reset}`,
      );
    }
    console.log("");

    // 5. Verificar Quotations
    console.log(`${colors.yellow}5. Verificando Quotations...${colors.reset}`);
    const quotationsCount = await prisma.quotation.count({
      where: {
        tenantId: tenant.id,
      },
    });
    console.log(`   Cotizaciones encontradas: ${quotationsCount}`);

    if (quotationsCount > 0) {
      const lastQuotation = await prisma.quotation.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      });
      console.log(
        `   ${colors.green}✓${colors.reset} Última cotización: ${lastQuotation.code}`,
      );
      console.log(`     - Estado: ${lastQuotation.status}`);
      console.log(
        `     - Total: ${lastQuotation.currency} ${lastQuotation.totalAmount}`,
      );
      console.log(`     - Items: ${lastQuotation.items.length}`);
    } else {
      console.log(
        `   ${colors.yellow}ℹ No hay cotizaciones. Puedes crear una con el endpoint POST /api/v1/rental/quotations${colors.reset}`,
      );
    }
    console.log("");

    // 6. Verificar si hay clientes
    console.log(`${colors.yellow}6. Verificando Clientes...${colors.reset}`);
    const clientsCount = await prisma.client.count({
      where: {
        tenantId: tenant.id,
      },
    });
    console.log(`   Clientes encontrados: ${clientsCount}`);
    if (clientsCount === 0) {
      console.log(
        `   ${colors.yellow}ℹ No hay clientes. Necesitas crear uno para hacer cotizaciones.${colors.reset}`,
      );
      console.log(
        `   ${colors.yellow}  Endpoint: POST /api/v1/clients${colors.reset}`,
      );
    } else {
      console.log(
        `   ${colors.green}✓${colors.reset} Hay ${clientsCount} cliente(s) disponible(s) para cotizaciones`,
      );
    }
    console.log("");

    // 7. Verificar Assets (para Rental)
    console.log(
      `${colors.yellow}7. Verificando Assets (maquinaria/equipos)...${colors.reset}`,
    );
    const assetsCount = await prisma.asset.count({
      where: {
        tenantId: tenant.id,
      },
    });
    console.log(`   Assets encontrados: ${assetsCount}`);
    if (assetsCount === 0) {
      console.log(
        `   ${colors.yellow}ℹ No hay assets. Para cotizaciones de alquiler necesitas crear equipos.${colors.reset}`,
      );
      console.log(
        `   ${colors.yellow}  Endpoint: POST /api/v1/assets${colors.reset}`,
      );
    } else {
      console.log(
        `   ${colors.green}✓${colors.reset} Hay ${assetsCount} asset(s) disponible(s) para alquilar`,
      );
    }
    console.log("");

    // Resumen
    console.log(
      `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(
      `${colors.green}✅ Sistema de Cotizaciones verificado correctamente${colors.reset}`,
    );
    console.log(
      `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    // Información para siguiente paso
    console.log(`${colors.blue}📋 Próximos pasos:${colors.reset}\n`);

    if (clientsCount === 0) {
      console.log(`   1. Crear un cliente:`);
      console.log(`      ${colors.yellow}POST /api/v1/clients${colors.reset}`);
      console.log(`      {`);
      console.log(`        "tenantId": "${tenant.id}",`);
      console.log(`        "businessUnitId": "${businessUnit.id}",`);
      console.log(`        "name": "Cliente Ejemplo",`);
      console.log(`        "email": "cliente@example.com"`);
      console.log(`      }\n`);
    }

    if (assetsCount === 0) {
      console.log(`   2. Crear assets (equipos/maquinaria):`);
      console.log(`      ${colors.yellow}POST /api/v1/assets${colors.reset}\n`);
    }

    console.log(
      `   ${clientsCount > 0 && assetsCount > 0 ? "1" : "3"}. Crear una cotización:`,
    );
    console.log(
      `      ${colors.yellow}POST /api/v1/rental/quotations${colors.reset}`,
    );
    console.log(`      {`);
    console.log(`        "businessUnitId": "${businessUnit.id}",`);
    console.log(`        "clientId": "<CLIENT_ID>",`);
    console.log(`        "validUntil": "2026-03-11",`);
    console.log(`        "items": [...]`);
    console.log(`      }\n`);

    console.log(
      `   ${clientsCount > 0 && assetsCount > 0 ? "2" : "4"}. Ver documentación completa:`,
    );
    console.log(`      ${colors.yellow}docs/RENTAL_ROUTES.md${colors.reset}`);
    console.log(
      `      ${colors.yellow}docs/QUOTATIONS_SIGNATURES_CONTRACTS.md${colors.reset}\n`,
    );
  } catch (error) {
    console.error(`\n${colors.red}❌ Error:${colors.reset}`, error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
