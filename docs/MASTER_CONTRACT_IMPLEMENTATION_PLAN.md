# 📋 PLAN DE IMPLEMENTACIÓN - CONTRATOS MARCO

**Prioridad**: 🔴 ALTA  
**Complejidad**: 🟡 MEDIA-ALTA  
**Tiempo estimado**: 3-4 semanas  
**Documento completo**: [MASTER_CONTRACT_ARCHITECTURE.md](./MASTER_CONTRACT_ARCHITECTURE.md)

---

## 🎯 RESUMEN EJECUTIVO

### Problema Actual

- Contratos listan implementos específicos desde el inicio
- No hay validación de saldo antes de entregas
- Clientes no tienen límites de crédito/tiempo configurables
- No existe flujo de aprobación para ampliaciones
- Se firmaba cotización (incorrecto) → Solo se debe firmar el contrato

### Solución Propuesta

- **Contratos Marco**: Acuerdo general sin items específicos
- **Addendums**: Documento por cada entrega con implementos específicos
- **Cuenta Corriente con Límites**: Crédito y tiempo máximo por cliente
- **Workflow de Ampliaciones**: Chat interno para solicitar aumentos
- **Anexos Especiales**: Documentos de seguridad para maquinaria con operador

---

## 🏗️ CAMBIOS PRINCIPALES

### 1. MODELO DE DATOS

#### ClientAccount (agregar campos)

```prisma
creditLimit      Decimal   // Límite máximo de dinero
timeLimit        Int       // Límite de días de alquiler
activeDays       Int       // Días activos acumulados
limitsOverridden Boolean   // Si se aprobó exceder
overrideReason   String?
overriddenBy     String?
overriddenAt     DateTime?
```

#### RentalContract (agregar campos)

```prisma
contractType     String    // "master" | "specific"
agreedAmount     Decimal   // Monto según cotización
agreedPeriod     Int?      // Días según cotización
totalActiveDays  Int       // Suma de días de todos los addendums
```

#### ContractAddendum (NUEVO)

```prisma
model ContractAddendum {
  id            String @id
  contractId    String
  code          String // CON-2026-001-ADD-001
  items         Json   // Implementos de ESTA entrega
  estimatedCost Decimal
  actualCost    Decimal
  estimatedDays Int?
  status        String // "active" | "completed"
  pdfUrl        String?
  ...
}
```

#### LimitChangeRequest (NUEVO)

```prisma
model LimitChangeRequest {
  id                   String @id
  clientAccountId      String
  requestedBy          String // Usuario entregas
  currentCreditLimit   Decimal
  requestedCreditLimit Decimal?
  currentTimeLimit     Int
  requestedTimeLimit   Int?
  reason               String
  urgency              String // "low" | "normal" | "high" | "urgent"
  status               String // "pending" | "approved" | "rejected"
  reviewedBy           String?
  reviewedAt           DateTime?
  ...
}
```

#### ContractAttachment (NUEVO)

```prisma
model ContractAttachment {
  id             String @id
  contractId     String
  attachmentType String // "operator_safety" | "operator_viaticum" | ...
  assetId        String?
  title          String
  fileUrl        String
  visibleToClient Boolean
  ...
}
```

#### ContractClauseTemplate (NUEVO)

```prisma
model ContractClauseTemplate {
  id             String @id
  name           String
  category       String // "general" | "safety" | "maintenance" | ...
  content        String // Con variables: "El activo {{asset.name}}..."
  applicableAssetTypes String[]
  isDefault      Boolean
  displayOrder   Int
  ...
}
```

---

## 🔄 FLUJOS CRÍTICOS

### FLUJO 1: Crear Cliente con Límites

```typescript
POST /api/v1/clients
{
  "name": "XYZ Construcciones",
  "accountConfig": {
    "initialCredit": 5000000,
    "creditLimit": 10000000,    // ✨ NUEVO
    "timeLimit": 60,             // ✨ NUEVO (días)
    "statementFrequency": "weekly"
  }
}
```

**Backend:**

1. Crea `Client`
2. Crea `ClientAccount` con límites
3. Si `initialCredit > 0`, crea movimiento "CREDIT_RELOAD"

