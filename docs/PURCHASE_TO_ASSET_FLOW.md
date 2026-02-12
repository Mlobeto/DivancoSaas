# 📦 FLUJO: COMPRA → ACTIVO

## 🎯 Objetivo

Documentar el flujo completo desde la creación de una orden de compra hasta la generación automática de activos al recibir la mercadería.

---

## 🔄 FLUJO COMPLETO

### **Fase 1: Creación de Orden de Compra** (Frontend)

**Ruta**: `/purchase-orders`  
**Componente**: `PurchaseOrderForm.tsx`

#### 1.1 Usuario llena el formulario

```typescript
{
  code: "OC-2026-001",
  supplierId: "uuid-proveedor",
  expectedDate: "2026-03-15",
  notes: "Compra de andamios para obra nueva",
  items: [
    {
      supplyId: "uuid-supply", // ⚠️ Nota: Se usa Supply como item, no Asset
      quantity: 10,
      unitPrice: 150000,
      createsAsset: true,        // ✅ CHECKBOX MARCADO
      assetTemplateId: "uuid-template-andamio" // ✅ TEMPLATE SELECCIONADO
    }
  ]
}
```

#### 1.2 Checkbox "Crear activos al recibir"

Cuando el usuario marca este checkbox:

- ✅ Aparece dropdown de **Asset Templates**
- ✅ Usuario selecciona el template correspondiente (ej: "Andamio Tubular")
- ✅ El campo `assetTemplateId` se guarda en el item

**Código relevante** (`PurchaseOrderForm.tsx` líneas 145-156):

