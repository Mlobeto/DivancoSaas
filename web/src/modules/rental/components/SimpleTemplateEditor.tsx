/**
 * SimpleTemplateEditor
 * Constructor visual de plantillas con bloques predefinidos
 * Los bloques se ven directamente renderizados, sin código HTML visible
 */

import { useState } from "react";
import {
  User,
  FileText,
  List,
  DollarSign,
  FileCheck,
  CreditCard,
  FileSignature,
  Trash2,
  Eye,
  Code,
  Truck,
  UserCog,
} from "lucide-react";

interface SimpleTemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
  templateType:
    | "quotation"
    | "quotation_rental"
    | "quotation_service"
    | "contract"
    | "contract_report"
    | "attachment";
  fontFamily?: string;
}

// Bloques HTML predefinidos (fuera del componente para evitar errores de TypeScript)
const BLOCK_CLIENTE = String.raw`<div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
  <h3 style="margin: 0 0 10px 0; color: #1f2937;">Cotizado a:</h3>
  <p style="margin: 0; line-height: 1.6; color: #374151;">
    <strong>{{clientName}}</strong><br>
    {{clientDocument}}<br>
    {{clientEmail}} | {{clientPhone}}<br>
    {{clientAddress}}
  </p>
</div>`;

const BLOCK_INFO_COTIZACION = String.raw`<h2 style="color: #1e40af; margin: 20px 0 10px 0; font-size: 24px;">Cotización {{quotationCode}}</h2>

<p style="margin: 10px 0; padding: 12px; background: #eff6ff; border-radius: 4px; line-height: 1.6; color: #1f2937;">
  <strong>Fecha:</strong> {{formatDate createdAt}}<br>
  <strong>Válida hasta:</strong> {{formatDate validUntil}}<br>
  <strong>Duración estimada:</strong> {{estimatedDays}} días
</p>`;

const BLOCK_TABLA_ITEMS = String.raw`<h3 style="margin: 30px 0 15px 0; color: #1f2937;">Detalle de Items - Modalidades de Alquiler</h3>
<p style="margin: 10px 0; color: #6b7280; font-size: 14px;">Cotizado a {{estimatedDays}} días. El cliente puede elegir la modalidad que prefiera al aprobar.</p>
{{#each items}}
<div style="margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa;">
  <h4 style="margin: 0 0 10px 0; color: #1f2937;">{{assetName}} {{#if assetCode}}<small style="color: #6b7280;">({{assetCode}})</small>{{/if}}</h4>
  {{#if description}}<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">{{description}}</p>{{/if}}
  <p style="margin: 5px 0; font-size: 14px; color: #374151;"><strong>Cantidad:</strong> {{quantity}} unidades</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 14px;">
    <thead>
      <tr style="background: #f3f4f6;">
        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Modalidad</th>
        <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Precio Base</th>
        {{#if operatorIncluded}}<th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">+ Operario</th>{{/if}}
        <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total Unitario</th>
      </tr>
    </thead>
    <tbody>
      {{#if selectedPeriods.daily}}
      <tr style="border-bottom: 1px solid #e5e7eb; background: #dbeafe;">
        <td style="padding: 8px;"><strong>📅 Por Día</strong></td>
        <td style="padding: 8px; text-align: right;">{{formatCurrency pricePerDay}}</td>
        {{#if operatorIncluded}}<td style="padding: 8px; text-align: right; color: #6b7280;">{{formatCurrency operatorCostPerDay}}</td>{{/if}}
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #1e40af;">{{formatCurrency totalPerDay}}</td>
      </tr>
      {{/if}}
      {{#if selectedPeriods.weekly}}
      <tr style="border-bottom: 1px solid #e5e7eb; background: #d1fae5;">
        <td style="padding: 8px;"><strong>📆 Por Semana</strong></td>
        <td style="padding: 8px; text-align: right;">{{formatCurrency pricePerWeek}}</td>
        {{#if operatorIncluded}}<td style="padding: 8px; text-align: right; color: #6b7280;">{{formatCurrency operatorCostPerWeek}}</td>{{/if}}
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #059669;">{{formatCurrency totalPerWeek}}</td>
      </tr>
      {{/if}}
      {{#if selectedPeriods.monthly}}
      <tr style="border-bottom: 1px solid #e5e7eb; background: #e9d5ff;">
        <td style="padding: 8px;"><strong>📅 Por Mes</strong></td>
        <td style="padding: 8px; text-align: right;">{{formatCurrency pricePerMonth}}</td>
        {{#if operatorIncluded}}<td style="padding: 8px; text-align: right; color: #6b7280;">{{formatCurrency operatorCostPerMonth}}</td>{{/if}}
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #7c3aed;">{{formatCurrency totalPerMonth}}</td>
      </tr>
      {{/if}}
    </tbody>
  </table>
</div>
{{/each}}`;

