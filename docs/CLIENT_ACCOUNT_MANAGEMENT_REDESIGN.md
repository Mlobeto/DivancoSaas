# 🏦 REDISEÑO DE GESTIÓN DE ESTADOS DE CUENTA

**Fecha**: Marzo 12, 2026  
**Estado**: 🔵 Propuesta de Diseño  
**Objetivo**: Escalar a 100+ clientes con gestión eficiente de contratos y cuentas

---

## 🎯 PROBLEMAS ACTUALES

### 1. **UI no escalable**

- Lista plana de cuentas sin agrupación
- Sin paginación eficiente para 100+ clientes
- Búsqueda limitada

### 2. **Comprobantes de pago no visibles**

- Backend guarda en `paymentProofUrl` + `metadata.receiptUrl` ✅
- Frontend no muestra correctamente los comprobantes
- Falta endpoint para ver historial de comprobantes

### 3. **Gestión de contratos fragmentada**

- No se ve lista de contratos por cuenta
- No se puede ver estado de firma
- Falta flujo de reenvío para contratos sin firmar
- No hay generación de corte de cuenta

### 4. **Falta funcionalidad de reportes**

- Sin PDF de estado de cuenta
- Sin envío por email/WhatsApp
- Sin evidencias de consumos/pagos

---

## 🏗️ ARQUITECTURA PROPUESTA

### Vista General

