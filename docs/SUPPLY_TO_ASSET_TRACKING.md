# 🔗 RELACIÓN SUMINISTROS → ACTIVOS (Historia Clínica)

## 🎯 Objetivo

Documentar cómo los **Suministros** (supplies) se relacionan con los **Activos** (assets/implementos) para mantener una historia clínica completa de mantenimiento y uso.

---

## 📊 MODELO DE DATOS

### Supply (Suministro)

```prisma
model Supply {
  id             String  @id @default(uuid())
  tenantId       String
  businessUnitId String
  categoryId     String? // Relación con SupplyCategory

  code String? // Código interno
  name String  // "Aceite 15W40", "Filtro de Aire"
  unit String  // "litros", "unidades", "kg"

  stock Decimal @default(0)

  // Categorías soportadas:
  // - CONSUMABLE: Lubricantes, filtros, tintas
  // - SPARE_PART: Repuestos y piezas
  // - RAW_MATERIAL: Materia prima
  // - FINISHED_PRODUCT: Productos terminados
  // - TOOL: Herramientas menores
  // - OTHER: Otros

  // Relations
  category  SupplyCategory? @relation(...)
  usages    SupplyUsage[]   // 🔗 RELACIÓN CON ASSETS
}
```

### SupplyUsage (Uso de Suministro en un Activo)

```prisma
model SupplyUsage {
  id       String  @id @default(uuid())
  supplyId String
  assetId  String? // 🎯 Implemento donde se usó el suministro
  quantity Decimal
  reason   String  // "preventive", "corrective", "post_obra", "discard"
  notes    String?

  createdAt DateTime @default(now())

  supply Supply @relation(...)
  asset  Asset? @relation(...) // 🔗 RELACIÓN CON IMPLEMENTO
}
```

---

## 🔄 FLUJO DE USO

### **Caso 1: Mantenimiento Preventivo de Retroexcavadora**

#### 1️⃣ Crear el registro de uso

```typescript
POST /api/v1/modules/supplies/:supplyId/usage
{
  assetId: "uuid-retroexcavadora-001",
  quantity: 20,  // 20 litros de aceite
  reason: "preventive",
  notes: "Mantenimiento preventivo 1000hrs - Cambio de aceite motor"
}
```

#### 2️⃣ Backend procesa

```typescript
// 1. Decrementar stock del Supply
await prisma.supply.update({
  where: { id: supplyId },
  data: {
    stock: { decrement: 20 }, // De 100L → 80L
  },
});

// 2. Crear registro de SupplyUsage
await prisma.supplyUsage.create({
  data: {
    supplyId: "uuid-aceite-15w40",
    assetId: "uuid-retroexcavadora-001", // 🔗 Relación con el implemento
    quantity: 20,
    reason: "preventive",
    notes: "Mantenimiento preventivo 1000hrs - Cambio de aceite motor",
    createdAt: new Date(),
  },
});

// 3. Actualizar Asset (opcional: registrar mantenimiento)
await prisma.assetMaintenanceRecord.create({
  data: {
    assetId: "uuid-retroexcavadora-001",
    type: "PREVENTIVE",
    description: "Cambio de aceite motor",
    supplies: [{ id: supplyId, quantity: 20 }], // Referencia a suministros usados
    completedAt: new Date(),
  },
});
```

#### 3️⃣ Resultado: Historia Clínica

**Vista del Implemento (Retroexcavadora-001):**

| Fecha      | Suministro Usado | Cantidad | Razón      | Nota                  |
| ---------- | ---------------- | -------- | ---------- | --------------------- |
| 2026-02-12 | Aceite 15W40     | 20L      | Preventivo | Mantenimiento 1000hrs |
| 2026-01-15 | Filtro Aire      | 1 unidad | Preventivo | Cambio programado     |
| 2026-01-10 | Filtro Aceite    | 1 unidad | Preventivo | Cambio programado     |

---

### **Caso 2: Reparación Correctiva de Andamio**

#### Registro de uso

