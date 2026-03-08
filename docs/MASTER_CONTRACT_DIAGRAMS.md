# 🔄 DIAGRAMAS DE FLUJO - CONTRATOS MARCO

**Documento de referencia**: [MASTER_CONTRACT_ARCHITECTURE.md](./MASTER_CONTRACT_ARCHITECTURE.md)

---

## 📊 FLUJO COMPLETO: DESDE COTIZACIÓN HASTA DEVOLUCIÓN

```mermaid
graph TD
    A[Cliente solicita cotización] --> B[Crear Cotización QU-2026-001]
    B --> C{Cliente aprueba?}
    C -->|No| D[Rechazada/Modificada]
    C -->|Sí| E[Cotización APPROVED]

    E --> F[Crear Contrato Marco CON-2026-001]
    F --> G[Generar PDF sin items específicos]
    G --> H[Enviar para firma digital SignNow]

    H --> I{Firma completada?}
    I -->|No| J[Recordatorio/Vencimiento]
    I -->|Sí| K[Contrato ACTIVO]

    K --> L{Cliente tiene saldo?}
    L -->|No| M[Debe acreditar fondos]
    M --> N[POST /account/reload]
    N --> O[ClientAccount balance actualizado]

    L -->|Sí| O

    O --> P[Cliente solicita retiro de implementos]
    P --> Q[POST /deliveries/check-availability]

    Q --> R{Saldo suficiente?}
    R -->|No| S{Límite disponible?}
    S -->|No| T[POST /limit-change-requests]
    T --> U[Owner revisa solicitud]
    U --> V{Aprobada?}
    V -->|No| W[Rechazada - Debe recargar]
    V -->|Sí| X[Límites actualizados]
    X --> Y[POST /contracts/:id/addendums]

    R -->|Sí| Y
    S -->|Sí| T

    Y --> Z[Crear Addendum ADD-001]
    Z --> AA[Generar PDF del addendum]
    AA --> AB{Asset requiere operador?}
    AB -->|Sí| AC[Generar anexo de seguridad]
    AC --> AD[Generar anexo de viáticos]
    AD --> AE[Email con anexos al cliente]
    AB -->|No| AE

    AE --> AF[Descuento en ClientAccount]
    AF --> AG[AssetRental creado - Status: active]
    AG --> AH[Activo entregado al cliente]

    AH --> AI[... Cliente usa el implemento ...]

    AI --> AJ[Cliente devuelve implemento]
    AJ --> AK[PUT /addendums/:id/complete]
    AK --> AL[AssetRental status: completed]
    AL --> AM[Calcular cobro real]
    AM --> AN[Actualizar balance si hay ajustes]
    AN --> AO[Addendum completado]

    AO --> AP{Más entregas pendientes?}
    AP -->|Sí| P
    AP -->|No| AQ[Contrato finalizado]
```

---

## 🏦 FLUJO: VERIFICACIÓN DE SALDO Y LÍMITES

```mermaid
graph TD
    A[Usuario Entregas: Cliente quiere retirar implementos] --> B[Calcular costo estimado]
    B --> C[estimatedCost = Σ dailyRate × estimatedDays]

    C --> D[Obtener ClientAccount]
    D --> E{balance >= estimatedCost?}

    E -->|No| F{¿Puede ampliar límite?}
    F -->|creditLimit > balance + estimatedCost| G[Opción: Solicitar ampliación]
    F -->|Ya está en el límite| H[Solo opción: Recargar saldo]

    E -->|Sí| I{activeDays + estimatedDays <= timeLimit?}

    I -->|No| J{¿Puede ampliar tiempo?}
    J -->|timeLimit puede aumentarse| K[Opción: Solicitar ampliación]
    J -->|Ya está en límite máximo| L[Solo opción: Esperar devoluciones]

    I -->|Sí| M[✅ PUEDE ENTREGAR]

    G --> N[POST /limit-change-requests]
    K --> N

    N --> O[LimitChangeRequest creado]
    O --> P[Notificación a Owner/Admin]

    P --> Q{Owner revisa}
    Q -->|Aprueba| R[Límites actualizados]
    Q -->|Rechaza| S[Notificar rechazo]

    R --> M
    S --> H

    H --> T[Cliente recarga saldo]
    T --> M

    L --> U[Cliente devuelve otros implementos]
    U --> M

    M --> V[Crear Addendum y entregar]
```

---

## 💬 FLUJO: SOLICITUD DE AMPLIACIÓN DE LÍMITES

