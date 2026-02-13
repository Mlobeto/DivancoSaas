import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Table as TableIcon,
  Quote,
  Undo,
  Redo,
  Type,
  Plus,
} from "lucide-react";
import { useState } from "react";

interface RichTemplateEditorProps {
  content: string;
  onChange: (html: string) => void;
  templateType: "quotation" | "contract" | "contract_report" | "attachment";
}

export function RichTemplateEditor({
  content,
  onChange,
  templateType,
}: RichTemplateEditorProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || "<p>Escribe aquí el contenido de tu plantilla...</p>",
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 bg-white rounded-lg text-gray-900",
      },
    },
  });

  // Variables disponibles según tipo de plantilla
  const getVariablesByType = () => {
    const commonVariables = [
      { label: "Nombre Empresa", value: "{{companyName}}" },
      { label: "Nombre Cliente", value: "{{clientName}}" },
      { label: "Email Cliente", value: "{{clientEmail}}" },
      { label: "Teléfono Cliente", value: "{{clientPhone}}" },
      { label: "Fecha Actual", value: "{{formatDate createdAt}}" },
    ];

    if (templateType === "quotation") {
      return [
        ...commonVariables,
        { label: "Código Cotización", value: "{{quotationCode}}" },
        { label: "Fecha Inicio", value: "{{formatDate estimatedStartDate}}" },
        { label: "Fecha Fin", value: "{{formatDate estimatedEndDate}}" },
        { label: "Días Totales", value: "{{estimatedDays}}" },
        { label: "Subtotal", value: "{{formatCurrency subtotal}}" },
        { label: "IVA", value: "{{formatCurrency taxAmount}}" },
        { label: "Total", value: "{{formatCurrency total}}" },
      ];
    }

    if (templateType === "contract") {
      return [
        ...commonVariables,
        { label: "Código Contrato", value: "{{contractCode}}" },
        { label: "Fecha Inicio", value: "{{formatDate startDate}}" },
        { label: "Fecha Fin", value: "{{formatDate endDate}}" },
        { label: "Duración", value: "{{duration}}" },
        { label: "Valor Total", value: "{{formatCurrency totalAmount}}" },
      ];
    }

    if (templateType === "contract_report") {
      return [
        ...commonVariables,
        { label: "Código Contrato", value: "{{contractCode}}" },
        { label: "Estado Contrato", value: "{{status}}" },
        { label: "Fecha Reporte", value: "{{formatDate reportDate}}" },
        { label: "Equipos Activos", value: "{{activeAssets}}" },
        { label: "Total Facturado", value: "{{formatCurrency totalBilled}}" },
        {
          label: "Saldo Pendiente",
          value: "{{formatCurrency pendingBalance}}",
        },
      ];
    }

    return commonVariables;
  };

  // Bloques predefinidos
  const predefinedBlocks = {
    quotation: [
      {
        name: "Tabla de Items",
        html: `
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Descripción</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Días</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Precio Unit.</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
    <tr>
      <td style="border: 1px solid #ddd; padding: 12px;">{{assetName}}</td>
      <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">{{rentalDays}}</td>
      <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">{{formatCurrency unitPrice}}</td>
      <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">{{formatCurrency subtotal}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>
        `,
      },
      {
        name: "Resumen de Totales",
        html: `
<div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; max-width: 400px; margin-left: auto;">
  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
    <strong>Subtotal:</strong>
    <span>{{formatCurrency subtotal}}</span>
  </div>
  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
    <strong>IVA ({{taxRate}}%):</strong>
    <span>{{formatCurrency taxAmount}}</span>
  </div>
  <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd; font-size: 18px;">
    <strong>Total:</strong>
    <strong style="color: #1e40af;">{{formatCurrency total}}</strong>
  </div>
</div>
        `,
      },
    ],
    contract: [
      {
        name: "Cláusula de Pago",
        html: `
<h3>CLÁUSULA DE PAGO</h3>
<p>El ARRENDATARIO se obliga a pagar al ARRENDADOR la suma de {{formatCurrency totalAmount}} por concepto de arriendo de los equipos descritos en el presente contrato.</p>
<p>El pago se realizará de la siguiente forma:</p>
<ul>
  <li>Forma de pago: [Especificar]</li>
  <li>Periodicidad: [Especificar]</li>
  <li>Fecha límite de pago: [Especificar]</li>
</ul>
        `,
      },
      {
        name: "Cláusula de Duración",
        html: `
<h3>CLÁUSULA DE DURACIÓN</h3>
<p>El presente contrato tendrá una duración de {{duration}} días, iniciando el {{formatDate startDate}} y finalizando el {{formatDate endDate}}.</p>
<p>El contrato podrá ser renovado previo acuerdo entre las partes y con una antelación mínima de [X] días.</p>
        `,
      },
      {
        name: "Cláusula de Responsabilidad",
        html: `
<h3>CLÁUSULA DE RESPONSABILIDAD</h3>
<p>El ARRENDATARIO será responsable del cuidado, mantenimiento y correcta utilización de los equipos arrendados durante el período de vigencia del contrato.</p>
<p>En caso de daño, pérdida o deterioro imputable al ARRENDATARIO, este deberá:</p>
<ul>
  <li>Notificar inmediatamente al ARRENDADOR</li>
  <li>Asumir los costos de reparación o reposición</li>
  <li>Indemnizar al ARRENDADOR por lucro cesante si aplica</li>
</ul>
        `,
      },
      {
        name: "Cláusula de Terminación",
        html: `
<h3>CLÁUSULA DE TERMINACIÓN</h3>
<p>El presente contrato podrá terminarse anticipadamente por las siguientes causales:</p>
<ol>
  <li>Mutuo acuerdo entre las partes</li>
  <li>Incumplimiento de las obligaciones contractuales</li>
  <li>Fuerza mayor o caso fortuito</li>
</ol>
<p>En caso de terminación anticipada, el ARRENDATARIO deberá devolver los equipos en las mismas condiciones en que fueron recibidos.</p>
        `,
      },
    ],
    contract_report: [
      {
        name: "Estado del Contrato",
        html: `
<div style="padding: 20px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; margin: 20px 0;">
  <h3 style="margin-top: 0;">Estado del Contrato</h3>
  <p><strong>Código:</strong> {{contractCode}}</p>
  <p><strong>Estado:</strong> {{status}}</p>
  <p><strong>Fecha del Reporte:</strong> {{formatDate reportDate}}</p>
  <p><strong>Equipos Activos:</strong> {{activeAssets}}</p>
</div>
        `,
      },
      {
        name: "Resumen Financiero",
        html: `
<div style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; margin: 20px 0;">
  <h3 style="margin-top: 0;">Resumen Financiero</h3>
  <p><strong>Total Facturado:</strong> {{formatCurrency totalBilled}}</p>
  <p><strong>Saldo Pendiente:</strong> {{formatCurrency pendingBalance}}</p>
  <p><strong>Próximo Pago:</strong> {{formatDate nextPaymentDate}}</p>
</div>
        `,
      },
    ],
    attachment: [],
  };

  const insertVariable = (variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent(variable).run();
      setShowVariables(false);
    }
  };

  const insertBlock = (html: string) => {
    if (editor) {
      editor.chain().focus().insertContent(html).run();
      setShowBlocks(false);
    }
  };

  const insertTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  if (!editor) {
    return <div className="text-gray-400">Cargando editor...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-dark-700 p-3 rounded-lg border border-dark-600 space-y-3">
        {/* Format Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive("bold")
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Negrita"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive("italic")
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Cursiva"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive("underline")
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Subrayado"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-dark-600" />

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive("heading", { level: 1 })
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Título 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive("heading", { level: 2 })
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Título 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-dark-600" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive("bulletList")
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Lista"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive("orderedList")
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Lista Numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-dark-600" />

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive({ textAlign: "left" })
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Alinear Izquierda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive({ textAlign: "center" })
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Centrar"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive({ textAlign: "right" })
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Alinear Derecha"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-dark-600" />

          <button
            type="button"
            onClick={insertTable}
            className="p-2 rounded hover:bg-dark-600 transition-colors text-gray-300"
            title="Insertar Tabla"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-dark-600 transition-colors ${
              editor.isActive("blockquote")
                ? "bg-primary-600 text-white"
                : "text-gray-300"
            }`}
            title="Cita"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-dark-600" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-dark-600 transition-colors text-gray-300 disabled:opacity-30"
            title="Deshacer"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-dark-600 transition-colors text-gray-300 disabled:opacity-30"
            title="Rehacer"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Variables & Blocks */}
        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVariables(!showVariables)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Type className="w-4 h-4" />
              Insertar Variable
            </button>
            {showVariables && (
              <div className="absolute top-full mt-2 left-0 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-10 w-64 max-h-80 overflow-y-auto">
                <div className="p-2">
                  {getVariablesByType().map((variable, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertVariable(variable.value)}
                      className="w-full text-left px-3 py-2 hover:bg-dark-700 rounded text-sm text-gray-300"
                    >
                      <div className="font-medium">{variable.label}</div>
                      <div className="text-xs text-gray-500">
                        {variable.value}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {predefinedBlocks[templateType].length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBlocks(!showBlocks)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Insertar Bloque
              </button>
              {showBlocks && (
                <div className="absolute top-full mt-2 left-0 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-10 w-72 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    {predefinedBlocks[templateType].map((block, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => insertBlock(block.html)}
                        className="w-full text-left px-3 py-2 hover:bg-dark-700 rounded text-sm text-gray-300 border-b border-dark-600 last:border-0"
                      >
                        {block.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="border border-dark-600 rounded-lg overflow-hidden">
        <EditorContent editor={editor} />
      </div>

      {/* Helper Text */}
      <div className="text-xs text-gray-500 bg-dark-800 p-3 rounded-lg">
        <p className="mb-1">
          💡 <strong>Consejos:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Usa las <strong>variables</strong> para insertar datos dinámicos
            como nombre del cliente, fechas, etc.
          </li>
          <li>
            Los <strong>bloques predefinidos</strong> incluyen estructuras
            comunes ya formateadas.
          </li>
          <li>
            Puedes editar libremente el texto, agregar imágenes y personalizar
            todo el contenido.
          </li>
        </ul>
      </div>
    </div>
  );
}
