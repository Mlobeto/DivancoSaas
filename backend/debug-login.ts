/**
 * Script de debug para verificar estado del usuario en Azure
 * Ejecutar: npx tsx backend/debug-login.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://divanco_admin:DBadmin123!@pg-divanco-dev.postgres.database.azure.com:5432/divanco_dev?sslmode=require"
    }
  }
});

async function debugUser() {
  console.log('\n=== DEBUG LOGIN AZURE ===\n');
  const email = 'Testeando@Testeando.com';
  const testPassword = 'Owner*7754';

  try {
    // Primero, verificar SUPER_ADMIN
    console.log('🔍 Verificando SUPER_ADMIN...\n');
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        password: true,
      }
    });

    if (superAdmin) {
      console.log('✅ SUPER_ADMIN encontrado:');
      console.log('   Email:', superAdmin.email);
      console.log('   Nombre:', superAdmin.firstName, superAdmin.lastName);
      console.log('   Status:', superAdmin.status);
      console.log('   Creado:', superAdmin.createdAt.toISOString());
      console.log('   Password hash:', superAdmin.password.substring(0, 20) + '...');
    } else {
      console.log('❌ NO HAY SUPER_ADMIN en la DB');
    }

    console.log('\n🔍 Buscando usuario:', email);

    // 1. Buscar usuario
    const users = await prisma.user.findMany({
      where: { email },
      include: {
        tenant: true,
        businessUnits: {
          include: {
            businessUnit: true,
            role: true,
          },
        },
      },
    });

    console.log('\n📊 Usuarios encontrados:', users.length);

    if (users.length === 0) {
      console.log('❌ NO SE ENCONTRÓ el usuario con ese email');
      
      // Buscar con lower case
      const usersLower = await prisma.user.findMany({
        where: {
          email: {
            contains: 'testeando',
            mode: 'insensitive'
          }
        },
        select: {
          email: true,
          status: true,
          firstName: true,
          lastName: true,
        }
      });
      
      if (usersLower.length > 0) {
        console.log('\n⚠️  Pero se encontraron estos usuarios similares:');
        usersLower.forEach(u => console.log(`   - ${u.email} (${u.status})`));
      }

      // Listar TODOS los usuarios en la DB
      console.log('\n📋 Usuarios registrados en Azure:');
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          status: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (allUsers.length === 0) {
        console.log('   ⚠️  NO HAY USUARIOS en la base de datos');
        console.log('\n💡 Solución: Registrar el primer usuario en /register');
      } else {
        console.log(`   Total: ${allUsers.length} usuarios:\n`);
        allUsers.forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.email}`);
          console.log(`      Nombre: ${u.firstName} ${u.lastName}`);
          console.log(`      Role: ${u.role}`);
          console.log(`      Status: ${u.status}`);
          console.log(`      Creado: ${u.createdAt.toISOString()}\n`);
        });
      }

      // Ver última migración aplicada
      console.log('\n📦 Últimas 5 migraciones aplicadas:');
      try {
        const migrations = await prisma.$queryRaw<any[]>`
          SELECT migration_name, finished_at 
          FROM "_prisma_migrations" 
          ORDER BY finished_at DESC 
          LIMIT 5
        `;
        
        migrations.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.migration_name}`);
          console.log(`      Fecha: ${m.finished_at?.toISOString() || 'N/A'}\n`);
        });
      } catch (e) {
        console.log('   Error consultando migraciones:', e);
      }
      
      return;
    }

    if (users.length > 1) {
      console.log('\n⚠️  MÚLTIPLES usuarios con ese email:');
      users.forEach((u, i) => {
        console.log(`\n   Usuario ${i + 1}:`);
        console.log(`   - ID: ${u.id}`);
        console.log(`   - Email: ${u.email}`);
        console.log(`   - Tenant: ${u.tenant?.name || 'N/A'} (${u.tenant?.slug || 'N/A'})`);
        console.log(`   - Status: ${u.status}`);
      });
      return;
    }

    const user = users[0];

    console.log('\n✅ Usuario encontrado:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Nombre:', user.firstName, user.lastName);
    console.log('   - Role:', user.role);
    console.log('   - Status:', user.status);
    console.log('   - Tenant ID:', user.tenantId || 'NULL (SUPER_ADMIN)');
    
    if (user.tenant) {
      console.log('\n🏢 Tenant:');
      console.log('   - ID:', user.tenant.id);
      console.log('   - Nombre:', user.tenant.name);
      console.log('   - Slug:', user.tenant.slug);
      console.log('   - Status:', user.tenant.status);
    }

    console.log('\n👥 Business Units:', user.businessUnits.length);
    user.businessUnits.forEach((bu, i) => {
      console.log(`   ${i + 1}. ${bu.businessUnit.name} - Role: ${bu.role?.name || 'N/A'}`);
    });

    // 2. Verificar status
    if (user.status !== 'ACTIVE') {
      console.log('\n❌ PROBLEMA: Usuario NO está ACTIVE');
      console.log('   Status actual:', user.status);
      return;
    }

    if (user.tenant && user.tenant.status !== 'ACTIVE') {
      console.log('\n❌ PROBLEMA: Tenant NO está ACTIVE');
      console.log('   Status del tenant:', user.tenant.status);
      return;
    }

    console.log('\n✅ Status: OK (user y tenant ACTIVE)');

    // 3. Verificar password
    console.log('\n🔐 Verificando password...');
    console.log('   Password hash length:', user.password.length);
    console.log('   Password hash prefix:', user.password.substring(0, 10));
    
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    if (isPasswordValid) {
      console.log('   ✅ PASSWORD VÁLIDO - El login debería funcionar');
    } else {
      console.log('   ❌ PASSWORD INVÁLIDO - Este es el problema!');
      console.log('\n📝 Solución: Resetear el password en la DB');
      
      // Generar nuevo hash para mostrar
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('\n   SQL para actualizar:');
      console.log(`   UPDATE "User" SET password = '${newHash}' WHERE email = '${email}';`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUser();
