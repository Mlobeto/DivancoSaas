# FLUJO COMPLETO: COTIZACIÓN → CONTRATO → ENTREGA → OPERACIÓN

**Fecha:** Febrero 20, 2026  
**Versión:** 1.0

---

## 📋 RESUMEN EJECUTIVO

Este documento describe el flujo completo del sistema de rental, desde que un cliente solicita una cotización hasta que devuelve los activos.

### **Fases del Flujo:**

```
1. COTIZACIÓN        → Usuario crea presupuesto con items
2. APROBACIÓN        → (Opcional) Supervisor aprueba
3. PAGO INICIAL      → Cliente recarga cuenta corriente
4. CONTRATO ACTIVO   → Se genera contrato automático
5. PREPARACIÓN       → Usuario checklist verifica todo
6. ENTREGA           → Se retiran assets con evidencia
7. OPERACIÓN         → Descuento diario + reportes operario
8. DEVOLUCIÓN        → Revisión en bodega + cierre
```

---

## 🎯 FASE 1: CREACIÓN DE COTIZACIÓN

### **Tipos de Cotización**

El sistema soporta **2 tipos de cotización** según el modelo de negocio:

#### **A) COTIZACIÓN POR TIEMPO (time_based)**

Modelo clásico donde se cobra por **tiempo de uso** (horas, días, semanas, meses).

**Características:**

- Se define duración estimada (ej: 60 días)
- Se cotiza con precio por período ($/hora, $/día, $/mes)
- Facturación basada en **uso real** (reportes diarios)
- Ideal para: alquiler de maquinaria, herramientas, equipos

**Ejemplo: Retroexcavadora por 2 meses**

```
┌─────────────────────────────────────────────┐
│ COTIZACIÓN POR TIEMPO                       │
├─────────────────────────────────────────────┤
│ Retroexcavadora CAT 416F                    │
│                                             │
│ Duración estimada: 60 días                  │
│ Precio: $625/hora                           │
│ Standby garantizado: 3 hrs/día              │
│                                             │
│ Cálculo:                                    │
│ 60 días × 3 hrs/día × $625 = $112,500      │
│                                             │
│ + Operario: $3,000/día × 60 = $180,000     │
│                                             │
│ TOTAL ESTIMADO: $292,500                    │
│                                             │
│ Nota: Facturación diaria según uso real     │
│ reportado por operario                      │
└─────────────────────────────────────────────┘
```

**Flujo de facturación:**

- Cliente recarga cuenta corriente con anticipo
- Operario reporta uso DIARIO (horómetro, kilometraje)
- Sistema descuenta cada día según reporte
- Si usa más/menos horas → se cobra lo real (respetando standby)

---

#### **B) COTIZACIÓN POR TRABAJO (service_based)**

Modelo por **proyecto completado** donde se cobra por trabajo realizado, no por tiempo.

**Características:**

- Se define alcance del trabajo (ej: "2 km de caminos")
- Precio fijo por el trabajo completo
- NO importa cuánto tiempo tome terminarlo
- Ideal para: proyectos definidos, obras específicas, trabajos a destajo

**Ejemplo: Construcción de 2 km de caminos**

```
┌─────────────────────────────────────────────┐
│ COTIZACIÓN POR TRABAJO                      │
├─────────────────────────────────────────────┤
│ Trabajo: Construcción de 2 km de caminos    │
│         rurales terciarios                  │
│                                             │
│ Alcance:                                    │
│ - Excavación y nivelación                   │
│ - Base granular compactada                  │
│ - Cunetas laterales                         │
│                                             │
│ Equipos incluidos:                          │
│ - Retroexcavadora CAT 416F                  │
│ - Motoniveladora CAT 140M                   │
│ - Compactadora vibradora                    │
│ - Operarios certificados (3)                │
│                                             │
│ PRECIO FIJO: $450,000                       │
│                                             │
│ Tiempo estimado: 45-60 días                 │
│ (solo referencia, no afecta precio)         │
│                                             │
│ Forma de pago:                              │
│ - 30% anticipo: $135,000                    │
│ - 40% avance 50%: $180,000                  │
│ - 30% entrega: $135,000                     │
└─────────────────────────────────────────────┘
```

**Flujo de facturación:**

- Cliente paga según hitos del proyecto (anticipo, avances, entrega)
- NO hay descuento diario automático
- Se factura al completar cada hito
- Equipos se asignan al proyecto, no se cobra por día

---

### **Comparación:**

| Aspecto               | Por Tiempo                             | Por Trabajo                  |
| --------------------- | -------------------------------------- | ---------------------------- |
| **Precio**            | $X por hora/día/mes                    | Precio fijo total            |
| **Duración**          | Estimada, puede variar                 | Estimada, no afecta precio   |
| **Facturación**       | Diaria según uso real                  | Por hitos/avances            |
| **Riesgo tiempo**     | Cliente (si toma más tiempo, paga más) | Proveedor (precio fijo)      |
| **Ideal para**        | Alquiler estándar                      | Proyectos definidos          |
| **Cuenta corriente**  | Descuento diario automático            | Descuento manual por hito    |
| **Reportes operario** | Obligatorios (diarios)                 | Opcionales (control interno) |

---

### **En el Sistema:**

```typescript
// Modelo Quotation
{
  quotationType: "time_based" | "service_based",

  // Para time_based:
  estimatedStartDate: "2026-03-01",
  estimatedEndDate: "2026-04-30",
  estimatedDays: 60,

  // Para service_based:
  serviceDescription: "Construcción de 2 km de caminos rurales terciarios con excavación, base granular compactada y cunetas laterales."
}
```

```typescript
// QuotationItem para time_based:
{
  description: "Retroexcavadora CAT 416F",
  rentalPeriodType: "daily",
  rentalDays: 60,
  unitPrice: 5625, // 3 hrs × $625/hr × 3 por día
  standbyHours: 3,
  operatorIncluded: true
}

// QuotationItem para service_based:
{
  description: "Retroexcavadora CAT 416F - Incluida en proyecto",
  quantity: 1,
  unitPrice: 0, // No se cobra por separado, está en precio del proyecto
  metadata: {
    projectItem: true,
    includedInServiceFee: true
  }
}
```

---

### **UX: Selector de Tipo al Crear Cotización**

