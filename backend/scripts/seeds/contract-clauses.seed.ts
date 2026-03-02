/**
 * CONTRACT CLAUSES SEED DATA
 * Cláusulas modulares ejemplo para contratos de alquiler
 */

export const contractClausesSeed = [
  // ============================================
  // CLÁUSULAS GENERALES (aplican a todos)
  // ============================================
  {
    code: "CLAUSE_EXTENSION_RIGHTS",
    name: "Extensión y Adición de Equipos",
    category: "general",
    order: 1,
    applicableAssetTypes: [], // Vacío = aplica a todos
    requiresOperator: false,
    content: `
      <div class="clause">
        <p>
          El ARRENDATARIO podrá agregar equipos adicionales al presente contrato
          en cualquier momento durante su vigencia, sin necesidad de firmar un nuevo
          documento, siempre que:
        </p>
        <ol>
          <li>Mantenga saldo positivo en su cuenta corriente</li>
          <li>Los equipos pertenezcan al mismo ARRENDADOR</li>
          <li>Se respeten las mismas condiciones económicas pactadas</li>
        </ol>
        <p>
          Los equipos agregados quedarán automáticamente sujetos a todas las cláusulas
          del presente contrato.
        </p>
      </div>
    `,
  },
  {
    code: "CLAUSE_PAYMENT_ACCOUNT",
    name: "Cuenta Corriente y Sistema de Pago",
    category: "payment",
    order: 2,
    applicableAssetTypes: [],
    requiresOperator: false,
    content: `
      <div class="clause">
        <p>
          El ARRENDATARIO dispondrá de una <strong>cuenta corriente</strong> con el ARRENDADOR,
          a la cual:
        </p>
        <ol>
          <li>Se acreditará el anticipo inicial y las recargas posteriores</li>
          <li>Se descontarán automáticamente los cargos diarios por uso de equipos</li>
          <li>Podrá consultar el saldo en tiempo real mediante la plataforma web</li>
          <li>Recibirá estados de cuenta según la frecuencia acordada</li>
        </ol>
        <p>
          Los descuentos se realizarán <strong>diariamente</strong> según los reportes de uso
          para maquinaria con operario, o automáticamente para herramientas menores.
        </p>
      </div>
    `,
  },
  {
    code: "CLAUSE_EARLY_TERMINATION",
    name: "Terminación Anticipada",
    category: "termination",
    order: 99,
    applicableAssetTypes: [],
    requiresOperator: false,
    content: `
      <div class="clause">
        <p>
          Cualquiera de las partes podrá dar por terminado el contrato con aviso previo
          de 48 horas. En caso de terminación anticipada:
        </p>
        <ul>
          <li>El ARRENDATARIO deberá devolver todos los equipos en el estado pactado</li>
          <li>Se realizará liquidación final del saldo de la cuenta corriente</li>
          <li>El saldo remanente será reembolsado en un plazo de 15 días hábiles</li>
        </ul>
      </div>
    `,
  },

  // ============================================
  // MAQUINARIA PESADA
  // ============================================
  {
    code: "CLAUSE_HEAVY_MACHINERY_LIABILITY",
    name: "Responsabilidad Maquinaria Pesada",
    category: "liability",
    order: 10,
    applicableAssetTypes: [
      "excavadora",
      "retroexcavadora",
      "bulldozer",
      "motoniveladora",
      "cargador frontal",
      "compactadora",
    ],
    requiresOperator: false,
    content: `
      <div class="clause">
        <h4>MAQUINARIA PESADA - RESPONSABILIDADES</h4>
        <p>
          El ARRENDATARIO se compromete a:
        </p>
        <ol>
          <li><strong>Uso exclusivo en zonas autorizadas:</strong> La maquinaria solo podrá
              operar en el sitio de obra indicado en el contrato</li>
          <li><strong>Mantenimiento diario:</strong> Realizar inspección visual antes de cada
              turno y reportar anomalías inmediatamente</li>
          <li><strong>Combustible y lubricantes:</strong> Utilizar únicamente los especificados
              por el fabricante</li>
          <li><strong>Daños y averías:</strong> Notificar cualquier daño dentro de las 2 horas
              siguientes al incidente</li>
          <li><strong>Responsabilidad civil:</strong> Mantener seguro de responsabilidad civil
              con cobertura mínima de $500,000 USD</li>
        </ol>
      </div>
    `,
  },
  {
    code: "CLAUSE_MACHINERY_OPERATOR_REQUIREMENTS",
    name: "Requisitos del Operario (Maquinaria)",
    category: "safety",
    order: 11,
    applicableAssetTypes: [
      "excavadora",
      "retroexcavadora",
      "bulldozer",
      "motoniveladora",
      "cargador frontal",
      "grúa",
    ],
    requiresOperator: true,
    content: `
      <div class="clause">
        <h4>OPERARIO CERTIFICADO</h4>
        <p>
          El operario asignado por el ARRENDADOR deberá:
        </p>
        <ul>
          <li>Poseer certificación vigente para la maquinaria específica</li>
          <li>Reportar diariamente el uso mediante la aplicación móvil con evidencia fotográfica
              del horómetro</li>
          <li>Cumplir estrictamente con las normas de seguridad del sitio</li>
          <li>Informar inmediatamente cualquier falla mecánica o condición insegura</li>
        </ul>
        <p>
          Los viáticos del operario son responsabilidad del ARRENDADOR y se encuentran incluidos
          en el precio pactado ({{operatorCostType}}: {{operatorCostRate}}/{{operatorCostUnit}}).
        </p>
      </div>
    `,
  },
  {
    code: "CLAUSE_MACHINERY_INSURANCE",
    name: "Seguro de Maquinaria Pesada",
    category: "insurance",
    order: 12,
    applicableAssetTypes: [
      "excavadora",
      "retroexcavadora",
      "bulldozer",
      "motoniveladora",
      "grúa",
    ],
    requiresOperator: false,
    minimumValue: 50000, // Solo si el contrato es > $50k
    content: `
      <div class="clause">
        <h4>COBERTURA DE SEGURO</h4>
        <p>
          El ARRENDADOR declara que la maquinaria cuenta con:
        </p>
        <ol>
          <li><strong>Seguro todo riesgo:</strong> Cobertura contra daño físico, robo, incendio</li>
          <li><strong>Deducible:</strong> El 10% del valor comercial con mínimo de $5,000 USD</li>
          <li><strong>Exclusiones:</strong> Negligencia grave, uso fuera de obra, operación
              por personal no autorizado</li>
        </ol>
        <p>
          En caso de siniestro, el ARRENDATARIO deberá cubrir el deducible y el ARRENDADOR
          realizará el trámite ante la aseguradora.
        </p>
      </div>
    `,
  },

  // ============================================
  // ANDAMIOS Y ESTRUCTURAS
  // ============================================
  {
    code: "CLAUSE_SCAFFOLDING_ASSEMBLY",
    name: "Montaje y Desmontaje de Andamios",
    category: "safety",
    order: 20,
    applicableAssetTypes: ["andamio", "andamio metálico", "andecen"],
    requiresOperator: false,
    content: `
      <div class="clause">
        <h4>ANDAMIOS - INSTALACIÓN</h4>
        <p>
          El montaje y desmontaje de andamios es responsabilidad del <strong>ARRENDATARIO</strong>,
          quien deberá:
        </p>
        <ul>
          <li>Contar con personal capacitado en montaje de estructuras temporales</li>
          <li>Seguir las instrucciones del fabricante y normas OSHA/locales</li>
          <li>Inspeccionar diariamente la estabilidad de la estructura</li>
          <li>No exceder la carga máxima especificada ({{maxLoad}} kg/m²)</li>
          <li>Instalar señalización de seguridad y barandas protectoras</li>
        </ul>
        <p>
          El ARRENDADOR no se hace responsable por accidentes derivados del montaje incorrecto.
        </p>
      </div>
    `,
  },

  // ============================================
  // VEHÍCULOS Y TRANSPORTE
  // ============================================
  {
    code: "CLAUSE_VEHICLE_LICENSE_INSURANCE",
    name: "Licencia y Seguro de Vehículos",
    category: "liability",
    order: 30,
    applicableAssetTypes: [
      "camión",
      "camioneta",
      "pickup",
      "volqueta",
      "minicargador",
    ],
    requiresOperator: false,
    content: `
      <div class="clause">
        <h4>VEHÍCULOS - REQUISITOS LEGALES</h4>
        <p>
          Para la operación de vehículos, el ARRENDATARIO deberá:
        </p>
        <ol>
          <li><strong>Conductor autorizado:</strong> Solo personal con licencia vigente
              categoría C1 o superior podrá operar el vehículo</li>
          <li><strong>SOAT vigente:</strong> El ARRENDADOR proveerá SOAT activo durante
              toda la duración del contrato</li>
          <li><strong>Estado del vehículo:</strong> El ARRENDATARIO recibirá el vehículo
              con tanque lleno y deberá devolverlo en las mismas condiciones</li>
          <li><strong>Multas de tránsito:</strong> Serán responsabilidad exclusiva del
              ARRENDATARIO</li>
          <li><strong>Mantenimiento preventivo:</strong> Cada 5,000 km o 30 días (lo que
              ocurra primero) deberá llevarse a revisión sin costo adicional</li>
        </ol>
      </div>
    `,
  },

  // ============================================
  // HERRAMIENTAS MENORES
  // ============================================
  {
    code: "CLAUSE_TOOL_CARE",
    name: "Cuidado de Herramientas Menores",
    category: "maintenance",
    order: 40,
    applicableAssetTypes: [
      "herramienta",
      "escalera",
      "carretilla",
      "compresor",
      "generador",
      "soldadora",
    ],
    requiresOperator: false,
    content: `
      <div class="clause">
        <h4>HERRAMIENTAS - USO Y CONSERVACIÓN</h4>
        <p>
          El ARRENDATARIO se compromete a:
        </p>
        <ul>
          <li>Usar las herramientas únicamente para el propósito diseñado</li>
          <li>Almacenarlas en lugar seco y seguro al finalizar cada jornada</li>
          <li>No realizar modificaciones ni reparaciones sin autorización escrita</li>
          <li>Reportar pérdida o robo dentro de las 24 horas</li>
          <li>Devolver en las mismas condiciones de limpieza y funcionamiento</li>
        </ul>
        <p>
          <strong>Penalización por pérdida:</strong> El ARRENDATARIO pagará el valor
          comercial actual de la herramienta más un 20% por gestión administrativa.
        </p>
      </div>
    `,
  },

  // ============================================
  // CONTRATOS DE ALTO VALOR
  // ============================================
  {
    code: "CLAUSE_HIGH_VALUE_GUARANTEE",
    name: "Garantía Adicional para Contratos de Alto Valor",
    category: "guarantee",
    order: 5,
    applicableAssetTypes: [],
    requiresOperator: false,
    minimumValue: 200000, // Solo para contratos > $200k
    content: `
      <div class="clause">
        <h4>GARANTÍA ADICIONAL</h4>
        <p>
          Dado el valor del presente contrato ({{contractTotal}} {{currency}}), el ARRENDATARIO
          deberá constituir una de las siguientes garantías:
        </p>
        <ol>
          <li><strong>Póliza de cumplimiento:</strong> Por el 10% del valor estimado del contrato</li>
          <li><strong>Carta de crédito stand-by:</strong> A favor del ARRENDADOR</li>
          <li><strong>Depósito en garantía:</strong> El 15% del valor estimado, reembolsable
              al finalizar sin novedad</li>
        </ol>
        <p>
          La garantía será liberada dentro de los 30 días siguientes a la terminación del
          contrato y previa liquidación final de la cuenta corriente.
        </p>
      </div>
    `,
  },
];