---

### FLUJO 2: Cotización Aprobada → Contrato Marco

```typescript
POST /api/v1/rental/quotations/:id/approve
```

**Cambio Importante**: ❌ NO firmar cotización → ✅ Firmar solo el contrato

**Backend:**

1. Marca cotización como `approved`
2. Crea `RentalContract` con:
   - `contractType = "master"`
   - `agreedAmount` = quotation.totalAmount
   - `agreedPeriod` = días estimados de cotización
   - **NO incluye items específicos**
3. Genera PDF con template "Contrato Marco"
4. Envía para firma digital (SignNow)

**Template de Contrato Marco:**

```
CONTRATO DE ALQUILER CON-2026-001

Entre DIVANCO SAS y Cliente XYZ, se acuerda contrato de alquiler
según Cotización QU-2026-001:

• Monto: $5,000,000 COP
• Período estimado: 30 días
• Inicio: 08/03/2026

Los implementos específicos serán documentados en Addendums
al momento de cada entrega.

[Cláusulas generales]
[Firmas]
```

---

### FLUJO 3: Verificar Disponibilidad para Entrega

```typescript
POST /api/v1/rental/deliveries/check-availability
{
  "clientId": "uuid",
  "items": [
    {
      "assetId": "uuid",
      "estimatedDays": 10,
      "dailyRate": 200000
    }
  ]
}
```

**Backend verifica:**

1. Calcula costo: `sum(dailyRate * estimatedDays)`
2. Obtiene `ClientAccount`
3. Valida:
   - ✅ `balance >= estimatedCost`
   - ✅ `activeDays + estimatedDays <= timeLimit`

**Response OK:**

```json
{
  "canDeliver": true,
  "estimatedCost": 2000000,
  "remainingBalance": 3000000,
  "remainingDays": 50
}
```

**Response FAIL:**

```json
{
  "canDeliver": false,
  "error": "INSUFFICIENT_BALANCE",
  "shortfall": 1500000,
  "options": ["reload_balance", "request_limit_increase"]
}
```

---

### FLUJO 4: Crear Addendum (Entregar Implementos)

```typescript
POST /api/v1/rental/contracts/:contractId/addendums
{
  "items": [
    {
      "assetId": "uuid",
      "startDate": "2026-03-08",
      "estimatedEndDate": "2026-03-18",
      "estimatedDays": 10,
      "dailyRate": 200000
    }
  ]
}
```

**Backend:**

1. Verifica disponibilidad (igual que check-availability)
2. Si OK:
   - Crea `ContractAddendum` con código `CON-2026-001-ADD-001`
   - Crea `AssetRental` para cada item
   - Crea `RentalAccountMovement` débito
   - Actualiza `ClientAccount.balance` y `activeDays`
   - Actualiza `RentalContract.totalConsumed` y `totalActiveDays`
3. Genera PDF del addendum
4. **Si asset.requiresOperator = true**:
   - Genera `ContractAttachment` con medidas de seguridad
   - Genera `ContractAttachment` con viáticos de operador
   - Envía email con anexos

---

### FLUJO 5: Solicitar Ampliación de Límites

**Usuario de Entregas NO puede modificar límites directamente**

```typescript
POST /api/v1/rental/limit-change-requests
{
  "clientAccountId": "uuid",
  "requestedCreditLimit": 15000000,
  "requestedTimeLimit": 90,
  "reason": "Proyecto ampliado, buen historial de pagos",
  "urgency": "high"
}
```

**Backend:**

1. Crea `LimitChangeRequest` con status "pending"
2. Notifica a usuarios con permiso `limit-requests:review`
3. Crea mensaje en chat/notificaciones:

```
🔔 SOLICITUD DE AMPLIACIÓN

Cliente: XYZ Construcciones (#12345)
Límite actual: $10,000,000 / 60 días
Solicitado: $15,000,000 / 90 días (+$5M / +30d)

Motivo: Proyecto ampliado, buen historial de pagos
Urgencia: ALTA

[Ver Cliente] [Aprobar] [Rechazar]
```

---

### FLUJO 6: Aprobar/Rechazar Ampliación