```mermaid
sequenceDiagram
    participant UE as Usuario Entregas
    participant API as Backend API
    participant DB as Database
    participant Chat as Chat/Notificaciones
    participant Owner as Owner/Admin

    UE->>API: POST /limit-change-requests
    Note over UE,API: clientAccountId, requestedLimits, reason

    API->>DB: Crear LimitChangeRequest (status: pending)
    API->>DB: Obtener datos del cliente

    API->>Chat: Notificar a Owner/Admin
    Note over Chat: 🔔 Solicitud de ampliación pendiente

    Chat->>Owner: Mostrar notificación
    Owner->>Chat: Abrir modal de solicitud

    Chat->>API: GET /limit-change-requests/:id
    API->>Owner: Datos completos del request

    Note over Owner: Revisa historial del cliente

    Owner->>API: POST /limit-change-requests/:id/review
    Note over Owner,API: action: "approve", approvedLimits

    API->>DB: Actualizar LimitChangeRequest (status: approved)
    API->>DB: Actualizar ClientAccount con nuevos límites

    API->>Chat: Notificar a Usuario Entregas
    Note over Chat: ✅ Solicitud aprobada

    Chat->>UE: Mostrar notificación
    UE->>UE: Proceder con entrega de implementos
```

---

## 📄 FLUJO: CREACIÓN DE ADDENDUM CON ANEXOS

```mermaid
graph TD
    A[Usuario crea Addendum] --> B[POST /contracts/:id/addendums]
    B --> C[Verificar saldo y límites]

    C --> D{Saldo OK?}
    D -->|No| E[Error: Saldo insuficiente]
    D -->|Sí| F[Crear ContractAddendum]

    F --> G[Generar código ADD-001]
    G --> H[Crear AssetRental para cada item]
    H --> I[Crear RentalAccountMovement débito]

    I --> J[Actualizar ClientAccount.balance]
    J --> K[Actualizar ClientAccount.activeDays]
    K --> L[Actualizar RentalContract totals]

    L --> M[Generar PDF del Addendum]
    M --> N{¿Algún asset tiene requiresOperator = true?}

    N -->|No| O[Enviar email con Addendum]
    N -->|Sí| P[Obtener AssetTemplate]

    P --> Q{¿Template tiene safety_instructions?}
    Q -->|Sí| R[Generar PDF de seguridad]
    R --> S[Crear ContractAttachment type: operator_safety]

    Q -->|No| T[Usar template genérico de seguridad]
    T --> S

    S --> U{¿Hay detalles de viáticos?}
    U -->|Sí| V[Generar PDF de viáticos]
    V --> W[Crear ContractAttachment type: operator_viaticum]

    U -->|No| X[Usar términos estándar]
    X --> W

    W --> Y[Enviar email con Addendum + Anexos]
    Y --> Z[Notificar al equipo]
    Z --> AA[✅ Entrega completada]
```

---

## 🔄 FLUJO: DEVOLUCIÓN DE IMPLEMENTOS

```mermaid
graph TD
    A[Cliente devuelve implemento] --> B[Usuario marca devolución]
    B --> C[PUT /addendums/:id/complete]

    C --> D[Obtener AssetRental del addendum]
    D --> E{¿Activo está en condiciones OK?}

    E -->|No| F[Inspección: Registrar daños]
    F --> G[Calcular cargo por daños]
    G --> H[Crear RentalAccountMovement extra]

    E -->|Sí| I[Calcular días reales usados]

    H --> I

    I --> J{Días reales = Días estimados?}
    J -->|Sí| K[Cobro = estimatedCost]
    J -->|No más| L[Días reales < estimados]
    J -->|No menos| M[Días reales > estimados]

    L --> N[Calcular diferencia]
    N --> O[Crear RentalAccountMovement crédito devolución]
    O --> P[Actualizar ClientAccount.balance +]

    M --> Q[Calcular cobro adicional]
    Q --> R[Crear RentalAccountMovement cargo extra]
    R --> S[Actualizar ClientAccount.balance -]

    K --> T[Sin ajustes]
    P --> T
    S --> T

    T --> U[Actualizar ContractAddendum status: completed]
    U --> V[Actualizar AssetRental returnedAt]
    V --> W[Actualizar ClientAccount.activeDays -]

    W --> X[Generar reporte de devolución PDF]
    X --> Y[Enviar email al cliente]
    Y --> Z[✅ Devolución procesada]
```

---

## 🎯 ESTADOS DE ENTIDADES

### ClientAccount

```mermaid
stateDiagram-v2
    [*] --> Active: Cliente creado
    Active --> LowBalance: balance < alertAmount
    LowBalance --> Active: Recarga saldo
    Active --> OverLimit: Excede límites
    OverLimit --> Active: Devuelve/Aprueba ampliación
    Active --> Suspended: Falta de pago
    Suspended --> Active: Pago regularizado
    Active --> [*]: Cliente inactivo
```

