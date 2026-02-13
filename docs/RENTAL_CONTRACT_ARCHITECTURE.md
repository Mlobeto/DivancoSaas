# ARQUITECTURA DE CONTRATOS DE ALQUILER - DivancoSaaS

**Fecha:** 2026-02-12  
**Versión:** 2.0 (Corregida con modelo real de negocio)

---

## 🎯 MODELO DE NEGOCIO REAL

### **Principio Fundamental: TODO contrato es por CRÉDITO**

```
1. Cliente solicita cotización
   ↓
2. Se cotiza (por obra con tiempo O por servicio sin tiempo)
   ↓
3. Cliente entrega ANTICIPO $$
   ↓
4. Mientras tenga SALDO puede RETIRAR assets
   ↓
5. Al retirar → se DESCUENTA del saldo
   ↓
6. Al devolver → se AJUSTA el saldo (si devuelve antes o después)
   ↓
7. Si necesita más → RECARGA más dinero
   ↓
8. Cuando saldo → $0 → Termina contrato (o recarga)
```

### **NO existen "dos tipos de contrato"**

❌ **Incorrecto**: "Contrato por ANTICIPO" vs "Contrato por TIEMPO"  
✅ **Correcto**: **TODOS son por crédito**, la diferencia está en **cómo se cotiza**:

#### **Tipo 1: Cotización con Tiempo Estimado (para obra específica)**

```
Cliente: Juan Pérez
Proyecto: Construcción Edificio Los Álamos
Duración ESTIMADA: 60 días (puede variar por clima ☔)

Items cotizados:
┌────────────────────────────────────────────────────┐
│ Asset                   │ Días Est. │ Total        │
├────────────────────────────────────────────────────┤
│ Retroexcavadora CAT 420F│ 60        │ $300,000     │
│ Operario certificado    │ 60        │ $180,000     │
│ Herramientas menores    │ -         │  $20,000     │
└────────────────────────────────────────────────────┘
TOTAL ESTIMADO: $500,000
ANTICIPO ACORDADO: $500,000 (puede ser menos)

Durante el contrato (mientras tenga saldo):
✅ Puede retirar esos assets
✅ Puede retirar OTROS assets
✅ Si llueve y devuelve temprano → se ajusta saldo
✅ Si necesita más días → recarga más dinero
✅ Si necesita otros equipos → los retira (se descuenta del saldo)
```

#### **Tipo 2: Cotización por Servicio/Trabajo (sin tiempo definido)**

```
Cliente: Constructora ABC
Trabajo: "Hacer 2 km de camino rural"
Duración: NO SE DEFINE (hasta terminar)

Items cotizados:
┌────────────────────────────────────────────────────┐
│ Descripción                         │ Total        │
├────────────────────────────────────────────────────┤
│ Servicio completo 2km camino        │ $150,000     │
└────────────────────────────────────────────────────┘

Desglose interno (informativo, NO vinculante):
- Motoniveladora
- Compactadora
- Operarios

TOTAL TRABAJO: $150,000
ANTICIPO: $150,000

Durante el contrato:
✅ Retira lo que necesite
✅ Solo importa el SALDO en la cuenta
✅ Cuando saldo = $0 → Termina o recarga
```

---

## 📐 SCHEMA DE BASE DE DATOS

### 1. **Asset** - Maquinaria/Implementos

```prisma
model Asset {
  id             String   @id @default(uuid())
  tenantId       String
  businessUnitId String
  code           String   // Código único: MQ-001
  name           String

  // Categorización
  assetType      String   // Configurable por BU
  templateId     String?  // Template de configuración

  // Estado y ubicación
  status         String   // "available", "rented", "maintenance", "retired"
  currentLocation String?

  // Costos
  acquisitionCost     Decimal? @db.Decimal(12,2)

  // NUEVO: Precios sugeridos (base para cotizaciones)
  suggestedPriceHourly   Decimal? @db.Decimal(10,2)
  suggestedPriceDaily    Decimal? @db.Decimal(10,2)
  suggestedPriceWeekly   Decimal? @db.Decimal(10,2)
  suggestedPriceMonthly  Decimal? @db.Decimal(10,2)

  // Costos adicionales
  requiresOperatorCost   Decimal? @db.Decimal(10,2) // Costo diario de operario
  maintenanceCostDaily   Decimal? @db.Decimal(10,2) // Costo estimado mantenimiento

  // Características operativas
  requiresOperator  Boolean @default(false)
  requiresTracking  Boolean @default(false)
  requiresClinic    Boolean @default(false)

  // NUEVO: Imagen principal
  imageUrl       String?

  // ... otros campos existentes ...

  // Relaciones
  template       AssetTemplate? @relation(fields: [templateId], references: [id])
  quotationItems QuotationItem[]
  movements      AccountMovement[]

  @@unique([tenantId, code])
  @@index([tenantId, businessUnitId, status])
}
```

