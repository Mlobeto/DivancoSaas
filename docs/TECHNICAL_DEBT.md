# 📋 Technical Debt - DivancoSaaS

**Last Updated**: 2026-02-11

Este documento registra decisiones técnicas pospuestas, features pendientes y mejoras arquitectónicas identificadas durante el desarrollo.

---

## ✅ Recently Completed (Febrero 2026)

### Sistema de Cotizaciones y Contratos - COMPLETADO

**Completed**: 2026-02-11  
**Components**:

- [x] Contrato `DigitalSignatureProvider` en core
- [x] Adapter SignNow con verificación de webhooks
- [x] DigitalSignatureResolver para proveedores intercambiables
- [x] Sistema de plantillas genérico (Handlebars + Puppeteer)
- [x] Template service en shared/ (reutilizable cross-módulos)
- [x] Modelos Prisma: Template, Quotation, QuotationItem, QuotationContract
- [x] QuotationService con generación de PDF
- [x] Firma digital y webhooks
- [x] Procesamiento de pagos
- [x] Creación automática de RentalContract desde Quotation (solo si tiene assetId)
- [x] Detección inteligente de rubros (rental vs otros)
- [x] Guard Rail compliant (campos específicos opcionales, metadata flexible)

**Context**: Sistema completo para cotizar, firmar digitalmente y convertir en contratos. Arquitectura reutilizable para múltiples rubros (maquinaria, arquitectura, servicios, productos).

**Documentation**: Ver `QUOTATIONS_SIGNATURES_CONTRACTS.md` e `IMPLEMENTATION_GUIDE_QUOTATIONS.md`

---

### Sistema de Documentación con Vencimientos - COMPLETADO

**Completed**: 2026-02-11  
**Components**:

- [x] Modelo `AssetDocumentType` (configurable por BusinessUnit)
- [x] Extensión de `AssetAttachment` con campos de vencimiento
- [x] Enum `AttachmentStatus` (ACTIVE, EXPIRING, EXPIRED, ARCHIVED)
- [x] Sistema de alertas configurable por tipo de documento
- [x] Guard Rail compliant (tipos definidos por usuario, no hardcodeados)

**Context**: Cada BU puede definir sus propios tipos de documentos (SOAT, Revisión Técnica, Certificados, etc.) con vencimientos y alertas personalizadas. Reutilizable para múltiples industrias.

**Pending Integration**: Sistema de alertas automáticas (cron job) y notificaciones

---

## 🔴 High Priority (Antes de lanzamiento)

### 1. PLATFORM_OWNER Role & Business Management

**Status**: Not started  
**Pending**:

- [ ] Agregar `PLATFORM_OWNER` al enum `UserRole` en Prisma
- [ ] Dashboard de administración del negocio SaaS
- [ ] Gestión manual de suscripciones (antes de pagos automáticos)
  - Crear suscripción para tenant
  - Cambiar plan (free → pro → enterprise)
  - Suspender/reactivar tenant por falta de pago
  - Ver historial de pagos manual
- [ ] Métricas de negocio (KPIs):
  - MRR (Monthly Recurring Revenue)
  - Tenants activos/suspendidos/cancelados
  - Tasa de churn
  - Crecimiento mensual
  - Revenue por tenant
- [ ] Proceso de aprobación de nuevos tenants (opcional)
- [ ] Gestión de precios y planes desde UI

**Context**:

**Diferencia de roles crítica**:

- `SUPER_ADMIN` (desarrolladora): Debugging técnico, logs, mantenimiento del sistema
- `PLATFORM_OWNER` (dueño del negocio): Gestión comercial, suscripciones, métricas de negocio
- `TENANT_ADMIN` (cliente): Administra solo su tenant, paga suscripción

Actualmente los tenants se auto-registran vía `/auth/register` sin control comercial. Necesitamos que PLATFORM_OWNER pueda:

1. Ver todos los tenants y su estado de suscripción
2. Gestionar manualmente las suscripciones (hasta implementar pagos automáticos)
3. Suspender tenants por falta de pago
4. Ver métricas del negocio para tomar decisiones

**Effort**: 3-4 días para MVP (dashboard básico + gestión manual)  
**Dependencies**:

- SUPER_ADMIN ya implementado (puede servir de base)
- Frontend dashboard (React)
- Protección de rutas por role

**Priority Justification**: Sin esto, no se puede operar el negocio SaaS cuando lleguen clientes reales.

---

### 2. Módulo de Maquinaria - Completar Gestión de Activos

