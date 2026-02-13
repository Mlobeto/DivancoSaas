# ✅ VALIDACIÓN FINAL - Modelo v3.0 Descuento Continuo

**Fecha:** 2026-02-12

---

## 🎯 ENTENDIMIENTO DEL MODELO

### **Descuento Continuo (NO al devolver):**

```
✅ NO se descuenta al RETIRAR
✅ SE DESCUENTA DÍA A DÍA mientras está en uso
✅ NO se descuenta al DEVOLVER (ya se descontó todo)
```

**¿Es correcto?** ☐ Sí ☐ No

---

## 📊 EJEMPLO: MAQUINARIA con Operario

### **Cotización:**

```
Retroexcavadora CAT 420F
- Precio: $625/hora
- Standby: 3 horas/día
- Estimado: 8 hrs/día × 60 días = $300,000

Operario certificado (PER_DAY - obra lejos)
- Viáticos: $3,000/día (incluye hotel, comida)
- Estimado: 60 días = $180,000

TOTAL ESTIMADO: $480,000
ANTICIPO: $480,000
```

### **Día 1 - Retiro (16 Feb):**

```
Usuario retira máquina:
- Horómetro inicial: 1250.5 hrs
- Odómetro inicial: 45,230 km
- Sistema: NO DESCUENTA NADA
- Saldo: $480,000 → $480,000 (sin cambio)
```

### **Día 1 - Final del día (16 Feb 18:00):**

```
Operario desde app móvil:
1. Toma foto horómetro: 1258.5 hrs
2. Toma foto odómetro: 45,280 km
3. Sube reporte

Sistema calcula automáticamente:
- Horas trabajadas: 8.0 hrs
- Costo máquina: 8 × $625 = $5,000
- Viáticos operario (PER_DAY): $3,000 (fijo por día)
- TOTAL: $8,000

Sistema descuenta:
- Saldo: $480,000 → $472,000
- Movimiento: "Cargo día 1 - Retroexcavadora (8 hrs) + Operario"
```

### **Día 2 - Final del día (17 Feb):**

```
Operario reporta:
- Horómetro: 1260.5 hrs (2.0 hrs trabajadas)
- Standby: 3.0 hrs
- Horas facturadas: Math.max(2.0, 3.0) = 3.0 hrs ⚠️
- Costo máquina: 3.0 × $625 = $1,875
- Viáticos (PER_DAY): $3,000 (fijo, no cambia por horas)
- TOTAL: $4,875

Saldo: $472,000 → $467,125
Dashboard: "⚠️ Standby aplicado: 2 hrs trabajadas, 3 hrs facturadas"
```

### **Día 12 - Devolución (28 Feb):**

```
Usuario devuelve máquina:
- Sistema: NO DESCUENTA NADA (ya se descontó todo)
- Solo registra fin de uso
- Estado asset: "available"

Resumen final:
- Días usados: 12
- Horas totales: 96 hrs
- Costo máquina: $60,000
- Viáticos: $36,000
- TOTAL: $96,000 (ya descontado día a día)
- Saldo final: $384,000
```

**¿Es correcto?** ☐ Sí ☐ No

---

## ⚙️ STANDBY: Mínimo Garantizado de Horas

### **¿Qué es Standby?**

```
Es el mínimo de horas/día que se garantiza facturar,
incluso si la máquina trabajó menos.

Ejemplo: Standby = 3 horas
- Si reporta 2 hrs → Se facturan 3 hrs
- Si reporta 5 hrs → Se facturan 5 hrs

Fórmula: billedHours = Math.max(reportedHours, standbyMinimumHours)
```

### **CASO 1: Reporta MENOS que standby**

```
Retroexcavadora CAT 420F
- Precio: $625/hora
- Standby: 3.0 horas/día
- Viáticos operario (PER_DAY): $3,000/día

Día 1:
- Operario reporta: 2.0 horas trabajadas
- Standby mínimo: 3.0 horas

Sistema calcula:
- Horas facturadas: Math.max(2.0, 3.0) = 3.0 hrs
- Costo máquina: 3.0 × $625 = $1,875
- Viáticos (PER_DAY): $3,000 (fijo)
- TOTAL: $4,875

Dashboard muestra:
"⚠️ Standby aplicado: 2 hrs reportadas, 3 hrs facturadas"
```

### **CASO 2: Reporta MÁS que standby**

```
Día 2:
- Operario reporta: 7.5 horas trabajadas
- Standby mínimo: 3.0 horas

Sistema calcula:
- Horas facturadas: Math.max(7.5, 3.0) = 7.5 hrs
- Costo máquina: 7.5 × $625 = $4,687.50
- Viáticos (PER_DAY): $3,000 (fijo)
- TOTAL: $7,687.50

Dashboard muestra:
"Horas facturadas: 7.5 hrs (sin standby)"
```

