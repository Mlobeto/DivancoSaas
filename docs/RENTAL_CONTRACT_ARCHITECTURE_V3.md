# ARQUITECTURA DE CONTRATOS DE ALQUILER - DivancoSaaS

**Fecha:** 2026-02-13  
**Versión:** 4.0 (Modelo con ClientAccount - Saldo Compartido)

---

## ⚠️ CAMBIO CRÍTICO: CLIENTACCOUNT (v4.0)

### **Problema Resuelto: Cliente con múltiples contratos**

```
ESCENARIO REAL:
Cliente «Constructora ABC» tiene 2 obras simultáneas:
  - Obra 1 (Carretera): Contrato #1 con 5 assets
  - Obra 2 (Puente): Contrato #2 con 3 assets

❌ MODELO ANTERIOR (v3.0): Dos contratos = Dos saldos separados
   → Cliente debe recargar cada contrato por separado
   → Complicado: cliente quiere UN SOLO SALDO compartido

✅ MODELO NUEVO (v4.0): ClientAccount = UN saldo compartido
   → Cliente recarga UNA CUENTA
   → Ambos contratos descuentan del MISMO saldo
   → Sencillo y real
```

### **Arquitectura: ClientAccount como núcleo**

```
Client (Cliente corporativo)
   |
   └─ ClientAccount (UNA cuenta por cliente)
         │
         │  balance: $1,000,000 (COMPARTIDO)
         │
         ├─ Contract #1 (Obra Carretera)
         │     └─ AssetRental, AssetRental...
         │
         └─ Contract #2 (Obra Puente)
               └─ AssetRental, AssetRental...

TODOS los cargos afectan ClientAccount.balance
```

---

## 🎯 MODELO DE NEGOCIO REAL - DESCUENTO CONTINUO

### **Principio Fundamental: Descuento DÍA A DÍA**

```
1. Cliente entrega ANTICIPO
   ↓
2. Retira assets (NO se descuenta al retirar)
   ↓
3. CADA DÍA mientras está en uso:
   - Maquinaria: Operario reporta uso → Descuenta
   - Herramientas: Descuenta automático por día
   - Viáticos: Descuenta por día trabajado
   ↓
4. Cliente ve saldo actualizado en TIEMPO REAL
   ↓
5. Devuelve assets (NO se descuenta nada, ya se descontó todo)
   ↓
6. Si necesita más → Recarga y continúa
```

### **Tipos de Assets y Tracking:**

#### **Tipo A: MAQUINARIA (con operario y tracking)**

```
Características:
✅ Requiere operario certificado
✅ Operario reporta DIARIAMENTE desde app móvil
✅ Se descuenta por USO REAL (horómetro/kilometraje)
✅ Viáticos del operario se descuentan POR DÍA

Ejemplos:
- Retroexcavadora
- Motoniveladora
- Camión
- Compactadora
- Vehículos pesados

Cotización:
┌──────────────────────────────────────────────────┐
│ Retroexcavadora CAT 420F                         │
│ - Precio: $625/hora                              │
│ - STANDBY: 3 horas/día (mínimo garantizado)      │
│ - Estimado: 8 hrs/día × 60 días = $300,000      │
│                                                  │
│ Operario certificado (PER_DAY - obra lejos)      │
│ - Viáticos: $3,000/día (incluye hotel, comida)   │
│ - Estimado: 60 días = $180,000                   │
│                                                  │
│ TOTAL ESTIMADO: $480,000                         │
└──────────────────────────────────────────────────┘

Alternativa para obra cerca:
┌──────────────────────────────────────────────────┐
│ Retroexcavadora CAT 420F                         │
│ - Precio: $625/hora                              │
│ - STANDBY: 3 horas/día                           │
│                                                  │
│ Operario certificado (PER_HOUR - obra cerca)     │
│ - Viáticos: $375/hora                            │
│ - Estimado: 8 hrs/día × 60 días = $180,000      │
│                                                  │
│ TOTAL ESTIMADO: $480,000                         │
└──────────────────────────────────────────────────┘

Flujo diario (CASO A: PER_DAY - obra lejos):
1. Operario abre app móvil
2. Toma foto del horómetro (inicio: 1250 hrs)
3. Al finalizar el día, toma foto (fin: 1258 hrs)
4. Sistema calcula:
   - Horas reportadas: 8.0 hrs
   - Standby mínimo: 3.0 hrs
   - Horas facturadas: Math.max(8.0, 3.0) = 8.0 hrs
5. Descuenta del contrato:
   - Maquinaria: 8 hrs × $625 = $5,000
   - Viáticos operario (PER_DAY): $3,000 (fijo, no importa horas)
   - TOTAL DÍA: $8,000
6. Saldo actualizado en tiempo real

Flujo diario (CASO B: PER_HOUR - obra cerca):
Mismo flujo, pero viáticos:
   - Viáticos operario (PER_HOUR): 8 hrs × $375 = $3,000
   - TOTAL DÍA: $8,000

Si reporta 2 hrs (standby 3):
   - Maquinaria: 3 hrs × $625 = $1,875
   - Viáticos (PER_HOUR): 3 hrs × $375 = $1,125
   - TOTAL: $3,000

📌 STANDBY: Si el operario reporta 2 hrs y el standby es 3 hrs,
   se facturan 3 hrs (garantía mínima para el proveedor)
   - Viáticos PER_DAY: $3,000 (fijo)
   - Viáticos PER_HOUR: 3 hrs × $375 = $1,125
```

---

## 💰 EJEMPLO COMPLETO: CLIENTACCOUNT COMPARTIDO (v4.0)

