# Módulo de Compras (Purchases)

Módulo frontend para la gestión de compras, proveedores, cotizaciones y órdenes de compra en DivancoSaaS.

## 🎯 Características

### ✅ Gestión de Proveedores

- CRUD completo de proveedores
- Información de contacto y financiera
- Gestión de cuenta corriente
- Filtros por estado, país y búsqueda textual
- Vista detallada de proveedores

### ✅ Cotizaciones de Insumos

- Crear y gestionar cotizaciones
- Comparar precios entre proveedores
- Validez temporal de cotizaciones
- Vinculación con proveedores e insumos

### ✅ Órdenes de Compra

- Crear órdenes con múltiples items
- Flujo de estados (Draft → Confirmed → Received → Completed)
- Confirmación y cancelación de órdenes
- Vista detallada con items y totales

## 📁 Estructura del Módulo

```
purchases/
├── index.ts                     # Exportaciones públicas
├── README.md                    # Documentación
├── types/
│   └── purchases.types.ts       # Tipos TypeScript
├── services/
│   ├── supplier.service.ts      # API de proveedores
│   ├── quote.service.ts         # API de cotizaciones
│   └── purchase-order.service.ts # API de órdenes
├── components/
│   ├── SupplierForm.tsx         # Formulario de proveedores
│   ├── QuoteForm.tsx            # Formulario de cotizaciones
│   └── PurchaseOrderForm.tsx    # Formulario de órdenes
└── pages/
    ├── SuppliersPage.tsx        # Página de proveedores
    └── PurchaseOrdersPage.tsx   # Página de órdenes
```

## 🚀 Uso

### Importar Páginas

```tsx
import { SuppliersPage, PurchaseOrdersPage } from "@/modules/purchases";

// En tu router
<Route path="/suppliers" element={<SuppliersPage />} />
<Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
```

### Importar Servicios

```tsx
import {
  supplierService,
  quoteService,
  purchaseOrderService,
} from "@/modules/purchases";

// Listar proveedores
const suppliers = await supplierService.list({ status: "ACTIVE" });

// Crear cotización
const quote = await quoteService.create({
  supplierId: "uuid",
  supplyId: "uuid",
  unitPrice: 100,
  validFrom: "2026-01-01",
});

// Crear orden de compra
const order = await purchaseOrderService.create({
  code: "PO-001",
  supplierId: "uuid",
  items: [{ supplyId: "uuid", quantity: 10, unitPrice: 100 }],
});
```

### Importar Componentes

```tsx
import {
  SupplierForm,
  QuoteForm,
  PurchaseOrderForm,
} from "@/modules/purchases";

// Usar en un modal o página
<SupplierForm
  supplier={editingSupplier}
  onSuccess={() => console.log("Guardado")}
  onCancel={() => console.log("Cancelado")}
/>;
```

## 🔗 Integraciones

### Backend API

- **Base URL**: `/api/v1/modules/purchases`
- **Autenticación**: JWT Bearer Token
- **Formato**: JSON

### Endpoints Utilizados

#### Proveedores

- `GET /suppliers` - Listar proveedores
- `POST /suppliers` - Crear proveedor
- `GET /suppliers/:id` - Obtener proveedor
- `PUT /suppliers/:id` - Actualizar proveedor
- `DELETE /suppliers/:id` - Eliminar proveedor
- `GET /suppliers/:id/account/balance` - Balance de cuenta
- `POST /suppliers/:id/account/entries` - Crear entrada en cuenta

#### Cotizaciones

- `GET /quotes` - Listar cotizaciones
- `POST /quotes` - Crear cotización
- `GET /quotes/:id` - Obtener cotización
- `PUT /quotes/:id` - Actualizar cotización
- `DELETE /quotes/:id` - Eliminar cotización
- `GET /quotes/compare/:supplyId` - Comparar precios

#### Órdenes de Compra

- `GET /purchase-orders` - Listar órdenes
- `POST /purchase-orders` - Crear orden
- `GET /purchase-orders/:id` - Obtener orden
- `PUT /purchase-orders/:id` - Actualizar orden
- `POST /purchase-orders/:id/confirm` - Confirmar orden
- `POST /purchase-orders/:id/cancel` - Cancelar orden
- `POST /purchase-orders/:id/receive` - Recibir mercadería

## 🎨 Componentes UI

### SupplierForm

Formulario completo para crear/editar proveedores con:

- Información básica (código, nombre, tax ID)
- Datos de contacto (email, teléfono, web, dirección)
- Información financiera (términos de pago, crédito, moneda)
- Notas adicionales

### QuoteForm

Formulario para cotizaciones con:

- Selección de proveedor e insumo
- Precio unitario y moneda
- Cantidad mínima opcional
- Periodo de vigencia
- Estado activo/inactivo

### PurchaseOrderForm

Formulario de órdenes con:

- Selección de proveedor
- Múltiples items con insumo, cantidad y precio
- Fecha esperada de entrega
- Cálculo automático de totales
- Gestión dinámica de items

## 🔒 Seguridad

- Todas las operaciones requieren autenticación JWT
- Contexto tenant y businessUnit obligatorio
- Validación de permisos en backend
- Sanitización de inputs en formularios

## 📊 Estados

### Proveedor

- `ACTIVE`: Proveedor activo
- `INACTIVE`: Proveedor inactivo
- `BLOCKED`: Proveedor bloqueado

### Orden de Compra

- `DRAFT`: Borrador (editable)
- `CONFIRMED`: Confirmada (enviada al proveedor)
- `CANCELLED`: Cancelada
- `PARTIALLY_RECEIVED`: Parcialmente recibida
- `COMPLETED`: Completada (totalmente recibida)

## 🧪 Testing

```bash
# Ejecutar tests
npm test -- purchases

# Con coverage
npm test -- purchases --coverage
```

## 🚧 Roadmap

### Funcionalidades Futuras

- [ ] Página de cotizaciones independiente
- [ ] Comparador visual de cotizaciones
- [ ] Recepción de mercadería con interfaz
- [ ] Dashboard de métricas de compras
- [ ] Integración con módulo de inventario
- [ ] Alertas de cotizaciones vencidas
- [ ] Generación de PDF de órdenes
- [ ] Historial de compras por proveedor

## 📝 Notas

- El módulo sigue la arquitectura multitenant de DivancoSaaS
- Todos los datos están aislados por tenant y businessUnit
- Los formularios usan TanStack Query para gestión de estado
- El diseño sigue el estilo técnico "AutoCAD 2014"
- Compatible con temas oscuros

## 🤝 Contribuir

Para agregar nuevas funcionalidades:

1. Crear tipos en `types/purchases.types.ts`
2. Implementar servicios en `services/`
3. Crear componentes en `components/`
4. Agregar páginas en `pages/`
5. Exportar en `index.ts`
6. Actualizar este README

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026
