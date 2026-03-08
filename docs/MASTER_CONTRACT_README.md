# 📚 SISTEMA DE CONTRATOS MARCO - DOCUMENTACIÓN COMPLETA

---

## 🎯 RESUMEN

El sistema de contratos de DivancoSaaS está siendo rediseñado para implementar un modelo de **Contratos Marco** con las siguientes características clave:

✅ **Contrato Marco**: Acuerdo general sin items específicos  
✅ **Cuenta Corriente con Límites**: Crédito y tiempo máximo por cliente  
✅ **Addendums por Entrega**: Documento específico para cada retiro  
✅ **Workflow de Ampliaciones**: Solicitudes aprobadas por Owner/Admin  
✅ **Anexos Especiales**: Medidas de seguridad para maquinaria con operador

---

## 📖 DOCUMENTACIÓN

### 1. [MASTER_CONTRACT_ARCHITECTURE.md](./MASTER_CONTRACT_ARCHITECTURE.md)

**Documentación técnica completa**

- 📋 Concepto y objetivos del sistema
- 🏗️ Modelos de base de datos detallados
- 🔄 Flujos de negocio completos
- 🎨 Templates de contratos y addendums
- 📱 Especificaciones de UI
- 🔐 Sistema de permisos

**Leer si**: Necesitas entender la arquitectura completa del sistema

---

### 2. [MASTER_CONTRACT_IMPLEMENTATION_PLAN.md](./MASTER_CONTRACT_IMPLEMENTATION_PLAN.md)

**Plan de implementación por sprints**

- ✅ Checklist de tareas por sprint (6 sprints, 4-5 semanas)
- 📊 Estimación de esfuerzo
- 🚨 Notas críticas y consideraciones
- 📝 Cambios principales resumidos

**Leer si**: Vas a implementar el sistema y necesitas un plan paso a paso

---

### 3. [MASTER_CONTRACT_DIAGRAMS.md](./MASTER_CONTRACT_DIAGRAMS.md)

**Diagramas de flujo visuales**

- 🔄 Flujo completo: Cotización → Contrato → Addendum → Devolución
- 🏦 Verificación de saldo y límites
- 💬 Solicitud de ampliación (chat)
- 📄 Creación de addendum con anexos
- 🎯 Estados de entidades
- 🔐 Permisos y roles
- 🎨 Mockups de UI

**Leer si**: Necesitas entender el flujo visualmente o presentar a stakeholders

---

## 🎬 INICIO RÁPIDO

### ¿Qué cambió?

**ANTES:**

1. Cliente aprueba cotización → **Se firmaba la cotización** ❌
2. Se crea contrato con items específicos listados
3. Se entregan todos los items al inicio

**AHORA:**

1. Cliente aprueba cotización (sin firma)
2. Se crea **Contrato Marco** → **Solo se firma el contrato** ✅
3. Contrato NO lista items específicos, solo monto y período general
4. Cada entrega genera un **Addendum** con items específicos
5. Sistema valida saldo y límites antes de cada entrega
6. Si excede límites → Workflow de solicitud de ampliación

---

## 🔑 CONCEPTOS CLAVE

### Contrato Marco (Master Contract)

- Acuerdo general entre empresa y cliente
- Referencia a cotización aprobada
- Incluye cláusulas generales
- NO lista implementos específicos
- Se firma digitalmente (SignNow)

### Cuenta Corriente del Cliente

- **Balance**: Saldo actual disponible
- **Credit Limit**: Límite máximo de dinero
- **Time Limit**: Límite de días de alquiler
- Un cliente puede tener múltiples contratos, pero una sola cuenta corriente

### Addendum

- Documento generado por cada entrega de implementos
- Lista items específicos retirados
- Fecha, período estimado, costos
- Descuenta del saldo de la cuenta
- Código ejemplo: `CON-2026-001-ADD-001`

### Solicitud de Ampliación

- Usuario de entregas NO puede modificar límites directamente
- Debe solicitar por chat interno a Owner/Admin
- Owner puede aprobar/rechazar con nuevos valores
- Se registra quién, cuándo y por qué se aprobó

### Anexos Especiales

- Documentos adicionales para maquinaria con operador:
  - Medidas de seguridad
  - Viáticos del operador
- Se generan automáticamente al crear addendum
- Se envían por email al cliente

---

## 🛠️ STACK TECNOLÓGICO