### 2. **Quotation** - Cotización (ya existe, pequeños ajustes)

```prisma
model Quotation {
  id             String   @id @default(uuid())
  tenantId       String
  businessUnitId String
  code           String   // QU-2026-001
  clientId       String
  assignedUserId String?
  status         String

  // Montos
  subtotal    Decimal @db.Decimal(12, 2)
  taxRate     Decimal @db.Decimal(5, 2) @default(0)
  taxAmount   Decimal @db.Decimal(12, 2)
  totalAmount Decimal @db.Decimal(12, 2)
  currency    String  @default("USD")

  // NUEVO: Tipo de cotización (informativo)
  quotationType String @default("time_based") // "time_based" | "service_based"

  // NUEVO: Para cotizaciones con tiempo estimado
  estimatedStartDate DateTime?
  estimatedEndDate   DateTime?
  estimatedDays      Int?

  // NUEVO: Para cotizaciones de servicio
  serviceDescription String? @db.Text

  // Validez
  quotationDate DateTime @default(now())
  validUntil    DateTime

  // Documentos y firma (existentes)
  templateId         String?
  pdfUrl             String?
  signedPdfUrl       String?
  signatureRequestId String?
  signatureStatus    String?
  signatureProvider  String?
  signedAt           DateTime?
  signedBy           String?

  // Pago
  paymentStatus   String @default("pending")
  paymentIntentId String?
  paidAt          DateTime?

  // Metadata
  notes              String? @db.Text
  termsAndConditions String? @db.Text
  metadata           Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String

  // Relaciones
  tenant       Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit BusinessUnit @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  client       Client       @relation(fields: [clientId], references: [id])
  assignedUser User?        @relation("AssignedQuotations", fields: [assignedUserId], references: [id])
  template     Template?    @relation(fields: [templateId], references: [id])
  creator      User         @relation("CreatedQuotations", fields: [createdBy], references: [id])

  items    QuotationItem[]
  contract RentalContract? // Relación 1:1 con contrato

  @@unique([tenantId, code])
  @@index([tenantId, businessUnitId, status])
  @@index([clientId])
}
```

### 3. **QuotationItem** - Items de la cotización

```prisma
model QuotationItem {
  id          String  @id @default(uuid())
  quotationId String
  assetId     String?
  description String
  quantity    Int

  // Precios
  unitPrice Decimal @db.Decimal(10, 2)
  total     Decimal @db.Decimal(10, 2)

  // NUEVO: Desglose de precio (opcional, para contratos flexibles)
  basePrice       Decimal? @db.Decimal(10,2) // Precio base del asset
  operatorCost    Decimal? @db.Decimal(10,2) // Costo de operario
  maintenanceCost Decimal? @db.Decimal(10,2) // Costo de mantenimiento
  discount        Decimal? @db.Decimal(10,2) // Descuento aplicado
  discountReason  String?

  // NUEVO: Para cotizaciones con tiempo (OPCIONAL)
  estimatedDays      Int?      // Días estimados (puede ser null si es por servicio)
  rentalPeriodType   String?   // "hourly" | "daily" | "weekly" | "monthly"
  estimatedStartDate DateTime?
  estimatedEndDate   DateTime?

  metadata  Json?
  sortOrder Int   @default(0)

  quotation Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  asset     Asset?    @relation(fields: [assetId], references: [id])

  @@index([quotationId])
}
```

### 4. **RentalContract** - Contrato de Alquiler (el corazón del sistema)

