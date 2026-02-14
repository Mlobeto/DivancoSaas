# Diagramas: Implementación de Inventario BULK

Documentación visual de la implementación del sistema de inventario dual (UNIT vs BULK) para el módulo de Assets.

**Fecha:** 14 de Febrero, 2026  
**Versión:** 1.0

---

## 1. Arquitectura General: UNIT vs BULK

Este diagrama muestra la diferencia entre los dos tipos de gestión de inventario:

- **UNIT**: Trackeo individual (cada excavadora tiene su registro Asset)
- **BULK**: Inventario agregado por cantidad (andamios manejados como stock)

```mermaid
graph TB
    subgraph "Tenant (Empresa)"
        T[Tenant: Divanco]
    end

    subgraph "Business Units"
        BU1[BusinessUnit: Sucursal Norte]
        BU2[BusinessUnit: Sucursal Sur]
    end

    subgraph "Asset Templates (Catálogo)"
        AT1[AssetTemplate: Excavadora CAT 320<br/>managementType: UNIT<br/>🔧 Trackeo individual]
        AT2[AssetTemplate: Andamio Tubular 2m<br/>managementType: BULK<br/>📦 Inventario por cantidad]
    end

    subgraph "UNIT Management (Trackeo Individual)"
        A1[Asset #001: Excavadora CAT 320<br/>serialNumber: EXC-001<br/>status: AVAILABLE]
        A2[Asset #002: Excavadora CAT 320<br/>serialNumber: EXC-002<br/>status: RENTED]
        A3[Asset #003: Excavadora CAT 320<br/>serialNumber: EXC-003<br/>status: MAINTENANCE]
    end

    subgraph "BULK Management (Inventario Agregado)"
        SL1[StockLevel<br/>━━━━━━━━━━━━━━<br/>quantityAvailable: 150 unidades<br/>quantityReserved: 30 unidades<br/>quantityRented: 45 unidades<br/>━━━━━━━━━━━━━━<br/>Total: 225 unidades<br/>minStock: 50<br/>unitCost: $25]

        SM1[StockMovement: ADD<br/>+100 unidades<br/>reason: Compra inicial]
        SM2[StockMovement: RESERVE<br/>-30 unidades<br/>referenceType: Quotation]
        SM3[StockMovement: RENT_OUT<br/>-45 unidades<br/>referenceType: RentalContract]
        SM4[StockMovement: RETURN<br/>+20 unidades<br/>referenceType: RentalContract]
    end

    T --> BU1
    T --> BU2
    BU1 --> AT1
    BU1 --> AT2

    AT1 -.-> A1
    AT1 -.-> A2
    AT1 -.-> A3

    AT2 --> SL1
    SL1 --> SM1
    SL1 --> SM2
    SL1 --> SM3
    SL1 --> SM4

    style AT1 fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style AT2 fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    style SL1 fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style A1 fill:#e8f5e9,stroke:#388e3c
    style A2 fill:#ffebee,stroke:#d32f2f
    style A3 fill:#fff3e0,stroke:#f57c00
```

---

## 2. Flujo de Creación de Inventario BULK

Secuencia completa de operaciones desde la creación de un template BULK hasta rentar el stock:

