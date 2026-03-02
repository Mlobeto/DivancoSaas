/**
 * CONTRACT TEMPLATE EDITOR V2.0
 * Editor modular para crear templates de contratos con secciones predefinidas
 */

import { useState } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  Settings,
  FileText,
  CreditCard,
  FileSignature,
  Package,
  List,
  Code,
  Layout,
} from "lucide-react";
import type {
  TemplateSection,
  SectionType,
  TemplateV2,
} from "../services/contract-template.service";

interface ContractTemplateEditorV2Props {
  value: TemplateV2;
  onChange: (value: TemplateV2) => void;
}

const SECTION_TYPES: Array<{
  type: SectionType;
  label: string;
  icon: any;
  description: string;
  defaultConfig: Record<string, any>;
}> = [
  {
    type: "header",
    label: "Encabezado",
    icon: Layout,
    description: "Logo, título y datos básicos del contrato",
    defaultConfig: {
      title: "CONTRATO DE ARRENDAMIENTO",
      showCompanyInfo: true,
    },
  },
  {
    type: "quotation_summary",
    label: "Resumen de Cotización",
    icon: FileText,
    description: "Hereda automáticamente datos de la cotización aprobada",
    defaultConfig: {
      showItems: true,
    },
  },
  {
    type: "contract_terms",
    label: "Términos del Contrato",
    icon: List,
    description: "Términos y condiciones estándar",
    defaultConfig: {
      terms: [
        "El presente contrato rige la relación de alquiler entre las partes.",
        "El cliente se compromete a pagar conforme a la cotización aprobada.",
        "Los activos deben ser devueltos en las mismas condiciones.",
      ],
    },
  },
  {
    type: "asset_clauses",
    label: "Cláusulas por Activo",
    icon: Package,
    description: "Cláusulas dinámicas según tipos de activo",
    defaultConfig: {},
  },
  {
    type: "payment_proof",
    label: "Comprobante de Pago",
    icon: CreditCard,
    description: "Sección para upload o marca de pago local",
    defaultConfig: {
      instructions: "Debe cargar el comprobante antes de la firma.",
      allowLocalPayment: true,
    },
  },
  {
    type: "signatures",
    label: "Firmas Digitales",
    icon: FileSignature,
    description: "Zona de firmas (integración SignNow)",
    defaultConfig: {
      signNowEnabled: true,
      signatories: [
        { role: "Arrendador", name: "{{tenant.name}}" },
        { role: "Arrendatario", name: "{{client.fullName}}" },
      ],
    },
  },
  {
    type: "custom_html",
    label: "HTML Personalizado",
    icon: Code,
    description: "Contenido HTML personalizado con variables",
    defaultConfig: {
      html: "<div><h3>Sección Personalizada</h3><p>Contenido...</p></div>",
    },
  },
];