```prisma
model RentalContract {
  id             String @id @default(uuid())
  tenantId       String
  businessUnitId String
  quotationId    String @unique
  clientId       String // Denormalizado para queries rápidas
  code           String // CON-2026-001

  // Estado del contrato
  status String // "active", "suspended", "completed", "cancelled"

  // Fechas
  startDate       DateTime
  estimatedEndDate DateTime? // Puede ser null si es por servicio
  actualEndDate    DateTime? // Cuando realmente termina

  // ═══════════════════════════════════════
  // CRÉDITO (Core del sistema)
  // ═══════════════════════════════════════

  initialCredit Decimal @db.Decimal(12,2) // Anticipo inicial
  currentCredit Decimal @db.Decimal(12,2) // Saldo actual disponible
  totalConsumed Decimal @db.Decimal(12,2) @default(0) // Total consumido hasta ahora
  totalReloaded Decimal @db.Decimal(12,2) @default(0) // Total recargado (sin contar inicial)

  // ═══════════════════════════════════════
  // ALERTAS (para USUARIOS, no para cliente)
  // ═══════════════════════════════════════

  alertAmount    Decimal  @db.Decimal(12,2) // Monto en el cual ALERTAR (ej: $10,000)
  alertTriggered Boolean  @default(false)    // Si ya se envió alerta
  lastAlertSent  DateTime?                   // Cuándo se envió última alerta

  // ═══════════════════════════════════════
  // ESTADOS DE CUENTA (para CLIENTE)
  // ═══════════════════════════════════════

  statementFrequency String?   // "weekly" | "biweekly" | "monthly" | "manual"
  lastStatementSent  DateTime? // Última vez que se envió estado de cuenta
  nextStatementDue   DateTime? // Próxima fecha de envío automático

  // Documentos
  templateId   String?
  pdfUrl       String  // PDF del contrato
  signedPdfUrl String? // PDF firmado (si aplica)

  // Montos estimados (de la cotización original)
  estimatedTotal Decimal @db.Decimal(12,2) // Total cotizado originalmente
  currency       String  @default("USD")

  // Metadata
  notes    String? @db.Text
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String

  // Relaciones
  tenant       Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit BusinessUnit    @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  quotation    Quotation       @relation(fields: [quotationId], references: [id])
  client       Client          @relation(fields: [clientId], references: [id])
  template     Template?       @relation(fields: [templateId], references: [id])
  creator      User            @relation(fields: [createdBy], references: [id])

  movements    AccountMovement[] // Historial de transacciones

  @@unique([tenantId, code])
  @@index([tenantId, businessUnitId, status])
  @@index([clientId, status])
  @@index([currentCredit]) // Para buscar contratos con saldo bajo
  @@index([nextStatementDue]) // Para cron job de estados de cuenta
}
```

### 5. **AccountMovement** - Movimientos de la Cuenta (NUEVO)

```prisma
model AccountMovement {
  id         String @id @default(uuid())
  contractId String

  // Tipo de movimiento
  movementType String // "INITIAL_CREDIT" | "CREDIT_RELOAD" | "WITHDRAWAL" | "RETURN" | "ADJUSTMENT" | "DAILY_CHARGE"

  // Montos
  amount        Decimal @db.Decimal(12,2) // Monto del movimiento (puede ser 0 en WITHDRAWAL)
  creditBefore  Decimal @db.Decimal(12,2) // Saldo ANTES del movimiento
  creditAfter   Decimal @db.Decimal(12,2) // Saldo DESPUÉS del movimiento

  // Referencias opcionales
  assetId         String? // Si es retiro/devolución de asset específico
  quotationItemId String? // Referencia al item de la cotización original

  // NUEVO: Pricing por tiempo
  dailyRate        Decimal? @db.Decimal(10,2) // Precio diario del asset
  hourlyRate       Decimal? @db.Decimal(10,2) // Precio por hora (opcional)
  daysUsed         Int?                       // Días reales de uso (al devolver)
  hoursUsed        Decimal? @db.Decimal(5,2)  // Horas reales (opcional)

  // Descripción
  description String // Ej: "Retiro de Retroexcavadora CAT 420F - $5,000/día"
  notes       String? @db.Text

  // Fechas (para retiros y devoluciones)
  withdrawalDate     DateTime? // Cuándo se retiró el asset
  expectedReturnDate DateTime? // Cuándo se esperaba devolver
  actualReturnDate   DateTime? // Cuándo realmente se devolvió

  // Evidencia (fotos, documentos)
  evidenceUrls String[] // Array de URLs en Azure Blob Storage

  // Auditoría
  createdBy String
  createdAt DateTime @default(now())

  // Relaciones
  contract RentalContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  asset    Asset?          @relation(fields: [assetId], references: [id])
  creator  User            @relation(fields: [createdBy], references: [id])

  @@index([contractId, createdAt])
  @@index([assetId])
  @@index([movementType])
  @@index([actualReturnDate]) // Para buscar assets aún no devueltos
}
```

