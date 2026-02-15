# Módulo de Maquinaria - Frontend Completado

## ✅ Componentes Implementados

### 1. **Gestión de Tipos de Documentos** (`DocumentTypesPage`)

- CRUD completo para tipos de documentos configurables por Business Unit
- Ejemplos: SOAT, Seguros, Certificados, Permisos
- Configuración de vencimientos y alertas personalizadas
- Estadísticas de uso en tiempo real

**Ruta sugerida**: `/machinery/document-types`

### 2. **Formulario de Creación/Edición de Activos** (`AssetFormPage`)

- Formulario dinámico basado en plantillas (AssetTemplate)
- Upload de imagen principal (Azure Blob Storage)
- Custom fields dinámicos según template seleccionado
- Integración con modal de documentación
- Workflow: Crear asset → Subir imagen → Cargar documentos

**Rutas sugeridas**:

- `/machinery/assets/new` - Crear nuevo activo
- `/machinery/assets/:id/edit` - Editar activo existente

### 3. **Modal de Documentación** (`AssetDocumentationModal`)

- Upload múltiple de archivos (imágenes, PDF, Word, Excel)
- Vinculación con tipos de documentos configurables
- Fechas de emisión y vencimiento
- Alertas configurables por documento
- Cálculo automático de status (ACTIVE, EXPIRING, EXPIRED)

**Uso**: Se abre desde `AssetFormPage` después de crear un activo

### 4. **Dashboard de Alertas de Vencimiento** (`AlertsDashboardPage`)

- Monitoreo en tiempo real de documentos por vencer
- Agrupación por urgencia:
  - 🔴 Vencidos (status EXPIRED)
  - 🟠 Urgentes (≤7 días)
  - 🟡 Próximos (8-30 días)
- Estadísticas y KPIs
- Links directos a activos

**Ruta sugerida**: `/machinery/alerts` o `/dashboard/alerts`

---

## 📦 Servicios API Implementados

### `documentTypesService`

- `list(filters?)` - Listar tipos de documentos
- `getById(id)` - Obtener tipo por ID
- `create(data)` - Crear nuevo tipo
- `update(id, data)` - Actualizar tipo
- `delete(id)` - Eliminar tipo
- `listWithStats()` - Listar con estadísticas de uso

### `assetsService`

- `list()` - Listar activos
- `getById(id)` - Obtener activo por ID
- `create(data)` - Crear nuevo activo
- `update(id, data)` - Actualizar activo
- `uploadMainImage(assetId, file)` - Subir imagen principal
- `deleteMainImage(assetId)` - Eliminar imagen
- `uploadAttachments(assetId, data)` - Subir múltiples documentos
- `listAttachments(assetId)` - Listar documentos del activo
- `deleteAttachment(attachmentId)` - Eliminar documento

### `alertsService`

- `getExpiringDocuments(daysAhead)` - Obtener documentos por vencer
- `getExpiringDocumentsByStatus()` - Agrupar por status (expired, expiring, active)

---

## 🔧 Integración con Rutas (React Router)

Agregar estas rutas a tu configuración de React Router:

```tsx
import {
  DocumentTypesPage,
  AssetFormPage,
  AlertsDashboardPage,
} from "@/modules/machinery";

const routes = [
  // ... rutas existentes

  // Module: Machinery
  {
    path: "/machinery/document-types",
    element: <DocumentTypesPage />,
  },
  {
    path: "/machinery/assets/new",
    element: <AssetFormPage />,
  },
  {
    path: "/machinery/assets/:id/edit",
    element: <AssetFormPage />,
  },
  {
    path: "/machinery/alerts",
    element: <AlertsDashboardPage />,
  },
];
```

---

## 🎨 Navegación Recomendada

Agregar links en tu sidebar/navigation:

```tsx
// Menú de Maquinaria
<NavLink to="/machinery">Activos</NavLink>
<NavLink to="/machinery/assets/new">Nuevo Activo</NavLink>
<NavLink to="/machinery/templates">Plantillas</NavLink>
<NavLink to="/machinery/document-types">Tipos de Documentos</NavLink>
<NavLink to="/machinery/alerts">Alertas de Vencimiento</NavLink>
```

---

## 🔄 Flujo de Trabajo Completo

1. **Configurar Tipos de Documentos** (una vez)
   - Ir a `/machinery/document-types`
   - Crear tipos como "SOAT", "Seguro", "Revisión Técnica"
   - Configurar si requieren vencimiento y días de alerta

2. **Crear Plantilla de Activo** (ya implementado)
   - Ir a `/machinery/templates`
   - Definir campos personalizados
   - Configurar validaciones

3. **Crear Activo**
   - Ir a `/machinery/assets/new`
   - Seleccionar plantilla
   - Llenar formulario (código, nombre, etc.)
   - Subir imagen principal
   - Cargar documentación con vencimientos
   - Guardar

4. **Monitorear Vencimientos**
   - Ir a `/machinery/alerts`
   - Ver documentos por vencer
   - Tomar acción antes del vencimiento

---

## 📊 Endpoints Backend Consumidos

Todos los endpoints están documentados en Swagger:

- `GET /api/v1/modules/assets/document-types` - Lista tipos
- `POST /api/v1/modules/assets/document-types` - Crea tipo
- `PATCH /api/v1/modules/assets/document-types/:id` - Actualiza tipo
- `DELETE /api/v1/modules/assets/document-types/:id` - Elimina tipo
- `POST /api/v1/modules/assets/assets` - Crea activo
- `POST /api/v1/modules/assets/assets/:id/image` - Sube imagen
- `POST /api/v1/modules/assets/assets/:id/attachments` - Sube documentos
- `GET /api/v1/modules/assets/attachments` - Lista documentos (con filtros)

---

## 🎯 Próximos Pasos (Opcional)

1. **Sistema de Alertas Automáticas (Backend)**
   - Cron job para detectar documentos por vencer
   - Notificaciones por email/WhatsApp
   - Actualización automática de status

2. **App Móvil Offline-First**
   - Reportes de uso desde campo
   - Fotos de horómetro/odómetro
   - Sincronización al reconectar

3. **Integración con Cotizaciones**
   - Crear cotizaciones con activos seleccionados
   - Workflow: Cotización → Firma → Contrato → Activo "rented"

---

**Estado**: ✅ Frontend completado y listo para integración  
**Fecha**: 2026-02-11