```
┌──────────────────────────────────────────────────────────┐
│              ESTADOS DE CUENTA (Rediseñado)              │
└──────────────────────────────────────────────────────────┘

1️⃣ LISTA DE CLIENTES CON CUENTA
   ┌────────────────────────────────────────────┐
   │ 🔍 Buscar: [___________] 🏷️ Filtros        │
   │                                             │
   │ ┌─────────────────────────────────────┐   │
   │ │ 👤 Cliente ABC S.A.S.               │   │
   │ │                                      │   │
   │ │ 💰 Saldo: $2,500,000 / $5,000,000   │   │
   │ │ 📊 Consumido: $1,800,000             │   │
   │ │ ⚠️  Alertas: 1 contrato sin firmar   │   │
   │ │                                      │   │
   │ │ 📋 Contratos (3):                    │   │
   │ │ ├─ CON-2026-001 ✅ Firmado  $800K    │   │
   │ │ ├─ CON-2026-015 ⏳ Pendiente $500K   │   │
   │ │ └─ CON-2026-022 ✅ Firmado  $500K    │   │
   │ │                                      │   │
   │ │ [Ver Detalle] [Generar Corte]       │   │
   │ └─────────────────────────────────────┘   │
   │                                             │
   │ ┌─────────────────────────────────────┐   │
   │ │ 👤 Cliente XYZ Ltda...              │   │
   └────────────────────────────────────────────┘

2️⃣ DETALLE DE CUENTA (Al hacer click)
   ┌────────────────────────────────────────────┐
   │ 🏦 Estado de Cuenta - Cliente ABC S.A.S.   │
   │                                             │
   │ INFORMACIÓN GENERAL                         │
   │ ├─ Saldo disponible: $2,500,000            │
   │ ├─ Límite de crédito: $5,000,000           │
   │ ├─ Total recargado: $4,300,000             │
   │ └─ Total consumido: $1,800,000             │
   │                                             │
   │ ┌────────────────────────────────────────┐ │
   │ │ 📑 CONTRATOS (3)                       │ │
   │ │                                         │ │
   │ │ CON-2026-001 - Excavadora + Retro      │ │
   │ │ ├─ Estado: ✅ Firmado (08/03/2026)     │ │
   │ │ ├─ Consumo: $800,000 / $1,200,000      │ │
   │ │ ├─ Comprobantes: 2 pagos verificados   │ │
   │ │ └─ [Ver Detalle] [Descargar PDF]       │ │
   │ │                                         │ │
   │ │ CON-2026-015 - Camión de carga         │ │
   │ │ ├─ Estado: ⏳ Pendiente de firma       │ │
   │ │ ├─ Creado: 10/03/2026                  │ │
   │ │ ├─ Link: https://...                   │ │
   │ │ └─ [Reenviar Email] [Reenviar WA]      │ │
   │ │                                         │ │
   │ │ CON-2026-022 - Montacarga              │ │
   │ │ ├─ Estado: ✅ Firmado (11/03/2026)     │ │
   │ │ ├─ Consumo: $500,000 / $800,000        │ │
   │ │ ├─ Comprobantes: 1 pago pendiente      │ │
   │ │ └─ [Ver Detalle] [Descargar PDF]       │ │
   │ └────────────────────────────────────────┘ │
   │                                             │
   │ ┌────────────────────────────────────────┐ │
   │ │ 💳 MOVIMIENTOS DE CUENTA               │ │
   │ │                                         │ │
   │ │ 12/03 Recarga        +$1,200,000 ✅    │ │
   │ │ 11/03 Cargo CON-022  -$500,000         │ │
   │ │ 08/03 Cargo CON-001  -$800,000         │ │
   │ │ 08/03 Recarga        +$3,100,000 ✅    │ │
   │ └────────────────────────────────────────┘ │
   │                                             │
   │ [📄 Generar Corte PDF] [📧 Enviar Email]   │
   │ [📱 Enviar WhatsApp]   [💰 Recargar Saldo] │
   └────────────────────────────────────────────┘

3️⃣ DETALLE DE CONTRATO (Al hacer click en contrato)
   ┌────────────────────────────────────────────┐
   │ 📄 Contrato CON-2026-001                   │
   │                                             │
   │ INFORMACIÓN                                 │
   │ ├─ Cliente: ABC S.A.S.                     │
   │ ├─ Estado: ✅ Firmado el 08/03/2026        │
   │ ├─ Monto: $1,200,000                       │
   │ ├─ Consumido: $800,000 (66.7%)             │
   │ └─ Saldo: $400,000                         │
   │                                             │
   │ ┌────────────────────────────────────────┐ │
   │ │ 🧾 COMPROBANTES DE PAGO (2)            │ │
   │ │                                         │ │
   │ │ 12/03/2026 - $500,000                  │ │
   │ │ ├─ Método: Transferencia bancaria      │ │
   │ │ ├─ Ref: TRF-12345                      │ │
   │ │ ├─ Estado: ✅ Verificado               │ │
   │ │ └─ [Ver Comprobante] 🖼️                │ │
   │ │                                         │ │
   │ │ 08/03/2026 - $300,000                  │ │
   │ │ ├─ Método: Efectivo                    │ │
   │ │ ├─ Estado: ✅ Verificado               │ │
   │ │ └─ [Ver Comprobante] 🖼️                │ │
   │ └────────────────────────────────────────┘ │
   │                                             │
   │ ┌────────────────────────────────────────┐ │
   │ │ 🚜 ITEMS DEL CONTRATO (2)              │ │
   │ │                                         │ │
   │ │ Excavadora CAT 320D                    │ │
   │ │ ├─ Costo diario: $80,000               │ │
   │ │ ├─ Días: 10 días                       │ │
   │ │ └─ Total: $800,000                     │ │
   │ │                                         │ │
   │ │ Retroexcavadora JCB                    │ │
   │ │ ├─ Costo diario: $40,000               │ │
   │ │ ├─ Días: 10 días                       │ │
   │ │ └─ Total: $400,000                     │ │
   │ └────────────────────────────────────────┘ │
   │                                             │
   │ [📄 Descargar Contrato] [📧 Enviar Email]  │
   │ [📱 Enviar WhatsApp]                       │
   └────────────────────────────────────────────┘
```

---

## 🛠️ COMPONENTES A CREAR/MODIFICAR