```mermaid
sequenceDiagram
    actor Admin
    participant API
    participant TemplateService
    participant StockService
    participant DB

    Note over Admin,DB: Paso 1: Crear Template BULK
    Admin->>API: POST /asset-templates<br/>{name: "Andamio Tubular 2m", managementType: "BULK"}
    API->>TemplateService: createTemplate(data)
    TemplateService->>DB: Create AssetTemplate
    DB-->>TemplateService: template {id: "abc123"}

    alt managementType === BULK
        TemplateService->>DB: Create StockLevel<br/>{templateId: "abc123", quantities: 0}
        DB-->>TemplateService: stockLevel
    end

    TemplateService-->>API: template + stockLevel
    API-->>Admin: ✅ Template creado

    Note over Admin,DB: Paso 2: Agregar Stock Inicial
    Admin->>API: POST /stock-levels/add<br/>{templateId: "abc123", quantity: 100}
    API->>StockService: addStock(data)

    StockService->>DB: Validate template is BULK
    DB-->>StockService: ✅ managementType === BULK

    StockService->>DB: BEGIN TRANSACTION
    StockService->>DB: Update StockLevel<br/>quantityAvailable += 100
    StockService->>DB: Create StockMovement<br/>{type: ADD, quantity: 100}
    StockService->>DB: COMMIT

    DB-->>StockService: updated stockLevel
    StockService-->>API: stockLevel {quantityAvailable: 100}
    API-->>Admin: ✅ Stock agregado

    Note over Admin,DB: Paso 3: Reservar para Cotización
    Admin->>API: POST /stock-levels/reserve<br/>{templateId: "abc123", quantity: 30}
    API->>StockService: reserveStock(data)

    StockService->>DB: Check availability<br/>quantityAvailable >= 30?
    DB-->>StockService: ✅ Available: 100

    StockService->>DB: BEGIN TRANSACTION
    StockService->>DB: Update StockLevel<br/>quantityAvailable: 70<br/>quantityReserved: 30
    StockService->>DB: Create StockMovement<br/>{type: RESERVE, quantity: 30}
    StockService->>DB: COMMIT

    StockService-->>API: stockLevel updated
    API-->>Admin: ✅ Stock reservado

    Note over Admin,DB: Paso 4: Rentar (Contrato firmado)
    Admin->>API: POST /stock-levels/rent<br/>{templateId: "abc123", quantity: 30}
    API->>StockService: rentOutStock(data)

    StockService->>DB: Check reserved >= 30
    DB-->>StockService: ✅ Reserved: 30

    StockService->>DB: BEGIN TRANSACTION
    StockService->>DB: Update StockLevel<br/>quantityReserved: 0<br/>quantityRented: 30
    StockService->>DB: Create StockMovement<br/>{type: RENT_OUT, quantity: 30}
    StockService->>DB: COMMIT

    StockService-->>API: stockLevel updated
    API-->>Admin: ✅ Stock rentado
```

---

## 3. Estados y Transiciones del Stock

Diagrama de estados que muestra todas las transiciones posibles del inventario BULK:

```mermaid
stateDiagram-v2
    [*] --> Available: ADD Stock<br/>(Compra inicial)

    Available --> Reserved: RESERVE<br/>(Cotización aprobada)
    Reserved --> Available: UNRESERVE<br/>(Cotización cancelada)

    Reserved --> Rented: RENT_OUT<br/>(Contrato firmado)
    Available --> Rented: RENT_OUT<br/>(Renta directa sin reserva)

    Rented --> Available: RETURN<br/>(Cliente devuelve)

    Available --> Lost: ADJUST<br/>(Pérdida/Daño)
    Rented --> Lost: ADJUST<br/>(No retornado)

    Lost --> [*]

    note right of Available
        quantityAvailable
        Disponible para reservar o rentar
    end note

    note right of Reserved
        quantityReserved
        Reservado en cotizaciones
        (no disponible para otros)
    end note

    note right of Rented
        quantityRented
        Actualmente con clientes
        (generando ingresos)
    end note

    note right of Lost
        Registrado en StockMovement
        pero ya no está en inventario
    end note
```

### Operaciones por Estado:

| Estado        | Operaciones Permitidas            |
| ------------- | --------------------------------- |
| **Available** | `RESERVE`, `RENT_OUT`, `ADJUST`   |
| **Reserved**  | `UNRESERVE`, `RENT_OUT`, `ADJUST` |
| **Rented**    | `RETURN`, `ADJUST`                |
| **Lost**      | Ninguna (registro histórico)      |

---

## 4. Ejemplo Práctico: Setup de Sucursal Norte

Guía paso a paso para configurar el inventario de una nueva sucursal:

```mermaid
graph LR
    subgraph "1️⃣ Setup Inicial"
        A[Crear BusinessUnit:<br/>Sucursal Norte]
    end

    subgraph "2️⃣ Crear Templates UNIT"
        B1[Template: Excavadora CAT 320<br/>managementType: UNIT]
        B2[Template: Grúa Móvil 50T<br/>managementType: UNIT]
    end

    subgraph "3️⃣ Crear Templates BULK"
        C1[Template: Andamio Tubular 2m<br/>managementType: BULK<br/>✅ Auto-crea StockLevel]
        C2[Template: Cono de Tráfico<br/>managementType: BULK<br/>✅ Auto-crea StockLevel]
        C3[Template: Cinta de Seguridad<br/>managementType: BULK<br/>✅ Auto-crea StockLevel]
    end

    subgraph "4️⃣ Agregar Assets UNIT"
        D1[Asset: EXC-001<br/>Serial: CAT320-2024-001]
        D2[Asset: EXC-002<br/>Serial: CAT320-2024-002]
        D3[Asset: GRU-001<br/>Serial: GMO50-2023-015]
    end

    subgraph "5️⃣ Agregar Stock BULK"
        E1[POST /stock-levels/add<br/>Andamio: +200 unidades]
        E2[POST /stock-levels/add<br/>Conos: +500 unidades]
        E3[POST /stock-levels/add<br/>Cintas: +1000 metros]
    end

    subgraph "6️⃣ Estado Final"
        F1[StockLevel Andamio:<br/>Available: 200<br/>Reserved: 0<br/>Rented: 0]
        F2[StockLevel Conos:<br/>Available: 500<br/>Reserved: 0<br/>Rented: 0]
        F3[StockLevel Cintas:<br/>Available: 1000<br/>Reserved: 0<br/>Rented: 0]
    end

    A --> B1
    A --> B2
    A --> C1
    A --> C2
    A --> C3

    B1 --> D1
    B1 --> D2
    B2 --> D3

    C1 --> E1
    C2 --> E2
    C3 --> E3

    E1 --> F1
    E2 --> F2
    E3 --> F3

    style A fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    style B1 fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style B2 fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style C1 fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style C2 fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style C3 fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style F1 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    style F2 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    style F3 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
```

---

## 5. API Endpoints Disponibles

### Stock Management (11 endpoints)