---

## 🔄 FLUJOS DE NEGOCIO

### **Flujo 1: Crear Contrato desde Cotización**

```
POST /api/v1/rental/contracts

Body:
{
  "quotationId": "quot-uuid",
  "initialCredit": 500000,      // Anticipo acordado
  "alertAmount": 50000,          // Alertar cuando queden $50k
  "statementFrequency": "weekly" // Enviar estados semanales
}

Sistema:
1. Valida que quotation esté firmada y pagada
2. Crea RentalContract:
   - initialCredit = 500000
   - currentCredit = 500000
   - totalConsumed = 0
   - totalReloaded = 0
   - estimatedTotal = quotation.totalAmount
   - status = "active"
3. Crea primer AccountMovement:
   - movementType = "INITIAL_CREDIT"
   - amount = 500000
   - creditBefore = 0
   - creditAfter = 500000
   - description = "Anticipo inicial - Cotización QU-2026-001"
4. Genera PDF del contrato
5. Programa primer estado de cuenta (nextStatementDue)
6. Notifica usuarios del tenant
```

### **Flujo 2: Retirar Asset (NO descuenta al retirar)**

```
POST /api/v1/rental/contracts/{contractId}/withdraw

Body:
{
  "assetId": "asset-uuid",
  "dailyRate": 5000,               // Precio por día (del asset)
  "expectedReturnDate": "2026-03-01",
  "estimatedDays": 15,             // Solo informativo
  "notes": "Retiro para obra edificio Los Álamos",
  "evidenceUrls": ["url1", "url2"] // Fotos del asset al retirarlo
}

Sistema:
1. Valida:
   - Contrato está activo
   - Asset está disponible
   - currentCredit > 0 (tiene saldo para usar)
2. Actualiza Asset:
   - status = "rented"
   - currentLocation = contract.workLocation
3. Crea AccountMovement:
   - movementType = "WITHDRAWAL"
   - amount = 0 ← NO DESCUENTA AÚN
   - creditBefore = 500000
   - creditAfter = 500000 ← SIN CAMBIOS
   - assetId = asset-uuid
   - dailyRate = 5000
   - withdrawalDate = now()
   - expectedReturnDate = "2026-03-01"
   - evidenceUrls = ["url1", "url2"]
   - description = "Retiro Retroexcavadora CAT 420F - $5,000/día"
4. RentalContract NO SE MODIFICA (aún no se descuenta)
5. Sistema muestra en UI: "Asset en uso - Costo diario: $5,000"

NOTA: El descuento se hace AL DEVOLVER, calculando días reales de uso
```

### **Flujo 3: Devolver Asset (AQUÍ se descuenta)**

```
POST /api/v1/rental/contracts/{contractId}/return

Body:
{
  "assetId": "asset-uuid",
  "returnCondition": "good",        // "good" | "damaged" | "maintenance_needed"
  "notes": "Devuelto antes de tiempo por lluvia",
  "evidenceUrls": ["url3", "url4"]  // Fotos del asset al devolverlo
}

Sistema:
1. Busca AccountMovement original (tipo WITHDRAWAL):
   - withdrawalDate = 2026-02-16
   - dailyRate = 5000

2. Calcula tiempo real de uso:
   - actualReturnDate = 2026-02-28 (now)
   - daysUsed = 12 días
   - totalCost = 12 × $5,000 = $60,000

3. Actualiza Asset:
   - status = "available" (o "maintenance" si damaged)
   - currentLocation = "warehouse"

4. Crea AccountMovement:
   - movementType = "RETURN"
   - amount = -60000 ← AHORA SÍ DESCUENTA
   - creditBefore = 500000
   - creditAfter = 440000
   - assetId = asset-uuid
   - daysUsed = 12
   - actualReturnDate = now()
   - evidenceUrls = ["url3", "url4"]
   - description = "Devolución Retroexcavadora (12 días × $5,000)"

5. Actualiza RentalContract:
   - currentCredit = 440000
   - totalConsumed = 60000

6. Verifica alertas:
   if (currentCredit <= alertAmount && !alertTriggered):
     - Envía alerta a USUARIOS del tenant
     - alertTriggered = true
     - lastAlertSent = now()
```

