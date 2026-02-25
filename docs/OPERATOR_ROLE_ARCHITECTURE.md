# ROL OPERARIO - Vertical Rental

## 🎯 Objetivo

Implementar el rol de OPERARIO como usuario especializado de la vertical rental que opera maquinaria pesada en obra y reporta evidencia desde la app móvil.

## 📋 Casos de Uso

### 1. Gestión de Operarios (Web - Admin/Supervisor)

- Crear perfil de operario
- Asignar licencias y certificaciones
- Gestionar documentación (licencias, curso maquinaria, ARL, etc.)
- Aprobar/rechazar viáticos
- Ver historial de operaciones por operario

### 2. Asignación a Maquinaria (Web - Admin)

- Asignar operario a contrato de rental
- Definir maquinaria que puede operar
- Establecer tarifas (por día/hora)
- Autorizar viáticos

### 3. Operación en Campo (Mobile - Operario)

- Login con credenciales
- Ver mis asignaciones activas
- Reportar inicio/fin de jornada
- Subir evidencia fotográfica (maquinaria, obra, incidentes)
- Reportar horómetro/odómetro
- Solicitar viáticos (combustible, peajes, alimentación)
- Reportar incidentes o mantenimientos necesarios
- Trabajar offline y sincronizar

## 🗄️ Modelos de Datos

### Backend (Prisma Schema)