| Método | Endpoint                              | Descripción                              |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/stock-levels/stats`                 | Estadísticas generales por business unit |
| GET    | `/stock-levels`                       | Listar todos los stock levels            |
| GET    | `/stock-levels/:templateId`           | Ver stock de un template específico      |
| PATCH  | `/stock-levels/:templateId`           | Actualizar precios y límites de alerta   |
| GET    | `/stock-levels/:templateId/movements` | Historial de movimientos de stock        |
| POST   | `/stock-levels/add`                   | Agregar stock (compra/ingreso)           |
| POST   | `/stock-levels/reserve`               | Reservar stock para cotización           |
| POST   | `/stock-levels/unreserve`             | Cancelar reserva de stock                |
| POST   | `/stock-levels/rent`                  | Rentar stock (contrato firmado)          |
| POST   | `/stock-levels/return`                | Devolver stock rentado                   |
| POST   | `/stock-levels/adjust`                | Ajustar por pérdidas/daños               |

### Ejemplos de Request Body

#### Agregar Stock

```json
{
  "templateId": "abc123",
  "quantity": 100,
  "unitCost": 25.5,
  "location": "Bodega A",
  "notes": "Compra inicial de andamios"
}
```

#### Reservar Stock

```json
{
  "templateId": "abc123",
  "quantity": 30,
  "referenceId": "quotation-456",
  "referenceType": "Quotation",
  "notes": "Reservado para cotización #456"
}
```

#### Rentar Stock

```json
{
  "templateId": "abc123",
  "quantity": 30,
  "fromReserved": true,
  "referenceId": "contract-789",
  "referenceType": "RentalContract",
  "notes": "Contrato firmado #789"
}
```

---

## 6. Modelo de Datos

### StockLevel

```typescript
{
  id: string
  assetTemplateId: string
  businessUnitId: string
  location?: string
  quantityAvailable: number    // Disponible para rentar
  quantityReserved: number     // Reservado en cotizaciones
  quantityRented: number       // Actualmente rentado
  minStock?: number            // Alerta de stock bajo
  maxStock?: number            // Límite máximo
  unitCost?: Decimal           // Costo por unidad
  pricePerDay?: Decimal        // Precio de renta diario
  pricePerWeek?: Decimal       // Precio de renta semanal
  pricePerMonth?: Decimal      // Precio de renta mensual
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### StockMovement (Audit Trail)

```typescript
{
  id: string
  stockLevelId: string
  movementType: StockMovementType  // ADD | RESERVE | UNRESERVE | RENT_OUT | RETURN | ADJUST
  quantity: number
  quantityBefore: number
  quantityAfter: number
  referenceId?: string             // ID de quotation o contract
  referenceType?: string           // "Quotation" | "RentalContract"
  performedBy: string              // userId
  notes?: string
  createdAt: DateTime
}
```

---

## 7. Validaciones y Reglas de Negocio

### ✅ Validaciones Automáticas

1. **Template debe ser BULK**: Todas las operaciones validan que `managementType === BULK`
2. **Stock suficiente**: No permite reservar/rentar más de lo disponible
3. **Transacciones atómicas**: Todos los movimientos usan transacciones de BD
4. **Audit trail completo**: Todo movimiento queda registrado en `StockMovement`
5. **Alertas de stock bajo**: Sistema detecta cuando `quantityAvailable <= minStock`

### ⚠️ Restricciones

- No se puede cambiar `managementType` de un template si ya tiene stock o assets
- No se puede eliminar un template BULK si tiene stock > 0
- Los ajustes de tipo `ADJUST` con cantidad negativa reducen stock sin posibilidad de reversa
- Las reservas expiran automáticamente (pendiente implementación de sistema de expiración)

---

## 8. Comparación UNIT vs BULK

| Aspecto              | UNIT                           | BULK                                 |
| -------------------- | ------------------------------ | ------------------------------------ |
| **Propósito**        | Equipos de alto valor          | Materiales consumibles/fungibles     |
| **Ejemplos**         | Excavadoras, grúas, camiones   | Andamios, conos, cintas, EPP         |
| **Modelo BD**        | 1 row en `Asset` por unidad    | 1 row en `StockLevel` por template   |
| **Identificación**   | Serial number único            | Cantidad agregada                    |
| **Trackeo**          | Individual (status, ubicación) | Agregado (available/reserved/rented) |
| **Mantenimiento**    | Preventivo programado          | No aplica                            |
| **Documentación**    | Ficha técnica, manual          | No requerida                         |
| **Cálculo de renta** | Por unidad específica          | Por cantidad solicitada              |

---

## 9. Próximos Pasos (Roadmap)

### Frontend (Pendiente)

- [ ] Selector de `managementType` en formulario de Asset Templates
- [ ] UI de gestión de stock BULK
- [ ] Dashboard de inventario con alertas
- [ ] Widget de stock disponible en pantalla de cotizaciones

### Integraciones (Pendiente)

- [ ] Módulo de Quotations: Reservar BULK items
- [ ] Módulo de Rental Contracts: Rentar/devolver BULK items
- [ ] Sistema de expiración automática de reservas
- [ ] Notificaciones de stock bajo

### Reportes (Pendiente)

- [ ] Reporte de movimientos de stock por período
- [ ] Análisis de rotación de inventario
- [ ] Proyección de necesidades de stock
- [ ] Valoración de inventario (unitCost × quantities)

---

## Referencias

- **Schema**: [backend/prisma/schema.prisma](../backend/prisma/schema.prisma)
- **Service**: [backend/src/modules/assets/services/stock-level.service.ts](../backend/src/modules/assets/services/stock-level.service.ts)
- **Controller**: [backend/src/modules/assets/controllers/stock-level.controller.ts](../backend/src/modules/assets/controllers/stock-level.controller.ts)
- **Migration**: `migrations/20260214142421_add_bulk_inventory_management/`

---

**Última actualización:** 14 de Febrero, 2026  
**Autor:** Mercedes (con asistencia de GitHub Copilot)