const BLOCK_TOTALES = String.raw`<h3 style="margin: 30px 0 15px 0; color: #1f2937;">Totales por Modalidad</h3>
<p style="margin: 10px 0 20px 0; color: #6b7280; font-size: 14px;">El cliente podrá elegir la modalidad que prefiera al aprobar la cotización.</p>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 15px 0;">
  {{#if totals.daily.hasItems}}
  <div style="padding: 20px; background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px;">
    <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📅 Modalidad Diaria</h4>
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="padding: 5px 0; color: #374151;">Subtotal:</td>
        <td style="padding: 5px 0; text-align: right; font-weight: bold;">{{formatCurrency totals.daily.subtotal}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #374151;">IVA ({{taxRate}}%):</td>
        <td style="padding: 5px 0; text-align: right; font-weight: bold;">{{formatCurrency totals.daily.tax}}</td>
      </tr>
      <tr style="border-top: 2px solid #3b82f6;">
        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #1e40af;">TOTAL:</td>
        <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #1e40af;">{{formatCurrency totals.daily.total}}</td>
      </tr>
    </table>
  </div>
  {{/if}}
  {{#if totals.weekly.hasItems}}
  <div style="padding: 20px; background: #d1fae5; border: 2px solid #10b981; border-radius: 8px;">
    <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 16px;">📆 Modalidad Semanal</h4>
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="padding: 5px 0; color: #374151;">Subtotal:</td>
        <td style="padding: 5px 0; text-align: right; font-weight: bold;">{{formatCurrency totals.weekly.subtotal}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #374151;">IVA ({{taxRate}}%):</td>
        <td style="padding: 5px 0; text-align: right; font-weight: bold;">{{formatCurrency totals.weekly.tax}}</td>
      </tr>
      <tr style="border-top: 2px solid #10b981;">
        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #059669;">TOTAL:</td>
        <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">{{formatCurrency totals.weekly.total}}</td>
      </tr>
    </table>
  </div>
  {{/if}}
  {{#if totals.monthly.hasItems}}
  <div style="padding: 20px; background: #e9d5ff; border: 2px solid #a855f7; border-radius: 8px;">
    <h4 style="margin: 0 0 10px 0; color: #7c3aed; font-size: 16px;">📅 Modalidad Mensual</h4>
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="padding: 5px 0; color: #374151;">Subtotal:</td>
        <td style="padding: 5px 0; text-align: right; font-weight: bold;">{{formatCurrency totals.monthly.subtotal}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #374151;">IVA ({{taxRate}}%):</td>
        <td style="padding: 5px 0; text-align: right; font-weight: bold;">{{formatCurrency totals.monthly.tax}}</td>
      </tr>
      <tr style="border-top: 2px solid #a855f7;">
        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #7c3aed;">TOTAL:</td>
        <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #7c3aed;">{{formatCurrency totals.monthly.total}}</td>
      </tr>
    </table>
  </div>
  {{/if}}
</div>`;

const BLOCK_CLAUSULAS = String.raw`<div style="margin: 30px 0; padding: 20px; border-left: 4px solid #1e40af; background: #eff6ff; border-radius: 4px;">
  <h3 style="margin: 0 0 15px 0; color: #1e40af;">Términos y Condiciones</h3>
  <ol style="margin: 0; padding-left: 20px; line-height: 1.8; color: #374151;">
    <li>Esta cotización tiene una validez hasta {{formatDate validUntil}}.</li>
    <li>Los precios están expresados en {{currency}} y no incluyen IVA.</li>
    <li>El arrendamiento tiene una duración estimada de {{estimatedDays}} días. El cliente seleccionará la modalidad de pago (día/semana/mes) al aprobar.</li>
    <li>Se requiere un depósito de garantía del 20% al momento de la firma del contrato.</li>
    <li>El pago debe realizarse según la modalidad acordada al momento de la aprobación.</li>
  </ol>
</div>`;