**Solo Owner/Admin con permiso `limit-requests:review`**

```typescript
POST /api/v1/rental/limit-change-requests/:id/review
{
  "action": "approve",
  "approvedCreditLimit": 15000000,
  "approvedTimeLimit": 90,
  "reviewNotes": "Cliente confiable, historial OK"
}
```

**Backend:**

1. Actualiza `LimitChangeRequest`:
   - `status = "approved"`
   - `reviewedBy = userId`
   - `reviewedAt = now()`
2. Actualiza `ClientAccount`:
   - `creditLimit = 15000000`
   - `timeLimit = 90`
   - `limitsOverridden = true`
   - `overrideReason = reviewNotes`
3. Notifica al usuario de entregas
4. Puede proceder con la entrega

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Sprint 1: Base de Datos y Modelos (Semana 1)

- [ ] **Migración Prisma**:
  - [ ] Agregar campos a `ClientAccount` (límites, override)
  - [ ] Agregar campos a `RentalContract` (contractType, agreed amounts)
  - [ ] Crear tabla `ContractAddendum`
  - [ ] Crear tabla `ContractAttachment`
  - [ ] Crear tabla `LimitChangeRequest`
  - [ ] Crear tabla `ContractClauseTemplate`

- [ ] **Seed Data**:
  - [ ] Cláusulas por defecto (generales, seguridad, etc.)
  - [ ] Template de Contrato Marco
  - [ ] Template de Addendum

- [ ] **Testing DB**:
  - [ ] Test: Crear cliente con límites
  - [ ] Test: Crear contrato marco
  - [ ] Test: Crear addendum con relaciones

---

### Sprint 2: Servicios Backend (Semana 2)

- [ ] **ClientAccountService**:
  - [ ] `configureLimits(clientId, limits)` - Configurar límites inicial
  - [ ] `checkAvailability(clientId, estimatedCost, estimatedDays)` - Verificar saldo/tiempo
  - [ ] `reloadBalance(clientId, amount)` - Recargar saldo

- [ ] **ContractService**:
  - [ ] `createMasterContract(quotation)` - Crear contrato marco (sin items)
  - [ ] Modificar template rendering para contrato marco

- [ ] **AddendumService**:
  - [ ] `createAddendum(contractId, items)` - Crear addendum con validación
  - [ ] `completeAddendum(addendumId)` - Cerrar al devolver implementos
  - [ ] `generateAddendumPDF(addendum)` - PDF del addendum

- [ ] **AttachmentService**:
  - [ ] `generateOperatorSafetyDoc(asset)` - Anexo de seguridad
  - [ ] `generateOperatorViaticumDoc(asset, operatorDetails)` - Anexo de viáticos

- [ ] **LimitChangeService**:
  - [ ] `createRequest(requestData)` - Crear solicitud
  - [ ] `reviewRequest(requestId, action, data)` - Aprobar/rechazar
  - [ ] `notifyRequester(requestId)` - Notificar resultado

- [ ] **ClauseTemplateService**:
  - [ ] `interpolateVariables(clauseContent, context)` - Reemplazar {{variables}}
  - [ ] `getApplicableClauses(assetTypes, contractType)` - Filtrar cláusulas

---

### Sprint 3: API Endpoints (Semana 2-3)

- [ ] **Clients**:
  - [ ] Modificar `POST /api/v1/clients` para aceptar `accountConfig`
  - [ ] `GET /api/v1/clients/:id/account` - Ver cuenta corriente
  - [ ] `PUT /api/v1/clients/:id/account/limits` - Modificar límites (Owner)
  - [ ] `POST /api/v1/clients/:id/account/reload` - Recargar saldo

- [ ] **Deliveries**:
  - [ ] `POST /api/v1/rental/deliveries/check-availability` - Verificar disponibilidad

- [ ] **Addendums**:
  - [ ] `POST /api/v1/rental/contracts/:id/addendums` - Crear addendum
  - [ ] `GET /api/v1/rental/contracts/:id/addendums` - Listar addendums
  - [ ] `GET /api/v1/rental/addendums/:id` - Detalle de addendum
  - [ ] `PUT /api/v1/rental/addendums/:id/complete` - Marcar completado