### **Escenario:**

```
Cliente: "CONSTRUCTORA DEL NORTE S.A."

Tiene 2 obras simultáneas:
  1. Carretera Panamericana (80 km) → Obra lejos
  2. Puente Urbano Centro (15 km) → Obra cerca
```

### **Estructura:**

```
ClientAccount #CA-001
├─ Cliente: CONSTRUCTORA DEL NORTE S.A.
├─ Balance inicial: $1,000,000
│
├─ Contract #1 (Obra Carretera)
│   ├─ AssetRental #R1: Retroexcavadora (PER_DAY viáticos)
│   ├─ AssetRental #R2: Motoniveladora (PER_DAY viáticos)
│   └─ AssetRental #R3: Andamio (herramienta)
│
└─ Contract #2 (Obra Puente)
    ├─ AssetRental #R4: Minicargador (PER_HOUR viáticos)
    └─ AssetRental #R5: Escalera (herramienta)
```

### **Día 1 - Movimientos:**

```
HORA   EVENTO                              MONTO      BALANCE
-------------------------------------------------------------
08:00  Balance inicial                     +$0        $1,000,000

       Contract #1 - Reportes diarios:
10:00  R1: Retroexcavadora (8 hrs)         -$8,000    $992,000
       - Maquinaria: 8 × $625 = $5,000
       - Operario PER_DAY: $3,000

11:00  R2: Motoniveladora (6 hrs)          -$5,400    $986,600
       - Maquinaria: 6 × $650 = $3,900
       - Operario PER_DAY: $1,500

       Contract #2 - Reportes diarios:
12:00  R4: Minicargador (5 hrs)            -$2,375    $984,225
       - Maquinaria: 5 × $325 = $1,625
       - Operario PER_HOUR: 5 × $150 = $750

       CRON JOB 00:01 - Herramientas:
00:01  R3: Andamio (automático)            -$200      $984,025
00:01  R5: Escalera (automático)           -$50       $983,975

-------------------------------------------------------------
TOTAL CONSUMIDO DÍA 1:                     -$16,025
BALANCE FINAL DÍA 1:                                  $983,975
```

### **RentalAccountMovement (Tabla):**

```
┌────┬───────────────┬──────────────┬──────────┬─────────────┬─────────────┐
│ ID │ TYPE          │ CONTRACT     │ AMOUNT   │ BALANCE_BEF │ BALANCE_AFT │
├────┼───────────────┼──────────────┼──────────┼─────────────┼─────────────┤
│ M1 │ DAILY_CHARGE  │ Contract #1  │ -$8,000  │ $1,000,000  │ $992,000    │
│ M2 │ DAILY_CHARGE  │ Contract #1  │ -$5,400  │ $992,000    │ $986,600    │
│ M3 │ DAILY_CHARGE  │ Contract #2  │ -$2,375  │ $986,600    │ $984,225    │
│ M4 │ DAILY_CHARGE  │ Contract #1  │ -$200    │ $984,225    │ $984,025    │
│ M5 │ DAILY_CHARGE  │ Contract #2  │ -$50     │ $984,025    │ $983,975    │
└────┴───────────────┴──────────────┴──────────┴─────────────┴─────────────┘
```

### **ClientAccount después de 30 días:**

```
ClientAccount #CA-001
├─ balance: $519,250
├─ totalConsumed: $480,750  (30 días × $16,025/día)
├─ totalReloaded: $0
│
├─ Contract #1 (informativo)
│  └─ totalConsumed: $408,000  ($13,600/día × 30)
│
└─ Contract #2 (informativo)
   └─ totalConsumed: $72,750  ($2,425/día × 30)
```

### **Cliente recarga $500,000:**

```
RentalAccountMovement:
- clientAccountId: CA-001
- contractId: null  (⚡ recarga no asociada a contrato específico)
- movementType: CREDIT_RELOAD
- amount: +$500,000
- balanceBefore: $519,250
- balanceAfter: $1,019,250

ClientAccount actualizado:
- balance: $1,019,250
- totalReloaded: $500,000
```

### **📊 Dashboard - Vista Cliente:**

```
┌─────────────────────────────────────────────────────────────┐
│  CONSTRUCTORA DEL NORTE S.A.                                │
│  Estado de Cuenta - Tiempo Real                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💰 Saldo Actual: $1,019,250                                │
│  📈 Total Recargado: $1,500,000                             │
│  📉 Total Consumido: $480,750                               │
│                                                             │
│  ⚡ Contratos Activos: 2                                     │
│  📦 Assets Rentados: 5                                      │
│  📅 Días Promedio hasta Vacío: 63 días                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📝 Contratos:                                              │
│                                                             │
│  ✅ Contract #1 - Carretera Panamericana                     │
│     Consumo: $408,000 ($13,600/día aprox)                   │
│     Assets: 3 (2 machinery + 1 tool)                        │
│                                                             │
│  ✅ Contract #2 - Puente Urbano Centro                       │
│     Consumo: $72,750 ($2,425/día aprox)                     │
│     Assets: 2 (1 machinery + 1 tool)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 VENTAJAS DEL MODELO CLIENTACCOUNT

### **1. Simplicidad para el Cliente:**

❌ **Antes (v3.0):**

```
Cliente necesita recargar:
  - Contract #1: $700,000
  - Contract #2: $300,000
Total: 2 transacciones separadas
```

✅ **Ahora (v4.0):**

```
Cliente recarga UNA VEZ:
  - ClientAccount: $1,000,000
Total: 1 transacción
Ambos contratos comparten el saldo
```

### **2. Flexibilidad Operativa:**

```
ESCENARIO: Obra #1 terminó antes, sobra saldo