const BLOCK_FORMA_PAGO = String.raw`<div style="margin: 30px 0; padding: 20px; background: #fefce8; border: 1px solid #fde047; border-radius: 8px;">
  <h3 style="margin: 0 0 15px 0; color: #854d0e;">💳 Formas de Pago</h3>
  <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #374151;">
    <li><strong>Transferencia bancaria:</strong> Banco [Nombre] - Cuenta [Número]</li>
    <li><strong>Efectivo:</strong> En nuestras oficinas</li>
    <li><strong>Cheque:</strong> A nombre de [Empresa]</li>
    <li><strong>Tarjeta de crédito:</strong> Con recargo del 3%</li>
  </ul>
</div>`;

const BLOCK_FIRMA = String.raw`<div style="margin: 60px 0 30px 0; text-align: center;">
  <hr style="border: none; border-top: 2px solid #000; width: 300px; margin: 0 auto;">
  <p style="margin: 15px 0 5px 0; font-weight: 600; color: #1f2937;"><strong>{{clientName}}</strong></p>
  <p style="margin: 0; color: #6b7280; font-size: 14px;">Firma y sello</p>
</div>`;

const BLOCK_TRANSPORTE = String.raw`<h3 style="margin: 30px 0 15px 0; color: #1f2937;">🚚 Costos de Transporte</h3>
<div style="margin: 15px 0; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #fbbf24;">
        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #f59e0b; color: #78350f;">Descripción</th>
        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #f59e0b; color: #78350f;">Cantidad</th>
        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #f59e0b; color: #78350f;">Costo</th>
      </tr>
    </thead>
    <tbody>
      {{#each transportItems}}
      <tr style="border-bottom: 1px solid #fcd34d;">
        <td style="padding: 10px;">
          <strong>{{description}}</strong>
          {{#if details}}<br><small style="color: #92400e;">{{details}}</small>{{/if}}
        </td>
        <td style="padding: 10px; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">{{formatCurrency cost}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #f59e0b; text-align: right;">
    <strong style="color: #78350f; font-size: 16px;">Total Transporte: {{formatCurrency totalTransport}}</strong>
  </div>
</div>`;

const BLOCK_OPERARIO = String.raw`<h3 style="margin: 30px 0 15px 0; color: #1f2937;">👷 Costos de Operarios</h3>
<div style="margin: 15px 0; padding: 20px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #93c5fd;">
        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #3b82f6; color: #1e3a8a;">Operario / Servicio</th>
        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #3b82f6; color: #1e3a8a;">Modalidad</th>
        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #3b82f6; color: #1e3a8a;">Cantidad</th>
        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #3b82f6; color: #1e3a8a;">Costo</th>
      </tr>
    </thead>
    <tbody>
      {{#each operatorItems}}
      <tr style="border-bottom: 1px solid #bfdbfe;">
        <td style="padding: 10px;">
          <strong>{{name}}</strong>
          {{#if description}}<br><small style="color: #1e40af;">{{description}}</small>{{/if}}
        </td>
        <td style="padding: 10px; text-align: center;">
          <span style="padding: 3px 8px; background: #eff6ff; border-radius: 4px; font-size: 12px; color: #1e40af;">
            {{#if isPerHour}}⏱️ Por Hora{{else}}💰 Por Día{{/if}}
          </span>
        </td>
        <td style="padding: 10px; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">{{formatCurrency cost}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #3b82f6; text-align: right;">
    <strong style="color: #1e40af; font-size: 16px;">Total Operarios: {{formatCurrency totalOperators}}</strong>
  </div>
</div>`;