```typescript
POST /api/v1/modules/supplies/:supplyId/usage
{
  assetId: "uuid-andamio-001",
  quantity: 2,  // 2 tubos de reemplazo
  reason: "corrective",
  notes: "Reemplazo de tubos dañados en obra - Zona Norte"
}
```

**Vista del Implemento (Andamio-001):**

| Fecha      | Suministro Usado | Cantidad | Razón      | Nota                                 |
| ---------- | ---------------- | -------- | ---------- | ------------------------------------ |
| 2026-02-12 | Tubo Andamio 2m  | 2 unid   | Correctivo | Reemplazo tubos dañados - Zona Norte |
| 2026-01-20 | Tornillo Andamio | 8 unid   | Correctivo | Reemplazo por desgaste               |

---

### **Caso 3: Post-Obra (Limpieza y preparación)**

```typescript
POST /api/v1/modules/supplies/:supplyId/usage
{
  assetId: "uuid-encofrado-001",
  quantity: 5,  // 5 litros de desmoldante
  reason: "post_obra",
  notes: "Limpieza post-obra Torre Central"
}
```

---

## 🔍 QUERIES ÚTILES

### **1. Historial completo de un implemento**

```typescript
// Obtener todos los suministros usados en un activo
const history = await prisma.supplyUsage.findMany({
  where: { assetId: "uuid-retroexcavadora-001" },
  include: {
    supply: {
      include: { category: true },
    },
  },
  orderBy: { createdAt: "desc" },
});

// Resultado:
[
  {
    id: "uuid",
    quantity: 20,
    reason: "preventive",
    notes: "Mantenimiento 1000hrs",
    createdAt: "2026-02-12",
    supply: {
      name: "Aceite Motor 15W40",
      unit: "litros",
      category: { name: "Lubricantes", type: "CONSUMABLE" },
    },
  },
  // ...más registros
];
```

### **2. Suministros más usados en un activo**

```typescript
// Ranking de suministros más consumidos por implemento
const topSupplies = await prisma.supplyUsage.groupBy({
  by: ["supplyId"],
  where: { assetId: "uuid-retroexcavadora-001" },
  _sum: { quantity: true },
  _count: { id: true },
  orderBy: { _sum: { quantity: "desc" } },
});
```

### **3. Costo total de mantenimiento de un implemento**

```typescript
// Calcular cuánto se ha gastado en suministros para este activo
const maintenanceCost = await prisma.supplyUsage.findMany({
  where: { assetId: "uuid-retroexcavadora-001" },
  include: {
    supply: {
      select: { costPerUnit: true },
    },
  },
});

const totalCost = maintenanceCost.reduce((sum, usage) => {
  return sum + usage.quantity * (usage.supply.costPerUnit || 0);
}, 0);

// Resultado: $1,500,000 en suministros usados
```

### **4. Activos que usan un suministro específico**

```typescript
// ¿Qué implementos están usando Aceite 15W40?
const assetsUsingOil = await prisma.supplyUsage.findMany({
  where: { supplyId: "uuid-aceite-15w40" },
  distinct: ["assetId"],
  include: {
    asset: {
      select: { code, name, assetType },
    },
  },
});

// Resultado:
[
  {
    asset: { code: "MACH-001", name: "Retroexcavadora JCB", type: "MACHINERY" },
  },
  {
    asset: { code: "MACH-003", name: "Minicargador Bobcat", type: "MACHINERY" },
  },
];
```

---

## 🎨 PANTALLAS FRONTEND

### **Página de Activo Individual**

```tsx
// AssetDetailPage.tsx

<section className="card">
  <h3>Historia de Suministros Usados</h3>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Suministro</th>
        <th>Cantidad</th>
        <th>Razón</th>
        <th>Nota</th>
      </tr>
    </thead>
    <tbody>
      {supplyUsages.map((usage) => (
        <tr key={usage.id}>
          <td>{formatDate(usage.createdAt)}</td>
          <td>
            <span className="badge">{usage.supply.category.name}</span>
            {usage.supply.name}
          </td>
          <td>
            {usage.quantity} {usage.supply.unit}
          </td>
          <td>
            <span className={`badge ${getReasonColor(usage.reason)}`}>
              {usage.reason}
            </span>
          </td>
          <td>{usage.notes}</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>
```