### **BACKEND**

#### 1. **Nuevo Endpoint: GET /api/rental/accounts/:id/detail**

```typescript
// Retorna información completa de la cuenta
{
  account: {
    id: string;
    balance: number;
    creditLimit: number;
    totalReloaded: number;
    totalConsumed: number;
  },
  contracts: [
    {
      id: string;
      contractNumber: string;
      status: "active" | "pending_signature" | "completed";
      signedAt: Date | null;
      signatureUrl: string | null;
      totalAmount: number;
      consumedAmount: number;
      itemsCount: number;
      paymentsCount: number;
      unverifiedPayments: number;
    }
  ],
  recentMovements: [
    {
      id: string;
      type: "credit" | "debit";
      amount: number;
      description: string;
      createdAt: Date;
      proofUrl: string | null;
    }
  ]
}
```

#### 2. **Nuevo Endpoint: GET /api/rental/contracts/:id/payments**

```typescript
// Retorna TODOS los comprobantes de pago de un contrato
{
  payments: [
    {
      id: string;
      amount: number;
      paymentMethod: string;
      referenceNumber: string;
      proofUrl: string;
      verifiedAt: Date | null;
      createdAt: Date;
    }
  ]
}
```

#### 3. **Nuevo Endpoint: POST /api/rental/contracts/:id/resend-signature**

```typescript
// Reenvía el email/WhatsApp para firma
{
  channel: "email" | "whatsapp" | "both";
}
```

#### 4. **Nuevo Endpoint: POST /api/rental/accounts/:id/generate-statement**

```typescript
// Genera PDF de corte de cuenta con evidencias
{
  includePaymentProofs: boolean;
  includeContracts: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  }
}
// Retorna: URL del PDF generado
```

### **FRONTEND**

#### 1. **AccountsListPage (Modificar)**

- ✅ Ya existe
- **Mejorar**: Mostrar preview de contratos por cuenta
- **Agregar**: Mini-cards con info de contratos

#### 2. **AccountDetailPage (NUEVO)**

```typescript
// Nueva página: /accounts/:accountId
- Resumen de cuenta
- Lista de contratos con estados
- Botones de acción (corte, envío)
- Movimientos recientes
```

#### 3. **ContractDetailDrawer (NUEVO)**

```typescript
// Drawer lateral que se abre al hacer click en contrato
- Info del contrato
- Lista de comprobantes de pago con preview
- Items del contrato
- Botones: descargar, reenviar firma
```

#### 4. **PaymentProofsGallery (NUEVO)**

```typescript
// Componente para mostrar todos los comprobantes
- Grid de imágenes/PDFs
- Modal de preview
- Estado de verificación
```

#### 5. **AccountStatementGenerator (NUEVO)**

