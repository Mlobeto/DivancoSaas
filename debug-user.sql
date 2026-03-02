-- Verificar estado del usuario Testeando@Testeando.com
SELECT 
  u.id as user_id,
  u.email,
  u.status as user_status,
  u."firstName",
  u."lastName",
  u.role,
  u."tenantId",
  t.id as tenant_id,
  t.name as tenant_name,
  t.slug as tenant_slug,
  t.status as tenant_status,
  (SELECT COUNT(*) FROM "User" WHERE email = u.email) as users_with_email,
  LENGTH(u.password) as password_hash_length,
  SUBSTRING(u.password, 1, 10) as password_hash_prefix
FROM "User" u
LEFT JOIN "Tenant" t ON u."tenantId" = t.id
WHERE u.email = 'Testeando@Testeando.com';

-- Verificar si el email existe con diferente capitalización
SELECT email, status, "firstName", "lastName"
FROM "User"
WHERE LOWER(email) = LOWER('Testeando@Testeando.com');

-- Ver todos los usuarios activos (para verificar si hay alguno)
SELECT 
  email, 
  status, 
  role,
  "firstName",
  "lastName"
FROM "User"
WHERE status = 'ACTIVE'
LIMIT 10;
