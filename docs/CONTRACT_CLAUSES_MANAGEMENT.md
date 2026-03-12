# 📜 GESTIÓN DE CLÁUSULAS DE CONTRATO

**Fecha**: Marzo 12, 2026  
**Estado**: ✅ Backend completo, ⚠️ Frontend pendiente

---

## 📍 ESTADO ACTUAL

### ✅ **Backend (Completo)**

Ya existe toda la infraestructura:

1. **Seed de cláusulas**: `backend/prisma/seed-contract-clauses.ts`
   - Ejecutar con: `npm run prisma:seed:clauses`
   - 20+ cláusulas predefinidas organizadas por categorías

2. **Servicios**:
   - `ContractClauseTemplateService` - CRUD completo
   - `ContractClauseService` - Gestión de cláusulas en contratos

3. **Endpoints disponibles**:
   ```
   POST   /api/v1/rental/clause-templates          ← Crear plantilla
   GET    /api/v1/rental/clause-templates          ← Listar plantillas
   GET    /api/v1/rental/clause-templates/:id      ← Obtener una
   PUT    /api/v1/rental/clause-templates/:id      ← Actualizar
   DELETE /api/v1/rental/clause-templates/:id      ← Eliminar
   POST   /api/v1/rental/clause-templates/:id/interpolate ← Interpolar variables
   ```

---

## 🏗️ CATEGORÍAS DE CLÁUSULAS EXISTENTES

### 1. **General** (3 cláusulas)

- Responsabilidad del Cliente
- Condiciones de Uso
- Periodo de Alquiler y Prórrogas

### 2. **Safety** (4 cláusulas)

- Operación Segura de Maquinaria _(retroexcavadora, excavadora, grúa, etc.)_
- Elementos de Protección Personal
- Inspección Preoperacional _(todos los vehículos)_
- Capacitación y Autorización

### 3. **Maintenance** (4 cláusulas)

- Mantenimiento Preventivo
- Mantenimiento Correctivo por Uso Normal
- Cuidado Diario del Equipo
- Reparaciones No Autorizadas

### 4. **Insurance** (3 cláusulas)

- Seguro del Equipo
- Responsabilidad por Robo
- Daños a Terceros

### 5. **Liability** (3 cláusulas)

- Daños por Mal Uso
- Multas y Sanciones _(vehículos con placas)_
- Pérdida de Ingresos

### 6. **Termination** (4 cláusulas)

- Devolución del Equipo
- Terminación Anticipada
- Inspección de Devolución
- Liquidación Final

---

## 🆕 CLÁUSULAS ADICIONALES SUGERIDAS

### **Para Maquinaria Pesada con Operador**