```typescript
// Modal para configurar y generar PDF de corte
- Selector de fecha
- Opciones: incluir comprobantes, contratos
- Preview antes de generar
- Botones: descargar, enviar email, enviar WhatsApp
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Arreglar Visibilidad de Comprobantes** (Urgente)

**Backend:**

- [x] Ya se arregló el guardado dual (`paymentProofUrl` + `metadata.receiptUrl`)
- [ ] Crear endpoint `/contracts/:id/payments` para listar todos los pagos

**Frontend:**

- [ ] Crear componente `PaymentProofsGallery`
- [ ] Agregar sección de comprobantes en `ContractDetailPage`
- [ ] Mostrar indicador visual de pagos pendientes/verificados

**Tiempo estimado:** 2-3 horas

---

### **FASE 2: Vista Detallada de Cuenta** (Escalabilidad)

**Backend:**

- [ ] Crear endpoint `/accounts/:id/detail` con datos completos
- [ ] Optimizar query con includes y agregaciones

**Frontend:**

- [ ] Crear página `AccountDetailPage`
- [ ] Modificar `AccountsListPage` para linkear a detalle
- [ ] Agregar breadcrumbs de navegación

**Tiempo estimado:** 4-6 horas

---

### **FASE 3: Gestión de Contratos Sin Firmar**

**Backend:**

- [ ] Crear endpoint `/contracts/:id/resend-signature`
- [ ] Integrar con sistema de intenciones (email/WhatsApp)
- [ ] Verificar que el link de firma siga válido

**Frontend:**

- [ ] Agregar botones de reenvío en cards de contratos
- [ ] Mostrar indicador visual de contratos pendientes
- [ ] Toast de confirmación al reenviar

**Tiempo estimado:** 3-4 horas

---

### **FASE 4: Generación de Cortes de Cuenta**

**Backend:**

- [ ] Crear servicio `AccountStatementPdfService`
- [ ] Template PDF para estado de cuenta
- [ ] Incluir: movimientos, contratos, comprobantes
- [ ] Endpoint `/accounts/:id/generate-statement`

**Frontend:**

- [ ] Crear componente `AccountStatementGenerator`
- [ ] Modal con opciones de personalización
- [ ] Botones de descarga y envío

**Tiempo estimado:** 6-8 horas

---

### **FASE 5: Envío por Email y WhatsApp**

**Backend:**

- [ ] Integrar con sistema de intenciones
- [ ] Template de email para estado de cuenta
- [ ] Template de mensaje para WhatsApp
- [ ] Adjuntar PDF generado

**Frontend:**

- [ ] Botones de envío en `AccountDetailPage`
- [ ] Modal de confirmación con preview
- [ ] Indicador de envío exitoso

**Tiempo estimado:** 3-4 horas

---

## 🔄 FLUJOS DE USUARIO

### **Flujo 1: Ver Comprobantes de Pago**

```
1. Usuario va a "Estados de Cuenta"
2. Hace click en "Ver Detalle" de un cliente
3. Ve lista de contratos
4. Hace click en un contrato
5. Se abre drawer con info del contrato
6. Sección "Comprobantes de Pago" muestra:
   - Fecha, monto, método, referencia
   - Thumbnail de imagen/PDF
   - Estado: Verificado ✅ / Pendiente ⏳
7. Click en thumbnail abre modal full-screen
8. Puede aprobar/rechazar comprobante
```

### **Flujo 2: Reenviar Contrato Sin Firmar**

```
1. Usuario ve lista de contratos en detalle de cuenta
2. Identifica contrato con estado "⏳ Pendiente de firma"
3. Hace click en "Reenviar Email" o "Reenviar WhatsApp"
4. Modal de confirmación: "¿Enviar recordatorio a cliente?"
5. Sistema envía email/mensaje con link de firma
6. Toast: "✅ Recordatorio enviado exitosamente"
```

### **Flujo 3: Generar y Enviar Corte de Cuenta**

```
1. Usuario hace click en "Generar Corte PDF"
2. Se abre modal con opciones:
   - Rango de fechas (último mes por defecto)
   - ✅ Incluir comprobantes de pago
   - ✅ Incluir detalle de contratos
3. Click en "Generar"
4. Sistema genera PDF con:
   - Resumen de cuenta
   - Movimientos del período
   - Contratos activos
   - Comprobantes como anexos
5. Opciones:
   - [Descargar PDF]
   - [Enviar por Email]
   - [Enviar por WhatsApp]
```

---

## 📊 ESTRUCTURA DE DATOS

### **Esquema Actual (OK)**

```prisma
model ClientAccount {
  id            String  @id @default(uuid())
  balance       Decimal @default(0) @db.Decimal(15, 2)
  totalReloaded Decimal @default(0) @db.Decimal(15, 2)
  totalConsumed Decimal @default(0) @db.Decimal(15, 2)
  creditLimit   Decimal @default(0) @db.Decimal(15, 2)

  // Relaciones
  client        Client  @relation(...)
  movements     RentalAccountMovement[]
  contracts     RentalContract[]
}