**Status**: Schema implementado, Frontend y Backend parcial  
**Pending**:

#### Backend:

- [ ] Campo `imageUrl` en modelo Asset (foto principal/portada)
- [ ] Campos en AssetUsage para métricas flexibles:
  - `kmUsed` (para vehículos)
  - `metricType` y `metricValue` (genérico: HOURS, KM, CYCLES)
  - `evidenceUrls` (JSON array de fotos de horómetro/odómetro)
  - `createdAtDevice` y `syncedAt` (para sincronización offline mobile)
- [ ] API endpoints para AssetDocumentType (CRUD)
- [ ] API endpoints para Asset attachments (upload con Azure Blob)
- [ ] Sistema de alertas automáticas para documentos por vencer (cron job)
- [ ] Notificaciones de vencimiento vía email/WhatsApp (motor de intenciones)
- [ ] Endpoints para AssetUsage (reportes desde móvil)

#### Frontend:

- [ ] Página de creación/edición de Activos con:
  - Upload de imagen principal (Azure Blob)
  - Modal de configuración de mantenimiento preventivo (si template lo requiere)
  - Modal de carga de documentación con vencimientos
  - Formulario de customFields dinámico según template
- [ ] Página de gestión de tipos de documentos por BU
- [ ] Vista de alertas de documentos próximos a vencer
- [ ] Integración con AssetTemplatesPage (ya existe)
- [ ] Pantalla de creación de cotizaciones con selección de activos

#### Mobile (Offline-First):

- [ ] App React Native con Expo
- [ ] Sincronización offline de AssetUsage
- [ ] Camera para capturar evidencia (horómetro, kilometraje)
- [ ] Cola local de eventos pendientes de sincronización
- [ ] Resolución de conflictos por timestamp

**Context**:

- Cliente necesita gestionar activos (maquinaria pesada, vehículos, herramientas)
- Cada activo puede requerir mantenimiento preventivo con insumos configurables
- Documentación con vencimientos (SOAT, revisión técnica, certificados)
- Operarios en campo reportan uso diario/semanal/mensual desde app móvil sin conexión

**Effort**:

- Backend: 3-4 días
- Frontend: 4-5 días
- Mobile: 1-2 semanas

**Dependencies**:

- Azure Blob Storage configurado ✅
- Template system implementado ✅
- Motor de intenciones para notificaciones (parcial)

**Priority Justification**: Feature core del negocio del cliente. Sin esto no pueden alquilar maquinaria ni hacer seguimiento operativo.

---

### 3. Maintenance Mode System

**Status**: Arquitectura básica implementada (SystemAnnouncement tabla)  
**Pending**:

- [ ] Sistema de notificaciones automáticas vía email a todos los tenants
- [ ] Banner dinámico en UI que muestre anuncios activos
- [ ] API read-only mode durante mantenimiento (bloquear POST/PUT/DELETE)
- [ ] Scheduled maintenance windows con countdown
- [ ] Webhook para notificar external systems

**Context**: Necesario para actualizaciones sin afectar a todos los tenants simultáneamente.

**Effort**: 2-3 días  
**Dependencies**: Email system, Frontend banner component

---

### 3. Zero-Downtime Deployment Strategy

**Status**: Not started  
**Pending**:

- [ ] Blue-green deployment setup en Railway/Azure
- [ ] Database migration strategy (online migrations)
- [ ] Health check endpoints mejorados
- [ ] Graceful shutdown de conexiones activas
- [ ] Connection pooling optimizado

**Context**: Cuando hay tráfico real, no podemos tener downtime en deploys.

**Effort**: 3-4 días  
**Dependencies**: Infrastructure, CI/CD pipeline

---

### 4. Audit Log System (Cross-Tenant)

**Status**: Not started  
**Pending**:

- [ ] Tabla `AuditLog` con eventos críticos
- [ ] Middleware para auto-logging de operaciones sensibles
- [ ] SUPER_ADMIN dashboard para ver audit logs
- [ ] Retention policy (GDPR compliance)
- [ ] Export de logs en formato JSON/CSV

**Context**: Para debugging, compliance y seguridad.

**Effort**: 2 días  
**Dependencies**: SUPER_ADMIN role (implementado)

---

## 🟡 Medium Priority (Post-MVP)

### 4. Rate Limiting & Throttling

**Status**: Not started  
**Pending**:

- [ ] Rate limiting por tenant (prevenir abuso)
- [ ] Rate limiting por IP (seguridad)
- [ ] Throttling de background jobs
- [ ] Queue system para operaciones pesadas
- [ ] Alertas cuando se exceden límites

**Context**: Protección contra abuso y garantizar fair usage.

**Effort**: 2-3 días  
**Dependencies**: Redis o similar para contadores distribuidos

---

### 5. Advanced Monitoring & Observability

**Status**: Basic logging con Pino implementado  
**Pending**:

- [ ] Integración con Datadog/New Relic/Sentry
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Business metrics dashboard
- [ ] Error tracking con stack traces
- [ ] Performance profiling

**Context**: Para debugging en producción y monitoreo proactivo.

**Effort**: 3 días  
**Dependencies**: Cuenta en servicio de monitoring

---

### 6. Multi-Region Deployment

**Status**: Not started  
**Pending**:

- [ ] Database replication cross-region
- [ ] CDN para static assets (Azure CDN configurado)
- [ ] GeoDNS routing
- [ ] Data residency compliance (GDPR, etc)
- [ ] Failover automático

**Context**: Latencia y compliance para clientes internacionales.

**Effort**: 1-2 semanas  
**Dependencies**: Infrastructure, presupuesto

---

### 7. File Storage Optimization

**Status**: Basic Azure Blob Storage implementado con multi-tenant structure  
**Pending**:

- [ ] Automatic image optimization (WebP, AVIF)
- [ ] Thumbnail generation pipeline
- [ ] CDN invalidation automática
- [ ] Storage lifecycle policies (archive old files)
- [ ] Duplicate file detection (hash-based)

**Context**: Reducir costos de storage y mejorar performance.

**Effort**: 2-3 días  
**Dependencies**: Azure Functions para processing

---

### 8. Email System Improvements

**Status**: Multi-provider implementado (SendGrid + Azure Communication)  
**Pending**:

- [ ] Email templates con template engine (Handlebars)
- [ ] Email queue con retry logic
- [ ] Bounce/complaint handling
- [ ] Email analytics (open rates, clicks)
- [ ] Unsubscribe management

**Context**: Mejorar deliverability y experiencia de usuario.

**Effort**: 3 días  
**Dependencies**: Bull/BullMQ para queues

---

### 9. WhatsApp Integration Completion

**Status**: Adapters creados, sin probar  
**Pending**:

- [ ] Webhook verification completado
- [ ] Template message testing
- [ ] Media message handling
- [ ] WhatsApp Business API approval process documentation
- [ ] Rate limiting específico para WhatsApp

**Context**: Feature crítica para clientes que usan WhatsApp.

**Effort**: 2 días  
**Dependencies**: WhatsApp Business account activo

---

### 10. Payment Gateway Testing

**Status**: Adapters creados (Stripe, MercadoPago, Wompi), sin probar  
**Pending**:

- [ ] Webhook signature verification implementado
- [ ] Testing con Stripe test mode
- [ ] Refund handling
- [ ] Dispute management
- [ ] Subscription billing (recurring payments)

**Context**: Feature crítica para monetización.

**Effort**: 3-4 días  
**Dependencies**: Cuentas en payment providers

---

## 🟢 Low Priority (Nice to Have)

### 11. GraphQL API (Alternativa a REST)

**Status**: Not started  
**Pending**:

- [ ] GraphQL schema generation desde Prisma
- [ ] Apollo Server setup
- [ ] DataLoader para N+1 queries
- [ ] GraphQL playground en desarrollo

**Context**: Mejor DX para frontend, especialmente mobile.

**Effort**: 1 semana  
**Dependencies**: None

---

### 12. WebSocket Real-Time Features

**Status**: Not started  
**Pending**:

- [ ] Socket.IO setup
- [ ] Real-time notifications
- [ ] Live chat entre usuarios
- [ ] Real-time dashboard updates

**Context**: Mejorar UX con updates en tiempo real.

**Effort**: 1 semana  
**Dependencies**: Redis para pub/sub en multi-server setup

---

### 13. Advanced Search (Full-Text)

**Status**: Basic Prisma queries  
**Pending**:

- [ ] Elasticsearch/Algolia integration
- [ ] Full-text search en proyectos, equipos, etc
- [ ] Fuzzy search
- [ ] Search analytics

**Context**: Mejorar UX cuando hay muchos datos.

**Effort**: 3-4 días  
**Dependencies**: Elasticsearch cluster o Algolia account

---

### 14. Multi-Language Support (i18n)