### **Flujo 4: Recargar Crédito**

```
POST /api/v1/rental/contracts/{contractId}/reload

Body:
{
  "amount": 200000,
  "paymentMethod": "transfer",
  "paymentReference": "TRANS-12345",
  "notes": "Recarga para continuar obra"
}

Sistema:
1. Valida pago (integración con payment provider)
2. Crea AccountMovement:
   - movementType = "CREDIT_RELOAD"
   - amount = +200000
   - creditBefore = 440000
   - creditAfter = 640000
3. Actualiza RentalContract:
   - currentCredit = 640000
   - totalReloaded = 200000
   - alertTriggered = false (reset para nueva alerta)
4. Notifica al cliente que su crédito fue recargado
```

### **Flujo 5: Generar y Enviar Estado de Cuenta**

```
POST /api/v1/rental/contracts/{contractId}/send-statement

Body:
{
  "channels": ["email", "whatsapp"]
}

Sistema:
1. Obtiene RentalContract + AccountMovements
2. Calcula resumen:
   {
     initialCredit: 500000,
     totalReloaded: 200000,
     totalAvailable: 700000,
     totalConsumed: 260000,
     currentCredit: 440000,
     movements: [
       { date, type, description, amount, balance },
       ...
     ]
   }
3. Renderiza plantilla "account_statement"
4. Genera PDF
5. Envía por canales:
   - Email con PDF adjunto
   - WhatsApp con enlace al PDF
6. Actualiza RentalContract:
   - lastStatementSent = now()
   - Si tiene frecuencia automática:
     - nextStatementDue = calculateNext(statementFrequency)
```

### **Flujo 6: Cron Job - Envío Automático de Estados**

```typescript
// Ejecuta cada hora
async function sendScheduledStatements() {
  const contracts = await prisma.rentalContract.findMany({
    where: {
      status: "active",
      nextStatementDue: { lte: new Date() },
      statementFrequency: { not: "manual" },
    },
  });

  for (const contract of contracts) {
    await statementService.generateAndSend(contract.id, ["email", "whatsapp"]);
  }
}
```

### **Flujo 7: Cron Job - Verificación de Alertas**

```typescript
// Ejecuta cada 6 horas
async function checkCreditAlerts() {
  const contracts = await prisma.rentalContract.findMany({
    where: {
      status: "active",
      currentCredit: { lte: prisma.raw("alert_amount") },
      alertTriggered: false,
    },
  });

  for (const contract of contracts) {
    await alertService.notifyLowCredit(contract.id);
  }
}
```

---

## 🎨 FRONTEND - Interfaces Clave

### 1. **ContractDashboard** (Vista principal de usuarios)