- [ ] **Attachments**:
  - [ ] `GET /api/v1/rental/contracts/:id/attachments` - Listar anexos
  - [ ] `GET /api/v1/rental/attachments/:id/download` - Descargar anexo

- [ ] **Limit Requests**:
  - [ ] `POST /api/v1/rental/limit-change-requests` - Crear solicitud
  - [ ] `GET /api/v1/rental/limit-change-requests` - Listar (pending)
  - [ ] `GET /api/v1/rental/limit-change-requests/:id` - Detalle
  - [ ] `POST /api/v1/rental/limit-change-requests/:id/review` - Aprobar/Rechazar

---

### Sprint 4: Frontend UI (Semana 3-4)

- [ ] **Clientes**:
  - [ ] Formulario de creación con configuración de límites
  - [ ] Vista de cuenta corriente del cliente
  - [ ] Historial de movimientos
  - [ ] Botón "Recargar Saldo" (modal)

- [ ] **Entregas**:
  - [ ] Verificación de disponibilidad antes de crear addendum
  - [ ] Mensaje de advertencia si saldo insuficiente
  - [ ] Formulario de creación de addendum
  - [ ] Lista de addendums de un contrato

- [ ] **Solicitudes de Ampliación**:
  - [ ] Panel para solicitar ampliación (Usuario Entregas)
  - [ ] Formulario con cliente, límites actuales/solicitados, motivo
  - [ ] Panel de revisión (Owner/Admin)
  - [ ] Tabla de solicitudes pendientes
  - [ ] Modal de aprobación con campos editables

- [ ] **Chat/Notificaciones**:
  - [ ] Notificación al Owner cuando hay solicitud pendiente
  - [ ] Notificación al solicitante cuando se aprueba/rechaza
  - [ ] Badge en navbar con contador de solicitudes pendientes

- [ ] **Anexos**:
  - [ ] Vista de anexos especiales de un contrato
  - [ ] Descarga de PDFs de seguridad/viáticos

---

### Sprint 5: Templates y PDFs (Semana 4)

- [ ] **Templates**:
  - [ ] Template de Contrato Marco (sin items)
  - [ ] Template de Addendum
  - [ ] Template de Anexo de Seguridad
  - [ ] Template de Anexo de Viáticos

- [ ] **Sistema de Cláusulas**:
  - [ ] CRUD de `ContractClauseTemplate`
  - [ ] Interpolación de variables: `{{asset.name}}`, `{{client.name}}`
  - [ ] Filtrado por tipo de activo y categoría
  - [ ] UI para gestionar cláusulas (admin)

- [ ] **PDF Generation**:
  - [ ] Generar PDF de contrato marco
  - [ ] Generar PDF de addendum
  - [ ] Generar PDF de anexos especiales
  - [ ] Adjuntar a emails

---

### Sprint 6: Notificaciones y Testing (Semana 4)

- [ ] **Emails**:
  - [ ] Email: Contrato marco creado (con link de firma)
  - [ ] Email: Addendum generado (con PDF adjunto)
  - [ ] Email: Anexos especiales disponibles (operador, seguridad)
  - [ ] Email: Solicitud de ampliación aprobada

- [ ] **Notificaciones**:
  - [ ] Push: Saldo bajo (alertAmount)
  - [ ] Push: Límite de tiempo cercano (85% del timeLimit)
  - [ ] Push: Solicitud de ampliación pendiente (Owner)
  - [ ] Push: Solicitud aprobada/rechazada (Solicitante)

- [ ] **Testing Integral**:
  - [ ] Test E2E: Crear cliente → Cotización → Contrato marco → Addendum
  - [ ] Test: Verificar disponibilidad (casos OK y FAIL)
  - [ ] Test: Solicitar ampliación → Aprobar → Crear addendum
  - [ ] Test: Asset con operador → Generar anexos automáticamente
  - [ ] Test: Devolver implementos → Actualizar addendum y saldo

---

## 🔐 PERMISOS NUEVOS

### Definición de Permisos