### RentalContract

```mermaid
stateDiagram-v2
    [*] --> Draft: Creado desde cotización
    Draft --> PendingSignature: PDF generado
    PendingSignature --> Active: Firma completada
    PendingSignature --> Expired: Vencido sin firmar
    Active --> Suspended: Problemas de pago
    Suspended --> Active: Pago regularizado
    Active --> Completed: Todos los addendums cerrados
    Active --> Cancelled: Terminación anticipada
    Completed --> [*]
    Cancelled --> [*]
    Expired --> [*]
```

### ContractAddendum

```mermaid
stateDiagram-v2
    [*] --> Active: Implementos entregados
    Active --> PartialReturn: Algunos devueltos
    PartialReturn --> Active: Aún hay activos activos
    PartialReturn --> Completed: Todos devueltos
    Active --> Completed: Todos devueltos
    Active --> Cancelled: Addendum cancelado
    Completed --> [*]
    Cancelled --> [*]
```

### LimitChangeRequest

```mermaid
stateDiagram-v2
    [*] --> Pending: Solicitud creada
    Pending --> UnderReview: Owner está revisando
    UnderReview --> Approved: Owner aprueba
    UnderReview --> Rejected: Owner rechaza
    Pending --> Cancelled: Solicitante cancela
    Approved --> [*]
    Rejected --> [*]
    Cancelled --> [*]
```

---

## 🔐 PERMISOS Y ROLES

```mermaid
graph TD
    A[Usuario del Sistema] --> B{¿Qué rol tiene?}

    B -->|Usuario Entregas| C[Permisos Básicos]
    C --> C1[accounts:view]
    C --> C2[deliveries:check-balance]
    C --> C3[deliveries:request-limit-increase]
    C --> C4[contracts:create-addendum]
    C --> C5[contracts:view-attachments]

    B -->|Owner/Admin| D[Permisos Avanzados]
    D --> D1[accounts:update]
    D --> D2[limit-requests:review]
    D --> D3[contracts:*]
    D --> D4[accounts:*]

    B -->|Admin Financiero| E[Permisos Financieros]
    E --> E1[accounts:view]
    E --> E2[accounts:reload]
    E --> E3[limit-requests:review]
    E --> E4[reports:financial]

    C1 --> F[Puede ver saldos]
    C2 --> G[Puede verificar disponibilidad]
    C3 --> H[Puede solicitar ampliaciones]
    C4 --> I[Puede crear entregas]

    D1 --> J[Puede modificar límites]
    D2 --> K[Puede aprobar/rechazar solicitudes]
```

---

## 📊 RELACIONES DE DATOS

```mermaid
erDiagram
    Client ||--o| ClientAccount : "tiene una"
    ClientAccount ||--o{ RentalContract : "tiene múltiples"
    RentalContract ||--o{ ContractAddendum : "genera múltiples"
    RentalContract ||--o{ ContractAttachment : "tiene anexos"
    ContractAddendum ||--o{ AssetRental : "contiene"
    ContractAddendum ||--o{ RentalAccountMovement : "genera movimientos"
    ClientAccount ||--o{ LimitChangeRequest : "puede solicitar"
    ClientAccount ||--o{ RentalAccountMovement : "registra en"

    ClientAccount {
        Decimal balance
        Decimal creditLimit
        Int timeLimit
        Int activeDays
        Boolean limitsOverridden
    }

    RentalContract {
        String contractType
        Decimal agreedAmount
        Int agreedPeriod
        Decimal totalConsumed
        Int totalActiveDays
    }

    ContractAddendum {
        String code
        Json items
        Decimal estimatedCost
        Decimal actualCost
        String status
    }

    LimitChangeRequest {
        Decimal requestedCreditLimit
        Int requestedTimeLimit
        String status
        String urgency
    }

    ContractAttachment {
        String attachmentType
        String fileUrl
        Boolean visibleToClient
    }
```

---

## 🎨 UI: PANTALLAS PRINCIPALES

### 1. Dashboard del Cliente

