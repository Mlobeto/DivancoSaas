# 🔎 Auditoría de Pendientes y Deprecados

**Fecha:** 2026-03-04  
**Objetivo:** identificar qué documentos son operativos, cuáles son históricos y dónde hay backlog real.

---

## Resultado por documento

### 1) `TENANT_HARDENING_QUICK_REFERENCE.md`

- **Estado:** ✅ Vigente (operativo)
- **Pendientes/deprecados detectados:** No críticos.
- **Notas:** Es guía práctica para desarrollo diario multi-tenant; mantener en `docs/`.

### 2) `TECHNICAL_DEBT.md`

- **Estado:** ✅ Vigente (backlog activo)
- **Pendientes/deprecados detectados:** muchos ítems `Not started`, `[ ]`, y `⏳`.
- **Notas:** Debe usarse como fuente de trabajo de deuda técnica; conviene actualizar fecha y prioridades semanalmente.

### 3) `TEMPLATE_TO_BRANDING_MIGRATION.md`

- **Estado:** 📦 Histórico (migración)
- **Pendientes/deprecados detectados:** menciona endpoint `@deprecated` y pasos de migración cerrada.
- **Acción aplicada:** movido a `docs/archive/`.

### 4) `VALIDATION_CHECKLIST.md`

- **Estado:** 📦 Histórico (validación de definición)
- **Pendientes/deprecados detectados:** checkboxes de decisión funcional, no guía operativa actual.
- **Acción aplicada:** movido a `docs/archive/`.

### 5) `VALIDATION_CHECKLIST_V3.md`

- **Estado:** 📦 Histórico (validación de modelo)
- **Pendientes/deprecados detectados:** checkboxes abiertos y preguntas de diseño, no operación actual.
- **Acción aplicada:** movido a `docs/archive/`.

---

## Reglas de uso (desde hoy)

1. **Implementación actual:** usar `ARQUITECTURA.md` + `GUARD_RAILS.md` + `docs/README.md`.
2. **Backlog:** usar `TECHNICAL_DEBT.md`.
3. **Histórico/migraciones:** consultar solo en `docs/archive/`.