```tsx
{
  item.createsAsset && (
    <div>
      <label className="block text-sm font-medium mb-1">
        Plantilla de Activo *
      </label>
      <select value={item.assetTemplateId || ""} required>
        <option value="">Seleccionar template...</option>
        {templatesData?.data?.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

### **Fase 2: Backend guarda la orden** (Draft)

**Endpoint**: `POST /api/v1/modules/purchases/purchase-orders`  
**Service**: `purchase-order.service.ts`

```typescript
// Items guardados con flags
await prisma.purchaseOrderItem.create({
  data: {
    purchaseOrderId: "uuid",
    supplyId: "uuid-supply",
    quantity: 10,
    unitPrice: 150000,
    createsAsset: true, // ✅ Flag guardado
    assetTemplateId: "uuid-template", // ✅ Relación guardada
  },
});
```

**Estado de la orden**: `DRAFT` → Usuario puede editar antes de enviar

---

### **Fase 3: Confirmación y envío al proveedor**

**Endpoint**: `PATCH /api/v1/modules/purchases/purchase-orders/:id/confirm`  
**Estado**: `DRAFT` → `SENT`

En esta fase:

- ✅ Se valida que tenga items
- ✅ Se envía al proveedor (email, WhatsApp, PDF, etc.)
- ❌ Todavía **NO se crean activos**

---

### **Fase 4: Recepción de mercadería** (Critical Phase)

**Endpoint**: `POST /api/v1/modules/purchases/purchase-orders/:id/receive`  
**Service**: `purchase-order.service.ts` (líneas 487-545)

#### 4.1 Usuario registra recepción

```typescript
{
  receivedDate: "2026-02-12",
  items: [
    {
      itemId: "uuid-item",
      receivedQty: 10 // Cantidad que realmente llegó
    }
  ]
}
```

#### 4.2 Backend procesa cada item recibido

**PASO A:** Actualizar stock del Supply

```typescript
// Incrementar stock del Supply
await prisma.supply.update({
  where: { id: orderItem.supplyId },
  data: {
    stock: { increment: receivedQty },
  },
});
```

**PASO B:** Crear transacción de stock

```typescript
await prisma.stockTransaction.create({
  data: {
    tenantId,
    businessUnitId,
    supplyId: orderItem.supplyId,
    type: TransactionType.PURCHASE,
    quantity: receivedQty,
    unitCost: orderItem.unitPrice,
    totalCost: receivedQty * orderItem.unitPrice,
    purchaseOrderId: orderId,
    notes: "Recepción de OC-2026-001",
  },
});
```

**PASO C:** 🎯 **CREACIÓN AUTOMÁTICA DE ACTIVOS**

```typescript
// SOLO si está marcado createsAsset
if (orderItem.createsAsset && orderItem.assetTemplateId) {
  // 1. Obtener template del activo
  const template = await prisma.assetTemplate.findUnique({
    where: { id: orderItem.assetTemplateId },
  });

  // 2. Crear tantos activos como unidades recibidas
  const qtyToCreate = Math.floor(receivedQty); // 10 andamios → 10 activos

  for (let i = 0; i < qtyToCreate; i++) {
    // 3. Generar código único para el activo
    const nextCode = await assetService.getNextAvailableCode(
      template.category, // "IMPLEMENT"
    );
    // Resultado: "IMP-001", "IMP-002", etc.

    // 4. Crear el activo
    const asset = await assetService.createAsset(tenantId, businessUnitId, {
      code: nextCode, // "IMP-001"
      name: "Andamio Tubular #1", // Auto-numerado
      assetType: template.category, // "IMPLEMENT"
      acquisitionCost: 150000, // Precio de compra
      origin: "Compra OC-2026-001", // Trazabilidad
      currentLocation: "Bodega", // Ubicación inicial
      requiresOperator: false,
      requiresTracking: true,
      requiresClinic: template.requiresPreventiveMaintenance, // ✅ Heredado del template
      templateId: template.id, // Relación con template
      customData: {}, // Se puede llenar después

      // 🔗 TRAZABILIDAD DE COMPRA
      purchaseOrderId: orderId, // Relación con OC
      supplierId: order.supplierId, // Proveedor original
      purchaseDate: new Date(), // Fecha de recepción
      purchasePrice: 150000, // Precio unitario
    });
  }
}
```

#### 4.3 Resultado

**10 unidades recibidas → 10 activos creados:**

| Activo      | Código  | Template        | OC Origen   | Proveedor      |
| ----------- | ------- | --------------- | ----------- | -------------- |
| Andamio #1  | IMP-001 | Andamio Tubular | OC-2026-001 | Andamios Costa |
| Andamio #2  | IMP-002 | Andamio Tubular | OC-2026-001 | Andamios Costa |
| Andamio #3  | IMP-003 | Andamio Tubular | OC-2026-001 | Andamios Costa |
| ...         | ...     | ...             | ...         | ...            |
| Andamio #10 | IMP-010 | Andamio Tubular | OC-2026-001 | Andamios Costa |

**Estado de la orden**: `SENT` → `RECEIVED` (o `PARTIALLY_RECEIVED` si faltan items)

---

## 📊 ESQUEMA VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: PurchaseOrderForm.tsx                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Usuario crea OC                                             │
│  2. Agrega item (Supply)                                        │
│  3. ✅ Marca "Crear activos al recibir"                         │
│  4. Selecciona "Andamio Tubular" del dropdown                   │
│  5. Guarda OC                                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: POST /purchase-orders (DRAFT)                          │
├─────────────────────────────────────────────────────────────────┤
│  PurchaseOrder:                                                 │
│    - code: "OC-2026-001"                                        │
│    - status: DRAFT                                              │
│    - supplierId: "uuid"                                         │
│                                                                 │
│  PurchaseOrderItem:                                             │
│    - supplyId: "uuid-supply"                                    │
│    - quantity: 10                                               │
│    - unitPrice: 150000                                          │
│    - createsAsset: true        ✅                               │
│    - assetTemplateId: "uuid"   ✅                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: PATCH /purchase-orders/:id/confirm                     │
├─────────────────────────────────────────────────────────────────┤
│  Status: DRAFT → SENT                                           │
│  (Envío a proveedor: email, WhatsApp, etc.)                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: POST /purchase-orders/:id/receive                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Actualizar stock del Supply (+10)                          │
│  2. Crear StockTransaction (PURCHASE)                          │
│  3. 🎯 CREAR 10 ACTIVOS:                                        │
│     - Obtener template                                          │
│     - Loop por cada unidad recibida                             │
│     - Generar código único (IMP-001, IMP-002...)               │
│     - Heredar requiresClinic del template                       │
│     - Guardar trazabilidad (purchaseOrderId, supplierId)       │
│  4. Status: SENT → RECEIVED                                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESULTADO: 10 Assets creados                                    │
├─────────────────────────────────────────────────────────────────┤
│  Asset #1:                                                      │
│    - code: "IMP-001"                                            │
│    - name: "Andamio Tubular #1"                                 │
│    - templateId: "uuid-template"                                │
│    - purchaseOrderId: "uuid-OC"                                 │
│    - supplierId: "uuid-supplier"                                │
│    - acquisitionCost: 150000                                    │
│    - currentLocation: "Bodega"                                  │
│    - requiresClinic: true (heredado)                            │
│                                                                 │
│  Asset #2 ... Asset #10 (igual estructura)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 CAMPOS CLAVE

### **PurchaseOrderItem**

```prisma
model PurchaseOrderItem {
  id               String  @id @default(uuid())
  purchaseOrderId  String
  supplyId         String          // Supply comprado
  quantity         Decimal
  unitPrice        Decimal
  receivedQty      Decimal @default(0)

  // 🎯 CAMPOS PARA ASSET CREATION
  createsAsset     Boolean @default(false)  // ✅ Checkbox
  assetTemplateId  String?                  // ✅ Template elegido
  generatedAssetId String?                  // ID del primer activo creado

  // Relations
  purchaseOrder    PurchaseOrder @relation(...)
  supply           Supply @relation(...)
  assetTemplate    AssetTemplate? @relation(...)
  generatedAsset   Asset? @relation("GeneratedAsset", ...)
}
```

### **Asset**

```prisma
model Asset {
  id              String  @id @default(uuid())
  code            String  // Auto-generado: "IMP-001"
  name            String  // "Andamio Tubular #1"
  templateId      String?

  // 🔗 TRAZABILIDAD DE COMPRA
  purchaseOrderId String?  // OC de origen
  supplierId      String?  // Proveedor
  purchaseDate    DateTime?
  purchasePrice   Decimal?

  // HERENCIAS DEL TEMPLATE
  requiresClinic  Boolean @default(false) // Heredado de template.requiresPreventiveMaintenance

  // Relations
  template        AssetTemplate? @relation(...)
  purchaseOrder   PurchaseOrder? @relation(...)
  supplier        Supplier? @relation(...)
}
```

---

## ✅ VALIDACIONES IMPLEMENTADAS

### Frontend (PurchaseOrderForm.tsx)

1. ✅ Si `createsAsset = true` → `assetTemplateId` es **obligatorio**
2. ✅ Dropdown solo muestra templates activos
3. ✅ Al enviar, valida que tenga al menos 1 item

### Backend (purchase-order.service.ts)

1. ✅ Si template no existe → Log error pero **NO falla** toda la recepción
2. ✅ Solo crea activos si `createsAsset = true AND assetTemplateId != null`
3. ✅ Genera códigos únicos secuenciales por categoría
4. ✅ Hereda `requiresClinic` desde `template.requiresPreventiveMaintenance`
5. ✅ Guarda trazabilidad completa (OC, proveedor, fecha, precio)

---

## 🎯 CASOS DE USO

### Caso 1: Compra de Implementos (con activos)

**Ejemplo**: Andamios para obra

```typescript
Item en OC:
- Supply: "Andamio Tubular" (genérico en catálogo)
- Cantidad: 10 unidades
- createsAsset: TRUE
- assetTemplateId: "template-andamio"