```typescript
┌─────────────────────────────────────────────────────┐
│  CONTRATOS ACTIVOS                [+ Nuevo Contrato]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ CON-2026-001 │ Constructora ABC              │  │
│  │ Obra: Edificio Los Álamos                    │  │
│  │                                               │  │
│  │  Crédito: $440,000 / $700,000                │  │
│  │  ████████████████░░░░░░ 63% 🟢               │  │
│  │                                               │  │
│  │  [Ver Detalle] [Estado de Cuenta] [Recargar] │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ CON-2026-005 │ Obras Viales SA               │  │
│  │ Servicio: 2km camino rural                   │  │
│  │                                               │  │
│  │  Crédito: $8,500 / $150,000                  │  │
│  │  ██░░░░░░░░░░░░░░░░░░░░ 6% 🔴 ALERTA        │  │
│  │                                               │  │
│  │  [Ver Detalle] [Estado de Cuenta] [Recargar] │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 2. **ContractDetailPage** (Detalle de un contrato)

```typescript
┌─────────────── CONTRATO #CON-2026-001 ──────────────┐
│                                                      │
│  Cliente: Constructora ABC                          │
│  Obra: Edificio Los Álamos                          │
│  Estado: 🟢 Activo                                  │
│  Inicio: 15 Feb 2026 | Fin estimado: 17 Abr 2026  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  💰 ESTADO DE CRÉDITO                        │  │
│  │                                               │  │
│  │  Anticipo inicial:    $500,000                │  │
│  │  Recargas totales:    $200,000                │  │
│  │  ────────────────────────────                 │  │
│  │  Total disponible:    $700,000                │  │
│  │  Consumido:          -$260,000                │  │
│  │  ────────────────────────────                 │  │
│  │  Saldo actual:        $440,000  🟢           │  │
│  │  Alerta en:            $50,000                │  │
│  │                                               │  │
│  │  [📧 Enviar Estado de Cuenta al Cliente]     │  │
│  │  [💳 Recargar Crédito]                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  📋 ASSETS EN USO                                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ Retroexcavadora CAT 420F                     │  │
│  │ Retirado: 16 Feb | Esperado: 1 Mar          │  │
│  │ Costo estimado: $75,000                      │  │
│  │ [📸 Ver Evidencias] [↩️ Registrar Devolución]│  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  📊 HISTORIAL DE MOVIMIENTOS                        │
│  ┌──────────────────────────────────────────────┐  │
│  │ Fecha       │ Tipo          │ Monto  │ Saldo │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 15 Feb 2026 │ Anticipo      │+$500k  │ $500k │  │
│  │ 16 Feb 2026 │ Retiro MQ-001 │-$75k   │ $425k │  │
│  │ 18 Feb 2026 │ Retiro MQ-012 │-$45k   │ $380k │  │
│  │ 20 Feb 2026 │ Devolución    │+$15k   │ $395k │  │
│  │ 25 Feb 2026 │ Retiro MQ-045 │-$140k  │ $255k │  │
│  │ 28 Feb 2026 │ Recarga       │+$200k  │ $455k │  │
│  │ ...                                           │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [📄 Descargar PDF Contrato] [⏸️ Suspender]        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 3. **WithdrawAssetModal** (Retirar asset)

```typescript
┌─────────── RETIRAR ASSET ──────────────────────┐
│                                                 │
│  Contrato: CON-2026-001 (Constructora ABC)     │
│  Saldo disponible: $440,000                    │
│                                                 │
│  [Asset] Buscar...                             │
│     ↓ (muestra disponibles)                    │
│     Retroexcavadora CAT 420F  ($5,000/día)     │
│                                                 │
│  [Días estimados] [15] días                    │
│                                                 │
│  Costo estimado: $75,000                       │
│                                                 │
│  [Fecha devolución esperada] [📅 01 Mar 2026]  │
│                                                 │
│  [Notas] Uso en excavación fundaciones...      │
│                                                 │
│  [📸 Subir fotos del asset] (opcional)         │
│     [Seleccionar archivos]                     │
│                                                 │
│  Nuevo saldo: $365,000                         │
│                                                 │
│  [Cancelar]  [✅ Confirmar Retiro]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ SERVICIOS BACKEND

### **ContractService**

```typescript
class ContractService {
  // Crear contrato desde cotización
  async createFromQuotation(
    params: CreateContractParams,
  ): Promise<RentalContract>;

  // Retirar asset
  async withdrawAsset(
    contractId: string,
    params: WithdrawParams,
  ): Promise<AccountMovement>;

  // Devolver asset
  async returnAsset(
    contractId: string,
    params: ReturnParams,
  ): Promise<AccountMovement>;

  // Recargar crédito
  async reloadCredit(
    contractId: string,
    params: ReloadParams,
  ): Promise<AccountMovement>;

  // Ajuste manual (por descuentos, bonificaciones, etc)
  async adjustCredit(
    contractId: string,
    params: AdjustmentParams,
  ): Promise<AccountMovement>;

