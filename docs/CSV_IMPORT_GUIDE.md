# 📥 GUÍA DE IMPORTACIÓN CSV - INVENTARIO INICIAL

## 🎯 Objetivo

Esta guía explica cómo usar las plantillas CSV para cargar el inventario inicial cuando un tenant comienza a usar DivancoSaaS.

---

## 📋 ARCHIVOS DE PLANTILLA

### 1. **import_categories.csv** - Categorías de Suministros

Crea las categorías antes de importar suministros.

**Campos obligatorios:**

- `code` - Código único (ej: IMPLEMENTOS, MATERIALES)
- `name` - Nombre descriptivo
- `type` - Tipo del sistema: `CONSUMABLE`, `SPARE_PART`, `RAW_MATERIAL`, `FINISHED_PRODUCT`, `TOOL`, `OTHER`

**Campos opcionales:**

- `description` - Descripción detallada
- `color` - Hex color (ej: #3B82F6)
- `icon` - Identificador de icono (ej: wrench, package)
- `requiresStockControl` - `true`/`false` (default: true)
- `allowNegativeStock` - `true`/`false` (default: false)

---

### 2. **import_templates.csv** - Plantillas de Activos

Crea las plantillas antes de importar activos.

**Campos obligatorios:**

- `code` - Código único del template (ej: ANDAMIO-TUB)
- `name` - Nombre descriptivo
- `category` - Categoría: `MACHINE`, `IMPLEMENT`, `VEHICLE`, `TOOL`, `OTHER`
- `codePrefix` - Prefijo para códigos de activos (ej: IMP, RET, VEH)

**Campos opcionales:**

- `requiresPreventiveMaintenance` - `true`/`false` (default: false)
- `description` - Descripción detallada
- `customFields` - Campos personalizados en formato: `key1:value1|key2:value2`

**Ejemplo de customFields:**

```
altura:2 metros|material:Acero galvanizado|capacidad:200 kg
```

---

### 3. **import_supplies_initial.csv** - Suministros (Catálogo + Stock Inicial)

Crea los items del catálogo de compras.

**Campos obligatorios:**

- `name` - Nombre del suministro
- `categoryCode` - Código de la categoría (debe existir previamente)

**Campos opcionales:**

- `code` - Código manual (si no se proporciona, se auto-genera SUM-XXXX)
- `sku` - Stock Keeping Unit
- `barcode` - Código de barras
- `unit` - Unidad de medida (ej: unidades, litros, kg, metros, bultos)
- `costPerUnit` - Costo por unidad en centavos (ej: 350000 = $3,500.00)
- `currentStock` - Stock inicial (default: 0)
- `minStock` - Stock mínimo para alertas
- `maxStock` - Stock máximo
- `description` - Descripción detallada

**⚠️ Nota sobre Stock:**

- Para **activos rastreables** (andamios, máquinas): dejar `currentStock = 0`
- Para **consumibles fungibles** (tornillos, cemento): poner cantidad inicial real

---

### 4. **import_assets_initial.csv** - Activos Individuales Existentes

Registra cada activo físico individual (retroexcavadoras, andamios, vehículos, etc.)

**Campos obligatorios:**

- `code` - Código único del activo (ej: IMP-001, RET-045)
- `name` - Nombre descriptivo
- `templateName` - Nombre de la plantilla de activo (debe existir previamente)

**Campos opcionales:**

- `acquisitionCost` - Costo de adquisición en centavos
- `origin` - Origen del activo (ej: "Inventario inicial", "Compra directa 2024")
- `currentLocation` - Ubicación actual (ej: "Bodega Central", "Obra Santa Fe")
- `notes` - Notas adicionales

**⚠️ Importante:**

- Los activos importados **NO tienen** `purchaseOrderId` (no vienen de una OC)
- Para activos comprados después del onboarding, usar el flujo normal de órdenes de compra

---

## 📊 ORDEN DE IMPORTACIÓN

**IMPORTANTE:** Seguir este orden para evitar errores de referencias:

```
1️⃣ import_categories.csv      (Categorías de suministros)
2️⃣ import_templates.csv        (Plantillas de activos)
3️⃣ import_supplies_initial.csv (Suministros del catálogo)
4️⃣ import_assets_initial.csv   (Activos físicos individuales)
```

---

## 🔧 PROCESO DE IMPORTACIÓN

### **Opción A: Por UI (Próximamente)**

```
1. Ir a: Configuración → Importación de Datos
2. Seleccionar tipo: "Categorías" / "Plantillas" / "Suministros" / "Activos"
3. Cargar archivo CSV
4. Validar preview
5. Confirmar importación
```

### **Opción B: Por API (Desarrollo/Scripts)**

```bash
# 1. Categorías
curl -X POST https://api.divancosaas.com/api/v1/modules/purchases/supply-categories/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Business-Unit-Id: $BU_ID" \
  -F "file=@import_categories.csv"

# 2. Plantillas
curl -X POST https://api.divancosaas.com/api/v1/modules/assets/templates/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Business-Unit-Id: $BU_ID" \
  -F "file=@import_templates.csv"

# 3. Suministros
curl -X POST https://api.divancosaas.com/api/v1/modules/purchases/supplies/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Business-Unit-Id: $BU_ID" \
  -F "file=@import_supplies_initial.csv"

# 4. Activos
curl -X POST https://api.divancosaas.com/api/v1/modules/assets/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-Business-Unit-Id: $BU_ID" \
  -F "file=@import_assets_initial.csv"
```

---

## ✅ VALIDACIONES

El sistema validará:

### Categorías

- ✅ Código único por BusinessUnit
- ✅ Tipo válido (enum)
- ✅ Color en formato hex válido (si se proporciona)

### Templates

- ✅ Código único por BusinessUnit
- ✅ Categoría válida (enum)
- ✅ Prefijo de código único
- ✅ customFields en formato correcto (key:value|key:value)

### Suministros

- ✅ Nombre no vacío
- ✅ Categoría existe (categoryCode válido)
- ✅ Código único si se proporciona manualmente
- ✅ currentStock >= 0
- ✅ minStock <= maxStock (si ambos están definidos)

### Activos

- ✅ Nombre no vacío
- ✅ Template existe (templateName válido)
- ✅ Código único si se proporciona manualmente
- ✅ acquisitionCost >= 0 (si se proporciona)

---

## 🚨 ERRORES COMUNES

### ❌ Error: "Category code IMPLEMENTOS not found"

**Solución:** Importar `import_categories.csv` primero

### ❌ Error: "Template code ANDAMIO-TUB not found"

**Solución:** Importar `import_templates.csv` antes de activos

### ❌ Error: "Duplicate code IMP-001"

**Solución:** Verificar que no haya códigos duplicados en el CSV o en la base de datos

### ❌ Error: "Invalid type value 'MAQUINA'"

**Solución:** Usar valores válidos del enum: `CONSUMABLE`, `SPARE_PART`, `RAW_MATERIAL`, `FINISHED_PRODUCT`, `TOOL`, `OTHER`

### ❌ Error: "Invalid category value 'MAQUINARIA'"

**Solución:** Usar valores válidos del enum: `MACHINE`, `IMPLEMENT`, `VEHICLE`, `TOOL`, `OTHER`

---

## 📝 EJEMPLOS COMPLETOS

### Caso 1: Constructora con 10 Andamios + Consumibles

**1. Crear categoría** (`import_categories.csv`):

```csv
code,name,type,description,color
IMPLEMENTOS,Implementos,TOOL,Andamios y estructuras,#3B82F6
MATERIALES,Materiales,RAW_MATERIAL,Cemento y agregados,#10B981
```

**2. Crear template** (`import_templates.csv`):

```csv
code,name,category,codePrefix,requiresPreventiveMaintenance
ANDAMIO-TUB,Andamio Tubular,IMPLEMENT,IMP,true
```

**3. Crear suministros** (`import_supplies_initial.csv`):

```csv
code,name,categoryCode,unit,costPerUnit,currentStock,minStock
SUM-0001,Andamio Tubular 2m,IMPLEMENTOS,unidades,350000,0,5
SUM-0002,Cemento 50kg,MATERIALES,bultos,35000,250,100
```

**4. Crear activos** (`import_assets_initial.csv`):

```csv
code,name,templateCode,acquisitionCost,origin,currentLocation
IMP-001,Andamio Tubular #1,ANDAMIO-TUB,350000,Inventario inicial,Bodega
IMP-002,Andamio Tubular #2,ANDAMIO-TUB,350000,Inventario inicial,Bodega
...
IMP-010,Andamio Tubular #10,ANDAMIO-TUB,350000,Inventario inicial,Obra Santa Fe
```

---

## 🔄 DESPUÉS DE LA IMPORTACIÓN

### Verificar importación exitosa:

```sql
-- Categorías creadas
SELECT code, name, type FROM supply_categories WHERE business_unit_id = 'xxx';

-- Templates creados
SELECT code, name, category FROM asset_templates WHERE business_unit_id = 'xxx';

-- Suministros creados
SELECT code, name, current_stock FROM supplies WHERE business_unit_id = 'xxx';

-- Activos creados
SELECT code, name, current_location FROM assets WHERE business_unit_id = 'xxx';
```

### Ajustar stock de consumibles (si es necesario):

```
Ir a: Compras → Suministros → [Suministro] → Ajustar Stock
Cantidad: +cantidad inicial
Motivo: "Carga inicial de inventario"
```

---

## 🎯 PRÓXIMOS PASOS

Después de la importación:

1. ✅ Verificar que todos los items se importaron correctamente
2. ✅ Configurar mantenimiento preventivo para activos (si aplica)
3. ✅ Asignar ubicaciones específicas a los activos
4. ✅ Configurar proveedores
5. ✅ Crear primera orden de compra para reponer stock

---

## 📞 SOPORTE

¿Problemas con la importación?

- 📧 Email: soporte@divancosaas.com
- 💬 Chat: Disponible en la app
- 📚 Docs: https://docs.divancosaas.com/import

---

**Última actualización:** Febrero 2026
