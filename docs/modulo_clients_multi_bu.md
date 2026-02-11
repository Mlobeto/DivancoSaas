# Módulo de Clientes: Modelo Global por Tenant y Asignación por Business Unit

## Objetivo

Permitir que un mismo cliente (persona o empresa) sea compartido entre varias Business Units dentro de un mismo tenant, manteniendo:

- Datos básicos y fiscales centralizados por tenant.
- Estado, tags y comportamiento comercial configurables por cada Business Unit.

Ejemplo típico:

- Tenant: **Divanco**.
- BU 1: **Alquiler de maquinaria**.
- BU 2: **Estudio de arquitectura**.
- El cliente "Constructora El Norte S.A." debe existir una sola vez en el tenant, pero con comportamiento distinto en cada BU.

---

## Modelo de Datos

### 1. `Client` (cliente global por tenant)

Representa a la persona/empresa dentro de un tenant.

Campos clave (resumen):

- `id`: UUID
- `tenantId`: referencia al tenant
- `name`: razón social o nombre principal
- `displayName`: alias o nombre corto
- `type`: `COMPANY` | `PERSON`
- `countryCode`: país (ISO 3166-1 alpha-2)
- `email`, `phone`
- Relaciones:
  - `tenant`
  - `contacts: ClientContact[]`
  - `taxProfiles: ClientTaxProfile[]`
  - `movements: ClientAccountMovement[]`
  - `riskSnapshots: ClientRiskSnapshot[]`
  - `businessUnits: ClientBusinessUnit[]`

Notas:

- Ya **no** tiene `businessUnitId` ni `status` ni `tags` propios.
- Es el "registro maestro" del cliente dentro del tenant.

### 2. `ClientBusinessUnit` (asignación por BU)

Representa cómo se comporta ese cliente en una Business Unit concreta.

Campos clave:

- `id`: UUID
- `tenantId`
- `businessUnitId`
- `clientId`
- `status`: `ACTIVE` | `INACTIVE` | `BLOCKED`
- `tags`: `Json` (ej: `["VIP", "Moroso"]`), segmentación por BU
- `createdAt`, `updatedAt`
- Relaciones:
  - `tenant: Tenant`
  - `businessUnit: BusinessUnit`
  - `client: Client`

Restricciones importantes:

- `@@unique([tenantId, businessUnitId, clientId])`: un cliente sólo puede tener **una** entrada por BU.

### 3. Otros modelos relacionados (sin cambios estructurales)

- `ClientAccountMovement` sigue siendo por tenant + BU + cliente:
  - `tenantId`, `businessUnitId`, `clientId`, `amount`, `direction`, `currency`, etc.
- `ClientRankingConfig` se mantiene por BU (`tenantId`, `businessUnitId`).
- `ClientRiskSnapshot` se mantiene por cliente (`clientId`).

---

## Flujo de Alta y Uso de Clientes

### Alta de cliente desde una Business Unit

1. El usuario está trabajando en una BU específica (por ejemplo, BU "Alquiler").
2. Envía un `POST /modules/clients/clients` con los datos básicos del cliente.
3. El backend crea:
   - Un registro en `Client` (si no existía este cliente en el tenant).
   - Un registro en `ClientBusinessUnit` para la BU actual, con:
     - `tenantId` del contexto.
     - `businessUnitId` del contexto.
     - `status` (por defecto `ACTIVE` si no se envía).
     - `tags` (por defecto `[]`).
4. Opcionalmente se crean:
   - Contactos (`ClientContact`).
   - Perfil fiscal principal (`ClientTaxProfile`).

Resultado:

- El cliente queda disponible para esa BU, con su propio estado y tags.

### Compartir cliente con otra Business Unit del mismo tenant

Supongamos que ya existe el cliente en la BU de Alquiler y ahora queremos usarlo en la BU de Estudio de arquitectura.

1. La segunda BU (Estudio) conoce el `clientId` global (por ejemplo, porque se busca por NIT o nombre vía un endpoint de búsqueda global futura).
2. Se crea una nueva fila en `ClientBusinessUnit` para (`tenantId`, `businessUnitId` = Estudio, `clientId`).
3. Se configuran `status` y `tags` específicos para esa BU.

Resultado:

- El mismo `Client` se comparte entre BUs, pero cada BU puede:
  - Tenerlo activo o inactivo.
  - Asignar tags distintos (ej. "VIP" en Alquiler, "Proyecto puntual" en Estudio).

### Lectura de clientes en el módulo

Cuando se listan clientes desde una BU:

- El servicio usa `ClientBusinessUnit` filtrando por:
  - `tenantId` del contexto.
  - `businessUnitId` del contexto.
- Incluye el `client` asociado para traer:
  - `name`, `displayName`, `countryCode`, `email`, `phone`, etc.
- Aplana la respuesta combinando:
  - Datos globales (`Client`).
  - Datos por BU (`status`, `tags`).

En la API y en el frontend se sigue viendo un objeto "cliente" único por fila del listado, pero internamente está construido a partir de estas dos tablas.

---

## Ejemplos de Uso

### Ejemplo 1: Cliente compartido entre Alquiler y Estudio

- Tenant: `divanco`.
- BU `ALQ`: "Divanco Alquiler".
- BU `EST`: "Divanco Estudio".
- Cliente global (`Client`):
  - `id = c1`
  - `tenantId = divanco`
  - `name = "Constructora El Norte S.A."`
  - `countryCode = "CO"`
  - `email = "contacto@elnorte.com"`

Asignaciones por BU (`ClientBusinessUnit`):

- Para BU ALQ:
  - `tenantId = divanco`
  - `businessUnitId = ALQ`
  - `clientId = c1`
  - `status = ACTIVE`
  - `tags = ["VIP", "ALQUILER"]`
- Para BU EST:
  - `tenantId = divanco`
  - `businessUnitId = EST`
  - `clientId = c1`
  - `status = ACTIVE`
  - `tags = ["PROYECTO_ARQ"]`

Cada módulo (Alquiler o Estudio) ve al mismo cliente global, pero con sus propias etiquetas y estado.

### Ejemplo 2: Cliente bloqueado sólo en una BU

- Mismo cliente `c1`.
- En BU ALQ se detectan múltiples facturas impagas.
- Se actualiza `ClientBusinessUnit` para ALQ:
  - `status = BLOCKED`
  - `tags = ["MOROSO", "NO_CREDITO"]`

En la BU EST el cliente puede seguir activo y trabajando normalmente, con sus propias reglas.

---

## Impacto en Otros Módulos

- **Alquiler de maquinaria / Estudio de arquitectura**:
  - Ambos se apoyan en el mismo `Client` global.
  - La toma de decisiones (ej.: permitir contrato sin anticipo) se apoya en:
    - Score y segmento (`ClientRiskSnapshot`).
    - Configuración de ranking y políticas por BU (`ClientRankingConfig`).
    - Estado y tags específicos de `ClientBusinessUnit`.

- **Reportes**:
  - A nivel tenant se puede ver:
    - Todos los clientes (`Client`).
    - En cuántas BUs está asignado cada uno (`ClientBusinessUnit`).
  - A nivel BU, los reportes se siguen apoyando en `ClientAccountMovement` y `ClientBusinessUnit`.

---

## Resumen

- `Client` = identidad global del cliente dentro del tenant.
- `ClientBusinessUnit` = cómo se ve y se comporta ese cliente en una BU concreta.
- Esto permite que un mismo cliente trabaje con varias unidades de negocio del tenant (ej. Alquiler y Estudio de arquitectura) sin duplicar datos maestros, pero manteniendo independencia en estado, tags y políticas por BU.