### **Formulario de Registro de Uso**

```tsx
// SupplyUsageForm.tsx

<form onSubmit={handleSubmit}>
  <label>Implemento</label>
  <select name="assetId" required>
    <option value="">Seleccionar implemento...</option>
    {assets.map((asset) => (
      <option key={asset.id} value={asset.id}>
        {asset.code} - {asset.name}
      </option>
    ))}
  </select>

  <label>Suministro</label>
  <select name="supplyId" required>
    <option value="">Seleccionar suministro...</option>
    {supplies.map((supply) => (
      <option key={supply.id} value={supply.id}>
        {supply.name} (Stock: {supply.stock} {supply.unit})
      </option>
    ))}
  </select>

  <label>Cantidad</label>
  <input type="number" name="quantity" required />

  <label>Razón</label>
  <select name="reason" required>
    <option value="preventive">Mantenimiento Preventivo</option>
    <option value="corrective">Reparación Correctiva</option>
    <option value="post_obra">Post-Obra</option>
    <option value="discard">Descarte</option>
  </select>

  <label>Notas</label>
  <textarea name="notes" rows={3} />

  <button type="submit">Registrar Uso</button>
</form>
```

---

## 📈 BENEFICIOS

### 1️⃣ **Trazabilidad Completa**

- ✅ Sabes exactamente qué suministros ha usado cada implemento
- ✅ Historial cronológico de mantenimientos
- ✅ Evidencia para auditorías

### 2️⃣ **Cálculo de Costos Reales**

```typescript
// Costo de adquisición + Costo de operación/mantenimiento
const totalAssetCost = asset.acquisitionCost + maintenanceCost;
```

### 3️⃣ **Predicción de Necesidades**

```typescript
// Cada 1000hrs → Necesito 20L de aceite
// Si tengo 5 retroexcavadoras → 100L cada mantenimiento
```

### 4️⃣ **Alertas Automáticas**

```typescript
// Si un implemento no ha tenido mantenimiento en 30 días → ALERTA
// Si un suministro crítico está por agotarse → REORDEN
```

### 5️⃣ **Reportes Gerenciales**

- Costo promedio de mantenimiento por tipo de implemento
- Suministros más consumidos
- Implementos más costosos de mantener
- Comparación de costos entre proveedores

---

## 🔄 INTEGRACIÓN CON OTROS MÓDULOS

### **Compras → Inventario → Activos**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Orden de    │  →  │ Supply      │  →  │ Asset       │
│ Compra      │     │ (Stock++)   │     │ (Uso++)     │
└─────────────┘     └─────────────┘     └─────────────┘
     OC-001          Aceite 15W40      Retroexcavadora
   50 litros         Stock: 100L       Usa 20L cada 1000hrs
```

### **Mantenimiento → Suministros → Historia Clínica**

```
┌────────────────┐
│ Maintenance    │
│ Schedule       │
└────────┬───────┘
         │
         ▼
┌────────────────┐     ┌────────────────┐
│ Create         │  →  │ SupplyUsage    │
│ Work Order     │     │ Record         │
└────────────────┘     └────────┬───────┘
                                │
                                ▼
                       ┌────────────────┐
                       │ Asset          │
                       │ History        │
                       └────────────────┘
```

---

## 📝 TAREAS PENDIENTES

- [ ] Implementar endpoint `POST /supplies/:id/usage`
- [ ] Crear página de historia clínica del activo
- [ ] Formulario de registro de uso de suministros
- [ ] Dashboard de costos de mantenimiento por activo
- [ ] Reportes CSV/Excel de uso de suministros
- [ ] Integración con módulo de mantenimiento preventivo
- [ ] Alertas de stock bajo basadas en patrones de uso
- [ ] Calculadora de costo total de propiedad (TCO)

---

**Última actualización**: 2026-02-12  
**Status**: ✅ Modelo de datos implementado, falta UI