❌ Antes:
  - Contract #1: $200,000 (bloqueado)
  - Contract #2: $50,000 (necesita más)
  → Cliente debe hacer transferencia manual

✅ Ahora:
  - ClientAccount: $250,000 (compartido)
  → Contract #2 automáticamente usa el saldo disponible
```

### **3. Estados de Cuenta Unificados:**

```
❌ Antes: Cliente recibe 2 PDFs separados
✅ Ahora: Cliente recibe 1 PDF con todo

Estado de Cuenta Mensual
========================
Cliente: CONSTRUCTORA DEL NORTE S.A.
Período: 1-31 Marzo 2026

Balance Inicial:     $1,000,000
+ Recargas:          $500,000
- Consumos:          $480,750
  • Contract #1:     $408,000
  • Contract #2:     $72,750
========================
Balance Final:       $1,019,250
```

#### **Tipo B: HERRAMIENTAS/IMPLEMENTOS (sin tracking)**

```
Características:
✅ No requiere operario
❌ No requiere reporte diario
✅ Se descuenta AUTOMÁTICO por día
✅ Desde retiro hasta devolución

Ejemplos:
- Andamios
- Escaleras
- Señalización
- Carretillas
- Herramientas menores
- Cercas temporales

Cotización:
┌─────────────────────────────────────────────┐
│ Andamio metálico 6m                         │
│ - Precio: $200/día                          │
│ - Estimado: 45 días = $9,000                │
│                                             │
│ Escalera extensible                         │
│ - Precio: $50/día                           │
│ - Estimado: 45 días = $2,250                │
│                                             │
│ TOTAL ESTIMADO: $11,250                     │
└─────────────────────────────────────────────┘

Flujo automático:
1. Usuario retira andamio (16 Feb)
2. Sistema registra retiro
3. CADA DÍA automáticamente:
   - Día 1 (16 Feb): -$200
   - Día 2 (17 Feb): -$200
   - Día 3 (18 Feb): -$200
   - ...
4. Usuario devuelve (5 Mar - 18 días)
5. Sistema detiene descuento automático
6. Total descontado: 18 × $200 = $3,600
```

---

## 📐 SCHEMA DE BASE DE DATOS (Actualizado)

### 1. **Asset** - Configuración de Maquinaria/Implementos

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

  // ═══════════════════════════════════════
  // NUEVO: Tipo de tracking
  // ═══════════════════════════════════════

  trackingType   String   // "MACHINERY" | "TOOL"

  // Si trackingType = "MACHINERY":
  requiresOperator     Boolean @default(false)
  trackingMetric       String? // "HOURS" | "KILOMETERS" | "BOTH"

  // Si trackingType = "TOOL":
  // Se cobra automático por día (sin reporte)

  // ═══════════════════════════════════════
  // Precios
  // ═══════════════════════════════════════

  // Para MACHINERY:
  pricePerHour      Decimal? @db.Decimal(10,2) // $625/hora
  minDailyHours     Decimal? @db.Decimal(5,2)  // STANDBY: Mínimo horas/día (ej: 3.0)
  pricePerKm        Decimal? @db.Decimal(10,2) // $5/km (opcional)

  // Para TOOL:
  pricePerDay       Decimal? @db.Decimal(10,2) // $200/día
  pricePerWeek      Decimal? @db.Decimal(10,2) // $1,200/sem (opcional)

  // Costo del operario (si aplica)
  operatorCostType  String?  // "PER_DAY" | "PER_HOUR" | null (sin operario)
  operatorCostRate  Decimal? @db.Decimal(10,2) // $3,000/día OR $375/hora

  // PER_DAY: Obra lejos (hotel, comida) → Cobra fijo por día
  // PER_HOUR: Obra cerca → Cobra por hora trabajada (respeta standby)

  // Costos adicionales
  maintenanceCostDaily Decimal? @db.Decimal(10,2)

  // Características operativas
  requiresTracking  Boolean @default(false)
  requiresClinic    Boolean @default(false)

  // Imagen principal
  imageUrl       String?

  // Costos
  acquisitionCost Decimal? @db.Decimal(12,2)

  // Metadata
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  tenant         Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit   BusinessUnit    @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  template       AssetTemplate?  @relation(fields: [templateId], references: [id])

  quotationItems QuotationItem[]
  usageReports   AssetUsage[]
  movements      AccountMovement[]
  activeRentals  AssetRental[]

  @@unique([tenantId, code])
  @@index([tenantId, businessUnitId, status])
  @@index([status, trackingType])
}
```

### 2. **AssetRental** - Assets Actualmente en Uso (NUEVO)

