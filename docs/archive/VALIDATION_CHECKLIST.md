# ✅ VALIDACIÓN - ¿Entendí Correctamente?

**Fecha:** 2026-02-12

---

## 🎯 MODELO DE NEGOCIO

### ❌ LO QUE YO PENSABA (INCORRECTO):

- Existen dos tipos de contrato: "ANTICIPO" y "TIEMPO"
- Algunos contratos son por tiempo, otros por crédito
- Son fundamentalmente diferentes

### ✅ LO QUE REALMENTE ES (CORRECTO):

- **TODOS los contratos son por CRÉDITO**
- La diferencia está solo en **cómo se hace la cotización**:
  - **Tipo 1**: Cotización con assets + tiempo estimado (para obra específica)
  - **Tipo 2**: Cotización por servicio (sin assets específicos, sin tiempo)
- Pero ambos funcionan igual: **cliente tiene SALDO, retira mientras tenga saldo**

---

## 💰 FLUJO DE CRÉDITO

### **¿Es así?**

```
1. Cliente pide cotización (por obra O por servicio)
2. Se genera cotización con monto estimado
3. Cliente entrega ANTICIPO (puede ser = total o menos)
4. Se crea CONTRATO con ese crédito
5. Mientras tenga SALDO en la cuenta:
   ✅ Puede retirar assets (se descuenta)
   ✅ Puede devolver assets (se ajusta)
   ✅ Puede recargar más dinero
6. Cuando saldo = $0 → Contrato termina (o recarga)
```

---

## 📊 EJEMPLO 1: Obra con Tiempo Estimado

```
Cliente: Juan Pérez
Obra: "Construcción Edificio Los Álamos"
Duración estimada: 60 días (puede variar por lluvia)

COTIZACIÓN:
┌────────────────────────────────────────────┐
│ Retroexcavadora × 60 días = $300,000      │
│ Operario × 60 días = $180,000             │
│ Herramientas = $20,000                    │
├────────────────────────────────────────────┤
│ TOTAL ESTIMADO: $500,000                  │
└────────────────────────────────────────────┘

ANTICIPO ACORDADO: $500,000

CONTRATO ABIERTO:
- Crédito inicial: $500,000
- Puede retirar:
  ✅ Esos assets cotizados
  ✅ OTROS assets también (mientras tenga saldo)
- Si devuelve antes de 60 días:
  ✅ Se ajusta el saldo (devuelve dinero al crédito)
- Si llueve y se extiende:
  ✅ Puede recargar más dinero y seguir
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 🚧 EJEMPLO 2: Servicio sin Tiempo

```
Cliente: Constructora ABC
Trabajo: "Hacer 2 km de camino rural"
Duración: NO SE DEFINE (termina cuando esté listo)

COTIZACIÓN:
┌────────────────────────────────────────────┐
│ Servicio completo: $150,000               │
│ (No se especifican assets ni tiempo)     │
└────────────────────────────────────────────┘

ANTICIPO: $150,000

CONTRATO ABIERTO:
- Crédito inicial: $150,000
- Retira lo que necesite:
  ✅ Motoniveladora → descuenta
  ✅ Compactadora → descuenta
  ✅ Lo que sea necesario
- Cuando saldo = $0:
  ✅ O ya terminó el trabajo
  ✅ O recarga más dinero para continuar
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 🔔 ALERTAS

### **Alertas para USUARIOS del sistema (NO al cliente)**

```
Al crear contrato se define un MONTO de alerta
Ejemplo: alertAmount = $50,000

Cuando currentCredit <= $50,000:
  ✅ Se notifica a usuarios del tenant
  ✅ Dashboard muestra alerta 🔴
  ✅ Email/notificación interna

NO se envía automáticamente al cliente.
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 📧 ESTADOS DE CUENTA

### **Estados para CLIENTES (no usuarios internos)**

```
Se envían PERIÓDICAMENTE al cliente:
  - Email con PDF adjunto
  - WhatsApp con enlace al PDF

