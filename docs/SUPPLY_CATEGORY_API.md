# 📋 SUPPLY CATEGORY API - Endpoints

## ✅ IMPLEMENTADO - Backend Controllers

### Base URL

```
/api/v1/modules/purchases/supply-categories
```

---

## 📍 ENDPOINTS

### 1. **Crear Categoría**

```http
POST /api/v1/modules/purchases/supply-categories
```

**Headers:**

```
Authorization: Bearer <token>
X-Tenant-Id: <uuid>
X-Business-Unit-Id: <uuid>
```

**Body:**

```json
{
  "code": "LUBRICANTE",
  "name": "Lubricantes",
  "description": "Aceites y lubricantes para maquinaria",
  "type": "CONSUMABLE",
  "color": "#3B82F6",
  "icon": "droplet",
  "requiresStockControl": true,
  "allowNegativeStock": false
}
```

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "LUBRICANTE",
    "name": "Lubricantes",
    "description": "Aceites y lubricantes para maquinaria",
    "type": "CONSUMABLE",
    "color": "#3B82F6",
    "icon": "droplet",
    "requiresStockControl": true,
    "allowNegativeStock": false,
    "isActive": true,
    "tenantId": "uuid",
    "businessUnitId": "uuid",
    "createdAt": "2026-02-10T...",
    "updatedAt": "2026-02-10T..."
  }
}
```

---

### 2. **Listar Categorías**

```http
GET /api/v1/modules/purchases/supply-categories
```

**Query Params (opcionales):**

- `type`: CONSUMABLE | SPARE_PART | RAW_MATERIAL | FINISHED_PRODUCT | TOOL | OTHER
- `search`: texto a buscar en code, name o description
- `isActive`: true | false

**Headers:**

```
Authorization: Bearer <token>
X-Tenant-Id: <uuid>
X-Business-Unit-Id: <uuid>
```

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "LUBRICANTE",
      "name": "Lubricantes",
      "type": "CONSUMABLE",
      "color": "#3B82F6",
      "icon": "droplet",
      "isActive": true,
      "suppliesCount": 15,
      "createdAt": "2026-02-10T...",
      "updatedAt": "2026-02-10T..."
    }
  ],
  "count": 1
}
```

---

### 3. **Obtener Categoría por ID**

```http
GET /api/v1/modules/purchases/supply-categories/:categoryId
```

**Headers:**

```
Authorization: Bearer <token>
X-Tenant-Id: <uuid>
X-Business-Unit-Id: <uuid>
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "LUBRICANTE",
    "name": "Lubricantes",
    "description": "Aceites y lubricantes para maquinaria",
    "type": "CONSUMABLE",
    "color": "#3B82F6",
    "icon": "droplet",
    "requiresStockControl": true,
    "allowNegativeStock": false,
    "isActive": true,
    "suppliesCount": 15,
    "supplies": [
      {
        "id": "uuid",
        "code": "LUB-001",
        "name": "Aceite Motor 15W40",
        "stock": 120,
        "isActive": true
      }
    ],
    "tenantId": "uuid",
    "businessUnitId": "uuid",
    "createdAt": "2026-02-10T...",
    "updatedAt": "2026-02-10T..."
  }
}
```

---

### 4. **Actualizar Categoría**

```http
PUT /api/v1/modules/purchases/supply-categories/:categoryId
```

**Headers:**

```
Authorization: Bearer <token>
X-Tenant-Id: <uuid>
X-Business-Unit-Id: <uuid>
```

**Body (todos los campos son opcionales):**

```json
{
  "name": "Lubricantes Industriales",
  "description": "Actualizado",
  "color": "#10B981",
  "isActive": true
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "LUBRICANTE",
    "name": "Lubricantes Industriales"
    // ... resto de campos actualizados
  }
}
```

---

### 5. **Eliminar Categoría**

```http
DELETE /api/v1/modules/purchases/supply-categories/:categoryId
```

**Headers:**

```
Authorization: Bearer <token>
X-Tenant-Id: <uuid>
X-Business-Unit-Id: <uuid>
```