```prisma
// Tabla para trackear qué assets están rentados en qué contratos
model AssetRental {
  id         String @id @default(uuid())
  contractId String
  assetId    String

  // Fechas
  withdrawalDate     DateTime @default(now())
  expectedReturnDate DateTime?
  actualReturnDate   DateTime? // Null mientras esté en uso

  // Tracking específico
  trackingType String // "MACHINERY" | "TOOL"

  // Para MACHINERY:
  hourlyRate        Decimal? @db.Decimal(10,2)
  operatorDailyCost Decimal? @db.Decimal(10,2)

  // Tracking de uso (MACHINERY)
  initialHourometer  Decimal? @db.Decimal(10,2) // Horómetro inicial
  currentHourometer  Decimal? @db.Decimal(10,2) // Último reporte
  totalHoursUsed     Decimal  @db.Decimal(10,2) @default(0)

  initialOdometer    Decimal? @db.Decimal(10,2) // Odómetro inicial
  currentOdometer    Decimal? @db.Decimal(10,2) // Último reporte
  totalKmUsed        Decimal  @db.Decimal(10,2) @default(0)

  // Para TOOL:
  dailyRate      Decimal? @db.Decimal(10,2)
  daysElapsed    Int      @default(0) // Se actualiza automático

  // Montos acumulados
  totalMachineryCost Decimal @db.Decimal(12,2) @default(0)
  totalOperatorCost  Decimal @db.Decimal(12,2) @default(0)
  totalCost          Decimal @db.Decimal(12,2) @default(0)

  // Último descuento realizado
  lastChargeDate DateTime?

  // Evidencias
  withdrawalEvidence String[] // URLs fotos al retirar
  returnEvidence     String[] // URLs fotos al devolver

  notes String? @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String

  // Relaciones
  contract RentalContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  asset    Asset          @relation(fields: [assetId], references: [id])
  creator  User           @relation(fields: [createdBy], references: [id])

  usageReports AssetUsage[] // Reportes diarios del operario

  @@index([contractId, actualReturnDate]) // Para buscar assets activos
  @@index([assetId, actualReturnDate])
  @@index([lastChargeDate]) // Para cron job de descuentos
}
```

### 3. **AssetUsage** - Reportes Diarios del Operario (ya existe, ajustes)

```prisma
model AssetUsage {
  id          String @id @default(uuid())
  assetId     String
  rentalId    String // NUEVO: Relación con AssetRental

  // Usuario que reporta
  reportedBy  String // Operario
  reportDate  DateTime @default(now())

  // Métricas de uso
  metricType   String // "HOUROMETER" | "ODOMETER" | "BOTH"

  // Horómetro
  hourometerStart Decimal? @db.Decimal(10,2)
  hourometerEnd   Decimal? @db.Decimal(10,2)
  hoursWorked     Decimal? @db.Decimal(5,2)  // Horas reales trabajadas
  hoursBilled     Decimal? @db.Decimal(5,2)  // Horas facturadas (con standby)
  // Evidencias (FOTOS obligatorias)
  evidenceUrls String[] // Fotos horómetro/odómetro

  // Cálculo de costo (automático)
  machineryCost Decimal? @db.Decimal(10,2) // Costo por uso
  operatorCost  Decimal? @db.Decimal(10,2) // Viáticos del día
  totalCost     Decimal? @db.Decimal(10,2)

  // Estado del reporte
  status String @default("pending") // "pending", "processed", "rejected"
  processedAt DateTime?

  // Sincronización offline
  createdAtDevice DateTime?
  syncedAt        DateTime?

  notes String? @db.Text

  // Relaciones
  asset   Asset       @relation(fields: [assetId], references: [id])
  rental  AssetRental @relation(fields: [rentalId], references: [id])
  user    User        @relation(fields: [reportedBy], references: [id])

  @@index([assetId, reportDate])
  @@index([rentalId, reportDate])
  @@index([status, processedAt])
}
```

### 4. **ClientAccount** - Cuenta Compartida del Cliente (NUEVO v4.0)

```prisma
model ClientAccount {
  id        String @id @default(uuid())
  tenantId  String
  clientId  String @unique // UNA cuenta por cliente

  // ═══════════════════════════════════════
  // SALDO COMPARTIDO (todos los contratos)
  // ═══════════════════════════════════════

  balance       Decimal @db.Decimal(12,2) @default(0) // Saldo actual COMPARTIDO
  totalConsumed Decimal @db.Decimal(12,2) @default(0) // Total consumido (histórico)
  totalReloaded Decimal @db.Decimal(12,2) @default(0) // Total recargado (histórico)

  // ═══════════════════════════════════════
  // ALERTAS (para USUARIOS INTERNOS)
  // ═══════════════════════════════════════

  alertAmount    Decimal  @db.Decimal(12,2) @default(0) // Monto en el cual ALERTAR
  alertTriggered Boolean  @default(false)
  lastAlertSent  DateTime?

  // ═══════════════════════════════════════
  // ESTADOS DE CUENTA (para CLIENTE)
  // ═══════════════════════════════════════

  statementFrequency String?   // "weekly" | "biweekly" | "monthly" | "manual"
  lastStatementSent  DateTime?
  nextStatementDue   DateTime?

  // Metadata
  notes    String? @db.Text
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  tenant    Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client    Client                 @relation(fields: [clientId], references: [id])
  contracts RentalContract[]       // Múltiples contratos comparten esta cuenta
  movements RentalAccountMovement[] // Historial de todas las transacciones

  @@index([tenantId, balance])
  @@index([clientId])
}
```

### 5. **RentalContract** - Contrato de Alquiler (ACTUALIZADO v4.0)

```prisma
model RentalContract {
  id               String @id @default(uuid())
  tenantId         String
  businessUnitId   String
  quotationId      String @unique
  clientId         String
  clientAccountId  String // ⚡ NUEVO: Referencia a cuenta compartida
  code             String // CON-2026-001

  // Estado del contrato
  status String // "active", "suspended", "completed", "cancelled"

  // Fechas
  startDate        DateTime
  estimatedEndDate DateTime?
  actualEndDate    DateTime?

  // ═══════════════════════════════════════
  // CRÉDITO (INFORMATIVO - el real está en ClientAccount)
  // ═══════════════════════════════════════

  totalConsumed Decimal @db.Decimal(12,2) @default(0) // Total consumido POR ESTE contrato

  // Documentos
  templateId   String?
  pdfUrl       String
  signedPdfUrl String?

  // Montos estimados
  estimatedTotal Decimal @db.Decimal(12,2)
  currency       String  @default("USD")

  // Metadata
  notes    String? @db.Text
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String

  // Relaciones
  tenant        Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit  BusinessUnit           @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  quotation     Quotation              @relation(fields: [quotationId], references: [id])
  client        Client                 @relation(fields: [clientId], references: [id])
  clientAccount ClientAccount          @relation(fields: [clientAccountId], references: [id]) // ⚡ NUEVO
  template      Template?              @relation(fields: [templateId], references: [id])
  creator       User                   @relation(fields: [createdBy], references: [id])

  movements     RentalAccountMovement[] // Movimientos generados por este contrato
  activeRentals AssetRental[]          // Assets actualmente rentados

  @@unique([tenantId, code])
  @@index([tenantId, businessUnitId, status])
  @@index([clientId, status])
  @@index([clientAccountId, status]) // ⚡ NUEVO
}
```