### **CASO 3: Reporta EXACTO standby**

```
Día 3:
- Operario reporta: 3.0 horas trabajadas
- Standby mínimo: 3.0 horas

Sistema calcula:
- Horas facturadas: Math.max(3.0, 3.0) = 3.0 hrs
- Costo máquina: 3.0 × $625 = $1,875
- Viáticos (PER_DAY): $3,000 (fijo)
- TOTAL: $4,875
```

### **App Móvil - Pantalla de Reporte:**

```
┌─────────────────────────────────┐
│ 📱 Reporte Diario               │
├─────────────────────────────────┤
│ Máquina: Retroexcavadora CAT    │
│ Standby mínimo: 3.0 hrs         │
│                                 │
│ Horómetro inicio: 1250.5 hrs    │
│ Horómetro fin: 1252.5 hrs       │
│                                 │
│ Horas trabajadas: 2.0 hrs       │
│ ⚠️ Se facturarán: 3.0 hrs       │
│ (Standby garantizado)           │
│                                 │
│ 📸 Foto horómetro (requerida)   │
│ 📸 Foto odómetro (opcional)     │
│                                 │
│ [ENVIAR REPORTE]                │
└─────────────────────────────────┘
```

**¿Es correcto este modelo?** ☐ Sí ☐ No

---

## 👷 VIÁTICOS: PER_DAY vs PER_HOUR

### **¿Por qué dos modalidades?**

```
PER_DAY: Obra LEJOS (requiere hotel, comida, traslado)
         → Se cobra FIJO por día (ej: $3,000)
         → No importa cuántas horas trabaje

PER_HOUR: Obra CERCA (operario viaja diario)
          → Se cobra por HORA trabajada (ej: $375/hora)
          → Respeta el standby (horas mínimas)
```

### **CASO A: PER_DAY (Obra Lejos)**

```
Cotización:
┌──────────────────────────────────────────┐
│ Retroexcavadora CAT 420F                 │
│ - $625/hora, standby 3 hrs               │
│                                          │
│ Operario (PER_DAY - obra en Santa Cruz) │
│ - $3,000/día (hotel + comida incluida)  │
└──────────────────────────────────────────┘

Día con 2 horas trabajadas (standby 3):
- Horas facturadas máquina: 3.0 hrs
- Costo máquina: 3.0 × $625 = $1,875
- Viáticos operario: $3,000 (FIJO, no importa horas)
- TOTAL: $4,875

Día con 8 horas trabajadas:
- Horas facturadas máquina: 8.0 hrs
- Costo máquina: 8.0 × $625 = $5,000
- Viáticos operario: $3,000 (FIJO, igual)
- TOTAL: $8,000
```

### **CASO B: PER_HOUR (Obra Cerca)**

```
Cotización:
┌──────────────────────────────────────────┐
│ Retroexcavadora CAT 420F                 │
│ - $625/hora, standby 3 hrs               │
│                                          │
│ Operario (PER_HOUR - obra en la ciudad) │
│ - $375/hora                              │
└──────────────────────────────────────────┘

Día con 2 horas trabajadas (standby 3):
- Horas facturadas máquina: 3.0 hrs
- Costo máquina: 3.0 × $625 = $1,875
- Viáticos operario: 3.0 × $375 = $1,125 (respeta standby)
- TOTAL: $3,000

Día con 8 horas trabajadas:
- Horas facturadas máquina: 8.0 hrs
- Costo máquina: 8.0 × $625 = $5,000
- Viáticos operario: 8.0 × $375 = $3,000
- TOTAL: $8,000
```

### **Comparación:**

```
Escenario: Operario reporta 2 hrs (standby 3 hrs)

PER_DAY:  Máquina $1,875 + Operario $3,000 = $4,875
PER_HOUR: Máquina $1,875 + Operario $1,125 = $3,000

Diferencia: $1,875 menos con PER_HOUR
```

### **App Móvil - Se muestra tipo de viático:**

```
┌─────────────────────────────────┐
│ 📱 Reporte Diario               │
├─────────────────────────────────┤
│ Máquina: Retroexcavadora CAT    │
│ Standby mínimo: 3.0 hrs         │
│                                 │
│ Viáticos: PER_DAY ($3,000)      │
│ Obra: Santa Cruz (hospedaje)   │
│                                 │
│ Horómetro: 1250.5 → 1252.5 hrs  │
│ Horas trabajadas: 2.0 hrs       │
│                                 │
│ Cargos del día:                 │
│ • Máquina: 3 hrs × $625 = $1,875│
│ • Operario: $3,000 (día)        │
│ TOTAL: $4,875                   │
└─────────────────────────────────┘
```

