# 📋 ARQUITECTURA DE CONTRATOS MARCO Y CUENTA CORRIENTE

**Versión**: 1.0  
**Fecha**: Marzo 8, 2026  
**Estado**: 🔴 Diseño (Implementación Pendiente)

---

## 🎯 OBJETIVO

Rediseñar el sistema de contratos para implementar:

1. **Contratos Marco**: Acuerdo general de alquiler sin listar implementos específicos
2. **Cuenta Corriente del Cliente**: Con límites de dinero y tiempo de alquiler
3. **Addendums por Entrega**: Documento específico para cada retiro de implementos
4. **Sistema de Ampliación de Límites**: Workflow de chat para solicitudes de aumento
5. **Anexos Especiales**: Documentación adicional para maquinaria con operador

---

## 🏗️ CONCEPTO DEL FLUJO

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO NUEVO DE CONTRATOS                      │
└─────────────────────────────────────────────────────────────────┘

1️⃣ COTIZACIÓN + APROBACIÓN
   ┌──────────────────┐
   │ Cliente recibe   │
   │ cotización       │ → Revisa monto, tiempo, implementos
   │ QU-2026-001      │
   └────────┬─────────┘
            │ Aprueba
            ▼
   ┌──────────────────────────────────────────────┐
   │ ✅ Cotización Aprobada                       │
   │ Monto: $5,000,000 COP                        │
   │ Período estimado: 30 días                    │
   │ Items: Excavadora, Retroexcavadora, Camión   │
   └────────┬─────────────────────────────────────┘
            │
            ▼

2️⃣ CREACIÓN DE CONTRATO MARCO (Sin implementos específicos)
   ┌──────────────────────────────────────────────┐
   │ 📄 CONTRATO MARCO CON-2026-001               │
   │                                               │
   │ Entre: DIVANCO SAS y Cliente XYZ             │
   │                                               │
   │ Por el presente, las partes acuerdan un      │
   │ contrato de alquiler de maquinaria           │
   │ según Cotización QU-2026-001 por:            │
   │                                               │
   │ • Monto: $5,000,000 COP                      │
   │ • Período estimado: 30 días                  │
   │ • Términos: [Cláusulas generales]            │
   │                                               │
   │ Los implementos específicos serán            │
   │ documentados en Addendums posteriores        │
   │ al momento de cada entrega.                  │
   │                                               │
   │ ✍️ Firmas: [Cliente] [Representante]         │
   └────────┬─────────────────────────────────────┘
            │ Se firma digitalmente (SignNow)
            ▼

3️⃣ ACREDITACIÓN EN CUENTA CORRIENTE DEL CLIENTE
   ❌ VALIDACIÓN: ¿Cliente tiene saldo?

   SI NO TIENE → Debe acreditar fondos primero

   ┌──────────────────────────────────────────────┐
   │ 💰 CUENTA CORRIENTE - Cliente XYZ            │
   │                                               │
   │ Saldo Actual:        $5,000,000 COP          │
   │ Límite de Dinero:    $10,000,000 COP         │
   │ Límite de Tiempo:    60 días                 │
   │                                               │
   │ Movimientos:                                 │
   │ [08/03] Acreditación inicial  +$5,000,000    │
   └──────────────────────────────────────────────┘

4️⃣ RETIRO DE IMPLEMENTOS (Primera entrega)

   Cliente solicita retirar:
   • Excavadora CAT 320D - 10 días

   ┌──────────────────────────────────────────────┐
   │ ✅ VERIFICACIÓN AUTOMÁTICA                   │
   │                                               │
   │ Costo estimado:     $2,000,000 COP           │
   │ Tiempo solicitado:  10 días                  │
   │                                               │
   │ ✔ Saldo suficiente (queda $3,000,000)        │
   │ ✔ Dentro del límite de tiempo (60 días)      │
   │                                               │
   │ ➡️ APROBADO - Generar Addendum               │
   └──────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────┐
   │ 📑 ADDENDUM #1 - CON-2026-001-ADD-001        │
   │                                               │
   │ Fecha: 08/03/2026                            │
   │ Contrato: CON-2026-001                       │
   │                                               │
   │ IMPLEMENTOS RETIRADOS:                       │
   │ • Excavadora CAT 320D (EXC-001)              │
   │   - Período: 08/03/2026 - 18/03/2026         │
   │   - Costo diario: $200,000                   │
   │   - Total estimado: $2,000,000               │
   │                                               │
   │ RESPONSABILIDADES:                           │
   │ • Operador calificado requerido              │
   │ • Mantenimiento cada 100 horas               │
   │ • Seguro todo riesgo                         │
   │                                               │
   │ Estado cuenta: -$2,000,000                   │
   │ Saldo restante: $3,000,000                   │
   └──────────────────────────────────────────────┘

   ⚠️ SI LA MAQUINA INCLUYE OPERADOR →

   ┌──────────────────────────────────────────────┐
   │ 📋 ANEXO - MEDIDAS DE SEGURIDAD              │
   │ Excavadora CAT 320D                          │
   │                                               │
   │ • Uso de EPP obligatorio                     │
   │ • Inspección diaria pre-operacional          │
   │ • Límite de carga: 2.5 toneladas             │
   │                                               │
   │ VIÁTICOS OPERADOR:                           │
   │ • $50,000 COP/día                            │
   │ • Transporte incluido                        │
   │ • Horario: 7am - 5pm                         │
   └──────────────────────────────────────────────┘