### 6. **RentalAccountMovement** - Historial de Transacciones (ACTUALIZADO v4.0)

```prisma
model RentalAccountMovement {
  id               String @id @default(uuid())
  clientAccountId  String  // ⚡ NUEVO: Afecta la cuenta compartida
  contractId       String? // ⚡ Nullable: tracking de qué contrato generó el movimiento

  // Tipo de movimiento
  movementType String // "INITIAL_CREDIT" | "CREDIT_RELOAD" | "DAILY_CHARGE" | "ADJUSTMENT" | "WITHDRAWAL_START" | "RETURN_END"

  // Montos
  amount        Decimal @db.Decimal(12,2) // Monto (negativo para cargos)
  balanceBefore Decimal @db.Decimal(12,2) // Saldo ANTES (del ClientAccount)
  balanceAfter  Decimal @db.Decimal(12,2) // Saldo DESPUÉS (del ClientAcc count)

  // Referencias
  assetRentalId String? // Si es cargo por asset específico
  usageReportId String? // Si viene de reporte del operario

  // Desglose (para DAILY_CHARGE)
  machineryCost Decimal? @db.Decimal(10,2) // Costo por uso de la máquina
  operatorCost  Decimal? @db.Decimal(10,2) // Viáticos del operario
  toolCost      Decimal? @db.Decimal(10,2) // Costo herramienta

  // Descripción
  description String // "Cargo diario - Retroexcavadora (8 hrs) + Operario"
  notes       String? @db.Text

  // Evidencia
  evidenceUrls String[] // URLs de fotos (horómetro, etc)

  // Metadata adicional
  metadata Json?

  // Auditoría
  createdBy String
  createdAt DateTime @default(now())

  // Relaciones
  clientAccount ClientAccount   @relation(fields: [clientAccountId], references: [id], onDelete: Cascade) // ⚡ NUEVO
  contract      RentalContract? @relation(fields: [contractId], references: [id], onDelete: Cascade) // ⚡ Nullable
  creator       User            @relation(fields: [createdBy], references: [id])

  @@index([clientAccountId, createdAt]) // ⚡ NUEVO: Para estados de cuenta
  @@index([contractId, createdAt])
  @@index([movementType])
  @@index([assetRentalId])
}
```

---

## 🔄 FLUJOS DE NEGOCIO

### **Flujo 1: Retirar Asset (NO descuenta)**

#### **A) Retirar MAQUINARIA:**

```
POST /api/v1/rental/contracts/{contractId}/withdraw

Body:
{
  "assetId": "asset-uuid",
  "expectedReturnDate": "2026-03-15",
  "initialHourometer": 1250.5,
  "initialOdometer": 45230,
  "operatorId": "user-uuid",
  "notes": "Retiro para obra edificio Los Álamos",
  "evidenceUrls": ["url1", "url2"]
}

Sistema:
1. Valida:
   - Contrato activo
   - Asset disponible
   - Operario certificado
   - clientAccount.balance > 0 (⚡ NUEVO: revisa cuenta compartida)
2. Crea AssetRental:
   - withdrawalDate = now()
   - trackingType = "MACHINERY"
   - hourlyRate = asset.pricePerHour
   - operatorCostType = asset.operatorCostType
   - operatorCostRate = asset.operatorCostRate
   - initialHourometer = 1250.5
   - currentHourometer = 1250.5
   - totalHoursUsed = 0
   - totalCost = 0
3. Actualiza Asset:
   - status = "rented"
4. Crea RentalAccountMovement: (⚡ NUEVO nombre)
   - clientAccountId = contract.clientAccountId
   - contractId = contract.id
   - movementType = "WITHDRAWAL_START"
   - amount = 0 (NO descuenta)
   - description = "Retiro Retroexcavadora - Inicio tracking"
5. NO cambia ClientAccount.balance (aún no se descuenta) ⚡
```

#### **B) Retirar HERRAMIENTA:**

```
POST /api/v1/rental/contracts/{contractId}/withdraw

Body:
{
  "assetId": "asset-uuid",
  "expectedReturnDate": "2026-03-10",
  "evidenceUrls": ["url1"]
}

Sistema:
1. Crea AssetRental:
   - trackingType = "TOOL"
   - dailyRate = asset.pricePerDay
   - daysElapsed = 0
2. Actualiza Asset:
   - status = "rented"
3. NO descuenta (se descuenta automático diariamente)
```

### **Flujo 2: Reporte Diario del Operario (MAQUINARIA)**