```
┌────────────────────────────────────────────────────────┐
│  CUENTA CORRIENTE - XYZ Construcciones                 │
├────────────────────────────────────────────────────────┤
│                                                         │
│  💰 Saldo Actual:        $3,000,000 COP                │
│  📊 Límite de Crédito:   $10,000,000 COP               │
│  ⏱️  Días Activos:        10 / 60 días                 │
│                                                         │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 30% usado     │
│                                                         │
│  [Recargar Saldo] [Ver Historial] [Ver Contratos]      │
│                                                         │
├────────────────────────────────────────────────────────┤
│  CONTRATOS ACTIVOS                                      │
├────────────────────────────────────────────────────────┤
│  📄 CON-2026-001  |  Activo  |  $2,000,000 consumido   │
│     • 1 Addendum activo (Excavadora)                    │
│     [Ver] [Crear Addendum]                              │
├────────────────────────────────────────────────────────┤
│  ÚLTIMOS MOVIMIENTOS                                    │
├────────────────────────────────────────────────────────┤
│  08/03  Addendum ADD-001      -$2,000,000              │
│  07/03  Recarga inicial       +$5,000,000              │
└────────────────────────────────────────────────────────┘
```

### 2. Verificación de Entrega

```
┌────────────────────────────────────────────────────────┐
│  VERIFICAR DISPONIBILIDAD PARA ENTREGA                 │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Cliente: XYZ Construcciones (#12345)                  │
│                                                         │
│  Implementos a entregar:                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ☑ Excavadora CAT 320D                           │  │
│  │   Días: [10] @ $200,000/día = $2,000,000        │  │
│  │                                                  │  │
│  │ ☑ Retroexcavadora                               │  │
│  │   Días: [5] @ $150,000/día = $750,000           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  TOTAL ESTIMADO: $2,750,000                            │
│  DÍAS TOTALES: 15 días                                 │
│                                                         │
│  ✅ SALDO DISPONIBLE                                   │
│     Saldo actual:    $3,000,000                        │
│     Después entrega: $250,000                          │
│                                                         │
│  ✅ TIEMPO DISPONIBLE                                   │
│     Días activos:    10 / 60                           │
│     Después entrega: 25 / 60                           │
│                                                         │
│  [Crear Addendum] [Cancelar]                           │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 3. Solicitud de Ampliación

```
┌────────────────────────────────────────────────────────┐
│  SOLICITAR AMPLIACIÓN DE LÍMITES                       │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Cliente: XYZ Construcciones (#12345)                  │
│  [Ver Historial] [Ver Contratos]                       │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ LÍMITES ACTUALES                              │    │
│  │                                                │    │
│  │ Límite de Dinero:  $10,000,000 COP           │    │
│  │ Límite de Tiempo:  60 días                    │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ LÍMITES SOLICITADOS                           │    │
│  │                                                │    │
│  │ Nuevo límite dinero: [$15,000,000]           │    │
│  │ Nuevo límite tiempo: [90] días                │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  Motivo de la solicitud:                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ Proyecto ampliado. Cliente requiere más      │    │
│  │ equipos para segunda fase de construcción.    │    │
│  │ Buen historial de pagos.                      │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  Urgencia: ⚫ Baja  ⚫ Normal  🔵 Alta  ⚫ Urgente       │
│                                                         │
│  [Enviar Solicitud] [Cancelar]                         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 4. Panel de Aprobación (Owner)

```
┌────────────────────────────────────────────────────────┐
│  🔔 SOLICITUD DE AMPLIACIÓN PENDIENTE                  │
│  [🚨 URGENCIA ALTA]          Solicitado: 08/03 10:30am │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Cliente: XYZ Construcciones (#12345)                  │
│  [Ver Perfil] [Ver Historial] [Ver Contratos]          │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ COMPARACIÓN DE LÍMITES                         │    │
│  ├───────────────────┬──────────────┬─────────────┤    │
│  │                   │   ACTUAL     │  SOLICITADO │    │
│  ├───────────────────┼──────────────┼─────────────┤    │
│  │ Límite Dinero     │ $10,000,000  │ $15,000,000 │    │
│  │ Límite Tiempo     │   60 días    │   90 días   │    │
│  └───────────────────┴──────────────┴─────────────┘    │
│                                                         │
│  Motivo:                                               │
│  "Proyecto ampliado. Cliente requiere más equipos..."  │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ APROBAR SOLICITUD                              │    │
│  │                                                │    │
│  │ Nuevo límite dinero: [$15,000,000]           │    │
│  │ Nuevo límite tiempo: [90] días                │    │
│  │                                                │    │
│  │ Notas de revisión:                             │    │
│  │ [Cliente confiable, buen historial...]        │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  [✅ Aprobar] [❌ Rechazar] [Cancelar]                  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

**Última actualización**: 8 de marzo de 2026  
**Documento relacionado**: [MASTER_CONTRACT_IMPLEMENTATION_PLAN.md](./MASTER_CONTRACT_IMPLEMENTATION_PLAN.md)