**¿Es correcto este modelo?** ☐ Sí ☐ No

---

## 🪜 EJEMPLO: HERRAMIENTA sin Tracking

### **Cotización:**

```
Andamio metálico 6m
- Precio: $200/día
- Estimado: 45 días = $9,000

ANTICIPO: $9,000
```

### **Día 1 - Retiro (20 Feb):**

```
Usuario retira andamio:
- Sistema: NO DESCUENTA
- Saldo: $9,000 → $9,000
```

### **Cada día automáticamente:**

```
CRON JOB ejecuta a las 00:01:

Día 1 (20 Feb): -$200 → Saldo: $8,800
Día 2 (21 Feb): -$200 → Saldo: $8,600
Día 3 (22 Feb): -$200 → Saldo: $8,400
...
Día 18 (9 Mar): -$200 → Saldo: $5,400

Total descontado: $3,600 (18 días)
```

### **Devolución (9 Mar):**

```
Usuario devuelve andamio:
- Sistema: NO DESCUENTA (ya se descontó automático)
- Solo marca fin de uso
- Saldo: $5,400 (sin cambios)
```

**¿Es correcto?** ☐ Sí ☐ No

---

## 📱 APP MÓVIL - Operario

### **Flujo diario:**

```
1. Operario abre app
2. Ve su máquina asignada:
   ┌───────────────────────────────┐
   │ RETROEXCAVADORA CAT 420F      │
   │ En uso desde: 16 Feb          │
   │                               │
   │ Horómetro actual: 1258.5 hrs  │
   │ Último reporte: Hoy 18:00     │
   │                               │
   │ [REPORTAR USO DE HOY]         │
   └───────────────────────────────┘

3. Clic en "Reportar"
4. Formulario:
   - [📸 Foto Horómetro Inicio] → Registra 1258.5
   - [📸 Foto Horómetro Fin] → Registra 1266.0
   - Calcula automático: 7.5 hrs
   - [📸 Foto Odómetro] (opcional)
   - [Notas] Excavación sector norte

5. Muestra cálculo:
   ┌───────────────────────────────┐
   │ Resumen del día:              │
   │ Horas trabajadas: 7.5         │
   │ Costo máquina: $4,687.50      │
   │ Viáticos: $3,000              │
   │ TOTAL: $7,687.50              │
   └───────────────────────────────┘

6. [GUARDAR REPORTE]
7. Sistema procesa:
   - Descuenta del contrato
   - Actualiza saldo en tiempo real
   - Cliente ve saldo actualizado
```

**¿Es correcto este flujo?** ☐ Sí ☐ No

### **Offline-First:**

```
Si no hay conexión:
1. Guarda reporte localmente
2. Muestra: "Guardado - Se sincronizará"
3. Al reconectar: Sube automático
```

**¿Es necesario?** ☐ Sí ☐ No

---

## 🖥️ FRONTEND WEB - Dashboard

### **Vista de Contrato:**

```
┌────────────────────────────────────────────┐
│ CONTRATO #CON-2026-001                     │
│ Cliente: Constructora ABC                  │
│                                            │
│ 💰 SALDO ACTUAL                            │
│ $384,000 / $480,000 inicial                │
│ ████████████████░░░░ 80% 🟢                │
│ Actualizado: Hoy 19:45                     │
│                                            │
│ 📋 ASSETS EN USO (facturando automático)  │
│                                            │
│ ┌────────────────────────────────────────┐│
│ │ 🚜 Retroexcavadora CAT 420F            ││
│ │ 12 días en uso                         ││
│ │ Horas acumuladas: 96 hrs               ││
│ │ Costo máquina: $60,000                 ││
│ │ Viáticos operario: $36,000             ││
│ │ TOTAL: $96,000                         ││
│ │                                        ││
│ │ Último reporte: Hoy 18:00              ││
│ │ [Ver Reportes] [Devolver]              ││
│ └────────────────────────────────────────┘│
│                                            │
│ ┌────────────────────────────────────────┐│
│ │ 🪜 Andamio metálico 6m                 ││
│ │ 8 días en uso (automático)             ││
│ │ $200/día × 8 = $1,600                  ││
│ │                                        ││
│ │ [Devolver]                             ││
│ └────────────────────────────────────────┘│
│                                            │
│ 📊 ÚLTIMOS MOVIMIENTOS                    │
│ ┌────────────────────────────────────────┐│
│ │ Fecha  │ Descripción      │Monto│Saldo││
│ │────────│──────────────────│─────│─────││
│ │15 Feb  │Anticipo inicial  │+$480k│$480k││
│ │16 Feb  │Retiro Retroexc.  │  $0  │$480k││
│ │16 Feb  │Cargo día 1       │-$8.0k│$472k││
│ │17 Feb  │Cargo día 2       │-$7.7k│$464k││
│ │18 Feb  │Cargo día 3       │-$8.0k│$456k││
│ │...     │                  │      │     ││
│ └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

**¿Es correcto que se vea así?** ☐ Sí ☐ No

---

## ⚙️ CRON JOBS

### **1. Cargo automático herramientas (00:01)**

```
Busca todas las herramientas actualmente rentadas
Por cada una:
  - Descuenta precio diario
  - Crea movimiento en historial
  - Actualiza saldo del contrato