```
POST /api/v1/mobile/usage-report

Body:
{
  "rentalId": "rental-uuid",
  "hourometerEnd": 1258.5,
  "odometerEnd": 45280,
  "evidenceUrls": ["foto_horometro.jpg", "foto_odometro.jpg"],
  "notes": "8 horas trabajadas - Excavación fundaciones"
}

Sistema (procesa automáticamente):
1. Crea AssetUsage:
   - hourometerStart = rental.currentHourometer (1250.5)
   - hourometerEnd = 1258.5
   - hoursWorked = 8.0
   - hoursBilled = Math.max(8.0, asset.minDailyHours) = 8.0 ⚡
   - machineryCost = 8 × $625 = $5,000
   - operatorCost = según operatorCostType: ⚡
     * PER_DAY: $3,000 (fijo)
     * PER_HOUR: 8 × $375 = $3,000
   - totalCost = $8,000

2. Actualiza AssetRental:
   - currentHourometer = 1258.5
   - totalHoursUsed += 8.0
   - totalMachineryCost += $5,000
   - totalOperatorCost += $3,000
   - totalCost += $8,000
   - lastChargeDate = now()

3. Crea RentalAccountMovement: ⚡
   - clientAccountId = contract.clientAccountId
   - contractId = contract.id
   - movementType = "DAILY_CHARGE"
   - amount = -$8,000
   - machineryCost = $5,000
   - operatorCost = $3,000
   - description = "Cargo diario - Retroexcavadora (8 hrs) + Operario"
   - evidenceUrls = ["foto_horometro.jpg", "foto_odometro.jpg"]

4. Actualiza ClientAccount: ⚡ NUEVO
   - balance -= $8,000
   - totalConsumed += $8,000

5. Actualiza RentalContract (informativo): ⚡
   - totalConsumed += $8,000

6. Verifica alertas (en ClientAccount): ⚡
   if (clientAccount.balance <= alertAmount && !alertTriggered):
     - Envía alerta a usuarios
     - clientAccount.alertTriggered = true
```

### **Flujo 3: Cargo Automático Diario (HERRAMIENTAS)**

```
CRON JOB: Ejecuta cada día a las 00:01

async function processAutomaticToolCharges() {
  // Busca todos los assets tipo TOOL actualmente rentados
  const activeToolRentals = await prisma.assetRental.findMany({
    where: {
      trackingType: "TOOL",
      actualReturnDate: null, // Aún no devuelto
      contract: {
        status: "active",
        include: { clientAccount: true } // ⚡ NUEVO
      }
    },
    include: { asset: true, contract: true }
  });

  for (const rental of activeToolRentals) {
    const dailyRate = rental.dailyRate;
    const clientAccount = rental.contract.clientAccount; // ⚡

    // Actualiza AssetRental
    await prisma.assetRental.update({
      where: { id: rental.id },
      data: {
        daysElapsed: { increment: 1 },
        totalCost: { increment: dailyRate },
        lastChargeDate: new Date()
      }
    });

    // Crea RentalAccountMovement ⚡
    await prisma.rentalAccountMovement.create({
      data: {
        clientAccountId: clientAccount.id, // ⚡ Afecta cuenta compartida
        contractId: rental.contractId,
        movementType: "DAILY_CHARGE",
        amount: -dailyRate,
        balanceBefore: clientAccount.balance, // ⚡
        balanceAfter: clientAccount.balance - dailyRate, // ⚡
        assetRentalId: rental.id,
        toolCost: dailyRate,
        description: `Cargo automático diario - ${rental.asset.name}`,
        createdBy: "SYSTEM"
      }
    });

    // Actualiza ClientAccount ⚡
    await prisma.clientAccount.update({
      where: { id: clientAccount.id },
      data: {
        balance: { decrement: dailyRate },
        totalConsumed: { increment: dailyRate }
      }
    });

    // Actualiza contrato (informativo) ⚡
    await prisma.rentalContract.update({
      where: { id: rental.contractId },
      data: {
        totalConsumed: { increment: dailyRate }
      }
    });

    // Verifica alertas (en ClientAccount) ⚡
    await checkAlerts(clientAccount.id);
  }
}
```

### **Flujo 4: Devolver Asset (NO descuenta, ya se descontó todo)**

```
POST /api/v1/rental/contracts/{contractId}/return

Body:
{
  "rentalId": "rental-uuid",
  "returnCondition": "good",
  "notes": "Devolución en buen estado",
  "evidenceUrls": ["foto_final.jpg"]
}

Sistema:
1. Actualiza AssetRental:
   - actualReturnDate = now()
   - returnEvidence = ["foto_final.jpg"]

2. Actualiza Asset:
   - status = "available" (o "maintenance" si damaged)

3. Crea RentalAccountMovement: ⚡
   - clientAccountId = contract.clientAccountId
   - contractId = contract.id
   - movementType = "RETURN_END"
   - amount = 0 (ya se descontó todo diariamente)
   - description = "Devolución Retroexcavadora - Total: $96,000 (12 días)"

4. NO modifica ClientAccount.balance (ya está actualizado) ⚡

5. Resumen:
   - Total días: 12
   - Maquinaria: $60,000 (96 hrs × $625)
   - Operario: $36,000 (12 días × $3,000)
   - TOTAL: $96,000 (ya descontado)
```

---

## 📱 APP MÓVIL - Reporte del Operario

### **Pantalla Principal:**