- **Backend**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL
- **Storage**: Azure Blob Storage
- **Firma Digital**: SignNow
- **PDF Generation**: Puppeteer / PDF-lib
- **Email**: Azure Communication Services
- **Frontend**: React + TypeScript + Vite

---

## 📊 MODELOS PRINCIPALES

```prisma
ClientAccount {
  balance       Decimal
  creditLimit   Decimal  // ✨ NUEVO
  timeLimit     Int      // ✨ NUEVO (días)
  activeDays    Int      // ✨ NUEVO
  movements     RentalAccountMovement[]
}

RentalContract {
  contractType     String   // ✨ NUEVO: "master" | "specific"
  agreedAmount     Decimal  // ✨ NUEVO
  agreedPeriod     Int?     // ✨ NUEVO
  totalActiveDays  Int      // ✨ NUEVO
  addendums        ContractAddendum[]  // ✨ NUEVO
}

ContractAddendum {            // ✨ NUEVO MODELO
  contractId    String
  code          String
  items         Json
  estimatedCost Decimal
  actualCost    Decimal
  status        String
}

LimitChangeRequest {          // ✨ NUEVO MODELO
  clientAccountId      String
  requestedCreditLimit Decimal?
  requestedTimeLimit   Int?
  status               String
  reviewedBy           String?
}

ContractAttachment {          // ✨ NUEVO MODELO
  contractId      String
  attachmentType  String
  assetId         String?
  fileUrl         String
}

ContractClauseTemplate {      // ✨ NUEVO MODELO
  name                 String
  category             String
  content              String
  applicableAssetTypes String[]
}
```

---

## ✅ PRÓXIMOS PASOS

### 1. Validación

- [ ] Revisar documentación con stakeholders
- [ ] Validar flujos de negocio
- [ ] Confirmar requisitos de chat/notificaciones

### 2. Preparación

- [ ] Crear tickets en sistema de gestión
- [ ] Asignar equipo de desarrollo
- [ ] Configurar entorno de desarrollo

### 3. Sprint 1 (Semana 1)

- [ ] Crear migraciones de base de datos
- [ ] Actualizar modelos Prisma
- [ ] Seed data de cláusulas y templates
- [ ] Testing de modelos

### 4. Sprint 2 (Semana 2)

- [ ] Implementar servicios backend
- [ ] Crear lógica de verificación de saldo
- [ ] Sistema de cláusulas con variables
- [ ] Testing de servicios

### 5-6. Continuar según [Plan de Implementación](./MASTER_CONTRACT_IMPLEMENTATION_PLAN.md)

---

## 🚨 CONSIDERACIONES IMPORTANTES

### Migración de Datos

- Contratos existentes se marcan como `contractType = "specific"`
- Sistema soporta ambos tipos simultáneamente
- No afecta contratos activos

### Validaciones Críticas

- **NUNCA permitir entregas si saldo insuficiente** (excepto override aprobado)
- **NUNCA permitir superar timeLimit** sin aprobación
- **SIEMPRE registrar quién y cuándo aprobó overrides**

### Flujo de Firma

- ❌ ANTES: Se firmaba la cotización
- ✅ AHORA: Solo se firma el contrato marco
- Cotización solo se "aprueba", no se firma

### Sistema de Chat

Recomendación: Usar sistema de notificaciones existente + modal de aprobación  
(Más rápido que construir chat desde cero)

---

## 📞 CONTACTO

**Responsable**: [Tu Nombre]  
**Fecha de diseño**: 8 de marzo de 2026  
**Estado**: 🔴 Diseño completado, pendiente aprobación e implementación

---

## 📚 DOCUMENTOS RELACIONADOS

- [CONTRACT_TEMPLATE_ARCHITECTURE.md](./CONTRACT_TEMPLATE_ARCHITECTURE.md) - Sistema de templates v2.0 (requiere actualización)
- [RENTAL_CONTRACT_ARCHITECTURE.md](./RENTAL_CONTRACT_ARCHITECTURE.md) - Arquitectura legacy de contratos
- [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) - Sistema de cobros y estados de cuenta
- [RBAC_PERMISSIONS_SYSTEM.md](./RBAC_PERMISSIONS_SYSTEM.md) - Sistema de permisos

---

**Última actualización**: 8 de marzo de 2026  
**Versión**: 1.0