**Response 200:**

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error 400 (si tiene insumos asignados):**

```json
{
  "success": false,
  "error": "Cannot delete category with 15 supplies assigned. Please reassign or delete supplies first."
}
```

---

### 6. **Activar/Desactivar Categoría**

```http
PATCH /api/v1/modules/purchases/supply-categories/:categoryId/toggle-active
```

**Headers:**

```
Authorization: Bearer <token>
X-Tenant-Id: <uuid>
X-Business-Unit-Id: <uuid>
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "LUBRICANTE",
    "isActive": false
    // ... resto de campos
  },
  "message": "Category deactivated successfully"
}
```

---

### 7. **Obtener Estadísticas**

```http
GET /api/v1/modules/purchases/supply-categories/stats
```

**Headers:**

```
Authorization: Bearer <token>
X-Tenant-Id: <uuid>
X-Business-Unit-Id: <uuid>
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "total": 12,
    "byType": {
      "CONSUMABLE": {
        "count": 5,
        "suppliesCount": 45,
        "active": 5
      },
      "SPARE_PART": {
        "count": 3,
        "suppliesCount": 28,
        "active": 2
      },
      "RAW_MATERIAL": {
        "count": 4,
        "suppliesCount": 67,
        "active": 4
      }
    },
    "activeCategories": 11,
    "inactiveCategories": 1
  }
}
```

---

## 🎯 TIPOS DE CATEGORÍA (SupplyCategoryType)

```typescript
enum SupplyCategoryType {
  CONSUMABLE          // Consumibles que se agotan (lubricantes, filtros)
  SPARE_PART          // Repuestos y partes
  RAW_MATERIAL        // Materia prima para producción
  FINISHED_PRODUCT    // Productos terminados para venta
  TOOL                // Herramientas menores no catalogadas como Asset
  OTHER               // Otros tipos definidos por el usuario
}
```

---

## ✅ VALIDACIONES IMPLEMENTADAS

1. **Código único** por BusinessUnit (automático uppercase)
2. **No eliminar** categorías con insumos asignados
3. **Multitenancy** estricto (tenantId + businessUnitId)
4. **Búsqueda case-insensitive** en code, name, description
5. **Conteo de insumos** en cada categoría

---

## 📊 CASOS DE USO

### BU: Constructora

```javascript
// Crear categorías para construcción
POST /supply-categories
{
  "code": "LUBRICANTE_MOTOR",
  "name": "Lubricantes de Motor",
  "type": "CONSUMABLE"
}

POST /supply-categories
{
  "code": "REPUESTO_MAQUINARIA",
  "name": "Repuestos Maquinaria Pesada",
  "type": "SPARE_PART"
}
```

### BU: Textilera

```javascript
// Crear categorías para textiles
POST /supply-categories
{
  "code": "TELA_ALGODON",
  "name": "Telas de Algodón",
  "type": "RAW_MATERIAL"
}

POST /supply-categories
{
  "code": "HILO_COSER",
  "name": "Hilos para Coser",
  "type": "RAW_MATERIAL"
}
```

---

## 🔄 FLUJO COMPLETO

```mermaid
graph LR
    A[Frontend Wizard] --> B[POST /supply-categories]
    B --> C[Service: Validate Code]
    C --> D[Create in Prisma]
    D --> E[Return Category]
    E --> F[Frontend Lista]
    F --> G[GET /supply-categories]
    G --> H[Mostrar en Cards]
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Backend Completo** - Controllers, Services, Routes
2. ⏳ **Testing** - Probar con Postman/Thunder Client
3. ⏳ **Integración Frontend** - Conectar wizard con API
4. ⏳ **Supply Module** - Usar categorías en formulario de insumos

---

**Estado:** ✅ **LISTO PARA PROBAR**  
**Archivos Creados:**

- `backend/src/modules/purchases/types/purchases.types.ts` (tipos agregados)
- `backend/src/modules/purchases/services/supply-category.service.ts`
- `backend/src/modules/purchases/controllers/supply-category.controller.ts`
- `backend/src/modules/purchases/routes/purchases.routes.ts` (rutas agregadas)