```
┌────────────────────────────────────────────────┐
│  NUEVA COTIZACIÓN                              │
├────────────────────────────────────────────────┤
│  Cliente: [ABC Corp ▼]                         │
│                                                │
│  ¿Qué tipo de cotización necesitas?            │
│                                                │
│  ┌────────────────────┐  ┌──────────────────┐ │
│  │  ⏱️ POR TIEMPO     │  │  🎯 POR TRABAJO   │ │
│  │                    │  │                   │ │
│  │  Alquiler por:     │  │  Proyecto con:    │ │
│  │  • Horas           │  │  • Precio fijo    │ │
│  │  • Días            │  │  • Alcance        │ │
│  │  • Meses           │  │  • Entregables    │ │
│  │                    │  │                   │ │
│  │  Cargo diario      │  │  Pago por hitos   │ │
│  │  automático        │  │  de avance        │ │
│  │                    │  │                   │ │
│  │  [Seleccionar]     │  │  [Seleccionar]    │ │
│  └────────────────────┘  └──────────────────┘ │
└────────────────────────────────────────────────┘
```

Según el tipo seleccionado, el wizard adapta los campos:

- **Por Tiempo**: Muestra duración, standby, período (hora/día/mes)
- **Por Trabajo**: Muestra descripción del servicio, hitos de pago

---

### **Interfaz Usuario (UI Propuesta)**

```
┌─────────────────────────────────────────────────────────────┐
│  NUEVA COTIZACIÓN                                [Preview] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌───────────────────────────────┐   │
│  │  SIDEBAR        │  │  PREVIEW PDF                   │   │
│  │                 │  │                                │   │
│  │  🔍 Buscar...   │  │  ┌─────────────────────────┐  │   │
│  │                 │  │  │ LOGO - Construcciones SA │  │   │
│  │  📦 Templates   │  │  │                          │  │   │
│  │  ├ Maquinaria   │  │  │ COTIZACIÓN #QU-2026-001 │  │   │
│  │  ├ Herramientas │  │  │                          │  │   │
│  │  └ Insumos      │  │  │ Cliente: ABC Corp        │  │   │
│  │                 │  │  │ Fecha: 20/02/2026        │  │   │
│  │  🚜 Retroexca.. │  │  │ Válida hasta: 05/03/2026 │  │   │
│  │     💵 $625/hr  │  │  │                          │  │   │
│  │     [+ Agregar] │  │  ├─────────────────────────┤  │   │
│  │                 │  │  │ ITEMS:                   │  │   │
│  │  🔧 Andamio     │  │  │                          │  │   │
│  │     💵 $200/día │  │  │ 1. Retroexcavadora       │  │   │
│  │     [+ Agregar] │  │  │    60 días × $625/hr     │  │   │
│  │                 │  │  │    Standby: 3hrs/día     │  │   │
│  │  🛢️ Diesel      │  │  │    = $112,500           │  │   │
│  │     💵 $12/gal  │  │  │                          │  │   │
│  │     [+ Agregar] │  │  │    + Operario (PER_DAY)  │  │   │
│  │                 │  │  │    60 días × $3,000      │  │   │
│  │                 │  │  │    = $180,000           │  │   │
│  │  ITEMS          │  │  │                          │  │   │
│  │  ✓ Retroexca..  │  │  │ 2. Transporte           │  │   │
│  │    [✏️] [🗑️]    │  │  │    Por definir          │  │   │
│  │                 │  │  │    $XX/km                │  │   │
│  │  ✓ Transporte   │  │  │                          │  │   │
│  │    [✏️] [🗑️]    │  │  │ SUBTOTAL: $292,500      │  │   │
│  │                 │  │  │ IVA (19%): $55,575       │  │   │
│  │  📄 Condiciones │  │  │ TOTAL: $348,075         │  │   │
│  │                 │  │  │                          │  │   │
│  │  Válida hasta:  │  │  │ TÉRMINOS:                │  │   │
│  │  [05/03/2026]   │  │  │ - Anticipo 30%           │  │   │
│  │                 │  │  │ - Descuento diario       │  │   │
│  │  Notas:         │  │  │ - Devolución en bodega   │  │   │
│  │  [Texto...]     │  │  └──────────────────────────┘  │   │
│  │                 │  │                                │   │
│  │  [💾 Guardar]   │  │  [📧 Enviar] [✏️ Firmar]      │   │
│  └─────────────────┘  └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Flujo UX:**

1. **Usuario abre nueva cotización**
   - Selecciona cliente (o crea nuevo)
   - **Selecciona tipo:** Por Tiempo o Por Trabajo
   - Selecciona template de documento (usa branding del BU)
   - Preview en tiempo real del PDF

2. **Busca y agrega items desde sidebar**

   **Si es cotización POR TIEMPO:**
   - Busca "Retroexcavadora" → Muestra templates disponibles
   - Click "+ Agregar" → Modal se abre:

```
┌────────────────────────────────────────────────┐
│  AGREGAR ITEM - COTIZACIÓN POR TIEMPO          │
│  Template: Retroexcavadora CAT 416F            │
├────────────────────────────────────────────────┤
│  📋 Descripción:                               │
│  [Retroexcavadora CAT 416F...]                 │
│                                                │
│  📊 Período de cotización:                     │
│  ○ Por Hora    ○ Por Día    ● Por Mes         │
│                                                │
│  📅 Duración:                                  │
│  [60] días (o [2] meses)                       │
│                                                │
│  ⏱️ STANDBY (horas mínimas/día):               │
│  [3] horas/día                                 │
│                                                │
│  💰 Precio:                                    │
│  Precio base: $625/hora (desde template)       │
│  ✓ Calculado: 60 días × 3 hrs × $625          │
│  = $112,500                                    │
│                                                │
│  ☑️ Incluir operario:  [✓]                     │
│     Costo operario: ○ PER_HOUR  ● PER_DAY     │
│     Viáticos: $3,000/día (obra lejos)          │
│     Total operario: 60 días × $3,000 = $180k   │
│                                                │
│  TOTAL ITEM: $292,500                          │
│                                                │
│  [Cancelar]              [✓ Agregar Item]      │
└────────────────────────────────────────────────┘
```

**Si es cotización POR TRABAJO:**

- Usuario describe el servicio/proyecto
- Selecciona equipos/recursos necesarios (NO se cobran por separado)
- Define precio fijo total del trabajo
- Define hitos de pago

```
┌────────────────────────────────────────────────┐
│  COTIZACIÓN POR TRABAJO - CONFIGURACIÓN        │
├────────────────────────────────────────────────┤
│  📋 Descripción del servicio:                  │
│  [Construcción de 2 km de caminos rurales      │
│   terciarios con excavación, base granular     │
│   compactada y cunetas laterales]              │
│                                                │
│  📦 Equipos/recursos incluidos:                │
│  [+ Agregar equipo]                            │
│  ✓ Retroexcavadora CAT 416F                    │
│  ✓ Motoniveladora CAT 140M                     │
│  ✓ Compactadora vibradora                      │
│  ✓ 3 Operarios certificados                    │
│  ✓ Combustible estimado                        │
│                                                │
│  💰 Precio total del trabajo:                  │
│  [$450,000]                                    │
│                                                │
│  📅 Tiempo estimado (referencia):              │
│  [45] a [60] días                              │
│                                                │
│  💳 Hitos de pago:                             │
│  ○ Pago único al finalizar                     │
│  ● Por avances                                 │
│                                                │
│  Distribución de pagos:                        │
│  - Anticipo (inicio):  [30]% = $135,000        │
│  - Avance 50%:         [40]% = $180,000        │
│  - Entrega final:      [30]% = $135,000        │
│                                                │
│  [Cancelar]              [✓ Crear Cotización]  │
└────────────────────────────────────────────────┘
```

3. **Agrega servicios adicionales** (según businessRules del template):
   - **Para cotización por TIEMPO**: Template tiene `requiresTransport: true` → Aparece automáticamente item "Transporte"
   - **Para cotización por TRABAJO**: Equipos y servicios ya están incluidos en el precio fijo
   - Usuario edita: "Transporte: $X.XX/km (por definir distancia exacta)"

4. **Define condiciones:**
   - **Por TIEMPO**: Fecha inicio estimada, duración, términos de descuento diario
   - **Por TRABAJO**: Hitos de pago, plazos de entrega, penalizaciones
   - Válida hasta: 15 días por defecto
   - Términos: Se cargan desde template
   - Notas adicionales

5. **Guarda cotización:**
   - Estado: `DRAFT`
   - Se genera PDF con template + branding del BU
   - Se almacena en Azure Blob Storage

### **Datos que tenemos actualmente:**

✅ **Ya existe:**

- Modelo `Quotation` con **soporte para ambos tipos** (`quotationType: "time_based" | "service_based"`)
- Campos específicos para cada tipo:
  - **time_based**: `estimatedStartDate`, `estimatedEndDate`, `estimatedDays`
  - **service_based**: `serviceDescription`
- Modelo `QuotationItem` con pricing calculado automático
- Modelo `AssetTemplate` con reglas de negocio
- Servicio `quotation.service.ts` con cálculo automático de precios por tiempo
- Sistema de templates con branding del BU
- Azure Blob Storage para PDFs

❌ **Falta implementar:**

- **UI: Selector de tipo** de cotización (tiempo vs trabajo) al inicio
- **UI: Wizard adaptativo** según tipo seleccionado
- **UI del wizard de creación** (sidebar + preview)
- Modal de "Agregar Item" para **cotización por tiempo**
- Modal de "Definir Servicio" para **cotización por trabajo**
- Auto-sugerencia de servicios (transporte, operario, etc.) basado en `businessRules`
- Preview en tiempo real del PDF
- **Lógica de facturación por hitos** para cotizaciones por trabajo (vs descuento diario automático)

---

## 🎯 FASE 2: APROBACIÓN (OPCIONAL)

### **Casos:**

**Caso A: Requiere aprobación** (cotización > $X monto)

```
Usuario Vendedor crea cotización  (status: DRAFT)
     ↓
