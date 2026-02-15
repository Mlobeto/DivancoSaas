# Módulo: Assets (Maquinaria)

## Propósito

Gestión completa de activos (maquinaria, herramientas, equipos) con sistema de plantillas, seguimiento de estado y documentación.

## Características

- ✅ Sistema de plantillas de activos con campos personalizados
- ✅ Gestión UNIT (tracking individual) y BULK (inventario por cantidad)
- ✅ Estados: AVAILABLE, RENTED, MAINTENANCE, OUT_OF_SERVICE, RESERVED
- ✅ Documentación de activos con alertas de vencimiento
- ✅ Tipos de documentos configurables
- ✅ Dashboard de alertas para documentos próximos a vencer
- ✅ Importación CSV de activos
- ✅ Imágenes de activos

## Estructura

```
machinery/
├── pages/
│   ├── AssetsListPage.tsx          # Listado de activos
│   ├── AssetFormPage.tsx           # Formulario crear/editar
│   ├── AssetTemplatesPage.tsx      # Gestión de plantillas
│   ├── DocumentTypesPage.tsx       # Tipos de documentos
│   ├── AlertsDashboardPage.tsx     # Dashboard de alertas
│   └── TemplateWizardPage.tsx      # Asistente plantillas
├── services/
│   ├── assets.service.ts           # CRUD de activos
│   ├── asset-template.service.ts   # Plantillas
│   ├── document-types.service.ts   # Tipos de docs
│   └── alerts.service.ts           # Alertas
├── components/
│   └── AssetDocumentationModal.tsx # Modal docs
└── index.ts                        # Exports del módulo
```

## Endpoints Backend

- `GET /api/v1/assets` - Lista activos
- `POST /api/v1/assets` - Crea activo
- `GET /api/v1/assets/:id` - Obtiene activo
- `PATCH /api/v1/assets/:id` - Actualiza activo
- `DELETE /api/v1/assets/:id` - Elimina activo
- `POST /api/v1/assets/:id/state` - Actualiza estado
- `GET /api/v1/assets/:id/events` - Eventos del activo
- `DELETE /api/v1/assets/:id/image` - Elimina imagen

## Dependencias del Core

- `Layout` - Layout principal con contexto multitenant
- `auth.store` - Estado de autenticación
- `api.types` - Tipos compartidos (ApiResponse, PaginatedResponse)

## Próximas Características

- [ ] Página de contratos de renta
- [ ] Asignación de maquinaria a obras
- [ ] Reportes de uso diario
- [ ] Gestión de incidentes
- [ ] Dashboard de disponibilidad
