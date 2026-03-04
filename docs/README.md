# 📚 Documentación Canónica - DivancoSaaS

Este archivo define qué documentos usar como **fuente de verdad** para desarrollo actual, con foco en guardrails multitenant y multi-negocio.

---

## ✅ Orden de lectura obligatorio (cambios funcionales)

1. [ARQUITECTURA.md](./ARQUITECTURA.md)  
   Documento maestro de principios no negociables.
2. [GUARD_RAILS.md](./GUARD_RAILS.md)  
   Reglas operativas concretas para implementación.
3. [MULTI_TENANT_REQUEST_CONTEXT.md](./MULTI_TENANT_REQUEST_CONTEXT.md)  
   Contexto técnico de aislamiento tenant/BU en runtime.
4. [RBAC_PERMISSIONS_SYSTEM.md](./RBAC_PERMISSIONS_SYSTEM.md)  
   Modelo dinámico de roles/permisos (sin hardcode).

---

## 🧱 Arquitectura vigente por capa

- Backend: [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)
- Frontend: [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
- Branding actual: [BRANDING_SYSTEM_V2.md](./BRANDING_SYSTEM_V2.md)

---

## ☁️ Integraciones Azure vigentes

- Blob Storage: [AZURE_BLOB_STORAGE_CONFIG.md](./AZURE_BLOB_STORAGE_CONFIG.md)
- Email ACS: [AZURE_EMAIL_SETUP_GUIDE.md](./AZURE_EMAIL_SETUP_GUIDE.md)
- Fix de logos en Blob privado: [AZURE_LOGO_STORAGE_FIX.md](./AZURE_LOGO_STORAGE_FIX.md)

---

## 🧪 Estado de pendientes/deprecados

- Auditoría actual: [PENDING_DEPRECATED_AUDIT.md](./PENDING_DEPRECATED_AUDIT.md)
- Backlog activo: [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)

---

## 🗂️ Documentos históricos (NO fuente primaria)

Estos archivos se conservan por trazabilidad en `docs/archive/` y pueden estar desactualizados:

- `archive/PROJECT_STATUS.md`
- `archive/EXECUTIVE_SUMMARY.md`
- `archive/FRONTEND_MODULAR_ARCHITECTURE_SUMMARY.md`
- `archive/DYNAMIC_ROUTER_MIGRATION.md`
- `archive/FRONTEND_MIGRATION_GUIDE.md`
- `archive/FRONTEND_MIGRATION_RISKS.md`
- `archive/PLATFORM_ARCHITECTURE_MIGRATION.md`
- `archive/PLATFORM_MIGRATION_RISKS.md`
- `archive/TEMPLATE_TO_BRANDING_MIGRATION.md`
- `archive/VALIDATION_CHECKLIST.md`
- `archive/VALIDATION_CHECKLIST_V3.md`

Si hay conflicto entre documentos: **ARQUITECTURA.md + GUARD_RAILS.md prevalecen siempre**.