Envía a supervisor  (status: PENDING_APPROVAL)
     ↓
Supervisor revisa y aprueba  (status: APPROVED)
     ↓
Se envía al cliente  (status: SENT)
```

**Caso B: Sin aprobación** (cotización < $X monto)

```
Usuario crea cotización  (status: DRAFT)
     ↓
Envía directamente al cliente  (status: SENT)
```

### **Implementación:**

```typescript
// En BusinessUnit settings
{
  quotationSettings: {
    requiresApproval: true,
    approvalThreshold: 500000, // Monto en moneda base
    approvers: ["user-id-1", "user-id-2"] // Usuarios con permiso
  }
}
```

**Permisos:**

- `quotations:create` → Puede crear cotizaciones
- `quotations:send` → Puede enviar sin aprobación (si < threshold)
- `quotations:approve` → Puede aprobar cotizaciones
- `quotations:reject` → Puede rechazar cotizaciones

✅ **Ya existe:**

- Sistema de permisos RBAC
- Modelo `Quotation.status`

❌ **Falta implementar:**

- **API endpoint** `/quotations/:id/request-approval`
- **API endpoint** `/quotations/:id/approve`
- **API endpoint** `/quotations/:id/reject`
- **UI de aprobaciones** (lista de pending, botones aprobar/rechazar)
- **Sistema de notificaciones** (email/WhatsApp a supervisor)

---

## 🎯 FASE 3: ENVÍO AL CLIENTE

### **Flujo:**

```
1. Cotización aprobada (o sin necesidad de aprobación)
   ↓
2. Usuario click "Enviar al Cliente"
   ↓
3. Sistema genera PDF final
   ↓
4. Se envía por email/WhatsApp (Sistema de Intenciones)
   ↓
5. Cliente recibe link único: /public/quotation/{token}
   ↓
6. Cliente ve cotización y puede:
   - Aceptar  → status: ACCEPTED
   - Rechazar → status: REJECTED
   - Solo ver → status: VIEWED
```

### **Opcional: Firma Digital**

Si se requiere firma digital (via SignNow/DocuSign):

```
1. Cotización enviada con firma requerida
   ↓
2. Sistema crea SignatureRequest en SignNow
   ↓
3. Cliente recibe email de SignNow con link a firmar
   ↓
4. Cliente firma digitalmente
   ↓
5. Webhook de SignNow notifica al sistema
   ↓
6. Sistema actualiza: status: SIGNED, signedPdfUrl: {...}
```

✅ **Ya existe:**

- Sistema de intenciones multicanal
- Integración con SignNow (adapter existe pero no está conectado)
- Modelo `Quotation` con campos de firma

❌ **Falta implementar:**

- **Vista pública** `/public/quotation/:token` para que cliente vea
- **Botones** Aceptar/Rechazar en vista pública
- **Conectar** servicio de firma digital al flow de cotizaciones

---

## 🎯 FASE 4: PAGO INICIAL & CREACIÓN DE CONTRATO

### **Flujo diferenciado por tipo:**

#### **A) COTIZACIÓN POR TIEMPO (time_based)**

```
1. Cliente acepta cotización  (status: ACCEPTED)
   ↓
