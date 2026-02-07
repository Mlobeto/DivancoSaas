# MÓDULO: ALQUILER DE MAQUINARIA E IMPLEMENTOS

## 1. Propósito del módulo
Este módulo gestiona el **alquiler de maquinaria e implementos** dentro de una unidad de negocio (businessUnit) en la plataforma Divanco SaaS.

Su objetivo es controlar:
- Inventario de activos
- Estados y ubicación de cada activo
- Contratos de alquiler por obra
- Uso real vs uso estimado
- Mantenimiento preventivo y correctivo
- Incidentes en obra
- Consumo de insumos
- Proyección de disponibilidad futura

El módulo **NO gestiona**:
- Facturación o pagos (Billing)
- Firma certificada de contratos
- Comunicación externa (WhatsApp, Email)

Estos aspectos se delegan a módulos transversales.

---

## 2. Alcance arquitectónico

- Vive dentro de una **businessUnit**
- Es independiente de otros módulos
- Expone solo **eventos y estados**, no decisiones comerciales
- Respeta el guardRail definido en `ARQUITECTURA.md`

---

## 3. Conceptos principales

### 3.1 Asset (Activo)
Maquinaria o implemento alquilable.

Tipos conceptuales:
- Activos con mantenimiento preventivo y "historia clínica"
- Activos sin mantenimiento preventivo

Propiedades relevantes:
- Tipo libre (string)
- Estado actual
- Ubicación actual
- Requiere historia clínica (boolean)

---

### 3.2 Insumos
Materiales consumibles utilizados:
- En mantenimiento preventivo
- En mantenimiento post-obra
- En reparaciones

Ejemplos:
- Aceite
- Pintura
- Filtros
- Repuestos

Los insumos:
- Tienen stock
- Pueden descartarse con motivo obligatorio
- Pueden asociarse a activos o eventos

---

### 3.3 Contrato de alquiler
Acuerdo entre la unidad de negocio y un cliente.

Características:
- Puede incluir múltiples activos
- Puede estar asociado a una o más obras
- Puede modificarse durante su vigencia
- Puede pausarse o finalizarse

Estados típicos:
- Draft
- Active
- Paused
- Finished

---

### 3.4 Obra
Lugar físico donde se utiliza el activo.

Se utiliza para:
- Ubicación del activo
- Reportes de uso
- Mantenimiento en sitio

---

### 3.5 Operario
Empleado de la unidad de negocio que:
- Traslada maquinaria
- Opera activos
- Reporta uso diario

El módulo **no gestiona RRHH**.
El operario se referencia solo como identificador externo.

---

## 4. Historia clínica de activos

Algunos activos requieren mantenimiento preventivo periódico.

### 4.1 Configuración preventiva

Al crear un activo:
- Se puede definir una configuración inicial de mantenimiento
- Incluye insumos estimados
- Es **editable en el tiempo**

Esto permite:
- Ajustes por desgaste
- Cambios por antigüedad
- Optimización de costos

---

### 4.2 Registro clínico

Cada mantenimiento preventivo:
- Se registra como evento
- Guarda insumos reales utilizados
- Se compara contra lo estimado

Estos datos permiten:
- Calcular pérdidas/ganancias
- Analizar eficiencia
- Trazar historial del activo

---

## 5. Uso en obra

### 5.1 Reporte diario

Cuando el activo está en obra:
- El operario reporta uso diario
- Ejemplos:
  - Horómetro
  - Kilometraje
  - Ciclos

Estos reportes:
- No calculan costos automáticamente
- Alimentan análisis posterior

---

### 5.2 Evidencia

El uso puede acompañarse de evidencia:
- Imágenes
- Documentación

El módulo solo registra la referencia al archivo.
El almacenamiento se delega a infraestructura externa.

---

## 6. Incidentes en obra

Un incidente es una falla:
- No atribuible al cliente
- O que requiere decisión operativa

Ejemplos:
- Rotura mecánica
- Fallo inesperado

Ante un incidente:
- Se registra el evento
- El activo puede cambiar de estado
- Se requiere decisión humana:
  - Reemplazo
  - Pausa del contrato
  - Continuidad

---

## 7. Mantenimiento post-obra

Al finalizar un contrato:
- El activo retorna
- Se evalúa su estado

Puede requerir:
- Limpieza
- Reparación
- Uso de insumos

Este mantenimiento:
- No genera historia clínica
- Sí registra consumo de insumos

---

## 8. Descarte

Se permite descartar:
- Insumos
- Activos

Requisitos:
- Motivo obligatorio
- Asociación a evento o contrato

Ejemplos:
- Insumo dañado
- Activo irrecuperable
- Daño atribuible al cliente

---

## 9. Disponibilidad y proyección

El módulo mantiene:
- Estado actual del activo
- Ubicación

Además puede:
- Proyectar disponibilidad futura
- Basarse en contratos activos
- Considerar mantenimientos estimados

⚠️ No reserva automáticamente futuros contratos.

---

## 10. Relación con otros módulos

Este módulo:
- Emite eventos
- Consume servicios externos vía adapters

Ejemplos:
- Envío de alertas (WhatsApp)
- Firma de contratos
- Facturación

Nunca accede directamente a implementaciones externas.

---

## 11. Principios clave

- Separación estricta de responsabilidades
- Decisiones críticas siempre humanas
- Datos históricos completos
- Flexibilidad ante flujos reales de obra

---

## 12. Estado del módulo

Este documento define el **estado definitivo del módulo de maquinaria**.

Cualquier ampliación:
- Debe respetar este alcance
- Debe documentarse antes de implementarse