```typescript
{
  name: "Responsabilidad del Operador Proporcionado",
  category: "safety",
  content: `Cuando el ARRENDADOR proporcione operador certificado para el equipo, este personal permanecerá bajo supervisión del ARRENDADOR en términos laborales. Sin embargo, durante las operaciones, el operador seguirá las instrucciones del CLIENTE en cuanto a tareas específicas a realizar. El CLIENTE debe proporcionar condiciones seguras de trabajo, acceso a servicios sanitarios, y tiempos de descanso según la legislación laboral vigente.`,
  applicableAssetTypes: ["excavadora", "retroexcavadora", "grúa", "minicargador"],
  applicableContractTypes: ["master", "specific"],
  isActive: true,
  isDefault: false,
  displayOrder: 14,
},
{
  name: "Horarios de Operación",
  category: "general",
  content: `El equipo debe ser operado únicamente durante los horarios permitidos por las regulaciones locales y el plan de manejo ambiental del proyecto. Como regla general, la operación está permitida entre 6:00 AM y 6:00 PM de lunes a sábado. Operaciones en horarios especiales (nocturno, dominicales, festivos) requieren autorización previa del ARRENDADOR y pueden generar cargos adicionales.`,
  applicableAssetTypes: ["excavadora", "retroexcavadora", "minicargador"],
  applicableContractTypes: ["master", "specific"],
  isActive: true,
  isDefault: false,
  displayOrder: 4,
},
{
  name: "Combustible y Consumibles",
  category: "general",
  content: `El CLIENTE es responsable del suministro de combustible (diésel, gasolina) necesario para la operación del equipo. El equipo se entrega con tanque lleno y debe devolverse en las mismas condiciones. El CLIENTE debe utilizar combustible de la calidad especificada por el fabricante. Los consumibles menores (filtros de aire, aceite de motor en cambios programados) son responsabilidad del ARRENDADOR según el plan de mantenimiento.`,
  applicableAssetTypes: ["excavadora", "retroexcavadora", "minicargador", "camioneta"],
  applicableContractTypes: ["master", "specific"],
  isActive: true,
  isDefault: true,
  displayOrder: 5,
},
{
  name: "Condiciones de Terreno y Operación",
  category: "safety",
  content: `El CLIENTE debe informar al ARRENDADOR sobre las condiciones específicas del terreno donde operará el equipo (pendientes, zonas blandas, proximidad a estructuras, presencia de servicios públicos enterrados). El CLIENTE es responsable de verificar la capacidad portante del terreno y las restricciones de peso. La operación en condiciones no adecuadas para el tipo de equipo puede generar responsabilidad por daños.`,
  applicableAssetTypes: ["excavadora", "retroexcavadora", "grúa", "minicargador"],
  applicableContractTypes: ["master", "specific"],
  isActive: true,
  isDefault: true,
  displayOrder: 15,
},
{
  name: "Documentación y Permisos",
  category: "general",
  content: `El CLIENTE es responsable de obtener todos los permisos, licencias, y autorizaciones necesarias para la operación del equipo en el sitio de trabajo. Esto incluye: permisos de construcción, planes de manejo de tráfico, autorizaciones ambientales, y cualquier otro requisito local. El ARRENDADOR proporcionará la documentación del equipo (SOAT, revisión técnico-mecánica, certificados) necesaria para las inspecciones.`,
  applicableAssetTypes: [],
  applicableContractTypes: ["master", "specific"],
  isActive: true,
  isDefault: false,
  displayOrder: 6,
},
{
  name: "Transporte y Movilización",
  category: "general",
  content: `Los costos de transporte del equipo desde las instalaciones del ARRENDADOR hasta el sitio de trabajo y su devolución están incluidos en el precio acordado, siempre que la distancia no exceda 50 km. Traslados adicionales durante el periodo de alquiler o distancias superiores generarán cargos adicionales según tarifa vigente. El CLIENTE debe garantizar acceso adecuado para la cama baja o camión de transporte.`,
  applicableAssetTypes: ["excavadora", "retroexcavadora", "minicargador"],
  applicableContractTypes: ["master", "specific"],
  isActive: true,
  isDefault: false,
  displayOrder: 7,
},
```

---

## ⚠️ FALTANTE: INTERFAZ FRONTEND

### **Ubicación sugerida**: `/rental/clause-templates`

### **Páginas necesarias**:

1. **ClauseTemplatesListPage** - Lista de cláusulas
   - Filtros por categoría
   - Búsqueda por nombre
   - Indicador de activa/inactiva
   - Indicador de "default"
   - Botón "Nueva Cláusula"

2. **ClauseTemplateFormPage** - Crear/Editar cláusula
   - Nombre de la cláusula
   - Categoría (select)
   - Contenido (textarea grande)
   - Tipos de activo aplicables (multi-select)
   - Tipos de contrato aplicables (checkboxes)
   - Es cláusula por defecto? (checkbox)
   - Orden de visualización (number)
   - Estado activo/inactivo

3. **ClausePreviewModal** - Preview de cláusula interpolada
   - Mostrar cláusula con variables reemplazadas
   - Útil para ver cómo se verá en el contrato

---

## 🎯 FLUJO DE USO

