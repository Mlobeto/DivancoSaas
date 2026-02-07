# Frontend Web - DivancoSaaS

## Estructura Implementada

### 🎨 Layout Multitenant

Componente `Layout.tsx` que implementa:

- **Header con contexto completo**: Muestra tenant, business unit y usuario
- **Selector de Business Unit**: Permite cambiar entre BUs si el usuario tiene acceso a múltiples
- **Estilo AutoCAD 2014**: Dark theme técnico y profesional
- **Responsivo**: Adaptado a diferentes tamaños de pantalla

### 📁 Servicios Frontend

#### `businessUnit.service.ts`

- Lista Business Units de un tenant
- CRUD completo de Business Units
- Obtiene las BUs del usuario actual con sus roles

#### `user.service.ts`

- Gestión de usuarios dentro del tenant
- Asignación de usuarios a Business Units con roles
- CRUD completo

#### `role.service.ts`

- Gestión de roles personalizados (NO hardcodeados)
- Lista permisos disponibles por módulo
- CRUD de roles

### 🧩 Componentes Adaptados

#### `EquipmentPage.tsx`

- Adaptado para usar el nuevo Layout
- Respeta contexto de tenant/businessUnit
- Validación de contexto antes de mostrar datos
- Query keys incluyen tenantId y businessUnitId

## 🎯 Flujo de Usuario Actual

1. **Login** → Usuario se autentica
2. **Dashboard** → Ve su contexto (tenant + BU)
3. **Selector de BU** → Puede cambiar entre sus Business Units
4. **Equipos** → Lista equipos respetando el contexto seleccionado

## 📋 Próximos Pasos Sugeridos

### Fase 1: Gestión Básica (Core)

- [ ] Página de gestión de Business Units
- [ ] Página de gestión de usuarios del tenant
- [ ] Página de gestión de roles personalizados

### Fase 2: Módulo de Maquinaria (Ya implementado en backend)

- [ ] Página de contratos de renta
- [ ] Página de asignación de equipos a contratos
- [ ] Página de reportes de uso
- [ ] Página de incidentes
- [ ] Dashboard de disponibilidad

## 🏗️ Arquitectura Frontend

```
web/src/
├── components/          # Componentes reutilizables
│   └── Layout.tsx      # Layout principal con contexto multitenant
├── pages/              # Páginas de la aplicación
│   ├── DashboardPage.tsx
│   ├── EquipmentPage.tsx
│   ├── LoginPage.tsx
│   └── ...
├── services/           # Servicios para API calls
│   ├── auth.service.ts
│   ├── businessUnit.service.ts
│   ├── user.service.ts
│   ├── role.service.ts
│   ├── equipment.service.ts
│   └── ...
├── store/              # Estado global (Zustand)
│   ├── auth.store.ts
│   └── ui.store.ts
├── types/              # TypeScript types
│   └── api.types.ts
└── lib/                # Utilidades
    └── api.ts          # Axios instance configurado
```

## 🎨 Estilo Visual

### Paleta de Colores (AutoCAD 2014 Inspired)

```css
/* Dark Theme */
--dark-900: #0a0e14 // Background principal
  --dark-800: #11151c // Cards, header
  --dark-700: #1f2329 // Borders, hover
  --dark-600: #2d3139 --dark-500: #3b4048 --dark-400: #6b7280 // Text secundario
  --dark-300: #9ca3af --dark-100: #e5e7eb // Text principal
  /* Primary (Accent) */ --primary-600: #3b82f6 // Botones, links
  --primary-700: #2563eb;
```

### Componentes CSS Personalizados

```css
.btn-primary    // Botón principal azul
.btn-secondary  // Botón secundario dark
.btn-ghost      // Botón transparente

.input          // Input con borde dark
.card           // Card con fondo dark-800
.header         // Header con border bottom
```

## 🔐 Seguridad

- JWT Token en localStorage
- Interceptor de Axios agrega token automáticamente
- Redirect a login si 401 Unauthorized
- Validación de contexto tenant/BU antes de mostrar datos

## 📡 Integración con Backend

Todos los servicios usan:

- `baseURL: '/api/v1'`
- Headers: `Authorization: Bearer <token>`
- Response format: `ApiResponse<T>`

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## 🚀 Comandos

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 📚 Guardrails Respetados

✅ Sistema Multitenant: Datos aislados por tenant
✅ Business Units: Usuarios pueden tener múltiples BUs con roles diferentes
✅ Roles NO hardcodeados: Se cargan desde el backend
✅ Context-aware: Toda acción respeta tenant + BU actual
✅ Estilo técnico: AutoCAD 2014 como referencia visual