**Status**: Not started  
**Pending**:

- [ ] i18next setup en backend
- [ ] Database schema para contenido traducible
- [ ] Language detection automática
- [ ] Admin panel para traducciones

**Context**: Expansion internacional.

**Effort**: 1 semana  
**Dependencies**: Translation service (opcional)

---

### 15. Automated Testing Suite

**Status**: Jest configurado, pocos tests  
**Pending**:

- [ ] Unit tests para services críticos
- [ ] Integration tests para API endpoints
- [ ] E2E tests con Playwright
- [ ] Coverage mínimo del 70%
- [ ] CI/CD integration

**Context**: Calidad de código y confianza en deploys.

**Effort**: 2 semanas (ongoing)  
**Dependencies**: None

---

## 🔧 Refactoring Opportunities

### 16. Consolidar console.log/error restantes

**Status**: Parcialmente completado (storage, whatsapp migrados)  
**Pending**:

- [ ] Migrar payment adapters a logger
- [ ] Migrar email adapters a logger
- [ ] Migrar resolvers y factories
- [ ] Remover todos los console.\* del código

**Effort**: 1 hora  
**Dependencies**: None

---

### 17. TypeScript Strict Mode

**Status**: `strict: true` configurado, algunos `any` en código  
**Pending**:

- [ ] Eliminar todos los `any` explícitos
- [ ] Agregar tipos para Prisma relations complejas
- [ ] Validar schemas con Zod en todos los endpoints

**Effort**: 2-3 días  
**Dependencies**: None

---

### 18. Error Handling Standardization

**Status**: Básico implementado  
**Pending**:

- [ ] Error codes consistentes (ERR_AUTH_001, etc)
- [ ] Error response format estándar
- [ ] Custom error classes por dominio
- [ ] Error tracking con contexto completo

**Effort**: 1 día  
**Dependencies**: None

---

## 📊 Performance Optimizations

### 19. Database Query Optimization

**Status**: Not started  
**Pending**:

- [ ] Index analysis con EXPLAIN
- [ ] N+1 query detection
- [ ] Caching layer (Redis)
- [ ] Connection pooling tuning
- [ ] Read replicas para queries pesadas

**Effort**: 2-3 días  
**Dependencies**: Production-like data volume

---

### 20. Background Jobs System

**Status**: Not started  
**Pending**:

- [ ] Bull/BullMQ setup
- [ ] Job scheduling (cron-like)
- [ ] Job retry logic
- [ ] Job monitoring dashboard
- [ ] Priority queues

**Context**: Para operaciones pesadas (exports, reports, emails)

**Effort**: 2 días  
**Dependencies**: Redis

---

## 🔒 Security Enhancements

### 21. Advanced Security Features

**Status**: Basic auth implementado  
**Pending**:

- [ ] 2FA/MFA con TOTP
- [ ] Session management mejorado
- [ ] IP whitelisting para SUPER_ADMIN
- [ ] Security headers (Helmet.js)
- [ ] SQL injection prevention audit
- [ ] XSS prevention audit
- [ ] CSRF protection

**Effort**: 3-4 días  
**Dependencies**: None

---

### 22. GDPR Compliance Complete

**Status**: Partially compliant  
**Pending**:

- [ ] Data export API (derecho a portabilidad)
- [ ] Data deletion API (derecho al olvido)
- [ ] Cookie consent management
- [ ] Privacy policy generator
- [ ] Data processing agreements templates

**Effort**: 1 semana  
**Dependencies**: Legal review

---

## 📝 Documentation

### 23. API Documentation Improvements

**Status**: Swagger básico implementado  
**Pending**:

- [ ] Ejemplos completos en todos los endpoints
- [ ] Error responses documentados
- [ ] Authentication flows documentados
- [ ] Postman collection exportable
- [ ] SDK generation (TypeScript client)

**Effort**: 2 días  
**Dependencies**: None

---

### 24. Architectural Decision Records (ADRs)

**Status**: ADR.md creado, incompleto  
**Pending**:

- [ ] Documentar decisión de multi-tenant
- [ ] Documentar elección de Azure vs AWS
- [ ] Documentar pattern de adapters
- [ ] Documentar estrategia de testing

**Effort**: 1 día  
**Dependencies**: None

---

## 🎯 Decision Log