```
┌──────────────────────────────────────────────────┐
│  1. Admin accede a /rental/clause-templates      │
│     Ve lista de todas las cláusulas              │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│  2. Crea nueva cláusula:                         │
│     - Nombre: "Operación en Zonas Húmedas"      │
│     - Categoría: safety                          │
│     - Contenido: El CLIENTE debe...             │
│     - Aplicable a: excavadora, retroexcavadora  │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│  3. Al crear contrato con plantilla v2.0:        │
│     - Sistema carga automáticamente cláusulas    │
│       según tipos de activo en la cotización     │
│     - Las cláusulas "default" siempre se incluyen│
│     - Admin puede agregar/quitar cláusulas extra │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│  4. Cliente ve contrato con cláusulas:           │
│     - Organizadas por categoría                  │
│     - Aplicables al tipo de maquinaria           │
│     - Con contenido interpolado (nombre cliente) │
└──────────────────────────────────────────────────┘
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Opción 1: UI Completa (Recomendada)**

**Tiempo**: 4-6 horas

1. Crear servicio frontend `clause-template.service.ts`
2. Crear página lista `ClauseTemplatesListPage.tsx`
3. Crear formulario `ClauseTemplateFormPage.tsx`
4. Agregar ruta en router `/rental/clause-templates`
5. Agregar enlace en menú de configuración

**Ventajas**:

- Admin puede gestionar cláusulas sin tocar código
- Fácil agregar cláusulas personalizadas por cliente
- Visualización clara de cuáles aplican a cada tipo

---

### **Opción 2: Solo Ejecutar Seed + Agregar Cláusulas Nuevas**

**Tiempo**: 30 minutos

1. Agregar las 6 cláusulas sugeridas arriba al seed
2. Ejecutar: `npm run prisma:seed:clauses`
3. Las cláusulas nuevas estarán disponibles automáticamente

**Ventajas**:

- Rápido de implementar
- Suficiente si solo necesitas las cláusulas base

**Desventaja**:

- Para agregar cláusulas custom después, hay que modificar el seed

---

## 📋 ESTRUCTURA DE DATOS

### **ContractClauseTemplate (Prisma)**

```prisma
model ContractClauseTemplate {
  id                      String   @id @default(uuid())
  tenantId                String
  businessUnitId          String?
  name                    String   // "Operación Segura de Maquinaria"
  category                String   // "safety", "general", "maintenance"...
  content                 String   @db.Text // Contenido con variables Handlebars
  applicableAssetTypes    String[] // ["excavadora", "retroexcavadora"]
  applicableContractTypes String[] // ["master", "specific"]
  isActive                Boolean  @default(true)
  isDefault               Boolean  @default(false) // Se incluye automáticamente?
  displayOrder            Int      @default(0)

  tenant        Tenant        @relation(...)
  businessUnit  BusinessUnit? @relation(...)
  contracts     ContractClause[] // Cláusulas instanciadas en contratos
}
```

---

## 💡 VARIABLES SOPORTADAS EN CLÁUSULAS

Las cláusulas pueden incluir variables Handlebars:

```handlebars
{{tenant.name}}
← Nombre de la empresa
{{client.fullName}}
← Nombre del cliente
{{client.identification}}
← Cédula/NIT
{{contract.number}}
← Número de contrato
{{contract.startDate}}
← Fecha inicio
{{contract.endDate}}
← Fecha fin
{{quotation.total}}
← Valor total
```

Ejemplo:

```
El CLIENTE {{client.fullName}} identificado con {{client.identification}}
se compromete a devolver el equipo antes del {{contract.endDate}}.
```

---

## 🎨 MOCKUP DE UI PROPUESTA

### Lista de Cláusulas

```
┌─────────────────────────────────────────────────────────┐
│  📜 Plantillas de Cláusulas                             │
│                                                          │
│  🔍 Buscar...  📁 Categoría: [Todas ▼]  [+ Nueva]     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ✅ Responsabilidad del Cliente        [Editar]   │  │
│  │    Categoría: general | Default | Orden: 1       │  │
│  │    Aplicable a: Todos los activos                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ✅ Operación Segura de Maquinaria    [Editar]   │  │
│  │    Categoría: safety | Orden: 10                 │  │
│  │    Aplicable a: excavadora, retroexcavadora, grúa│  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ⏸️ Cláusula Personalizada XYZ        [Editar]   │  │
│  │    Categoría: custom | Inactiva                  │  │
│  │    Aplicable a: camioneta                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ PRÓXIMOS PASOS

**¿Qué prefieres?**

1. **Agregar solo las 6 cláusulas nuevas al seed** (30 min)
   - Modifico el seed
   - Ejecutas `npm run prisma:seed:clauses`
   - Listo para usar

2. **Crear interfaz completa para gestionar cláusulas** (4-6h)
   - Páginas de lista y formulario
   - Servicio frontend
   - Gestión visual completa

3. **Ambas** 🎯
   - Primero agrego las cláusulas al seed para que ya estén disponibles
   - Luego creo la UI para que puedas agregar más después

---

**Archivo de seed**: [backend/prisma/seed-contract-clauses.ts](c:\Users\merce\Desktop\desarrollo\DivancoSaas\backend\prisma\seed-contract-clauses.ts)

**Ejecutar seed**:

```bash
cd backend
npm run prisma:seed:clauses
```