Al recibir:
→ 10 activos individualizados (IMP-001 a IMP-010)
→ Cada uno rastreable con código único
→ Listos para alquilar independientemente
```

### Caso 2: Compra de Consumibles (sin activos)

**Ejemplo**: Aceite lubricante

```typescript
Item en OC:
- Supply: "Aceite Motor 15W40"
- Cantidad: 50 litros
- createsAsset: FALSE
- assetTemplateId: null

Al recibir:
→ Solo se incrementa stock del Supply
→ NO se crean activos
→ Se usa para mantenimiento de otros activos
```

### Caso 3: Compra mixta

**OC-2026-001:**

- Item 1: 10 Andamios → `createsAsset: true` → 10 Assets
- Item 2: 50 Litros Aceite → `createsAsset: false` → Stock++
- Item 3: 5 Retroexcavadoras → `createsAsset: true` → 5 Assets

**Resultado:**

- 15 activos creados (10 + 5)
- 1 supply actualizado (aceite)
- Trazabilidad completa de todo

---

## 🚨 CASOS ESPECIALES

### ¿Qué pasa si recibo parcialmente?

**Escenario**: Pedí 10 andamios, solo llegaron 6

```typescript
POST /purchase-orders/:id/receive
{
  receivedDate: "2026-02-12",
  items: [
    { itemId: "uuid", receivedQty: 6 }
  ]
}
```

**Resultado:**

- ✅ Stock incrementa en +6
- ✅ Se crean 6 activos (IMP-001 a IMP-006)
- ✅ Order status: `PARTIALLY_RECEIVED`
- ⏳ Esperando los 4 restantes

**Segunda recepción:**

```typescript
POST /purchase-orders/:id/receive
{
  receivedDate: "2026-02-15",
  items: [
    { itemId: "uuid", receivedQty: 4 }
  ]
}
```

**Resultado:**

- ✅ Stock incrementa en +4 (total: 10)
- ✅ Se crean 4 activos (IMP-007 a IMP-010)
- ✅ Order status: `RECEIVED` (completo)

---

### ¿Qué pasa si el template no existe al recibir?

**Escenario**: Template fue eliminado después de crear la OC

```typescript
// Backend detecta que template no existe
if (!template) {
  console.error(`Asset template ${orderItem.assetTemplateId} not found`);
  continue; // ⚠️ Salta este item pero sigue con los demás
}
```

**Resultado:**

- ❌ NO se crean activos para ese item
- ✅ Stock del Supply SÍ se actualiza
- ✅ Recepción de otros items continúa normalmente
- ⚠️ Log de error para debugging

**Recomendación:**

- Frontend debería validar que template siga activo antes de recibir
- Backend es defensivo: mejor skip que fallar todo

---

## 📱 TESTING MANUAL

### Test 1: Flujo Completo Básico

1. ✅ Crear proveedor "Andamios Costa"
2. ✅ Crear template "Andamio Tubular" (IMPLEMENT)
3. ✅ Crear OC con 10 andamios
4. ✅ Marcar "Crear activos al recibir"
5. ✅ Seleccionar template "Andamio Tubular"
6. ✅ Confirmar OC (DRAFT → SENT)
7. ✅ Recibir 10 unidades
8. ✅ Verificar que se crearon 10 activos (IMP-001 a IMP-010)
9. ✅ Verificar que cada activo tiene:
   - ✅ `purchaseOrderId` apuntando a la OC
   - ✅ `supplierId` apuntando al proveedor
   - ✅ `templateId` apuntando al template
   - ✅ `acquisitionCost` = precio unitario
   - ✅ `requiresClinic` heredado del template

### Test 2: Recepción Parcial

1. ✅ Crear OC con 10 unidades
2. ✅ Recibir solo 6
3. ✅ Verificar 6 activos creados
4. ✅ Verificar status `PARTIALLY_RECEIVED`
5. ✅ Recibir las 4 restantes
6. ✅ Verificar 4 activos adicionales
7. ✅ Verificar status `RECEIVED`
8. ✅ Total: 10 activos con códigos secuenciales

### Test 3: Compra Sin Activos

1. ✅ Crear OC de aceite (consumible)
2. ✅ NO marcar "Crear activos"
3. ✅ Recibir 50 litros
4. ✅ Verificar que solo aumentó stock
5. ✅ Verificar que NO se crearon activos

---

## 🔄 PRÓXIMOS PASOS (Posibles Mejoras)

### 1. Configuración de Activos Post-Creación

**Problema**: Activos se crean con `customData: {}` vacío

**Solución**:

- Permitir llenar customFields al recibir
- O mostrar modal post-recepción para completar datos

### 2. Upload de Imágenes Masivo

**Problema**: 10 activos sin foto

**Solución**:

- Permitir upload de fotos durante recepción
- Copiar imagen del template como default
- Upload masivo para múltiples activos

### 3. Asignación de Ubicación Detallada

**Problema**: Todos quedan en "Bodega" genérica

**Solución**:

- Selector de ubicaciones específicas
- Integración con módulo de bodegas/locaciones

### 4. Notificaciones

**Solución**:

- Email/WhatsApp al recibir OC
- Notificar cuando se crean activos
- Dashboard de "Activos recién ingresados"

---

## 📚 REFERENCIAS

**Backend**:

- `backend/src/modules/purchases/services/purchase-order.service.ts`
- `backend/src/modules/assets/services/asset.service.ts`
- `backend/prisma/schema.prisma`

**Frontend**:

- `web/src/modules/purchases/components/PurchaseOrderForm.tsx`
- `web/src/modules/purchases/services/purchase-order.service.ts`

**Seed Data**:

- `backend/prisma/seed.ts` (proveedores y templates de ejemplo)

---

**Última actualización**: 2026-02-12  
**Status**: ✅ Completamente implementado y funcional