  // Obtener estado actual
  async getCurrentState(contractId: string): Promise<ContractState>;

  // Verificar alertas
  async checkAlerts(contractId: string): Promise<void>;
}
```

### **StatementService**

```typescript
class StatementService {
  // Generar estado de cuenta
  async generate(contractId: string): Promise<StatementData>;

  // Generar PDF
  async generatePDF(contractId: string): Promise<string>;

  // Enviar por canales
  async send(contractId: string, channels: string[]): Promise<void>;

  // Programar envíos automáticos
  async scheduleAutomatic(): Promise<void>;
}
```

### **AlertService**

```typescript
class AlertService {
  // Notificar crédito bajo (a USUARIOS)
  async notifyLowCredit(contractId: string): Promise<void>;

  // Verificar todos los contratos activos
  async checkAllContracts(): Promise<void>;
}
```

---

## 📋 ENDPOINTS API

```
# Contratos
POST   /api/v1/rental/contracts                    # Crear desde quotation
GET    /api/v1/rental/contracts                    # Listar
GET    /api/v1/rental/contracts/:id                # Detalle
PATCH  /api/v1/rental/contracts/:id                # Actualizar
POST   /api/v1/rental/contracts/:id/suspend        # Suspender
POST   /api/v1/rental/contracts/:id/reactivate     # Reactivar
POST   /api/v1/rental/contracts/:id/complete       # Finalizar

# Movimientos de cuenta
POST   /api/v1/rental/contracts/:id/withdraw       # Retirar asset
POST   /api/v1/rental/contracts/:id/return         # Devolver asset
POST   /api/v1/rental/contracts/:id/reload         # Recargar crédito
POST   /api/v1/rental/contracts/:id/adjust         # Ajuste manual
GET    /api/v1/rental/contracts/:id/movements      # Historial

# Estados de cuenta
GET    /api/v1/rental/contracts/:id/statement      # Ver estado actual
POST   /api/v1/rental/contracts/:id/statement/send # Enviar por email/WhatsApp
GET    /api/v1/rental/contracts/:id/statement/pdf  # Descargar PDF
```

---

## ✅ VALIDACIONES CRÍTICAS

### **Al crear contrato:**

- [ ] Quotation debe estar firmada
- [ ] initialCredit > 0
- [ ] alertAmount < initialCredit
- [ ] Cliente existe y pertenece al mismo tenant

### **Al retirar asset:**

- [ ] Contrato está activo
- [ ] currentCredit >= estimatedCost
- [ ] Asset está disponible (status = "available")
- [ ] Asset pertenece al mismo tenant

### **Al devolver asset:**

- [ ] Existe un WITHDRAWAL previo para ese asset en este contrato
- [ ] Asset no ha sido devuelto previamente

### **Al recargar crédito:**

- [ ] Contrato está activo o suspendido
- [ ] amount > 0
- [ ] Pago está confirmado (integración payment provider)

---

## 📊 QUERIES ÚTILES

```sql
-- Contratos con saldo bajo (próximos a alertar)
SELECT * FROM rental_contracts
WHERE status = 'active'
  AND current_credit <= alert_amount * 1.1
  AND alert_triggered = false;

-- Contratos que necesitan enviar estado de cuenta
SELECT * FROM rental_contracts
WHERE status = 'active'
  AND next_statement_due <= NOW()
  AND statement_frequency != 'manual';

-- Assets actualmente en uso
SELECT a.*, am.contract_id, am.withdrawal_date, am.expected_return_date
FROM assets a
JOIN account_movements am ON a.id = am.asset_id
WHERE a.status = 'rented'
  AND am.movement_type = 'WITHDRAWAL'
  AND am.actual_return_date IS NULL;

-- Resumen financiero de un contrato
SELECT
  initial_credit,
  total_reloaded,
  (initial_credit + total_reloaded) as total_available,
  total_consumed,
  current_credit,
  ((current_credit::float / (initial_credit + total_reloaded)) * 100) as credit_percentage
FROM rental_contracts
WHERE id = 'contract-uuid';
```

---

**Versión:** 2.0  
**Estado:** ✅ Arquitectura corregida con modelo real de negocio  
**Próximos pasos:** Crear migración de Prisma e implementar servicios
