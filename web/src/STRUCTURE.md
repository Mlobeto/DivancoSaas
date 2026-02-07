# Frontend - Estructura Modular

## 📁 Organización del Código

```
web/src/
├── core/                    # Funcionalidad transversal del sistema
├── modules/                 # Módulos de negocio independientes
├── shared/                  # Componentes/utils reutilizables
├── lib/                     # Configuración de librerías
├── store/                   # Estado global (Zustand)
└── types/                   # (deprecated - usar core/types)
```

## 🏗️ Core

Contiene toda la funcionalidad transversal que NO pertenece a un módulo específico:

- **Autenticación** (login, register, forgot password)
- **Dashboard principal**
- **Layout con contexto multitenant**
- **Servicios del core** (auth, businessUnit, dashboard)
- **Tipos compartidos** (ApiResponse, User, Tenant, BusinessUnit)

## 📦 Módulos

Cada módulo de negocio es autocontenido y sigue esta estructura:

```
modules/[nombre-modulo]/
├── pages/              # Páginas del módulo
├── services/           # API calls específicos del módulo
├── components/         # Componentes específicos del módulo
├── types/              # Tipos específicos (opcional)
├── README.md           # Documentación del módulo
└── index.ts            # Exports públicos del módulo
```

### Módulos Actuales:

#### ✅ machinery (Maquinaria)

- Gestión de maquinaria e implementos para alquiler
- Estado: **Implementado**

#### 🔧 users (Usuarios y Roles)

- Gestión de usuarios internos del tenant
- Asignación de usuarios a Business Units con roles
- Estado: **Servicios implementados, páginas pendientes**

### Futuros Módulos:

- `rental` - Contratos de renta y asignaciones
- `projects` - Gestión de proyectos/obras
- `hr` - Recursos humanos
- `reports` - Reportes y analytics

## 🧩 Shared

Componentes UI y utilidades reutilizables entre módulos:

- `components/` - Botones, Modals, DataTables, etc.
- `hooks/` - Custom hooks (useDebounce, usePagination, etc.)
- `utils/` - Funciones helper (formatters, validators, etc.)

## 🔌 Imports

### Usar alias @ configurado en vite.config.ts:

```typescript
// ✅ CORRECTO - Imports desde el core
import { Layout } from "@/core/components/Layout";
import { authService } from "@/core/services/auth.service";
import type { User } from "@/core/types/api.types";

// ✅ CORRECTO - Imports desde módulos
import { MachineryPage } from "@/modules/machinery";
import { machineryService } from "@/modules/machinery/services/machinery.service";

// ✅ CORRECTO - Imports desde shared
import { Button } from "@/shared/components/Button";
import { useDebounce } from "@/shared/hooks/useDebounce";

// ❌ INCORRECTO - No usar rutas relativas entre módulos
import { Something } from "../../other-module/...";
```

## 🎯 Principios

1. **El core NO conoce módulos** - Core no importa nada de modules/
2. **Módulos son independientes** - No se importan entre sí
3. **Shared es neutral** - No tiene lógica de negocio
4. **Un módulo = un dominio de negocio** - Cohesión alta, acoplamiento bajo

## 🚀 Agregar un Nuevo Módulo

1. Crear estructura:

```bash
mkdir -p src/modules/[nombre]/pages
mkdir -p src/modules/[nombre]/services
mkdir -p src/modules/[nombre]/components
```

2. Crear README con propósito y características

3. Crear index.ts con exports públicos

4. Implementar servicios (API calls)

5. Implementar páginas

6. Documentar dependencias del core

## 📚 Documentación Adicional

- [README_FRONTEND.md](../README_FRONTEND.md) - Guía general del frontend
- [modules/machinery/README.md](modules/machinery/README.md) - Módulo de maquinaria
- [modules/users/README.md](modules/users/README.md) - Módulo de usuarios
