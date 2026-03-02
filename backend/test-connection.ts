/**
 * Test de conexión a Azure PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('\n🔌 Probando conexión a Azure PostgreSQL...\n');

  try {
    // Test simple con query
    await prisma.$queryRaw`SELECT NOW() as server_time, version() as pg_version`;
    
    console.log('✅ CONEXIÓN EXITOSA!');
    console.log('   Database URL configurado correctamente\n');
    
    // Contar usuarios
    const userCount = await prisma.user.count();
    console.log(`📊 Usuarios en DB: ${userCount}`);
    
    // Verificar migrations
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as total FROM "_prisma_migrations"
    `;
    console.log(`📦 Migraciones aplicadas: ${migrations[0].total}\n`);
    
    console.log('🎉 Todo funciona correctamente!\n');

  } catch (error: any) {
    console.error('❌ ERROR DE CONEXIÓN:\n');
    
    if (error.code === 'P1001') {
      console.error('   No se puede alcanzar el servidor de base de datos');
      console.error('   - Verifica que el password sea correcto');
      console.error('   - Verifica el firewall de Azure (debe permitir tu IP)');
    } else if (error.code === 'P1002') {
      console.error('   El servidor fue alcanzado pero timeout');
    } else if (error.code === '28P01') {
      console.error('   ⚠️  PASSWORD INCORRECTO');
      console.error('   Verifica que el password en DATABASE_URL sea el correcto');
    } else {
      console.error('   ', error.message);
    }
    
    console.error('\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