```
┌─────────────────────────────────────────────┐
│  RETROEXCAVADORA CAT 420F                   │
│  En uso desde: 16 Feb 2026                  │
│                                             │
│  📊 Estado Actual:                          │
│  Horómetro: 1250.5 hrs                      │
│  Odómetro: 45,230 km                        │
│                                             │
│  [📸 REPORTAR USO DE HOY]                   │
│                                             │
│  Historial:                                 │
│  ┌───────────────────────────────────────┐ │
│  │ 16 Feb - 8 hrs trabajadas             │ │
│  │ 17 Feb - 7.5 hrs trabajadas           │ │
│  │ 18 Feb - 8 hrs trabajadas             │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### **Formulario de Reporte:**

```
┌─────────────────────────────────────────────┐
│  REPORTE DIARIO                             │
│                                             │
│  Fecha: 19 Feb 2026                         │
│                                             │
│  📷 HORÓMETRO:                              │
│  [Tomar Foto Inicio]  Inicio: 1266.0       │
│  [Tomar Foto Fin]     Fin: 1274.0           │
│  Horas trabajadas: 8.0 ✓                    │
│                                             │
│  📷 ODÓMETRO (opcional):                    │
│  [Tomar Foto]         Km: 45,280            │
│                                             │
│  📝 NOTAS:                                  │
│  Excavación de zanjas sector norte...      │
│                                             │
│  ═══════════════════════════════════════   │
│  Costo del día: $8,000                      │
│  (Máquina: $5,000 + Operario: $3,000)      │
│  ═══════════════════════════════════════   │
│                                             │
│  [Cancelar]  [✅ GUARDAR REPORTE]          │
│                                             │
└─────────────────────────────────────────────┘
```

### **Offline-First:**

```typescript
// Al guardar reporte sin conexión:
1. Guarda localmente en SQLite
2. Marca como "pending_sync"
3. Muestra en UI: "Guardado - Se sincronizará"
4. Al reconectar:
   - Sube imágenes a Azure Blob
   - Envía reporte al backend
   - Backend procesa y descuenta del contrato
   - App actualiza estado: "Sincronizado ✓"
```

---

## 🎨 FRONTEND WEB - Dashboard de Contratos

### **Vista Principal:**

```
┌─────────── CONTRATOS ACTIVOS ──────────────────────┐
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ CON-2026-001 │ Constructora ABC              │ │
│  │ Obra: Edificio Los Álamos                    │ │
│  │                                               │ │
│  │  Crédito: $404,000 / $500,000                │ │
│  │  ████████████████░░░░░░░░ 81% 🟢             │ │
│  │                                               │ │
│  │  Assets en uso:                              │ │
│  │  • Retroexcavadora CAT 420F (12 días)        │ │
│  │  • Andamio metálico (18 días)                │ │
│  │                                               │ │
│  │  [Ver Detalle] [Estado de Cuenta] [Recargar] │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### **Detalle de Contrato:**

```
┌─────────────── CONTRATO #CON-2026-001 ─────────────┐
│                                                      │
│  Cliente: Constructora ABC                          │
│  Obra: Edificio Los Álamos                          │
│  Estado: 🟢 Activo                                  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  💰 ESTADO DE CRÉDITO                        │  │
│  │                                               │  │
│  │  Anticipo inicial:    $500,000                │  │
│  │  Consumido a la fecha: -$96,000               │  │
│  │  ────────────────────────────                 │  │
│  │  Saldo actual:        $404,000  🟢           │  │
│  │  Actualizado: Hoy 19:45                      │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  📋 ASSETS EN USO (Facturando automáticamente)      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🚜 Retroexcavadora CAT 420F                  │  │
│  │ Desde: 16 Feb │ 12 días transcurridos        │  │
│  │ Uso acumulado: 96 hrs                        │  │
│  │ Costo maquinaria: $60,000                    │  │
│  │ Costo operario: $36,000                      │  │
│  │ Total: $96,000                               │  │
│  │                                               │  │
│  │ Último reporte: Hoy 18:00 (8 hrs)            │  │
│  │ [📊 Ver Reportes] [↩️ Registrar Devolución]  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🪜 Andamio metálico 6m                       │  │
│  │ Desde: 20 Feb │ 8 días transcurridos         │  │
│  │ Cargo automático: $200/día                   │  │
│  │ Total: $1,600                                │  │
│  │                                               │  │
│  │ [↩️ Registrar Devolución]                     │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  📊 MOVIMIENTOS RECIENTES                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ Fecha       │ Descripción       │ Monto │ Saldo││
│  ├──────────────────────────────────────────────┤  │
│  │ 15 Feb 2026 │ Anticipo inicial  │+$500k │$500k ││
│  │ 16 Feb 2026 │ Retiro Retroexc.  │  $0   │$500k ││
│  │ 16 Feb 2026 │ Cargo día 1       │-$8k   │$492k ││
│  │ 17 Feb 2026 │ Cargo día 2       │-$7.7k │$484k ││
│  │ 18 Feb 2026 │ Cargo día 3       │-$8k   │$476k ││
│  │ ...                                           │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [📧 Enviar Estado de Cuenta] [💳 Recargar]        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## ⚙️ SERVICIOS BACKEND

### **ContractService:**

```typescript
class ContractService {
  // Retirar asset
  async withdrawAsset(
    contractId: string,
    params: WithdrawParams,
  ): Promise<AssetRental>;

  // Devolver asset
  async returnAsset(
    rentalId: string,
    params: ReturnParams,
  ): Promise<AssetRental>;

  // Recargar crédito
  async reloadCredit(
    contractId: string,
    amount: number,
  ): Promise<AccountMovement>;

  // Obtener estado actual con assets en uso
  async getCurrentState(contractId: string): Promise<ContractStateWithAssets>;