```

### **2. Notificar operarios sin reporte (20:00)**

```
Busca maquinaria sin reporte del día
Envía notificación push a operario:
"Recuerda enviar el reporte del horómetro"
```

### **3. Estados de cuenta periódicos**

```
Busca contratos con envío programado
Genera PDF con estado actualizado
Envía por email + WhatsApp
```

**¿Son necesarios estos 3 cron jobs?** ☐ Sí ☐ No

---

## 🎨 VIÁTICOS DEL OPERARIO

### **Importante:**

```
Viáticos se cobran POR DÍA TRABAJADO, no por hora

Ejemplo:
- Operario trabaja 8 hrs: Viáticos $3,000
- Operario trabaja 4 hrs: Viáticos $3,000 (igual)
- Si no envía reporte: NO se cobran viáticos ese día
```

**¿Es correcto?** ☐ Sí ☐ No

### **Cotización muestra:**

```
┌─────────────────────────────────────────┐
│ Retroexcavadora CAT 420F                │
│ - Máquina: $625/hora                    │
│ - Operario: $3,000/día (viáticos)       │
│                                         │
│ Total estimado 60 días:                 │
│ - Máquina (8hrs/día): $300,000          │
│ - Operario: $180,000                    │
│ ────────────────────────────────────    │
│ TOTAL: $480,000                         │
└─────────────────────────────────────────┘
```

**¿Se ve bien la cotización?** ☐ Sí ☐ No

---

## ✅ MVP - ¿Qué implementamos PRIMERO?

### **Opción A: Solo Herramientas (más simple)**

```
✅ Retiro de herramientas
✅ Cargo automático diario
✅ Devolución de herramientas
✅ Dashboard web con saldo en tiempo real
✅ Estados de cuenta

SIN:
- App móvil
- Reportes de operario
- Maquinaria con tracking
```

### **Opción B: Maquinaria + Herramientas (completo)**

```
✅ Todo lo de Opción A
✅ App móvil para operarios
✅ Reportes diarios con fotos
✅ Tracking de horómetro/odómetro
✅ Viáticos de operarios
```

**¿Cuál prefieres?** ☐ Opción A (MVP) ☐ Opción B (Completo)

---

## ❓ DUDAS FINALES

### **1. Frecuencia de reportes:**

¿Los operarios DEBEN reportar todos los días?

- ☐ Sí, obligatorio diario
- ☐ No, pueden reportar cada 2-3 días
- ☐ Depende del contrato

### **2. Horarios:¿A qué hora se ejecuta el cargo automático de herramientas?**

- ☐ 00:01 (medianoche)
- ☐ 06:00 (mañana)
- ☐ Otra: **\_\_\_**

### **3. Validación horómetro:**

¿Qué pasa si el horómetro reportado es menor que el anterior?

- ☐ Rechazar reporte (error)
- ☐ Permitir pero alertar (puede ser reseteo)
- ☐ Permitir siempre (usuario sabe)

### **4. Operario sin reporte:**

Si el operario NO envía reporte un día:

- ☐ NO se cobra nada ese día
- ☐ Se cobra estimado (8 hrs)
- ☐ Se cobra solo viáticos
- ☐ Se notifica y espera

### **5. Estados de cuenta:**

¿Cuál es la frecuencia más común?

- ☐ Semanal
- ☐ Quincenal
- ☐ Mensual

### **6. Alertas:**

¿A qué monto típico se alerta?

- ☐ $50,000
- ☐ 20% del crédito inicial
- ☐ Configurable por contrato

---

## ✅ CONFIRMACIÓN FINAL

Una vez validado todo, procederé con:

1. ✅ Crear migración de Prisma (modelos: AssetRental, AccountMovement actualizado)
2. ✅ Implementar servicios backend:
   - ContractService
   - UsageReportService
   - AutoChargeService
3. ✅ Crear endpoints API
4. ✅ Implementar cron jobs
5. ✅ Desarrollar app móvil (React Native + Expo)
6. ✅ Frontend web (dashboard actualizado en tiempo real)

**¿Procedo con la implementación?** ☐ Sí, adelante ☐ No, revisar

---

**POR FAVOR REVISA CADA SECCIÓN Y MARCA LOS CHECKBOXES**