| Date       | Decision                                 | Rationale                                                    | Status     |
| ---------- | ---------------------------------------- | ------------------------------------------------------------ | ---------- |
| 2026-02-06 | Implementar SUPER_ADMIN role             | Debugging cross-tenant necesario                             | ✅ Done    |
| 2026-02-06 | Tabla SystemAnnouncement básica          | Comunicación con todos los tenants                           | ✅ Done    |
| 2026-02-06 | Identificar necesidad PLATFORM_OWNER     | Gestión comercial separada de role técnico                   | ⏳ Pending |
| 2026-02-06 | Posponer maintenance mode completo       | No es MVP blocker                                            | ⏳ Pending |
| 2026-02-06 | Azure sobre AWS                          | Cliente ya tiene Azure, menor learning curve                 | ✅ Done    |
| 2026-02-06 | Migrar console a logger                  | Producción requiere structured logging                       | 🔄 Partial |
| 2026-02-10 | Sistema de cotizaciones genérico         | Reutilizable para múltiples rubros, no hardcodear categorías | ✅ Done    |
| 2026-02-10 | Firma digital con adapters               | SignNow como primer provider, arquitectura extensible        | ✅ Done    |
| 2026-02-10 | Templates en shared/                     | Sistema de plantillas transversal, no acoplado a rental      | ✅ Done    |
| 2026-02-11 | QuotationContract → RentalContract       | Conexión automática según tipo de cotización                 | ✅ Done    |
| 2026-02-11 | AssetDocumentType configurable           | Tipos de docs definidos por usuario, guard rail compliant    | ✅ Done    |
| 2026-02-11 | AssetAttachment con vencimientos         | Extender modelo existente vs crear nuevo                     | ✅ Done    |
| 2026-02-11 | Posponer sincronización offline completa | MVP puede ser sin mobile, agregar después                    | ⏳ Pending |
| 2026-02-11 | imageUrl directo + attachments array     | Pragmático: foto principal accesible, múltiples en array     | ⏳ Pending |

---

## 📌 Notes

- Este documento debe actualizarse cada vez que se identifique deuda técnica
- Prioridades pueden cambiar según feedback de usuarios
- Esfuerzo estimado es para 1 desarrollador full-time
- Dependencies críticas están marcadas y deben resolverse primero

---

## 🎯 Roadmap Módulo de Maquinaria (Próximos Pasos)

### Fase 1: Completar Gestión de Activos (1 semana)

**Objetivo**: Poder crear y gestionar activos completos con documentación

1. ✅ **Schema Prisma** - Completado
   - AssetDocumentType
   - AssetAttachment extendido
   - AttachmentStatus enum

2. ⏳ **Migración de datos**
   - Agregar `imageUrl` a Asset
   - Agregar `kmUsed`, `evidenceUrls`, `metricType`, `metricValue` a AssetUsage
   - Agregar `createdAtDevice`, `syncedAt` a AssetUsage

3. 🔄 **Backend API**
   - [ ] CRUD AssetDocumentType
   - [ ] Upload de attachments con Azure Blob
   - [ ] AssetService completo (crear con imagen, docs, mantenimiento)
   - [ ] AssetUsageService (reportes de uso)

4. 🔄 **Frontend**
   - [ ] Modal de configuración de mantenimiento preventivo
   - [ ] Modal de carga de documentación
   - [ ] Formulario crear/editar Asset integrado
   - [ ] Vista de alertas de vencimientos

### Fase 2: Sistema de Alertas y Reportes (3-4 días)

1. [ ] Cron job para detectar documentos por vencer
2. [ ] Integración con motor de intenciones (SEND_EXPIRY_ALERT)
3. [ ] Notificaciones por email/WhatsApp
4. [ ] Dashboard de alertas para administradores

### Fase 3: Cotizaciones y Contratos de Alquiler (2-3 días)

1. [ ] Frontend para crear cotizaciones
2. [ ] Configurar plantilla de cotización vía UI
3. [ ] Configurar SignNow en BusinessUnit
4. [ ] Probar flujo completo: Cotización → Firma → Pago → Contrato → Activos marcados como "rented"

### Fase 4: App Móvil Offline-First (2-3 semanas)

1. [ ] Setup Expo + React Native
2. [ ] Autenticación
3. [ ] Lista de activos asignados al operario
4. [ ] Formulario de reporte de uso (horómetro/km)
5. [ ] Captura de fotos (evidencia)
6. [ ] Cola de sincronización offline
7. [ ] Sync al reconectar
8. [ ] Resolución de conflictos

---

**Contributors**: Mercedes (Backend Lead)  
**Review Frequency**: Semanal durante desarrollo activo
