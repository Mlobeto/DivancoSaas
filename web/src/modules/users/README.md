# Módulo: Usuarios y Roles (Users)

## Propósito

Gestión de usuarios internos del tenant y definición de roles personalizados con permisos granulares.

## Características

- 🔧 **Por implementar**: Gestión de usuarios del tenant
- 🔧 **Por implementar**: Asignación de usuarios a Business Units
- 🔧 **Por implementar**: Definición de roles personalizados
- 🔧 **Por implementar**: Gestión de permisos por módulo

## Estructura

```
users/
├── pages/
│   └── (por crear)
├── services/
│   ├── user.service.ts         # API calls para usuarios
│   └── role.service.ts         # API calls para roles y permisos
├── components/
│   └── (por crear)
└── index.ts                    # Exports del módulo
```

## Servicios Disponibles

- `userService` - CRUD de usuarios, asignación a BUs
- `roleService` - CRUD de roles, gestión de permisos

## Endpoints Backend

- `GET /api/v1/users` - Lista usuarios del tenant
- `POST /api/v1/users` - Crea usuario
- `POST /api/v1/users/:id/business-units` - Asigna usuario a BU con rol
- `GET /api/v1/roles` - Lista roles
- `GET /api/v1/permissions` - Lista permisos disponibles

## Próximas Páginas a Crear

- [ ] UserListPage - Listado de usuarios del tenant
- [ ] UserRolesPage - Asignación de usuarios a BUs con roles
- [ ] RoleManagementPage - Definición de roles personalizados
- [ ] PermissionsPage - Vista de permisos por módulo