\`\`\`prisma
// ============================================
// RENTAL VERTICAL - OPERARIOS
// ============================================

model Operator {
id String @id @default(uuid())
tenantId String
businessUnitId String

// Información personal
userId String? // Referencia a User si tiene acceso al sistema
firstName String
lastName String
document String // DNI/RUT/CC
phone String
email String?

// Información laboral
employeeCode String?
status OperatorStatus @default(ACTIVE)
hireDate DateTime
endDate DateTime?

// Documentación
documents OperatorDocument[]

// Tarifas
defaultRateType String? // "PER_DAY" | "PER_HOUR"
defaultRate Decimal? @db.Decimal(10, 2)

// Metadata
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relaciones
tenant Tenant @relation(fields: [tenantId], references: [id])
businessUnit BusinessUnit @relation(fields: [businessUnitId], references: [id])
user User? @relation(fields: [userId], references: [id])
assignments OperatorAssignment[]
dailyReports OperatorDailyReport[]
expenses OperatorExpense[]

@@unique([tenantId, businessUnitId, document])
@@index([tenantId, businessUnitId])
@@index([status])
@@map("operators")
}

enum OperatorStatus {
ACTIVE
INACTIVE
ON_LEAVE // De vacaciones o licencia
SUSPENDED
}

model OperatorDocument {
id String @id @default(uuid())
operatorId String

type OperatorDocumentType
name String // "Licencia A2", "Curso Retroexcavadora", etc.
documentNumber String?
issueDate DateTime?
expiryDate DateTime?
fileUrl String? // Azure Blob Storage
status DocumentStatus @default(PENDING)

// Metadata
uploadedAt DateTime @default(now())
verifiedAt DateTime?
verifiedBy String? // userId del verificador
notes String?

operator Operator @relation(fields: [operatorId], references: [id], onDelete: Cascade)

@@index([operatorId])
@@index([expiryDate]) // Para alertas de vencimiento
@@map("operator_documents")
}

enum OperatorDocumentType {
DRIVERS_LICENSE // Licencia conducir
MACHINERY_LICENSE // Licencia maquinaria específica
TRAINING_CERTIFICATE // Certificado de capacitación
HEALTH_CERTIFICATE // Certificado médico
INSURANCE // Seguro/ARL
CONTRACT // Contrato laboral
OTHER
}

enum DocumentStatus {
PENDING
APPROVED
REJECTED
EXPIRED
}

// Asignación de operario a un contrato de rental
model OperatorAssignment {
id String @id @default(uuid())
tenantId String
operatorId String
rentalContractId String
assetId String // Qué maquinaria opera

startDate DateTime
endDate DateTime?
status AssignmentStatus @default(ACTIVE)

// Tarifas específicas para esta asignación (override defaults)
rateType String? // "PER_DAY" | "PER_HOUR"
rate Decimal? @db.Decimal(10, 2)

// Autorización de viáticos
allowExpenses Boolean @default(true)
dailyExpenseLimit Decimal? @db.Decimal(10, 2)

// Metadata
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
createdBy String

// Relaciones
operator Operator @relation(fields: [operatorId], references: [id])
rentalContract RentalContract @relation(fields: [rentalContractId], references: [id])
asset Asset @relation(fields: [assetId], references: [id])
dailyReports OperatorDailyReport[]
expenses OperatorExpense[]

@@index([operatorId])
@@index([rentalContractId])
@@index([assetId])
@@index([status])
@@map("operator_assignments")
}

enum AssignmentStatus {
ACTIVE
COMPLETED
CANCELLED
}

// Reporte diario del operario desde la app móvil
model OperatorDailyReport {
id String @id @default(uuid())
tenantId String
operatorId String
assignmentId String
assetId String

date DateTime @db.Date

// Jornada laboral
startTime DateTime?
endTime DateTime?
workHours Decimal? @db.Decimal(5, 2) // 8.5 horas

// Lectura de contadores
hourMeter Decimal? @db.Decimal(10, 2)
odometer Decimal? @db.Decimal(10, 2)
fuelLevel String? // "FULL", "3/4", "1/2", "1/4", "EMPTY"

// Ubicación
locationLat Decimal? @db.Decimal(10, 7)
locationLon Decimal? @db.Decimal(10, 7)
locationName String? // "Obra Villa del Mar, Sector A"

// Estado y observaciones
assetCondition AssetCondition @default(GOOD)
notes String?
incidentReported Boolean @default(false)
maintenanceRequired Boolean @default(false)

// Evidencia fotográfica
photos OperatorPhoto[]

// Sincronización (para offline-first)
syncStatus SyncStatus @default(PENDING)
submittedAt DateTime @default(now())
syncedAt DateTime?

// Relaciones
operator Operator @relation(fields: [operatorId], references: [id])
assignment OperatorAssignment @relation(fields: [assignmentId], references: [id])
asset Asset @relation(fields: [assetId], references: [id])

@@unique([assignmentId, date]) // Un reporte por día por asignación
@@index([operatorId])
@@index([date])
@@index([syncStatus])
@@map("operator_daily_reports")
}

enum AssetCondition {
EXCELLENT
GOOD
FAIR
POOR
NEEDS_REPAIR
}

enum SyncStatus {
PENDING // En cola para sincronizar
SYNCED // Sincronizado exitosamente
FAILED // Falló al sincronizar
}

// Evidencia fotográfica del operario
model OperatorPhoto {
id String @id @default(uuid())
reportId String

type PhotoType
description String?
fileUrl String // Azure Blob Storage
fileName String
mimeType String
fileSize Int

// Metadata de la foto
latitude Decimal? @db.Decimal(10, 7)
longitude Decimal? @db.Decimal(10, 7)
takenAt DateTime
uploadedAt DateTime @default(now())

report OperatorDailyReport @relation(fields: [reportId], references: [id], onDelete: Cascade)

@@index([reportId])
@@map("operator_photos")
}

enum PhotoType {
ASSET_START // Foto al iniciar jornada
ASSET_END // Foto al finalizar jornada
HOUROMETER // Foto del horómetro/odómetro
INCIDENT // Foto de incidente o daño
WORK_PROGRESS // Foto del avance de obra
OTHER
}

// Viáticos y gastos del operario
model OperatorExpense {
id String @id @default(uuid())
tenantId String
operatorId String
assignmentId String

date DateTime @db.Date
type ExpenseType
description String
amount Decimal @db.Decimal(10, 2)

// Evidencia
receiptUrl String? // Foto del comprobante

// Aprobación
status ExpenseStatus @default(PENDING)
approvedAt DateTime?
approvedBy String?
rejectionReason String?

// Metadata
submittedAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relaciones
operator Operator @relation(fields: [operatorId], references: [id])
assignment OperatorAssignment @relation(fields: [assignmentId], references: [id])

@@index([operatorId])
@@index([assignmentId])
@@index([status])
@@index([date])
@@map("operator_expenses")
}

enum ExpenseType {
FUEL
TOLL
PARKING
FOOD
TRANSPORT
ACCOMMODATION
OTHER
}

enum ExpenseStatus {
PENDING
APPROVED
REJECTED
PAID
}
\`\`\`

## 🔐 Permisos RBAC

### Rol: OPERATOR (rol global en UserRole enum)

\`\`\`typescript
// Agregar a UserRole enum
enum UserRole {
OWNER
ADMIN
USER
OPERATOR // NUEVO
}
\`\`\`

### Permisos específicos para OPERATOR:

\`\`\`
operator.view_own_assignments
operator.submit_daily_reports
operator.upload_photos
operator.submit_expenses
operator.view_own_profile
operator.view_own_documents
\`\`\`

### Permisos para ADMIN/SUPERVISOR:

\`\`\`
operators.create
operators.read
operators.update
operators.delete
operators.assign_to_contracts
operators.approve_expenses
operators.manage_documents
operators.view_reports
\`\`\`

## 📱 App Móvil - Funcionalidades

### Pantallas Principales

1. **Login**
   - Solo operarios autorizados
   - Offline login (token guardado)

2. **Dashboard**
   - Mis asignaciones activas
   - Reportes pendientes de hoy
   - Viáticos pendientes de aprobación

3. **Reporte Diario**
   - Iniciar jornada (registra hora, GPS, foto maquinaria)
   - Ingresar horómetro/odómetro
   - Tomar fotos de evidencia
   - Calificar estado de maquinaria
   - Agregar notas
   - Finalizar jornada (foto final)

4. **Viáticos**
   - Registrar gasto (tipo, monto)
   - Foto del comprobante
   - Enviar para aprobación

5. **Perfil**
   - Ver mis documentos
   - Ver historial de reportes
   - Ver viáticos aprobados/rechazados

### Funcionalidades Offline

- Cache local con SQLite
- Cola de sincronización
- Fotos guardadas localmente
- Sincronización automática al recuperar conexión

## 🚀 Plan de Implementación

### Fase 1: Backend (2-3 días)

1. ✅ Agregar modelos Prisma
2. ✅ Migrations
3. ✅ Servicios CRUD para operarios
4. ✅ Endpoints de asignaciones
5. ✅ Endpoints de reportes diarios
6. ✅ Endpoints de viáticos
7. ✅ Upload de fotos a Azure Blob
8. ✅ Permisos RBAC

### Fase 2: Web Admin (2 días)

1. ✅ CRUD de operarios
2. ✅ Gestión de documentos
3. ✅ Asignación a contratos
4. ✅ Dashboard de reportes
5. ✅ Aprobación de viáticos

### Fase 3: App Móvil (3-4 días)

1. ✅ Setup autenticación
2. ✅ Pantalla login
3. ✅ Dashboard operario
4. ✅ Formulario reporte diario
5. ✅ Cámara y galería
6. ✅ Formulario viáticos
7. ✅ Sync offline-first

### Fase 4: Testing & Deploy (1 día)

1. ✅ Testing E2E
2. ✅ Deploy backend
3. ✅ Build y deploy app móvil

## 🔧 Stack Técnico

### Backend

- Prisma para modelos
- Azure Blob Storage para fotos
- Express REST API
- JWT auth

### Web

- React
- TanStack Query
- Formularios operarios
- Dashboard reportes

### Mobile

- Expo (React Native)
- expo-camera para fotos
- expo-location para GPS
- SQLite para cache offline
- AsyncStorage para auth
- TanStack Query con offline support

---

¿Quieres que empecemos con la implementación? ¿Por dónde prefieres comenzar: Backend, Web o Mobile?