5️⃣ SEGUNDO RETIRO (Días después)

   Cliente solicita:
   • Retroexcavadora - 15 días
   • Camión volteo - 5 días

   Costo estimado: $2,500,000

   ❌ PROBLEMA: Solo tiene $3,000,000 pero ya usó $2,000,000
       Saldo disponible: $1,000,000

   ┌──────────────────────────────────────────────┐
   │ ⚠️ SALDO INSUFICIENTE                        │
   │                                               │
   │ Necesita: $2,500,000                         │
   │ Disponible: $1,000,000                       │
   │ Faltante: $1,500,000                         │
   │                                               │
   │ ➡️ Opciones:                                 │
   │ 1. Recargar cuenta                           │
   │ 2. Solicitar ampliación de límite            │
   └──────────────────────────────────────────────┘

6️⃣ SOLICITUD DE AMPLIACIÓN DE LÍMITE (VÍA CHAT)

   Usuario de Entregas NO puede aumentar límites
   → Debe solicitar por chat interno

   ┌──────────────────────────────────────────────┐
   │ 💬 CHAT INTERNO - Aprobaciones               │
   │                                               │
   │ [Usuario Entregas - 08/03 10:30am]           │
   │ 🔔 Solicitud de ampliación de límite         │
   │                                               │
   │ 👤 Cliente: XYZ Construcciones (#12345)      │
   │ 📊 Límite actual dinero: $10,000,000         │
   │ 📊 Límite actual tiempo: 60 días             │
   │                                               │
   │ ✏️ Solicita:                                 │
   │ • Nuevo límite dinero: $15,000,000           │
   │ • Motivo: Proyecto requiere más equipos      │
   │                                               │
   │ [Botón: Ver Cliente] [Botón: Ver Contrato]  │
   │                                               │
   │ ─────────────────────────────────────────    │
   │                                               │
   │ [Owner/Admin - 08/03 10:45am]                 │
   │ ✅ Aprobado                                  │
   │                                               │
   │ [Modifica en línea]                          │
   │ Nuevo límite dinero: [$15,000,000] ➡️ Guardar│
   │ Nuevo límite tiempo: [90 días] ➡️ Guardar    │
   │                                               │
   │ Motivo: Cliente confiable, buen historial    │
   └──────────────────────────────────────────────┘

   ✅ Límites actualizados automáticamente
   → Usuario de entregas recibe notificación
   → Puede proceder con la entrega

7️⃣ DEVOLUCIÓN DE IMPLEMENTOS

   Cliente devuelve Excavadora después de 10 días

   ┌──────────────────────────────────────────────┐
   │ 🔙 DEVOLUCIÓN - Excavadora CAT 320D          │
   │                                               │
   │ Fecha entrega: 08/03/2026                    │
   │ Fecha devolución: 18/03/2026                 │
   │ Días usados: 10                              │
   │                                               │
   │ Cobro real: $2,000,000                       │
   │ (sin cargos adicionales)                     │
   │                                               │
   │ ✅ Inspección OK - Sin daños                 │
   │                                               │
   │ Cuenta actualizada:                          │
   │ Consumo confirmado: -$2,000,000              │
   └──────────────────────────────────────────────┘
```

---

## 📊 MODELO DE DATOS

### 1. Actualización: `ClientAccount` (Agregar Límites)

```prisma
model ClientAccount {
  id       String @id @default(uuid())
  tenantId String
  clientId String @unique

  // Saldo compartido entre todos los contratos del cliente
  balance       Decimal @default(0) @db.Decimal(12, 2)
  totalConsumed Decimal @default(0) @db.Decimal(12, 2)
  totalReloaded Decimal @default(0) @db.Decimal(12, 2)

  // ✨ NUEVO: Límites configurables
  creditLimit    Decimal @default(0) @db.Decimal(12, 2) // Límite máximo de dinero
  timeLimit      Int     @default(30)                    // Límite de días de alquiler

  // Tracking de uso de límites
  activeDays     Int     @default(0)                     // Días activos acumulados

  // Estado de excepción
  limitsOverridden Boolean  @default(false)   // Si se aprobó exceder límites
  overrideReason   String?  @db.Text          // Motivo de la excepción
  overriddenBy     String?                    // userId que aprobó
  overriddenAt     DateTime?

  // Alertas
  alertAmount    Decimal   @default(0) @db.Decimal(12, 2)
  alertTriggered Boolean   @default(false)
  lastAlertSent  DateTime?

  // Estados de cuenta
  statementFrequency String?
  lastStatementSent  DateTime?
  nextStatementDue   DateTime?

  // Metadata
  notes    String? @db.Text
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  tenant              Tenant                     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client              Client                     @relation(fields: [clientId], references: [id], onDelete: Cascade)
  movements           RentalAccountMovement[]
  rentalContracts     RentalContract[]
  limitChangeRequests LimitChangeRequest[]      // ✨ NUEVO

  @@index([tenantId])
  @@index([balance])
  @@index([limitsOverridden]) // Para auditoría
  @@map("client_accounts")
}
```

### 2. Actualización: `RentalContract` (Convertir a Contrato Marco)

```prisma
model RentalContract {
  id              String  @id @default(uuid())
  tenantId        String
  businessUnitId  String
  quotationId     String? @unique
  clientId        String
  clientAccountId String
  code            String

  // ✨ NUEVO: Tipo de contrato
  contractType String @default("master") // "master" | "specific" (legacy)

  // MASTER CONTRACT: Sin items específicos, solo montos y períodos generales
  // SPECIFIC CONTRACT: Legacy - con items en el momento de creación

  // Estado
  status String

  // Fechas
  startDate        DateTime
  estimatedEndDate DateTime?
  actualEndDate    DateTime?

  // Montos y períodos del contrato marco (referencia a cotización)
  agreedAmount  Decimal  @db.Decimal(12, 2) // Monto acordado según cotización
  agreedPeriod  Int?                        // Días acordados según cotización

  // Tracking - ahora la suma de todos los addendums
  totalConsumed        Decimal @default(0) @db.Decimal(12, 2)
  totalActiveDays      Int     @default(0)

  lastAutoChargeDate   DateTime?

  // Documentos
  templateId   String?
  pdfUrl       String?
  signedPdfUrl String?

  // Tokens y estados
  receiptToken         String?   @unique
  receiptUploadedAt    DateTime?
  estimatedTotal       Decimal?  @db.Decimal(12, 2)
  currency             String    @default("COP")

  // Payment Proof
  paymentType       String?
  paymentProofUrl   String?
  paymentDetails    Json?
  paymentVerifiedBy String?
  paymentVerifiedAt DateTime?

  // Firma
  signatureToken       String?   @unique
  signatureStatus      String?
  signatureRequestedAt DateTime?
  signatureCompletedAt DateTime?
  signatureRequestId   String?
  signatureProvider    String?
  activationMethod     String?

  // Metadata
  notes    String? @db.Text
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  // Relaciones
  tenant        Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit  BusinessUnit  @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  quotation     Quotation?    @relation(fields: [quotationId], references: [id])
  client        Client        @relation(fields: [clientId], references: [id])
  clientAccount ClientAccount @relation(fields: [clientAccountId], references: [id])
  template      Template?     @relation(fields: [templateId], references: [id])
  creator       User?         @relation("RentalContractCreator", fields: [createdBy], references: [id])

  movements           RentalAccountMovement[]
  activeRentals       AssetRental[]
  bulkItems           BulkRentalItem[]
  addendums           ContractAddendum[]          // ✨ NUEVO: Anexos por entrega
  specialAttachments  ContractAttachment[]        // ✨ NUEVO: Anexos especiales (operador, etc)

  // Legacy
  contractAssets      ContractAsset[]
  usageReports        UsageReport[]
  incidents           Incident[]
  operatorAssignments OperatorAssignment[]

  @@unique([tenantId, code])
  @@index([tenantId, businessUnitId])
  @@index([tenantId, businessUnitId, status])
  @@index([clientId])
  @@index([clientAccountId])
  @@index([contractType]) // ✨ NUEVO
  @@map("rental_contracts")
}
```

### 3. NUEVO: `ContractAddendum` (Anexo por Entrega)

```prisma
model ContractAddendum {
  id         String @id @default(uuid())
  tenantId   String
  contractId String
  code       String // CON-2026-001-ADD-001

  // Metadata del addendum
  addendumType String @default("delivery") // "delivery" | "modification" | "extension"

  // Fecha de emisión
  issueDate   DateTime @default(now())

  // Activos entregados en ESTE addendum
  items Json // Array de { assetId, quantity, startDate, estimatedEndDate, dailyRate, estimatedCost }

  // Costos de ESTE addendum
  estimatedCost Decimal @db.Decimal(12, 2)
  actualCost    Decimal @default(0) @db.Decimal(12, 2) // Se actualiza al devolver

  // Período estimado
  estimatedDays Int?

  // Estado del addendum
  status String @default("active") // "active" | "completed" | "cancelled"

  // Documento PDF del addendum
  pdfUrl       String?
  signedPdfUrl String?

  // Fechas de devolución
  completedAt DateTime?

  // Metadata
  notes    String? @db.Text
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  // Relaciones
  tenant   Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contract RentalContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  creator  User?          @relation("ContractAddendumCreator", fields: [createdBy], references: [id])

  // Movimientos de cuenta relacionados
  movements RentalAccountMovement[]

  // Rentals específicos de este addendum
  rentals AssetRental[] // Assets entregados en ESTE addendum

  @@unique([tenantId, code])
  @@index([contractId])
  @@index([tenantId, status])
  @@map("contract_addendums")
}
```

### 4. NUEVO: `ContractAttachment` (Anexos Especiales)

```prisma
model ContractAttachment {
  id         String @id @default(uuid())
  tenantId   String
  contractId String

  // Tipo de anexo
  attachmentType String // "operator_safety" | "operator_viaticum" | "insurance" | "technical_specs" | "custom"

  // Referencia al activo (si aplica)
  assetId String?

  // Metadata
  title       String
  description String? @db.Text

  // Archivo
  fileUrl     String
  fileType    String  // "pdf" | "docx" | "jpg" | etc
  fileSize    Int?    // bytes

  // Visibilidad
  visibleToClient Boolean @default(true)

  // Fechas
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  // Relaciones
  tenant   Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contract RentalContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  asset    Asset?         @relation(fields: [assetId], references: [id])
  creator  User?          @relation("ContractAttachmentCreator", fields: [createdBy], references: [id])

  @@index([contractId])
  @@index([assetId])
  @@map("contract_attachments")
}
```

### 5. NUEVO: `LimitChangeRequest` (Solicitud de Ampliación)

```prisma
model LimitChangeRequest {
  id              String @id @default(uuid())
  tenantId        String
  clientAccountId String

  // Quién solicita
  requestedBy   String   // userId (usuario de entregas)
  requestedAt   DateTime @default(now())

  // Límites actuales
  currentCreditLimit Decimal @db.Decimal(12, 2)
  currentTimeLimit   Int

  // Límites solicitados
  requestedCreditLimit Decimal? @db.Decimal(12, 2)
  requestedTimeLimit   Int?

  // Justificación
  reason     String  @db.Text
  urgency    String  @default("normal") // "low" | "normal" | "high" | "urgent"

  // Estado de la solicitud
  status     String  @default("pending") // "pending" | "approved" | "rejected" | "cancelled"

  // Respuesta
  reviewedBy String?   // userId (owner/admin)
  reviewedAt DateTime?

  approvedCreditLimit Decimal? @db.Decimal(12, 2)
  approvedTimeLimit   Int?

  reviewNotes String? @db.Text

  // Metadata
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  tenant        Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  clientAccount ClientAccount @relation(fields: [clientAccountId], references: [id], onDelete: Cascade)
  requester     User          @relation("LimitChangeRequestRequester", fields: [requestedBy], references: [id])
  reviewer      User?         @relation("LimitChangeRequestReviewer", fields: [reviewedBy], references: [id])

  @@index([clientAccountId])
  @@index([status])
  @@index([requestedAt])
  @@map("limit_change_requests")
}
```

### 6. NUEVO: `ContractClauseTemplate` (Plantillas de Cláusulas)

```prisma
model ContractClauseTemplate {
  id             String  @id @default(uuid())
  tenantId       String
  businessUnitId String?

  // Metadata de la cláusula
  name        String
  category    String  // "general" | "safety" | "maintenance" | "insurance" | "liability" | "termination"

  // Contenido
  content     String  @db.Text

  // Variables soportadas (para interpolación)
  // Ejemplo: "El activo {{asset.name}} debe ser operado..."
  supportedVariables Json?

  // Aplicabilidad
  applicableAssetTypes String[] // ["excavadora", "retroexcavadora"] o [] para todas
  applicableContractTypes String[] @default(["master", "specific"])

  // Estado
  isActive   Boolean @default(true)
  isDefault  Boolean @default(false) // Si se incluye automáticamente

  // Orden de visualización
  displayOrder Int @default(0)

  // Metadata
  notes    String? @db.Text
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  // Relaciones
  tenant       Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit BusinessUnit? @relation(fields: [businessUnitId], references: [id])
  creator      User?         @relation("ContractClauseTemplateCreator", fields: [createdBy], references: [id])

  @@index([tenantId])
  @@index([category])
  @@index([isActive])
  @@map("contract_clause_templates")
}
```

---

## 🔄 FLUJOS DE NEGOCIO

### FLUJO 1: Creación de Cliente con Cuenta Corriente

```http
POST /api/v1/clients
```

**Request Body:**

```json
{
  "name": "XYZ Construcciones",
  "email": "contacto@xyz.com",
  "phone": "+57 300 1234567",
  "documentType": "NIT",
  "documentId": "900123456-7",
  "type": "COMPANY",

  // ✨ NUEVO: Configuración inicial de cuenta
  "accountConfig": {
    "initialCredit": 5000000, // Saldo inicial (puede ser 0)
    "creditLimit": 10000000, // Límite máximo de dinero
    "timeLimit": 60, // Límite de días de alquiler
    "statementFrequency": "weekly" // Frecuencia de estados de cuenta
  }
}
```

**Sistema hace:**

1. Crea el `Client`
2. Crea automáticamente el `ClientAccount` con los límites especificados
3. Si `initialCredit > 0`, crea un `RentalAccountMovement` tipo "CREDIT_RELOAD"

---

### FLUJO 2: Aprobación de Cotización → Contrato Marco

```http
POST /api/v1/rental/quotations/:id/approve
```

**Cambio:**

Antes se firmaba la cotización. **AHORA solo se firma el contrato.**

**Sistema hace:**

1. Marca cotización como `approved`
2. Crea `RentalContract` con `contractType = "master"`
   - NO lista activos específicos
   - Referencia a la cotización para monto y período estimado
   - `agreedAmount` = quotation.totalAmount
   - `agreedPeriod` = días estimados de la cotización
3. Genera PDF del contrato marco con template específico
4. Envía para firma digital (SignNow)
5. Envía email al cliente con link de firma

**Contenido del Contrato Marco:**

```
CONTRATO DE ALQUILER DE MAQUINARIA
CON-2026-001

Entre DIVANCO SAS (el Arrendador) y XYZ CONSTRUCCIONES (el Arrendatario),
se acuerda un contrato de alquiler según los términos de la
Cotización QU-2026-001:

• Monto acordado: $5,000,000 COP
• Período estimado: 30 días
• Fecha de inicio: 08/03/2026

Los implementos específicos serán documentados en Addendums
al momento de cada entrega.

CLÁUSULAS:
[Cláusulas generales desde ContractClauseTemplate]

1. VIGENCIA
2. RESPONSABILIDADES DEL ARRENDATARIO
3. SEGUROS Y GARANTÍAS
4. TERMINACIÓN ANTICIPADA
...

FIRMAS:
_______________          _______________
Cliente                  Representante
```

---

### FLUJO 3: Verificación de Saldo antes de Entrega

```http
POST /api/v1/rental/deliveries/check-availability
```

**Request Body:**

```json
{
  "clientId": "client-uuid",
  "items": [
    {
      "assetId": "asset-uuid",
      "quantity": 1,
      "estimatedDays": 10,
      "dailyRate": 200000
    }
  ]
}
```

**Sistema verifica:**

1. Calcula costo total estimado: `items.reduce((sum, item) => sum + (item.dailyRate * item.estimatedDays), 0)`
2. Obtiene `ClientAccount`
3. Verifica:
   - `balance >= estimatedCost` → ✅ Saldo suficiente
   - `activeDays + estimatedDays <= timeLimit` → ✅ Dentro del límite de tiempo

**Response:**

```json
{
  "success": true,
  "data": {
    "canDeliver": true,
    "estimatedCost": 2000000,
    "currentBalance": 3000000,
    "remainingBalance": 1000000,
    "estimatedDays": 10,
    "currentActiveDays": 0,
    "timeLimit": 60,
    "remainingDays": 50
  }
}
```

**Si NO puede:**

```json
{
  "success": false,
  "error": "INSUFFICIENT_BALANCE",
  "data": {
    "canDeliver": false,
    "estimatedCost": 2500000,
    "currentBalance": 1000000,
    "shortfall": 1500000,
    "options": ["reload_balance", "request_limit_increase"]
  }
}
```

---

### FLUJO 4: Creación de Addendum (Entrega de Implementos)

```http
POST /api/v1/rental/contracts/:contractId/addendums
```

**Request Body:**

```json
{
  "items": [
    {
      "assetId": "asset-uuid",
      "quantity": 1,
      "startDate": "2026-03-08",
      "estimatedEndDate": "2026-03-18",
      "estimatedDays": 10,
      "dailyRate": 200000,
      "estimatedCost": 2000000,
      "notes": "Excavadora CAT 320D para obra Centro Comercial"
    }
  ],
  "notes": "Primera entrega según contrato CON-2026-001"
}
```

**Sistema hace:**

1. Verifica saldo y límites (igual que check-availability)
2. Si OK:
   - Crea `ContractAddendum` con código `CON-2026-001-ADD-001`
   - Crea `AssetRental` para cada item (vinculado al addendum)
   - Crea `RentalAccountMovement` tipo "RENTAL_CHARGE" débito
   - Actualiza `ClientAccount.balance` y `activeDays`
   - Actualiza `RentalContract.totalConsumed` y `totalActiveDays`
3. Genera PDF del addendum
4. Si el activo requiere operador → crea `ContractAttachment` con medidas de seguridad

**Contenido del Addendum:**

```
ADDENDUM #1 al Contrato CON-2026-001
Código: CON-2026-001-ADD-001

Fecha de emisión: 08/03/2026

IMPLEMENTOS ENTREGADOS:

1. Excavadora CAT 320D (EXC-001)
   • Período: 08/03/2026 - 18/03/2026
   • Días estimados: 10
   • Tarifa diaria: $200,000 COP
   • Costo estimado: $2,000,000 COP

RESPONSABILIDADES ESPECÍFICAS:
• Operador calificado requerido (Categoría A)
• Mantenimiento cada 100 horas
• Seguro todo riesgo
• Inspección diaria pre-operacional

CUENTA CORRIENTE:
• Cargo: -$2,000,000 COP
• Saldo restante: $3,000,000 COP
```

---

### FLUJO 5: Solicitud de Ampliación de Límites (Chat)

```http
POST /api/v1/rental/limit-change-requests
```

**Request Body:**

```json
{
  "clientAccountId": "account-uuid",
  "requestedCreditLimit": 15000000,
  "requestedTimeLimit": 90,
  "reason": "Cliente requiere más equipos para ampliación del proyecto. Buen historial de pagos.",
  "urgency": "high"
}
```

**Sistema hace:**

1. Crea `LimitChangeRequest` con status "pending"
2. Envía notificación por chat interno a usuarios con permiso `accounts:update`
3. Crea mensaje en el chat:

```
🔔 SOLICITUD DE AMPLIACIÓN DE LÍMITES

👤 Cliente: XYZ Construcciones (#12345)
📊 Límite actual dinero: $10,000,000 COP
📊 Límite actual tiempo: 60 días

✏️ Límites solicitados:
• Dinero: $15,000,000 COP (+$5,000,000)
• Tiempo: 90 días (+30 días)

📝 Motivo: Cliente requiere más equipos para ampliación del proyecto.
Buen historial de pagos.

🚨 Urgencia: ALTA

[Botón: Ver Cliente] [Botón: Ver Historial] [Botón: Aprobar] [Botón: Rechazar]
```

---

### FLUJO 6: Aprobación/Rechazo de Ampliación

```http
POST /api/v1/rental/limit-change-requests/:id/review
```

**Request Body (Aprobar):**

```json
{
  "action": "approve",
  "approvedCreditLimit": 15000000,
  "approvedTimeLimit": 90,
  "reviewNotes": "Cliente confiable con buen historial. Proyecto verificado."
}
```

**Sistema hace:**

1. Actualiza `LimitChangeRequest`:
   - `status = "approved"`
   - `reviewedBy = userId`
   - `reviewedAt = now()`
   - `approvedCreditLimit = 15000000`
   - `approvedTimeLimit = 90`
2. Actualiza `ClientAccount`:
   - `creditLimit = 15000000`
   - `timeLimit = 90`
   - `limitsOverridden = true`
   - `overrideReason = reviewNotes`
   - `overriddenBy = userId`
   - `overriddenAt = now()`
3. Notifica al usuario de entregas que solicitó
4. Actualiza el chat con la respuesta

**Request Body (Rechazar):**

```json
{
  "action": "reject",
  "reviewNotes": "Historial de pagos irregular. Requiere normalizar cuenta primero."
}
```

---

### FLUJO 7: Anexo Especial (Maquinaria con Operador)

Cuando se crea un addendum y uno de los activos tiene `requiresOperator = true`:

**Sistema automáticamente:**

1. Genera PDF de "Medidas de Seguridad" desde template específico del asset
2. Genera PDF de "Viáticos del Operador" con detalles acordados
3. Crea `ContractAttachment` para cada documento:

```json
{
  "contractId": "contract-uuid",
  "attachmentType": "operator_safety",
  "assetId": "asset-uuid",
  "title": "Medidas de Seguridad - Excavadora CAT 320D",
  "description": "Normas de seguridad y responsabilidades para operación",
  "fileUrl": "https://storage.../safety-EXC-001.pdf",
  "fileType": "pdf",
  "visibleToClient": true
}
```

**Email al cliente:**

```
Asunto: Documentos adicionales - Excavadora CAT 320D

Estimado cliente,

Ha retirado una maquinaria que incluye operador. Adjuntamos:

1. Medidas de Seguridad y Operación
2. Viáticos y Condiciones del Operador

Por favor, revise estos documentos antes de iniciar operaciones.
```

---

## 🎨 PLANTILLAS DE CONTRATO

### Template: Contrato Marco

```json
{
  "name": "Contrato Marco de Alquiler",
  "type": "master_contract",
  "version": "2.0",
  "sections": [
    {
      "id": "header",
      "type": "header",
      "order": 1,
      "config": {
        "title": "CONTRATO DE ALQUILER DE MAQUINARIA",
        "showCompanyInfo": true
      }
    },
    {
      "id": "parties",
      "type": "parties",
      "order": 2,
      "config": {
        "template": "Entre {{tenant.legalName}} (el Arrendador) con NIT {{tenant.taxId}}, y {{client.name}} (el Arrendatario) con documento {{client.documentId}}, se acuerda el presente contrato."
      }
    },
    {
      "id": "quotation_reference",
      "type": "quotation_reference",
      "order": 3,
      "config": {
        "showQuotationCode": true,
        "showAgreedAmount": true,
        "showAgreedPeriod": true,
        "template": "Según los términos de la Cotización {{quotation.code}}, se acuerda:<br>• Monto: {{currency contract.agreedAmount}}<br>• Período estimado: {{contract.agreedPeriod}} días<br>• Fecha de inicio: {{date contract.startDate}}"
      }
    },
    {
      "id": "addendum_notice",
      "type": "custom_html",
      "order": 4,
      "config": {
        "html": "<p><strong>NOTA:</strong> Los implementos específicos a entregar serán documentados en Addendums posteriores al momento de cada entrega. Este contrato establece el marco general de la relación comercial.</p>"
      }
    },
    {
      "id": "general_clauses",
      "type": "clause_list",
      "order": 5,
      "config": {
        "title": "CLÁUSULAS GENERALES",
        "includeClauses": ["all_default"], // Incluye todas las ContractClauseTemplate con isDefault=true
        "categories": ["general", "liability", "termination"]
      }
    },
    {
      "id": "signatures",
      "type": "signatures",
      "order": 6,
      "config": {
        "signNowEnabled": true,
        "signatories": [
          { "role": "Arrendador", "name": "{{tenant.name}}" },
          { "role": "Arrendatario", "name": "{{client.name}}" }
        ]
      }
    }
  ]
}
```

### Template: Addendum

```json
{
  "name": "Addendum - Entrega de Implementos",
  "type": "addendum",
  "version": "1.0",
  "sections": [
    {
      "id": "header",
      "type": "header",
      "order": 1,
      "config": {
        "title": "ADDENDUM al Contrato {{contract.code}}",
        "subtitle": "Código: {{addendum.code}}"
      }
    },
    {
      "id": "issue_date",
      "type": "custom_html",
      "order": 2,
      "config": {
        "html": "<p><strong>Fecha de emisión:</strong> {{date addendum.issueDate}}</p>"
      }
    },
    {
      "id": "items_delivered",
      "type": "addendum_items",
      "order": 3,
      "config": {
        "title": "IMPLEMENTOS ENTREGADOS",
        "showAssetDetails": true,
        "showPeriod": true,
        "showCosts": true
      }
    },
    {
      "id": "asset_clauses",
      "type": "clause_list",
      "order": 4,
      "config": {
        "title": "RESPONSABILIDADES ESPECÍFICAS",
        "includeClauses": ["per_asset_type"], // Cláusulas según tipo de activo
        "categories": ["safety", "maintenance"]
      }
    },
    {
      "id": "account_summary",
      "type": "account_summary",
      "order": 5,
      "config": {
        "showCharge": true,
        "showRemainingBalance": true
      }
    }
  ]
}
```

---

## 📱 UI: Chat para Aprobación de Límites

### Componente: `LimitChangeRequestChat`

**Vista Usuario de Entregas (Solicitar):**

```tsx
<div className="limit-change-request-panel">
  <h3>Solicitar Ampliación de Límites</h3>

  <div className="client-info">
    <h4>Cliente: {client.name}</h4>
    <p>Número: #{client.code}</p>

    <div className="current-limits">
      <div>
        <label>Límite de Dinero Actual</label>
        <input type="text" value="$10,000,000 COP" disabled />
      </div>
      <div>
        <label>Límite de Tiempo Actual</label>
        <input type="text" value="60 días" disabled />
      </div>
    </div>
  </div>

  <div className="requested-limits">
    <h4>Límites Solicitados</h4>
    <div>
      <label>Nuevo Límite de Dinero</label>
      <input
        type="number"
        value={requestedCreditLimit}
        onChange={(e) => setRequestedCreditLimit(e.target.value)}
      />
    </div>
    <div>
      <label>Nuevo Límite de Tiempo (días)</label>
      <input
        type="number"
        value={requestedTimeLimit}
        onChange={(e) => setRequestedTimeLimit(e.target.value)}
      />
    </div>
  </div>

  <div className="reason">
    <label>Motivo de la Solicitud</label>
    <textarea
      value={reason}
      onChange={(e) => setReason(e.target.value)}
      placeholder="Explique por qué el cliente necesita aumentar sus límites..."
      rows={4}
    />
  </div>

  <div className="urgency">
    <label>Urgencia</label>
    <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
      <option value="low">Baja</option>
      <option value="normal">Normal</option>
      <option value="high">Alta</option>
      <option value="urgent">Urgente</option>
    </select>
  </div>

  <button onClick={handleSubmit} className="btn-primary">
    Enviar Solicitud
  </button>
</div>
```

**Vista Owner/Admin (Aprobar/Rechazar):**

```tsx
<div className="limit-change-review">
  <div className="request-header">
    <span className="urgency-badge urgency-high">🚨 URGENCIA ALTA</span>
    <span className="timestamp">Solicitado el 08/03/2026 10:30am</span>
  </div>

  <div className="client-summary">
    <h4>Cliente: XYZ Construcciones</h4>
    <p>Código: #12345</p>
    <button onClick={() => navigate("/clients/12345")}>Ver Cliente</button>
    <button onClick={() => navigate("/clients/12345/contracts")}>
      Ver Contratos
    </button>
  </div>

  <div className="limits-comparison">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Actual</th>
          <th>Solicitado</th>
          <th>Diferencia</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Límite Dinero</td>
          <td>$10,000,000</td>
          <td>$15,000,000</td>
          <td className="positive">+$5,000,000</td>
        </tr>
        <tr>
          <td>Límite Tiempo</td>
          <td>60 días</td>
          <td>90 días</td>
          <td className="positive">+30 días</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div className="request-reason">
    <h4>Motivo</h4>
    <p>{request.reason}</p>
  </div>

  <div className="review-actions">
    {status === "pending" && (
      <>
        <div className="approval-form">
          <h4>Aprobar Solicitud</h4>
          <div>
            <label>Nuevo Límite de Dinero</label>
            <input
              type="number"
              value={approvedCreditLimit}
              onChange={(e) => setApprovedCreditLimit(e.target.value)}
            />
          </div>
          <div>
            <label>Nuevo Límite de Tiempo (días)</label>
            <input
              type="number"
              value={approvedTimeLimit}
              onChange={(e) => setApprovedTimeLimit(e.target.value)}
            />
          </div>
          <div>
            <label>Notas de Revisión</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Motivo de aprobación o rechazo..."
              rows={3}
            />
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => handleApprove()} className="btn-success">
            ✅ Aprobar
          </button>
          <button onClick={() => handleReject()} className="btn-danger">
            ❌ Rechazar
          </button>
        </div>
      </>
    )}

    {status === "approved" && (
      <div className="review-result success">
        <h4>✅ Solicitud Aprobada</h4>
        <p>Por: {reviewer.name}</p>
        <p>Fecha: {reviewedAt}</p>
        <p>Notas: {reviewNotes}</p>
      </div>
    )}

    {status === "rejected" && (
      <div className="review-result error">
        <h4>❌ Solicitud Rechazada</h4>
        <p>Por: {reviewer.name}</p>
        <p>Fecha: {reviewedAt}</p>
        <p>Notas: {reviewNotes}</p>
      </div>
    )}
  </div>
</div>
```

---

## 🔐 PERMISOS

### Nuevos Permisos Requeridos

```typescript
{
  "accounts:view": {
    "name": "Ver Cuentas Corrientes",
    "description": "Visualizar saldo y movimientos de clientes"
  },
  "accounts:update": {
    "name": "Modificar Límites de Cuenta",
    "description": "Aumentar/disminuir límites de crédito y tiempo"
  },
  "accounts:reload": {
    "name": "Recargar Saldo",
    "description": "Acreditar fondos en cuenta del cliente"
  },
  "contracts:create-addendum": {
    "name": "Crear Addendums",
    "description": "Generar documentos de entrega de implementos"
  },
  "contracts:view-attachments": {
    "name": "Ver Anexos de Contratos",
    "description": "Acceder a documentos especiales (seguridad, operador)"
  },
  "deliveries:check-balance": {
    "name": "Verificar Saldo para Entregas",
    "description": "Consultar disponibilidad antes de entrega"
  },
  "deliveries:request-limit-increase": {
    "name": "Solicitar Ampliación de Límites",
    "description": "Crear solicitudes de aumento de crédito/tiempo"
  },
  "limit-requests:review": {
    "name": "Revisar Solicitudes de Ampliación",
    "description": "Aprobar/rechazar aumentos de límites"
  }
}
```

### Roles Sugeridos

**Usuario de Entregas:**

- `accounts:view`
- `deliveries:check-balance`
- `deliveries:request-limit-increase`
- `contracts:create-addendum` (con validación de saldo)

**Owner / Admin Financiero:**

- `accounts:*` (todos)
- `limit-requests:review`
- `contracts:*` (todos)

---

## ✅ PLAN DE IMPLEMENTACIÓN

### Fase 1: Modelos y Migraciones (Backend)

- [ ] Crear migración para agregar campos a `ClientAccount`:
  - `creditLimit`, `timeLimit`, `activeDays`
  - `limitsOverridden`, `overrideReason`, `overriddenBy`, `overriddenAt`
- [ ] Crear modelo `ContractAddendum`
- [ ] Crear modelo `ContractAttachment`
- [ ] Crear modelo `LimitChangeRequest`
- [ ] Crear modelo `ContractClauseTemplate`
- [ ] Actualizar `RentalContract`:
  - Agregar `contractType`, `agreedAmount`, `agreedPeriod`, `totalActiveDays`
  - Agregar relaciones a `addendums` y `specialAttachments`

### Fase 2: Servicios (Backend)

- [ ] Servicio: `ClientAccountService.configureLimits()`
- [ ] Servicio: `ContractService.createMasterContract()`
- [ ] Servicio: `AddendumService.createAddendum()`
- [ ] Servicio: `AddendumService.checkDeliveryAvailability()`
- [ ] Servicio: `LimitChangeService.createRequest()`
- [ ] Servicio: `LimitChangeService.reviewRequest()`
- [ ] Servicio: `AttachmentService.generateOperatorSafetyDoc()`
- [ ] Servicio: `ClauseTemplateService.interpolateVariables()`

### Fase 3: Templates (Backend)

- [ ] Template: Contrato Marco (sin items)
- [ ] Template: Addendum de Entrega
- [ ] Template: Anexo de Medidas de Seguridad
- [ ] Template: Anexo de Viáticos de Operador
- [ ] Sistema de cláusulas con variables interpoladas

### Fase 4: API Endpoints (Backend)

- [ ] `POST /api/v1/clients` - Crear con cuenta corriente y límites
- [ ] `GET /api/v1/clients/:id/account` - Ver cuenta corriente
- [ ] `PUT /api/v1/clients/:id/account/limits` - Modificar límites (Owner)
- [ ] `POST /api/v1/clients/:id/account/reload` - Recargar saldo
- [ ] `POST /api/v1/rental/deliveries/check-availability` - Verificar disponibilidad
- [ ] `POST /api/v1/rental/contracts/:id/addendums` - Crear addendum
- [ ] `GET /api/v1/rental/contracts/:id/addendums` - Listar addendums
- [ ] `GET /api/v1/rental/contracts/:id/attachments` - Listar anexos
- [ ] `POST /api/v1/rental/limit-change-requests` - Crear solicitud
- [ ] `GET /api/v1/rental/limit-change-requests` - Listar solicitudes (pending)
- [ ] `POST /api/v1/rental/limit-change-requests/:id/review` - Aprobar/Rechazar

### Fase 5: UI (Frontend)

- [ ] Formulario de creación de cliente con límites
- [ ] Vista de cuenta corriente del cliente
- [ ] Verificación de disponibilidad antes de entrega
- [ ] Formulario de creación de addendum
- [ ] Vista de addendums de un contrato
- [ ] Vista de anexos especiales
- [ ] Panel de solicitud de ampliación de límites
- [ ] Panel de revisión de solicitudes (Owner)
- [ ] Chat integrado para solicitudes

### Fase 6: Notificaciones y Emails

- [ ] Email: Contrato Marco firmado
- [ ] Email: Addendum generado (con PDF)
- [ ] Email: Anexo especial adjunto (operador, seguridad)
- [ ] Notificación: Saldo bajo
- [ ] Notificación: Límite de tiempo cercano
- [ ] Notificación: Solicitud de ampliación pendiente (Owner)
- [ ] Notificación: Solicitud aprobada/rechazada (Usuario entregas)

### Fase 7: Testing

- [ ] Test: Crear cliente con límites
- [ ] Test: Verificar disponibilidad (OK y FAIL)
- [ ] Test: Crear addendum y descontar de cuenta
- [ ] Test: Generar anexo especial automáticamente
- [ ] Test: Solicitar ampliación de límites
- [ ] Test: Aprobar/Rechazar solicitud
- [ ] Test: Integración firma digital de contrato marco

---

## 🚨 CONSIDERACIONES IMPORTANTES

### 1. Migración de Contratos Existentes

Los contratos ya creados son de tipo "specific" (legacy) con items listados.

**Estrategia:**

- Agregar campo `contractType = "specific"` por defecto a contratos existentes
- Nuevos contratos se crean como `contractType = "master"`
- Sistema soporta ambos tipos simultáneamente

### 2. Validación de Saldo en Entregas

**Validación estricta:**

- No permitir entregas si `balance < estimatedCost`
- Mostrar mensaje claro: "Saldo insuficiente. Debe recargar o solicitar ampliación de límite."

**Excepción:**

- Si `limitsOverridden = true`, permitir exceder con advertencia
- Registrar en logs de auditoría

### 3. Chat Interno

Requisito: Sistema de chat interno para solicitudes.

**Opciones:**

1. Construir desde cero (más trabajo, más control)
2. Integrar con sistema de notificaciones existente + modal de aprobación
3. Usar WebSocket para actualizaciones en tiempo real

**Recomendación:** Opción 2 (usar sistema de notificaciones + modal)

### 4. Plantillas de Cláusulas

Las cláusulas deben ser:

- Editables por tenant/business unit
- Con variables interpoladas: `{{asset.name}}`, `{{client.name}}`
- Categorizadas: general, seguridad, mantenimiento, etc.
- Aplicables según tipo de activo

---

## 📚 DOCUMENTOS RELACIONADOS

- [CONTRACT_TEMPLATE_ARCHITECTURE.md](./CONTRACT_TEMPLATE_ARCHITECTURE.md) - Sistema de templates v2.0 (actualizar para contrato marco)
- [RENTAL_CONTRACT_ARCHITECTURE.md](./RENTAL_CONTRACT_ARCHITECTURE.md) - Arquitectura legacy de contratos
- [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) - Sistema de cobros y estados de cuenta

---

**Versión:** 1.0  
**Fecha:** 8 de marzo de 2026  
**Estado:** 🔴 Diseño - Implementación Pendiente  
**Responsable:** [Tu Nombre]
