# 🚀 GUÍA RÁPIDA: Endpoints de Importación CSV

## 📌 Endpoints Disponibles

### 1. Importar Categorías de Suministros

```http
POST /api/v1/modules/purchases/supply-categories/import
Content-Type: multipart/form-data
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
X-Business-Unit-Id: {business-unit-id}

Body:
- file: [archivo CSV]
```

### 2. Importar Suministros

```http
POST /api/v1/modules/purchases/supplies/import
Content-Type: multipart/form-data
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
X-Business-Unit-Id: {business-unit-id}

Body:
- file: [archivo CSV]
```

---

## 🧪 Prueba con cURL

### Importar Categorías

```bash
curl -X POST https://localhost:3000/api/v1/modules/purchases/supply-categories/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID" \
  -H "X-Business-Unit-Id: YOUR_BU_ID" \
  -F "file=@docs/templates/import_categories.csv"
```

### Importar Suministros

```bash
curl -X POST https://localhost:3000/api/v1/modules/purchases/supplies/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Id: YOUR_TENANT_ID" \
  -H "X-Business-Unit-Id: YOUR_BU_ID" \
  -F "file=@docs/templates/import_supplies_initial.csv"
```

---

## 📥 Prueba con Postman

1. **Crear nueva request**
   - Method: POST
   - URL: `http://localhost:3000/api/v1/modules/purchases/supply-categories/import`

2. **Headers**

   ```
   Authorization: Bearer {tu_token}
   X-Tenant-Id: {tu_tenant_id}
   X-Business-Unit-Id: {tu_business_unit_id}
   ```

3. **Body**
   - Seleccionar: `form-data`
   - Key: `file` (cambiar tipo a "File")
   - Value: Seleccionar archivo CSV

4. **Send** ✅

---

## 📊 Respuesta Exitosa

```json
{
  "success": true,
  "created": 6,
  "errors": [],
  "summary": "Imported 6 of 6 categories. 0 errors."
}
```

---

## ⚠️ Respuesta con Errores Parciales

```json
{
  "success": false,
  "created": 5,
  "errors": [
    {
      "row": 3,
      "error": "Category with code 'IMPLEMENTOS' already exists",
      "data": {
        "code": "IMPLEMENTOS",
        "name": "Implementos",
        "type": "TOOL"
      }
    }
  ],
  "summary": "Imported 5 of 6 categories. 1 errors."
}
```

---

## 🔧 Swagger UI

También puedes probar los endpoints desde Swagger UI:

```
http://localhost:3000/api-docs
```

Busca la sección **"Supply Categories"** o **"Supplies"** y encontrarás los endpoints de import:

- `POST /modules/purchases/supply-categories/import`
- `POST /modules/purchases/supplies/import`

---

## ✅ Validaciones Automáticas

### Categorías

- ✅ Código único por BusinessUnit
- ✅ Tipo válido (CONSUMABLE, SPARE_PART, RAW_MATERIAL, etc.)
- ✅ Color en formato hex (si se proporciona)

### Suministros

- ✅ Nombre no vacío
- ✅ Categoría existe (valida categoryCode)
- ✅ Código único o auto-generado (SUM-XXXX)
- ✅ currentStock >= 0
- ✅ minStock <= maxStock

---

## 🎯 Flujo Recomendado

1. **Primero**: Importar categorías

   ```bash
   POST /supply-categories/import
   → docs/templates/import_categories.csv
   ```

2. **Después**: Importar suministros
   ```bash
   POST /supplies/import
   → docs/templates/import_supplies_initial.csv
   ```

---

## 📝 Notas Importantes

- Máximo 5MB por archivo
- Solo archivos CSV permitidos
- Codificación: UTF-8 (con BOM)
- Separador: coma (,)
- Primera fila: encabezados

---

## 🐛 Troubleshooting

### Error: "Only CSV files are allowed"

**Solución**: Asegúrate de que el archivo tenga extensión `.csv`

### Error: "CSV file is empty"

**Solución**: Verifica que el CSV tenga al menos una fila de datos (además del header)

### Error: "Category with code 'XXX' not found"

**Solución**: Importa las categorías antes de los suministros

### Error: "Invalid type value 'MAQUINA'"

**Solución**: Usa valores válidos del enum. Ver `/docs/CSV_IMPORT_GUIDE.md`

---

**Más información**: Ver [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md)