export function SimpleTemplateEditor({
  content,
  onChange,
  fontFamily = "Inter",
}: SimpleTemplateEditorProps) {
  const [showCode, setShowCode] = useState(false);

  const handleInsertBlock = (blockHtml: string) => {
    onChange(content + "\n\n" + blockHtml);
  };

  const handleClearContent = () => {
    if (confirm("¿Estás seguro de que quieres borrar todo el contenido?")) {
      onChange("");
    }
  };

  // Definición de bloques usando las constantes
  const blocks = [
    {
      name: "Datos de Cliente",
      icon: User,
      description: "Información completa del cliente",
      html: BLOCK_CLIENTE,
    },
    {
      name: "Información de Cotización",
      icon: FileCheck,
      description: "Código y duración estimada",
      html: BLOCK_INFO_COTIZACION,
    },
    {
      name: "Tabla de Items",
      icon: List,
      description: "Assets con modalidades de alquiler (día/semana/mes)",
      html: BLOCK_TABLA_ITEMS,
    },
    {
      name: "Transporte",
      icon: Truck,
      description: "Costos de transporte y logística",
      html: BLOCK_TRANSPORTE,
    },
    {
      name: "Operarios",
      icon: UserCog,
      description: "Costos de operarios y servicios adicionales",
      html: BLOCK_OPERARIO,
    },
    {
      name: "Totales",
      icon: DollarSign,
      description: "Totales por modalidad (3 opciones)",
      html: BLOCK_TOTALES,
    },
    {
      name: "Cláusulas",
      icon: FileText,
      description: "Términos y condiciones de la cotización",
      html: BLOCK_CLAUSULAS,
    },
    {
      name: "Forma de Pago",
      icon: CreditCard,
      description: "Métodos de pago disponibles",
      html: BLOCK_FORMA_PAGO,
    },
    {
      name: "Firma",
      icon: FileSignature,
      description: "Sección para firma del cliente",
      html: BLOCK_FIRMA,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Sidebar: Solo Bloques Predefinidos */}
      <div className="lg:col-span-1">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <List className="w-5 h-5 text-primary-400" />
            Bloques Predefinidos
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Haz click para insertar secciones completas en tu plantilla
          </p>

          <div className="space-y-2">
            {blocks.map((block) => (
              <button
                type="button"
                key={block.name}
                onClick={() => handleInsertBlock(block.html)}
                className="w-full text-left px-4 py-3 rounded-lg border border-dark-700 hover:border-primary-500 hover:bg-dark-800/50 bg-dark-800 transition-all group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <block.icon className="w-5 h-5 text-primary-400 group-hover:text-primary-300" />
                  <span className="text-sm font-semibold text-gray-200">
                    {block.name}
                  </span>
                </div>
                <div className="text-xs text-gray-400 pl-8">
                  {block.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Vista Previa Visual */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-400" />
              Vista Previa de tu Plantilla
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="btn-ghost text-xs"
              >
                <Code className="w-4 h-4 mr-1" />
                {showCode ? "Ocultar" : "Ver"} Código
              </button>
              {content && (
                <button
                  type="button"
                  onClick={handleClearContent}
                  className="btn-ghost text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpiar Todo
                </button>
              )}
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-sm text-blue-300">
              💡{" "}
              <strong>
                Vista previa en tiempo real con tu fuente seleccionada
              </strong>
            </p>
            <p className="text-xs text-blue-300/80 mt-1">
              Inserta bloques desde el panel izquierdo. Estás viendo la fuente{" "}
              <strong>{fontFamily}</strong> que configuraste en Branding. Los
              colores, logo y estilos finales se aplicarán al generar el PDF.
            </p>
          </div>

          {showCode ? (
            // Modo código (avanzado)
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-[600px] px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg font-mono text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Código HTML (modo avanzado)..."
            />
          ) : (
            // Vista previa visual (modo predeterminado)
            <div className="border border-dark-700 rounded-lg bg-white overflow-hidden">
              {content ? (
                <div
                  className="p-8 min-h-[600px] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                  style={{
                    color: "#1f2937",
                    fontFamily: fontFamily,
                  }}
                />
              ) : (
                <div className="p-8 min-h-[600px] flex items-center justify-center">
                  <div
                    className="text-center text-gray-400"
                    style={{ fontFamily }}
                  >
                    <List className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-2">Plantilla vacía</p>
                    <p className="text-sm">
                      Haz click en los bloques del panel izquierdo para empezar
                      a construir tu plantilla
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