  // Verificar alertas
  async checkAlerts(contractId: string): Promise<void>;
}
```

### **UsageReportService:**

```typescript
class UsageReportService {
  // Procesar reporte del operario
  async processUsageReport(params: UsageReportParams): Promise<AssetUsage> {
    // 1. Crear AssetUsage
    const hoursWorked = params.hourometerEnd - params.hourometerStart;

    // 2. Calcular costos (con STANDBY)
    const asset = await getAsset(params.assetId);
    const rental = await getAssetRental(params.rentalId);

    // ⚠️ STANDBY: Garantiza mínimo de horas por día
    const minHours = asset.minDailyHours || 0;
    const hoursBilled = Math.max(hoursWorked, minHours);

    const machineryCost = hoursBilled * rental.hourlyRate;

    // ⚠️ VIÁTICOS: PER_DAY (obra lejos) vs PER_HOUR (obra cerca)
    let operatorCost = 0;
    if (asset.operatorCostType === "PER_DAY") {
      // Obra lejos (hotel, comida) → Fijo por día
      operatorCost = asset.operatorCostRate || 0;
    } else if (asset.operatorCostType === "PER_HOUR") {
      // Obra cerca → Por hora trabajada (respeta standby)
      operatorCost = hoursBilled * (asset.operatorCostRate || 0);
    }

    const totalCost = machineryCost + operatorCost;

    // 3. Actualizar AssetRental
    // 4. Crear AccountMovement (DAILY_CHARGE)
    // 5. Descontar de RentalContract
    // 6. Verificar alertas
  }

  // Validar fotos del reporte
  async validateEvidence(urls: string[]): Promise<boolean>;

  // Obtener historial de reportes
  async getReportHistory(rentalId: string): Promise<AssetUsage[]>;
}
```

### **AutoChargeService:**

```typescript
class AutoChargeService {
  // Cargo automático herramientas (CRON)
  async processToolCharges(): Promise<void>;

  // Notificar operarios sin reporte
  async notifyMissingReports(): Promise<void>;

  // Proyectar consumo futuro
  async projectConsumption(
    contractId: string,
    days: number,
  ): Promise<Projection>;
}
```

---

## 🔔 CRON JOBS

### **1. Cargo Automático Herramientas:**

```typescript
// Ejecuta: Cada día a las 00:01
async function processToolCharges() {
  const toolRentals = await getActiveToolRentals();

  for (const rental of toolRentals) {
    await autoChargeService.chargeDailyRate(rental.id);
  }
}
```

### **2. Notificar Reportes Pendientes:**

```typescript
// Ejecuta: Cada día a las 20:00
async function notifyMissingReports() {
  const machineryRentals = await getActiveMachineryWithoutTodayReport();

  for (const rental of machineryRentals) {
    await notificationService.notifyOperator(
      rental.operatorId,
      "Recuerda enviar el reporte diario del horómetro",
    );
  }
}
```

### **3. Enviar Estados de Cuenta:**

```typescript
// Ejecuta: Cada hora
async function sendScheduledStatements() {
  const contracts = await getContractsWithStatementDue();

  for (const contract of contracts) {
    await statementService.generateAndSend(contract.id);
  }
}
```

### **4. Verificar Alertas de Crédito:**

```typescript
// Ejecuta: Cada 6 horas
async function checkCreditAlerts() {
  const contracts = await getContractsWithLowCredit();

  for (const contract of contracts) {
    await alertService.notifyLowCredit(contract.id);
  }
}
```

---

## 📊 QUERIES ÚTILES

```sql
-- Assets actualmente en uso
SELECT ar.*, a.name, a.code, c.clientId
FROM asset_rentals ar
JOIN assets a ON ar.asset_id = a.id
JOIN rental_contracts c ON ar.contract_id = c.id
WHERE ar.actual_return_date IS NULL
  AND c.status = 'active';

-- Contratos con consumo diario alto
SELECT
  c.code,
  c.client_id,
  c.current_credit,
  COUNT(ar.id) as assets_en_uso,
  SUM(ar.total_cost) as consumo_acumulado
FROM rental_contracts c
JOIN asset_rentals ar ON c.id = ar.contract_id
WHERE c.status = 'active'
  AND ar.actual_return_date IS NULL
GROUP BY c.id
HAVING c.current_credit < (initial_credit * 0.3)
ORDER BY c.current_credit ASC;

-- Operarios sin reporte hoy
SELECT u.*, ar.id as rental_id, a.name as asset_name
FROM asset_rentals ar
JOIN assets a ON ar.asset_id = a.id
JOIN users u ON u.id = ar.created_by
WHERE ar.actual_return_date IS NULL
  AND ar.tracking_type = 'MACHINERY'
  AND NOT EXISTS (
    SELECT 1 FROM asset_usages au
    WHERE au.rental_id = ar.id
      AND DATE(au.report_date) = CURRENT_DATE
  );
```

---

## ✅ VALIDACIONES CRÍTICAS

### **Al retirar asset:**

- [ ] Contrato está activo
- [ ] Asset disponible
- [ ] Si MACHINERY: Operario certificado asignado
- [ ] currentCredit > 0

### **Al procesar reporte:**

- [ ] Reporte del día (no duplicados)
- [ ] Fotos obligatorias
- [ ] Horómetro/Odómetro coherente (no retrocede)
- [ ] Asset rental activo

### **Cargo automático:**

- [ ] Solo herramientas (trackingType = "TOOL")
- [ ] Asset rental activo (actualReturnDate IS NULL)
- [ ] Contrato activo
- [ ] No procesar dos veces el mismo día

---

**Versión:** 3.0  
**Estado:** ✅ Arquitectura correcta con descuento continuo día a día  
**Próximos pasos:**

1. Validar con usuario
2. Crear migración de Prisma
3. Implementar servicios backend
4. Desarrollar app móvil para operarios
5. Implementar cron jobs
