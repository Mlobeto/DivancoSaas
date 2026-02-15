# Módulos de Negocio

Los módulos son funcionalidades independientes que se pueden activar/desactivar por Business Unit.

## 📂 Estructura de un Módulo

```
modules/
└── [nombre-modulo]/
    ├── [nombre-modulo].module.ts    # Implementa ModuleContract
    ├── routes/                      # Rutas del módulo
    ├── services/                    # Lógica de negocio
    ├── models/                      # Prisma schema (si aplica)
    └── README.md                    # Documentación
```

## ✅ Reglas para Módulos

1. **Cada módulo es independiente**
   - No puede depender de otro módulo
   - Solo puede usar contracts del core

2. **Debe implementar ModuleContract**
   ```typescript
   export class MiModulo implements ModuleContract {
     readonly name = 'mi-modulo';
     readonly version = '1.0.0';
     // ...
   }
   ```

3. **Registrar permisos necesarios**
   - Declarar todos los recursos y acciones

4. **Definir workflows por defecto** (opcional)
   - Estados y transiciones

5. **Aislamiento de datos**
   - Siempre filtrar por `tenantId` y `businessUnitId`

## 📦 Módulos Disponibles

Consulta cada módulo en su carpeta respectiva:
- `assets/` - Gestión de activos (UNIT y BULK)
- `clients/` - Gestión de clientes
- `purchases/` - Órdenes de compra y proveedores
- `rental/` - Cotizaciones y contratos de alquiler

## 🔌 Cómo Crear un Nuevo Módulo

1. Crear carpeta en `modules/`
2. Implementar `ModuleContract`
3. Definir rutas y servicios
4. Registrar en el sistema
5. Agregar a Prisma schema si necesita tablas

## ⚠️ Lo que NO Debe Hacer un Módulo

- ❌ Acceder directamente a datos de otro módulo
- ❌ Depender de implementaciones concretas de adapters
- ❌ Mezclar datos entre business units
- ❌ Hardcodear estados o roles