2. Se crea ClientAccount para el cliente (si no existe)
   Balance inicial: $0
   ↓
3. Cliente hace pago inicial (anticipo 30%, 50%, o 100%)
   ↓
4. Sistema registra:
   RentalAccountMovement:
     - movementType: INITIAL_CREDIT
     - amount: $104,422.50 (30% de $348,075)
     - balanceBefore: $0
     - balanceAfter: $104,422.50
   ↓
5. Sistema crea RentalContract automáticamente:
   - quotationId: {...}
   - clientAccountId: {...}
   - status: ACTIVE
   - estimatedEndDate: calculado según duración
   ↓
6. Cliente queda listo para retirar assets
   ↓
7. DESCUENTO DIARIO AUTOMÁTICO comienza cuando se entrega el asset
```

**Recargas posteriores:**

- Cliente puede recargar en cualquier momento
- Sistema alerta cuando balance < threshold
- Descuentos diarios continúan mientras haya saldo

---

#### **B) COTIZACIÓN POR TRABAJO (service_based)**

```
1. Cliente acepta cotización  (status: ACCEPTED)
   ↓
2. Se crea ClientAccount (mismo que time_based)
   Balance inicial: $0
   ↓
3. Cliente paga primer hito (ej: 30% anticipo)
   ↓
4. Sistema registra:
   RentalAccountMovement:
     - movementType: MILESTONE_PAYMENT
     - amount: $135,000 (30% de $450,000)
     - description: "Hito 1: Anticipo - Construcción 2km caminos"
     - balanceBefore: $0
     - balanceAfter: $135,000
   ↓
5. Sistema crea RentalContract:
   - quotationType: "service_based"
   - status: ACTIVE
   - NO se hace descuento diario automático
   ↓
6. Equipos se asignan al proyecto
   ↓
7. Usuario marca hitos completados manualmente:
   - Hito 1 (Anticipo): ✓ Pagado
   - Hito 2 (Avance 50%): ⏳ Pendiente
   - Hito 3 (Entrega): ⏳ Pendiente
   ↓
8. Al completar avance 50% del trabajo:
   - Usuario marca "Hito 2 completado"
   - Sistema genera factura por $180,000 (40%)
   - Cliente paga → Se registra movimiento
   ↓
9. Al completar trabajo (100%):
   - Usuario marca "Hito 3 completado"
   - Sistema genera factura final $135,000 (30%)
   - Cliente paga → Contrato status: COMPLETED
```

**Diferencias clave:**

- ❌ **NO hay descuento diario automático**
- ✅ **Facturación manual por hitos**
- ✅ **Usuario controla cuando se factura cada hito**
- ✅ **Precio fijo no importa tiempo real**

---

### **Importante:**

**UN ClientAccount por cliente, NO por contrato.**

```
Cliente "ABC Corp" tiene:
  - ClientAccount #CA-001 (balance compartido)

  Puede tener múltiples contratos simultáneos:
    - Contract #1 (TIEMPO): Obra Carretera - descuento diario
    - Contract #2 (TRABAJO): 2 km caminos - pago por hitos

  AMBOS usan el MISMO ClientAccount.balance