model RentalContract {
  id                String   @id
  contractNumber    String   @unique
  status            String
  signedAt          DateTime?
  signatureUrl      String?

  // CAMPOS DE PAGO (YA CORREGIDOS)
  paymentProofUrl   String?   // ✅ Campo nuevo
  paymentType       String?
  paymentDetails    Json?
  paymentVerifiedAt DateTime?

  metadata          Json?     // Incluye receiptUrl (legacy)
}

model RentalAccountMovement {
  id               String   @id
  type             String   // "credit" | "debit"
  amount           Decimal
  description      String
  proofUrl         String?  // ✅ Para recargas
  createdAt        DateTime

  clientAccount    ClientAccount @relation(...)
}
```

**NO se necesitan cambios de schema** - solo nuevos endpoints y componentes.

---

## 🎨 UI/UX MOCKUP

### Cards de Contratos en Lista

```
┌─────────────────────────────────────────────┐
│ CON-2026-001                          ✅    │
│ Excavadora + Retro                          │
│                                             │
│ Consumido: $800K / $1.2M  [████░░░] 66%    │
│ Pagos: 2 verificados, 0 pendientes         │
│                                             │
│ [Ver Detalle] [Descargar PDF]              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ CON-2026-015                          ⏳    │
│ Camión de carga                             │
│                                             │
│ Estado: Pendiente de firma desde 10/03     │
│ Link: https://sign.example.com/xyz          │
│                                             │
│ [Reenviar Email] [Reenviar WhatsApp]       │
└─────────────────────────────────────────────┘
```

### Indicadores Visuales

- ✅ **Verde**: Firmado y pagado
- ⏳ **Amarillo**: Pendiente de firma
- ⚠️ **Naranja**: Firmado, pagos pendientes
- ❌ **Rojo**: Problemas/vencido

---

## ✅ CHECKLIST DE VALIDACIÓN

### **Escalabilidad**

- [ ] Lista de cuentas paginada (12 por página)
- [ ] Búsqueda en tiempo real sin lag
- [ ] Lazy loading de comprobantes
- [ ] Optimización de queries

### **Funcionalidad**

- [ ] Comprobantes visibles en todos los contratos
- [ ] Reenvío de contratos sin firmar funcional
- [ ] Generación de PDF de corte de cuenta
- [ ] Envío por email/WhatsApp

### **UX**

- [ ] Navegación clara entre vistas
- [ ] Breadcrumbs implementados
- [ ] Feedback visual en todas las acciones
- [ ] Loading states en operaciones largas

### **Arquitectura**

- [ ] Código modular y reutilizable
- [ ] Servicios separados por responsabilidad
- [ ] Componentes atómicos bien definidos
- [ ] TypeScript sin errores

---

## 📚 REFERENCIAS

- [MASTER_CONTRACT_ARCHITECTURE.md](./MASTER_CONTRACT_ARCHITECTURE.md) - Flujo de contratos
- [QUOTATIONS_SIGNATURES_CONTRACTS.md](./QUOTATIONS_SIGNATURES_CONTRACTS.md) - Firma digital
- [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) - Sistema de cobros
- [RENTAL_API_ENDPOINTS.md](./RENTAL_API_ENDPOINTS.md) - Endpoints actuales

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Revisar y aprobar propuesta**
2. ⏳ **Implementar Fase 1** (comprobantes)
3. ⏳ **Implementar Fase 2** (vista detallada)
4. ⏳ **Implementar Fase 3** (reenvío de firmas)
5. ⏳ **Implementar Fase 4** (generación de PDFs)
6. ⏳ **Implementar Fase 5** (envío multicanal)

---

**¿Te parece bien esta propuesta de arquitectura?**

Podemos empezar por la **Fase 1** para que los comprobantes sean visibles inmediatamente, y luego seguir con las demás fases de forma incremental.