Contenido:
┌────────────────────────────────────────────┐
│ ESTADO DE CUENTA - CON-2026-001           │
│                                            │
│ Cliente: Juan Pérez                        │
│ Obra: Edificio Los Álamos                 │
│                                            │
│ Anticipo inicial:    $500,000              │
│ Recargas:            $200,000              │
│ Total disponible:    $700,000              │
│ Consumido:          -$260,000              │
│ SALDO ACTUAL:        $440,000              │
│                                            │
│ MOVIMIENTOS:                               │
│ 15 Feb | Anticipo inicial  | +$500,000    │
│ 16 Feb | Retiro MQ-001     | -$75,000     │
│ 20 Feb | Devolución MQ-001 | +$15,000     │
│ 25 Feb | Retiro MQ-045     | -$140,000    │
│ 28 Feb | Recarga            | +$200,000    │
│ ...                                        │
└────────────────────────────────────────────┘

Frecuencia configurable:
  - Semanal
  - Quincenal
  - Mensual
  - Manual (solo cuando usuario lo envía)
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 🔄 RETIROS Y DEVOLUCIONES

### **Flujo de retiro:**

```
Usuario en el sistema:
1. Abre contrato CON-2026-001
2. Clic en "Retirar Asset"
3. Busca asset disponible (Retroexcavadora CAT 420F)
4. Ve precio: $5,000/día
5. Ingresa:
   - Días estimados: 15 (solo informativo)
   - Fecha devolución esperada: 1 Mar
   - Fotos del asset al retirarlo
6. Sistema:
   - ❌ NO descuenta dinero del saldo
   - ✅ Marca asset como "rented"
   - ✅ Registra: "Asset en uso - $5,000/día"
   - ✅ Crédito sigue en $500,000
7. Dashboard muestra: "Retroexcavadora en uso - $5k/día desde 16 Feb"
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

### **Flujo de devolución:**

```
Usuario en el sistema:
1. Abre contrato CON-2026-001
2. Ve assets en uso:
   ┌───────────────────────────────────┐
   │ Retroexcavadora CAT 420F         │
   │ En uso desde: 16 Feb            │
   │ Días transcurridos: 12           │
   │ Costo acumulado: $60,000        │
   │ [Registrar Devolución]          │
   └───────────────────────────────────┘
3. Clic en "Registrar Devolución"
4. Ingresa:
   - Estado: "Bueno"
   - Fotos del asset al devolverlo
   - Notas: "Devuelto antes por clima"
5. Sistema:
   - ✅ Calcula: 12 días × $5,000 = $60,000
   - ✅ AHORA descuenta $60,000 del crédito
   - ✅ Nuevo saldo: $440,000
   - ✅ Marca asset como "available"
6. Muestra: "Devolución registrada - Saldo actualizado"
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 💳 RECARGAS

### **Cliente puede recargar en cualquier momento:**

```
Si el contrato sigue activo y cliente necesita más:
1. Usuario registra nueva recarga
2. Valida pago (transferencia, efectivo, etc)
3. Sistema:
   - Crea movimiento "CREDIT_RELOAD"
   - Suma al saldo actual
   - Resetea alerta (para volver a alertar si baja)
4. Se notifica al cliente que su recarga fue procesada
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 🎨 FRONTEND SIMPLIFICADO

### **Dashboard de Contratos:**

```
Lista de contratos activos con:
  - Nombre cliente y obra
  - Barra visual del crédito (% restante)
  - Botones rápidos:
    [Ver Detalle] [Estado de Cuenta] [Recargar]

Si crédito < monto de alerta:
  → Barra ROJA + ícono 🔴
  → Usuario ve que debe alertar al cliente
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

### **Detalle de Contrato:**

```
Vista con:
1. Resumen de crédito (grande y visual)
2. Botón "Enviar Estado de Cuenta al Cliente"
3. Botón "Recargar Crédito"
4. Sección "Assets en Uso Actualmente"
   - Con botón "Registrar Devolución" en cada uno
5. Historial de todos los movimientos (tabla)
6. Botón "Retirar Nuevo Asset" (siempre visible)
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

### **Retirar Asset (Modal/Página):**

```
Flujo rápido:
1. Buscar asset (typeahead) → Muestra: "Retroexcavadora - $5,000/día"
2. Sistema automáticamente toma el precio diario del asset
3. Días estimados (input) - SOLO INFORMATIVO
4. Fecha devolución esperada (datepicker) - SOLO INFORMATIVO
5. Notas (textarea)
6. Upload de fotos (opcional)
7. Muestra: "NO se descontará al retirar - Se cobrará al devolver"
8. Botón grande "Confirmar Retiro"

IMPORTANTE: El saldo NO cambia al retirar
El descuento se hace al DEVOLVER calculando días reales
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

