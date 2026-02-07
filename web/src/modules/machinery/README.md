# Módulo: Maquinaria (Machinery)

## Propósito

Gestión completa de maquinaria e implementos para alquiler en proyectos de construcción.

## Características

- ✅ Listado de maquinaria con filtros (estado, condición, categoría)
- ✅ CRUD completo de maquinaria
- ✅ Gestión de tarifas (diaria, semanal, mensual)
- ✅ Estados: Disponible, Rentado, Mantenimiento, Fuera de servicio, Reservado
- ✅ Condiciones: Excelente, Bueno, Regular, Malo

## Estructura

```
machinery/
├── pages/
│   └── MachineryPage.tsx       # Listado y gestión de maquinaria
├── services/
│   └── machinery.service.ts    # API calls para maquinaria
├── types/
│   └── (por definir)
└── index.ts                    # Exports del módulo
```

## Endpoints Backend

- `GET /api/v1/equipment` - Lista maquinaria
- `POST /api/v1/equipment` - Crea maquinaria
- `PUT /api/v1/equipment/:id` - Actualiza maquinaria
- `DELETE /api/v1/equipment/:id` - Elimina maquinaria

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