export function ContractTemplateEditorV2({
  value,
  onChange,
}: ContractTemplateEditorV2Props) {
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const addSection = (type: SectionType) => {
    const sectionType = SECTION_TYPES.find((s) => s.type === type);
    if (!sectionType) return;

    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      type,
      order: value.sections.length + 1,
      title: sectionType.label,
      isRequired: true,
      config: { ...sectionType.defaultConfig },
    };

    onChange({
      ...value,
      sections: [...value.sections, newSection],
    });
  };

  const removeSection = (sectionId: string) => {
    const filtered = value.sections.filter((s) => s.id !== sectionId);
    // Reordenar
    const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChange({
      ...value,
      sections: reordered,
    });
  };

  const moveSection = (sectionId: string, direction: "up" | "down") => {
    const index = value.sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === value.sections.length - 1) return;

    const newSections = [...value.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];

    // Update order
    const reordered = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));

    onChange({
      ...value,
      sections: reordered,
    });
  };

  const updateSection = (
    sectionId: string,
    updates: Partial<TemplateSection>,
  ) => {
    onChange({
      ...value,
      sections: value.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s,
      ),
    });
  };

  const getSectionIcon = (type: SectionType) => {
    const sectionType = SECTION_TYPES.find((s) => s.type === type);
    return sectionType?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Section List */}
      <div className="space-y-3">
        {value.sections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => (
            <div
              key={section.id}
              className="rounded-lg border border-gray-700 bg-gray-800/50 p-4"
            >
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div className="pt-1 text-gray-500">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Section Icon */}
                <div className="rounded bg-blue-500/20 p-2 text-blue-400">
                  {(() => {
                    const Icon = getSectionIcon(section.type);
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>

                {/* Section Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        {section.title}
                      </h4>
                      <p className="text-sm text-gray-400">{section.type}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      Orden: {section.order}
                    </span>
                  </div>

                  {/* Editing Panel */}
                  {editingSection === section.id && (
                    <div className="mt-4 space-y-3 rounded-lg border border-gray-600 bg-gray-900/50 p-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-300">
                          Título de la Sección
                        </label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) =>
                            updateSection(section.id, { title: e.target.value })
                          }
                          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${section.id}`}
                          checked={section.isRequired}
                          onChange={(e) =>
                            updateSection(section.id, {
                              isRequired: e.target.checked,
                            })
                          }
                          className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`required-${section.id}`}
                          className="text-sm text-gray-300"
                        >
                          Sección requerida
                        </label>
                      </div>

                      {/* Section-specific config */}
                      <SectionConfigEditor
                        section={section}
                        onChange={(config) =>
                          updateSection(section.id, { config })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => moveSection(section.id, "up")}
                    disabled={index === 0}
                    className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30"
                    title="Mover arriba"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveSection(section.id, "down")}
                    disabled={index === value.sections.length - 1}
                    className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30"
                    title="Mover abajo"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      setEditingSection(
                        editingSection === section.id ? null : section.id,
                      )
                    }
                    className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-blue-400"
                    title="Configurar"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeSection(section.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-red-400"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Add Section Menu */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
          <Plus className="h-4 w-4" />
          Agregar Sección
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {SECTION_TYPES.map((sectionType) => (
            <button
              key={sectionType.type}
              onClick={() => addSection(sectionType.type)}
              className="group flex items-start gap-3 rounded-lg border border-gray-600 bg-gray-900/50 p-3 text-left transition hover:border-blue-500 hover:bg-blue-500/10"
            >
              <div className="rounded bg-gray-700 p-2 text-gray-400 group-hover:bg-blue-500/20 group-hover:text-blue-400">
                <sectionType.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {sectionType.label}
                </p>
                <p className="text-xs text-gray-500">
                  {sectionType.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Section Config Editor - Configuración específica por tipo de sección
 */
function SectionConfigEditor({
  section,
  onChange,
}: {
  section: TemplateSection;
  onChange: (config: Record<string, any>) => void;
}) {
  const updateConfig = (key: string, value: any) => {
    onChange({
      ...section.config,
      [key]: value,
    });
  };

  switch (section.type) {
    case "header":
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Título</label>
            <input
              type="text"
              value={section.config.title || ""}
              onChange={(e) => updateConfig("title", e.target.value)}
              placeholder="CONTRATO DE ARRENDAMIENTO"
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.config.showCompanyInfo || false}
              onChange={(e) =>
                updateConfig("showCompanyInfo", e.target.checked)
              }
              className="rounded border-gray-600 bg-gray-800 text-blue-600"
            />
            <label className="text-sm text-gray-400">
              Mostrar información de la empresa
            </label>
          </div>
        </div>
      );

    case "quotation_summary":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={section.config.showItems || false}
            onChange={(e) => updateConfig("showItems", e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-blue-600"
          />
          <label className="text-sm text-gray-400">
            Mostrar tabla de items
          </label>
        </div>
      );

    case "contract_terms":
      return (
        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Términos (uno por línea)
          </label>
          <textarea
            value={(section.config.terms || []).join("\n")}
            onChange={(e) =>
              updateConfig(
                "terms",
                e.target.value.split("\n").filter((t) => t.trim()),
              )
            }
            rows={5}
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
          />
        </div>
      );

    case "payment_proof":
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">
              Instrucciones
            </label>
            <textarea
              value={section.config.instructions || ""}
              onChange={(e) => updateConfig("instructions", e.target.value)}
              rows={2}
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.config.allowLocalPayment || false}
              onChange={(e) =>
                updateConfig("allowLocalPayment", e.target.checked)
              }
              className="rounded border-gray-600 bg-gray-800 text-blue-600"
            />
            <label className="text-sm text-gray-400">
              Permitir pago local/efectivo
            </label>
          </div>
        </div>
      );

    case "signatures":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={section.config.signNowEnabled || false}
            onChange={(e) => updateConfig("signNowEnabled", e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-blue-600"
          />
          <label className="text-sm text-gray-400">
            Habilitar integración SignNow
          </label>
        </div>
      );

    case "custom_html":
      return (
        <div>
          <label className="mb-2 block text-sm text-gray-400">
            HTML (soporta Handlebars)
          </label>
          <textarea
            value={section.config.html || ""}
            onChange={(e) => updateConfig("html", e.target.value)}
            rows={8}
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 font-mono text-xs text-white"
            placeholder="<div><h3>{{title}}</h3><p>{{content}}</p></div>"
          />
          <p className="mt-1 text-xs text-gray-500">
            Variables disponibles: contract, client, tenant, quotation, etc.
          </p>
        </div>
      );

    case "asset_clauses":
      return (
        <p className="text-sm text-gray-500">
          Las cláusulas se cargan automáticamente según los tipos de activo.
        </p>
      );

    default:
      return null;
  }
}