### **Devolver Asset (Modal/Página):**

```
Sistema muestra automáticamente:
┌─────────────────────────────────────────┐
│ Retroexcavadora CAT 420F                │
│ Retirado: 16 Feb 2026                   │
│ Días transcurridos: 12                  │
│ Precio: $5,000/día                      │
│ COSTO TOTAL: $60,000                    │
│───────────────────────────────────────  │
│ Saldo actual: $500,000                  │
│ Después de devolver: $440,000           │
└─────────────────────────────────────────┘

Usuario solo ingresa:
1. Estado del asset (select)
2. Notas
3. Fotos al devolver

Botón: "Confirmar Devolución y Descontar $60,000"
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 📋 PLANTILLAS

### **Sistema de Templates:**

```
Tipos de plantilla:
1. "quotation" → Para cotizaciones
2. "contract" → Para contratos
3. "account_statement" → Para estados de cuenta ← NUEVO

Variables disponibles:
{{clientName}}
{{contractCode}}
{{initialCredit}}
{{currentCredit}}
{{totalConsumed}}
{{accountMovements}} ← Array para iterar:
  {{movement.date}}
  {{movement.type}}
  {{movement.description}}
  {{movement.amount}}
  {{movement.balance}}

Usuario puede:
  - Crear plantillas custom
  - Usar editor visual (WYSIWYG)
  - Arrastrar variables
  - Previsualizar con datos reales
  - Asociar plantilla a tipo de asset (opcional)
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 🔧 VARIABLES CLIMÁTICAS

### **Consideración:**

```
Al cotizar obra por tiempo, se debe:
  ✅ Dejar claro que es ESTIMADO
  ✅ Puede variar por clima
  ✅ Si se extiende → cliente recarga
  ✅ Si termina antes → se ajusta saldo

En la planificación de disponibilidad:
  ✅ Sistema debe considerar que obras pueden extenderse
  ✅ NO bloquear assets por todo el tiempo estimado
     (podría devolverse antes)
```

**¿Es correcto?** ☐ Sí ☐ No (explicar)

---

## 🎯 MVP - ¿Qué implementamos PRIMERO?

### **Opción A: Empezar con lo básico**

```
1. Crear contrato desde cotización (solo crédito inicial)
2. Retirar asset (descuenta del saldo)
3. Devolver asset (ajusta saldo)
4. Ver estado actual en dashboard
5. Alertas simples (solo en dashboard)

SIN:
- Recargas de crédito
- Estados de cuenta automáticos
- Envío por WhatsApp/Email
```

### **Opción B: Completo desde el inicio**

```
Todo lo documentado:
- Contratos
- Retiros/Devoluciones
- Recargas
- Alertas internas
- Estados de cuenta
- Envío automático
- Plantillas configurables
```

**¿Cuál prefieres?** ☐ Opción A (MVP) ☐ Opción B (Completo) ☐ Otro (explicar)

---

## ❓ DUDAS Y ACLARACIONES

### **Editor de Plantillas:**

¿Qué herramienta prefieres?

- ☐ TinyMCE (rich text editor completo)
- ☐ Quill (más simple)
- ☐ Builder.io (drag & drop visual)
- ☐ Otra: ****\_\_\_****

### **Frecuencia de Estados de Cuenta:**

¿Cuál es la más común?

- ☐ Semanal
- ☐ Quincenal
- ☐ Mensual

### **Assets en Cotización:**

¿La cotización DEBE tener assets específicos?

- ☐ Sí, siempre
- ☐ No, puede ser solo "servicio" sin detallar assets
- ☐ Depende del tipo de trabajo

---

## ✅ CONFIRMACIÓN FINAL

Una vez validado todo esto, procederé a:

1. ✅ Crear migración de Prisma con modelos correctos
2. ✅ Implementar servicios backend (ContractService, StatementService)
3. ✅ Crear endpoints API
4. ✅ Implementar frontend (Dashboard + Detalle + Retiro/Devolución)
5. ✅ Implementar sistema de plantillas para estados de cuenta
6. ✅ Implementar cron jobs (alertas + estados automáticos)

**¿Procedo con la implementación?** ☐ Sí, adelante ☐ No, hay que ajustar (explicar)

---

**Instrucciones:** Por favor revisa cada sección y marca los checkboxes o aclara lo que sea necesario antes de que implemente.