```typescript
const NEW_PERMISSIONS = {
  "accounts:view": "Ver cuentas corrientes",
  "accounts:update": "Modificar límites de cuenta (Solo Owner/Admin)",
  "accounts:reload": "Recargar saldo en cuenta",
  "contracts:create-addendum": "Crear documentos de entrega",
  "deliveries:check-balance": "Verificar disponibilidad para entregas",
  "deliveries:request-limit-increase": "Solicitar ampliación de límites",
  "limit-requests:review": "Aprobar/rechazar solicitudes (Solo Owner/Admin)",
  "contracts:view-attachments": "Ver anexos de contratos",
};
```

### Asignación a Roles

**Usuario de Entregas:**

- `accounts:view`
- `deliveries:check-balance`
- `deliveries:request-limit-increase`
- `contracts:create-addendum`
- `contracts:view-attachments`

**Owner / Admin Financiero:**

- `accounts:*`
- `limit-requests:review`
- `contracts:*`

---

## 🚨 NOTAS CRÍTICAS

### 1. Migración de Contratos Existentes

Los contratos ya creados se marcan como `contractType = "specific"` (legacy).

```sql
UPDATE rental_contracts
SET contractType = 'specific'
WHERE contractType IS NULL;
```

Nuevos contratos se crean como `"master"`.

### 2. Validación Estricta en Entregas

**NO permitir entregas si:**

- `balance < estimatedCost`
- `activeDays + estimatedDays > timeLimit`

**Excepción:**

- Si `limitsOverridden = true`, permitir con advertencia
- Registrar en logs

### 3. Chat Interno

**Opción 1**: Construir desde cero (más trabajo)  
**Opción 2**: Usar sistema de notificaciones + modal de aprobación ✅ **RECOMENDADO**

Implementación:

- Notificación push al Owner con solicitud pendiente
- Modal con detalles del cliente y límites
- Campos editables para aprobar con nuevos valores
- Guardar en `LimitChangeRequest`

### 4. Firma de Contratos

**CAMBIO IMPORTANTE**:

- ❌ ANTES: Se firmaba la cotización
- ✅ AHORA: Solo se firma el contrato marco

Flujo:

1. Cliente aprueba cotización (sin firma)
2. Se crea contrato marco
3. Se envía contrato para firma digital (SignNow)
4. Cliente firma el contrato
5. Contrato se activa

---

## 📊 ESTIMACIÓN DE ESFUERZO

| Sprint   | Tareas                   | Tiempo   | Complejidad   |
| -------- | ------------------------ | -------- | ------------- |
| Sprint 1 | DB, Migraciones, Modelos | 3-4 días | 🟢 Baja       |
| Sprint 2 | Servicios Backend        | 5-6 días | 🟡 Media      |
| Sprint 3 | API Endpoints            | 4-5 días | 🟡 Media      |
| Sprint 4 | Frontend UI              | 6-7 días | 🟠 Media-Alta |
| Sprint 5 | Templates y PDFs         | 3-4 días | 🟡 Media      |
| Sprint 6 | Notificaciones y Testing | 3-4 días | 🟢 Baja-Media |

**Total**: ~24-30 días (4-5 semanas)

---

## 📚 RECURSOS

- [MASTER_CONTRACT_ARCHITECTURE.md](./MASTER_CONTRACT_ARCHITECTURE.md) - Documentación técnica completa
- [CONTRACT_TEMPLATE_ARCHITECTURE.md](./CONTRACT_TEMPLATE_ARCHITECTURE.md) - Sistema de templates (actualizar)
- [RENTAL_CONTRACT_ARCHITECTURE.md](./RENTAL_CONTRACT_ARCHITECTURE.md) - Arquitectura legacy

---

## ✅ PRÓXIMOS PASOS

1. **Validar diseño** con stakeholders
2. **Priorizar funcionalidades** (¿Empezar por límites básicos o sistema completo?)
3. **Crear tickets** en sistema de gestión de tareas
4. **Asignar Sprint 1** y comenzar con migraciones de base de datos

---

**Última actualización**: 8 de marzo de 2026  
**Estado**: 🔴 Diseño aprobado, pendiente implementación