```

**Movimientos mixtos:**

```
FECHA    TIPO              MONTO       BALANCE
--------------------------------------------------
01/03    INITIAL_CREDIT    +$200,000   $200,000
02/03    DAILY_CHARGE      -$8,000     $192,000  (Contract #1)
03/03    DAILY_CHARGE      -$8,000     $184,000  (Contract #1)
04/03    MILESTONE_PAYMENT +$180,000   $364,000  (Contract #2 - Hito 2)
05/03    DAILY_CHARGE      -$8,000     $356,000  (Contract #1)
...
```

✅ **Ya existe:**

- Modelo `ClientAccount` con balance compartido
- Modelo `RentalContract` con campo `quotationType`
- Modelo `RentalAccountMovement` para historial (soporta diferentes `movementType`)
- Servicio `account.service.ts` para manejo de movimientos

❌ **Falta implementar:**

- **Auto-creación de contrato** cuando cotización pasa a ACCEPTED + pago confirmado
- **Lógica diferenciada** según `quotationType`:
  - time_based: habilitar descuento diario automático
  - service_based: deshabilitar descuento diario, habilitar hitos manuales
- **Sistema de hitos** para cotizaciones por trabajo:
  - Modelo `ProjectMilestone` (o usar metadata en Quotation)
  - UI para marcar hitos completados
  - Generación de factura por hito
  - Validación: no cerrar contrato hasta pagar todos los hitos
- **Integración con pasarela de pago** (pendiente definir proveedor)
- **UI para registro manual de pagos** (mientras no tengamos pasarela)
- **Integración con pasarela de pago** (pendiente definir proveedor)
- **UI para registro manual de pagos** (mientras no tengamos pasarela)

---

## 🎯 FASE 5: PREPARACIÓN DE ENTREGA (CHECKLIST)

### **Concepto:**

Cuando el cliente está listo para retirar un asset, un usuario del warehouse debe verificar todo antes de entregar.

### **Checklist (basado en businessRules del template):**

```
┌────────────────────────────────────────────────┐
│  PREPARACIÓN DE ENTREGA                        │
│  Contrato: #CON-2026-001                       │
│  Cliente: ABC Corp                             │
│  Asset: Retroexcavadora CAT 416F #A-001        │
├────────────────────────────────────────────────┤
│                                                │
│  ☑️ DOCUMENTACIÓN DE LA MÁQUINA                │
│  □ SOAT vigente (vence: 15/08/2026)            │
│  □ Seguro todo riesgo vigente                  │
│  □ Certificado de revisión técnica             │
│  □ Manual de operación (físico o digital)      │
│                                                │
│  ☑️ ESTADO DEL ASSET                           │
│  □ Inspección visual realizada                 │
│  □ Horómetro inicial: [1250] horas             │
│  □ Fotos del asset: [📷 Subir]                 │
│                                                │
│  ☑️ OPERARIO (requiere operario)               │
│  Asignar operario: [Buscar empleado...]        │
│                                                │
│  Operario seleccionado:                        │
│  👤 Juan Pérez (Employee #E-042)               │
│      - Licencia C2 vigente hasta: 12/2026      │
│      - Certificación CAT válida                │
│      - Examen médico vigente                   │
│                                                │
│  □ Licencia de conducir vigente                │
│  □ Certificación del fabricante vigente        │
│  □ Examen médico ocupacional vigente           │
│  □ ARL activa                                  │
│  □ Entrega de EPP (foto evidencia)             │
│                                                │
│  ☑️ TRANSPORTE (requiere transporte)           │
│  □ Distancia: [85] km                          │
│  □ Costo transporte: 85km × $15 = $1,275       │
│  □ Cama-baja asignada: #T-003                  │
│  □ Conductor: Carlos Gómez                     │
│                                                │
│  ☑️ INSUMOS INCLUIDOS                          │
│  □ Diesel: 55 galones (foto tambor)            │
│  □ Aceite hidráulico: 20 litros                │
│  □ Kit de herramientas básicas                 │
│                                                │
│  ☑️ EVIDENCIA DE ENTREGA                       │
│  📷 Fotos: [Subir imágenes...]                 │
│  📄 Firma cliente: [Firmar en tablet]          │
│                                                │
│  Notas adicionales:                            │
│  [Cliente solicitó entrega a las 6am...]       │
│                                                │
│  [❌ Cancelar]          [✅ Confirmar Entrega]  │
└────────────────────────────────────────────────┘
```

### **Proceso:**

1. **Usuario warehouse busca contrato activo**
   - Ve lista de "Pendientes de entregar"
   - Click en "Preparar entrega" → Abre checklist

2. **Verifica documentación del asset**
   - Sistema pre-carga documentos desde `Asset.attachments`
   - Usuario valida que estén vigentes

3. **Asigna operario (si requiere)**
   - Busca en tabla `User` con role `EMPLOYEE` y flag `isOperator: true`
   - Valida que tenga documentación vigente:
     - Licencia de conducir (en `User.attachments`)
     - Certificación del fabricante
     - Examen médico ocupacional
     - ARL activa

4. **Define detalles de transporte (si requiere)**
   - Ingresa distancia real (que estaba "por definir" en cotización)
   - Sistema calcula: $15/km × 85km = $1,275
   - Se descuenta del `ClientAccount.balance` INMEDIATAMENTE

5. **Sube evidencia:**
   - Fotos del asset antes de salir
   - Firma digital del cliente en tablet
   - Fotos de documentación
   - Fotos de insumos entregados

6. **Confirma entrega:**
   - Se crea `AssetRental`:
     ```typescript
     {
       contractId: "CON-2026-001",
       assetId: "A-001",
       operatorUserId: "E-042", // Juan Pérez
       withdrawnAt: new Date(),
       initialHourometer: 1250,
       estimatedReturnDate: calculado,
       status: "IN_USE"
     }
     ```
   - Se crea `RentalAccountMovement` con costo de transporte:
     ```typescript
     {
       movementType: "WITHDRAWAL_START",
       amount: -1275, // Transporte
       description: "Transporte Retroexcavadora a obra (85km)"
     }
     ```
   - Asset cambia a `status: IN_USE`

### **Módulo de Staff con documentación:**

**Necesitamos extender el modelo `User`:**

```prisma
model User {
  // ... campos existentes

  // Para operarios
  isOperator Boolean @default(false)
  operatorLicense String? // Tipo de licencia (C1, C2, etc.)
  operatorLicenseExpiry DateTime?
  operatorCertifications Json? // Array de certificaciones
  medicalExamExpiry DateTime?

  // Documentos del operario
  operatorDocuments Json? // URLs en Azure Blob
  // {
  //   license: "https://...",
  //   medicalExam: "https://...",
  //   certifications: ["https://...", "https://..."]
  // }
}
```

✅ **Ya existe:**

- Modelo `User` con roles
- Sistema de permisos
- Azure Blob Storage

❌ **Falta implementar:**

- **Campos en User** para operarios (isOperator, documentación)
- **UI del checklist** de preparación de entrega
- **Búsqueda de operarios** con documentación vigente
- **Validación automática** de vigencia de documentos
- **Cálculo y descuento** de transporte al confirmar

---

## 🎯 FASE 6: OPERACIÓN DIARIA

### **Dos tipos de descuento:**

#### **A) MAQUINARIA (con operario + reporte manual)**

```
1. Operario asignado usa app móvil (offline-first)
   ↓
2. Al inicio del día:
   - Toma foto del horómetro/odómetro
   - Registro: 1250 horas
   ↓
3. Al final del día:
   - Toma foto del horómetro
   - Registro: 1258 horas
   - Horas trabajadas: 8.0
   ↓
4. Sistema calcula (considera STANDBY):
   - Horas reportadas: 8.0
   - Standby mínimo: 3.0
   - Horas facturadas: Math.max(8.0, 3.0) = 8.0
   ↓
5. Descuento automático:
   - Maquinaria: 8 hrs × $625 = $5,000
   - Operario (PER_DAY): $3,000 (fijo)
   - TOTAL: $8,000
   ↓
6. Crea RentalAccountMovement:
   {
     movementType: "DAILY_CHARGE",
     amount: -8000,
     assetRentalId: {...},
     usageReportId: {...},
     description: "Retroexcavadora - Día 1: 8.0 hrs",
     evidenceUrls: ["foto-horometro-inicio.jpg", "foto-horometro-fin.jpg"]
   }
   ↓
7. ClientAccount.balance se actualiza en tiempo real
```

#### **B) HERRAMIENTAS/INSUMOS (descuento automático)**

```
1. CRON JOB diario (00:01 AM):
   ↓
2. Busca AssetRental con status: IN_USE y trackingType: TOOL
   ↓
3. Para cada uno:
   - Calcula días desde withdrawnAt
   - Obtiene precio diario del asset
   - Descuenta automáticamente
   ↓
4. Crea RentalAccountMovement:
   {
     movementType: "DAILY_CHARGE",
     amount: -200,
     description: "Andamio Tubular - Cargo diario automático"
   }
```

✅ **Ya existe:**

- Modelo `AssetRental` para tracking
- Modelo `AssetUsage` para reportes de operario
- Modelo `RentalAccountMovement` para movimientos
- Servicio `usage-report.service.ts`
- Servicio `auto-charge.service.ts` (CRON job)

❌ **Falta implementar:**

- **App móvil del operario** (offline-first con sync)
- **Upload de fotos** desde app móvil
- **Validación de reportes** (no permitir valores ilógicos)

---

## 🎯 FASE 7: DEVOLUCIÓN Y CIERRE

### **Proceso:**

```
1. Cliente devuelve asset
   ↓
2. Asset DEBE pasar por bodega (obligatorio)
   ↓
3. Usuario warehouse abre "Recepción de Devolución":
```

```
┌────────────────────────────────────────────────┐
│  RECEPCIÓN DE DEVOLUCIÓN                       │
│  Asset: Retroexcavadora CAT 416F #A-001        │
│  Contrato: #CON-2026-001                       │
│  Cliente: ABC Corp                             │
├────────────────────────────────────────────────┤
│                                                │
│  ☑️ INSPECCIÓN VISUAL                          │
│  Estado general:                               │
│  ○ Excelente  ● Bueno  ○ Regular  ○ Dañado    │
│                                                │
│  ☑️ HORÓMETRO/KILOMETRAJE FINAL                │
│  Horómetro final: [1730] horas                 │
│  Inicial: 1250 hrs                             │
│  Total trabajado: 480 hrs                       │
│                                                │
│  ☑️ COMBUSTIBLE/INSUMOS                         │
│  Diesel devuelto: [10] galones (de 55)        │
│  Faltante: 45 galones × $12 = $540             │
│  ☑️ Descontar faltante                         │
│                                                │
│  ☑️ DAÑOS/DESGASTE                             │
│  □ Raspón lateral (foto)                       │
│  □ Llanta desgastada (foto)                    │
│  Costo estimado reparación: [$1,200]           │
    ☑️ Descontar reparación
│                                                │
│  ☑️ LIMPIEZA                                   │
│  ○ Limpio  ○ Requiere limpieza ($150)          │
│                                                │
│  ☑️ MANTENIMIENTO POST-OBRA                    │
│  ☑️ Requiere mantenimiento preventivo          │
│  Agendar para: [25/02/2026]                    │
│                                                │
│  ☑️ EVIDENCIA                                  │
│  📷 Fotos: [Subir imágenes...]                 │
│  📄 Firma cliente: [Firmar recepción]          │
│                                                │
│  DESCUENTOS:                                   │
│  - Diesel faltante: $540                       │
│  - Reparación: $1,200                          │
│  TOTAL A DESCONTAR: $1,740                     │
│                                                │
│  [❌ Cancelar]        [✅ Confirmar Devolución] │
└────────────────────────────────────────────────┘
```

4. **Al confirmar devolución:**
   - Se actualiza `AssetRental`:
     ```typescript
     {
       returnedAt: new Date(),
       finalHourometer: 1730,
       status: "RETURNED",
       returnCondition: "GOOD",
       returnNotes: "Raspón lateral, requiere mantenimiento"
     }
     ```
   - Se crean movimientos si hay faltantes/daños:

     ```typescript
     // Diesel faltante
     {
       movementType: "ADJUSTMENT",
       amount: -540,
       description: "Diesel faltante: 45 gal"
     }

     // Reparación
     {
       movementType: "ADJUSTMENT",
       amount: -1200,
       description: "Reparación: raspón lateral"
     }
     ```

   - Asset cambia a `status: MAINTENANCE` (si requiere) o `AVAILABLE`
   - Si era el último asset del contrato → `contract.status: COMPLETED`

### **Para Insumos (cantidad):**

```
┌────────────────────────────────────────────────┐
│  RECEPCIÓN: Diesel (BULK)                      │
├────────────────────────────────────────────────┤
│  Retirado: 55 galones                          │
│  Devuelto: [10] galones                        │
│  Consumido: 45 galones                         │
│                                                │
│  Precio: $12/galón                            │
│  Total consumido: 45 × $12 = $540              │
│  ☑️ Descontar del saldo                        │
│                                                │
│  Estado del contenedor:                        │
│  ○ Bueno  ● Sucio  ○ Dañado                    │
│                                                │
│  [Confirmar Devolución]                        │
└────────────────────────────────────────────────┘
```

✅ **Ya existe:**

- Modelo `AssetRental` con campos de devolución
- Sistema para calcular consumos
- Azure Blob para fotos de evidencia

❌ **Falta implementar:**

- **UI del checklist** de devolución
- **Cálculo automático** de faltantes/daños
- **Workflow de mantenimiento** (agendar mantenimiento post-obra)
- **Firma digital** en tablet para recepción

---

## 🎯 FASE 8: RECARGAS Y MÚLTIPLES RETIROS

### **Concepto:**

El contrato queda **ACTIVO** mientras el cliente tenga cuenta corriente activa. Puede retirar y devolver múltiples veces.

```
Timeline del Cliente "ABC Corp":
================================

DÍA 1:  Pago inicial $104,422 → Balance: $104,422
        Retira Retroexcavadora

DÍA 2-60: Descuentos diarios ($8,000/día)
          Balance disminuye...

DÍA 45: Balance: $15,000 (queda poco)
        ⚠️ ALERTA enviada al cliente

DÍA 50: Cliente RECARGA $200,000
        Balance: $215,000

DÍA 55: Devuelve Retroexcavadora
        Balance: $135,000 (aún tiene saldo)

DÍA 60: Retira Minicargador (NUEVO ASSET)
        Balance: continúa...

DÍA 90: Devuelve Minicargador
        Balance: $85,000

DÍA 120: Cliente no retira nada más
         → Contrato se marca: status: COMPLETED
         → Saldo restante $85,000 queda disponible
            para futuros contratos (mismo ClientAccount)
```

### **Sistema de Alertas:**

```typescript
// Alertas automáticas por email/WhatsApp
if (clientAccount.balance < threshold) {
  sendAlert({
    type: "LOW_BALANCE",
    currentBalance: 15000,
    estimatedDaysRemaining: 2,
    message: "Tu saldo está bajo. Recarga para continuar.",
  });
}
```

✅ **Ya existe:**

- Modelo `ClientAccount` con balance compartido
- Sistema de notificaciones multicanal

❌ **Falta implementar:**

- **Alertas automáticas** de saldo bajo
- **UI de recarga** para que cliente o admin agregue fondos
- **Predicción de días restantes** basada en consumo promedio

---

## 📊 GAPS & PRIORIDADES

### **🔴 PRIORIDAD ALTA (Bloqueantes para MVP)**

1. ✅ **Modelo de datos completo** → Ya existe (con soporte para ambos tipos)
2. ❌ **UI: Wizard de cotización con sidebar + preview**
   - Selector de tipo (time_based vs service_based)
   - Modal "Agregar Item" para cotización por tiempo
   - Modal "Definir Servicio" para cotización por trabajo
3. ❌ **API: Auto-creación de contrato al pagar**
4. ❌ **UI: Checklist de preparación de entrega**
5. ❌ **Extensión User para operarios + documentación**
6. ❌ **UI: Checklist de devolución**
7. ❌ **API: Cálculo de transporte real en entrega**
8. ❌ **Sistema de milestones para cotizaciones service_based**
   - Modelo o metadata para hitos de pago
   - API para marcar milestone completado
   - UI para tracking de hitos

### **🟡 PRIORIDAD MEDIA (Mejoran UX)**

9. ❌ **Sistema de aprobaciones** (workflow)
10. ❌ **Vista pública de cotización** (/public/quotation/:token)
11. ❌ **Integración con firma digital** (SignNow)
12. ❌ **App móvil de operario** (offline-first)
13. ❌ **Sistema de alertas de saldo bajo**

### **🟢 PRIORIDAD BAJA (Nice to have)**

13. ❌ **Integración con pasarela de pago**
14. ❌ **Predicción de consumo** (IA/ML)
15. ❌ **Dashboard de operaciones** en tiempo real
16. ❌ **Workflow de mantenimiento** post-obra

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Sprint 1: Cotización Dual (tiempo/trabajo) (1 semana)**

**Objetivo:** Usuario puede crear cotización por tiempo O por trabajo.

- [ ] UI: Wizard de cotización
  - [ ] **Selector de tipo** (time_based vs service_based)
  - [ ] Layout con sidebar + preview
  - [ ] Sidebar: buscar templates (solo para time_based)
  - [ ] **Modal "Agregar Item"** (para time_based):
    - Período: hora/día/mes
    - Standby hours
    - Operario incluido (sí/no)
    - Cálculo automático de precios
  - [ ] **Modal "Definir Servicio"** (para service_based):
    - Descripción del trabajo (ej: "2 km de caminos")
    - Precio fijo total
    - Hitos de pago (opcional: ej. 50% inicio, 50% final)
  - [ ] Preview PDF que se adapta según tipo
  - [ ] Auto-sugerencia de servicios (transporte, operario) solo para time_based
- [ ] API:
  - [ ] Endpoint: POST /quotations (validar que soporte quotationType)
  - [ ] Endpoint: GET /asset-templates (con filtros)
  - [ ] Lógica: sugerir items adicionales según businessRules (solo time_based)

**Resultado:** Usuario puede crear cotización por tiempo (items individuales) o por trabajo (precio fijo), ver preview PDF, guardar como DRAFT.

### **Sprint 2: Aprobación & Envío (1 semana)**

**Objetivo:** Flujo de aprobación y envío al cliente.

- [ ] API:
  - [ ] POST /quotations/:id/request-approval
  - [ ] POST /quotations/:id/approve
  - [ ] POST /quotations/:id/reject
  - [ ] POST /quotations/:id/send
- [ ] UI:
  - [ ] Lista de "Mis cotizaciones pendientes"
  - [ ] Lista de "Cotizaciones por aprobar" (para supervisores)
  - [ ] Botones aprobar/rechazar
  - [ ] Vista pública /public/quotation/:token
- [ ] Notificaciones:
  - [ ] Email cuando requiere aprobación
  - [ ] Email al cliente con link de cotización

**Resultado:** Cotización aprobada se envía al cliente, cliente puede verla.

### **Sprint 3: Pago & Contrato Dual (1 semana)**

**Objetivo:** De cotización aceptada → contrato activo (con lógica diferencial según tipo).

- [ ] API:
  - [ ] POST /client-accounts/:id/credit (recarga manual)
  - [ ] Auto-crear contrato cuando quotation.status = ACCEPTED + balance > 0 (solo time_based)
  - [ ] Para service_based: crear contrato SIN auto-descuento diario
  - [ ] Endpoint: POST /quotations/:id/accept (para cliente)
  - [ ] Sistema de milestones:
    - [ ] Metadata en Quotation o nueva tabla ProjectMilestone
    - [ ] POST /contracts/:id/milestones/:id/complete (marcar completado)
    - [ ] Descuento manual del ClientAccount al completar milestone
- [ ] UI:
  - [ ] Vista pública: botón "Aceptar Cotización"
  - [ ] Panel admin: registrar pago manual inicial
  - [ ] **Para time_based:** Ver contrato con auto-descuento diario
  - [ ] **Para service_based:** Ver contrato con tracker de milestones
  - [ ] Botón "Marcar Milestone Completado" (descuenta del balance)

**Resultado:**

- **time_based:** Cliente acepta, admin registra pago, contrato se crea automático con descuentos diarios.
- **service_based:** Cliente acepta, admin registra pago, contrato se crea con milestones manuales (ej: 50% inicio, 50% fin).

### **Sprint 4: Preparación de Entrega (2 semanas)**

**Objetivo:** Checklist de entrega con operarios.

- [ ] **Modelo:**
  - [ ] Migración: agregar campos de operario a User
  - [ ] Seed: crear usuarios operarios de ejemplo
- [ ] **API:**
  - [ ] GET /users/operators (búsqueda de operarios)
  - [ ] POST /asset-rentals (crear asset rental en entrega)
  - [ ] Validación de documentos vigentes
- [ ] **UI:**
  - [ ] Checklist de preparación de entrega
  - [ ] Búsqueda y selección de operario
  - [ ] Validación de documentación (alertas si vencido)
  - [ ] Upload de evidencia (fotos)
  - [ ] Cálculo de transporte (ingreso de km reales)
  - [ ] Confirmar entrega → crea AssetRental

**Resultado:** Usuario puede preparar y entregar asset con checklist completo.

### **Sprint 5: Devolución (1 semana)**

**Objetivo:** Recepción de assets devueltos.

- [ ] **API:**
  - [ ] PUT /asset-rentals/:id/return
  - [ ] Cálculo de faltantes/daños
  - [ ] Crear movimientos de ajuste
- [ ] **UI:**
  - [ ] Checklist de devolución
  - [ ] Inspección de estado
  - [ ] Cálculo de consumos (insumos)
  - [ ] Upload fotos de daños
  - [ ] Confirmar devolución

**Resultado:** Asset devuelto, inspeccionado, y listo para próximo uso.

### **Sprint 6: App Móvil Operario (3 semanas)**

**Objetivo:** Operario puede reportar uso desde el campo (offline).

- [ ] **App React Native:**
  - [ ] Login offline-first
  - [ ] Lista de assets asignados
  - [ ] Captura de foto horómetro (inicio/fin día)
  - [ ] Sync con backend (cuando hay internet)
- [ ] **API:**
  - [ ] POST /asset-usage (recibir reportes)
  - [ ] Validación de datos (no permitir retrocesos ilógicos)

**Resultado:** Operario reporta uso diario, descuentos automáticos funcionan.

---

## 💡 SOLUCIONES A TUS DUDAS

### **1. "Hay 2 tipos de cotizaciones: por tiempo y por trabajo"**

**Solución:**  
El modelo `Quotation` ya soporta ambos con el campo `quotationType: "time_based" | "service_based"`.

**Diferencias clave:**

| Aspecto        | **time_based** (Alquiler)                               | **service_based** (Trabajo)                          |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| **Items**      | Múltiples assets (sidebar con templates)                | Un solo "servicio" (ej: "2 km de caminos")           |
| **Precio**     | Auto-calculado por item (days × price + standby + oper) | Precio fijo total ingresado manualmente              |
| **Modal UI**   | "Agregar Item" con configuración detallada              | "Definir Servicio" simple (descripción + precio)     |
| **Pago**       | Crédito inicial en ClientAccount                        | Crédito inicial en ClientAccount                     |
| **Descuentos** | **Diarios automáticos** por consumo                     | **Manuales por milestone** (ej: 50% inicio, 50% fin) |
| **Ejemplo**    | Alquiler de retroexcavadora por 60 días                 | Construcción de 2 km de caminos por $500,000 fijo    |
| **Contrato**   | RentalContract con auto-descuento diario                | RentalContract con milestones manuales               |

**Implementación:**

```typescript
// En el wizard, usuario selecciona tipo primero:
<QuotationTypeSelector>
  <Card onClick={() => setType("time_based")}>
    ⏱️ Por Tiempo
    <small>Alquiler por hora/día/mes</small>
  </Card>
  <Card onClick={() => setType("service_based")}>
    🛠️ Por Trabajo
    <small>Proyecto precio fijo</small>
  </Card>
</QuotationTypeSelector>

// Si time_based → muestra sidebar con templates
// Si service_based → muestra formulario simple precio fijo
```

**Flujo de pago:**

- **time_based:** Cliente paga $104,422 inicial → se descuentan $8,000/día automáticamente
- **service_based:** Cliente paga $250,000 inicial (50% de $500k) → admin marca "Milestone 1: Inicio" completado → se descuentan $250,000 manuales → al terminar obra, admin marca "Milestone 2: Final" → se descuentan otros $250,000

### **2. "No sé cómo hacerlo simple para el usuario"**

**Solución:**  
El wizard con sidebar + preview es la clave. Usuario busca templates como si buscara en un catálogo de e-commerce, hace click "+ Agregar", configura el item (días, standby, operario sí/no) y ya. El preview muestra el PDF en tiempo real.

**UX Inspiración:** Figma, Canva (sidebar de elementos + canvas preview).

### **3. "Transporte se cotiza por km pero no sabemos distancia aún"**

**Solución:**  
En la cotización, transporte aparece como "$XX/km (por definir)". Cuando el usuario prepara la entrega, ingresa los km reales (85km) y el sistema calcula el costo final. Ese costo se descuenta INMEDIATAMENTE del ClientAccount.

### **4. "El operario no se asigna en cotización, sino en entrega"**

**Solución:**  
Correcto. En la cotización solo se indica "Incluye operario: Sí (viáticos $3,000/día)". En el checklist de entrega, se busca un operario disponible con documentación vigente y se asigna en ese momento.

### **5. "Si requiere aprobación vs no requiere"**

**Solución:**  
En `BusinessUnitSettings`:

```typescript
{
  quotationSettings: {
    requiresApproval: true,
    approvalThreshold: 500000 // Si > $500k requiere aprobación
  }
}
```

Si la cotización < threshold → pasa directo a SENT.  
Si > threshold → pasa a PENDING_APPROVAL primero.

### **6. "Operarios usan app offline para reportar"**

**Solución:**  
App React Native offline-first:

- Descarga lista de assets asignados al login
- Toma fotos y guarda localmente
- Cuando hay internet, sincroniza automáticamente
- Backend recibe reportes y ejecuta descuentos

### **7. "Devolución obligatoria en bodega"**

**Solución:**  
El AssetRental NO se puede cerrar sin pasar por el checklist de devolución. El sistema marca el asset como `status: IN_TRANSIT_RETURN` hasta que warehouse confirma recepción.

### **8. "Cuenta corriente abierta permite múltiples retiros"**

**Solución:**  
El `RentalContract` queda en `status: ACTIVE` mientras `ClientAccount.balance > 0` o mientras tenga `AssetRental` con `status: IN_USE`. Cliente puede retirar/devolver cuantas veces quiera.

---

## ✅ CONCLUSIÓN

**Tienes un sistema muy bien pensado.** Ya existe el 70% de la lógica de negocio en el backend (modelos, servicios, cálculos). El modelo soporta **ambos tipos de cotizaciones** (por tiempo y por trabajo) desde el schema.

LO QUE FALTA es principalmente:

1. **UI/UX** de los wizards (cotización con selector de tipo, entrega, devolución)
2. **Conexión** de piezas que ya existen (quotation → contract automático)
3. **Sistema de milestones** para cotizaciones service_based (proyecto precio fijo)
4. **Extensión del modelo User** para operarios con documentación
5. **App móvil** del operario (offline-first)

El flujo es largo pero cada fase es independiente. Podemos ir Sprint por Sprint construyéndolo.

**Resumen de diferencias entre tipos:**

- **time_based:** Alquiler de assets con auto-descuento diario (ej: retroexcavadora por 60 días)
- **service_based:** Proyecto precio fijo con milestones manuales (ej: construcción de 2 km de caminos por $500k)

Ambos tipos comparten el mismo `ClientAccount` y pueden coexistir en un mismo cliente simultáneamente.

---

**¿Por dónde empezamos?** Te sugiero Sprint 1 (Wizard de cotización con selector de tipo) para que empieces a ver resultados visuales rápido. Luego seguimos con el resto del flujo.
