/**
 * EmailLayoutTab
 * Tab for managing email templates
 */

import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Save, Star, Power, Trash2 } from "lucide-react";
import { emailTemplateApi } from "@/core/services/email-template.api";
import type { EmailTemplate } from "@/core/types/email-template.types";

interface EmailLayoutTabProps {
  businessUnitId: string;
}

interface EmailTypeOption {
  id: string;
  label: string;
  description: string;
}

interface EmailTemplateFormData {
  name: string;
  description: string;
  subject: string;
  fromName: string;
  replyToEmail: string;
  preheader: string;
  htmlContent: string;
  textContent: string;
  useBranding: boolean;
  isActive: boolean;
}

const EMAIL_TYPES: EmailTypeOption[] = [
  {
    id: "welcome",
    label: "Bienvenida",
    description: "Email de bienvenida a nuevos clientes",
  },
  {
    id: "quotation_sent",
    label: "Cotización Enviada",
    description: "Notificación de cotización",
  },
  {
    id: "contract_signed",
    label: "Contrato Firmado",
    description: "Confirmación de contrato",
  },
  {
    id: "payment_reminder",
    label: "Recordatorio de Pago",
    description: "Recordatorio de pago pendiente",
  },
  { id: "invoice", label: "Factura", description: "Envío de factura" },
];

const EMPTY_FORM: EmailTemplateFormData = {
  name: "",
  description: "",
  subject: "",
  fromName: "",
  replyToEmail: "",
  preheader: "",
  htmlContent: "",
  textContent: "",
  useBranding: true,
  isActive: true,
};

function toFormData(template: EmailTemplate): EmailTemplateFormData {
  return {
    name: template.name || "",
    description: template.description || "",
    subject: template.subject || "",
    fromName: template.fromName || "",
    replyToEmail: template.replyToEmail || "",
    preheader: template.preheader || "",
    htmlContent: template.htmlContent || "",
    textContent: template.textContent || "",
    useBranding: template.useBranding,
    isActive: template.isActive,
  };
}

export function EmailLayoutTab({ businessUnitId }: EmailLayoutTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<string>("quotation_sent");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState<EmailTemplateFormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return (
      templates.find((template) => template.id === selectedTemplateId) || null
    );
  }, [templates, selectedTemplateId]);

  const templatesForType = useMemo(
    () => templates.filter((template) => template.emailType === selectedType),
    [templates, selectedType],
  );

  const activeCountByType = useMemo(() => {
    const counters = new Map<string, number>();
    for (const template of templates) {
      if (!template.isActive) continue;
      counters.set(
        template.emailType,
        (counters.get(template.emailType) || 0) + 1,
      );
    }
    return counters;
  }, [templates]);

  const isLastActiveTemplateForType = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.isActive) return false;
    const activeCount = templatesForType.filter(
      (template) => template.isActive,
    ).length;
    return activeCount <= 1;
  }, [selectedTemplate, templatesForType]);

  const isLastActiveTemplate = (template: EmailTemplate) => {
    if (!template.isActive) return false;
    return (activeCountByType.get(template.emailType) || 0) <= 1;
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emailTemplateApi.list(businessUnitId);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "No se pudieron cargar plantillas",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [businessUnitId]);

  useEffect(() => {
    if (templatesForType.length === 0) {
      setSelectedTemplateId(null);
      setFormData({
        ...EMPTY_FORM,
        name: `Plantilla ${selectedType}`,
      });
      return;
    }

    const current = templatesForType.find((t) => t.id === selectedTemplateId);
    const next =
      current ||
      templatesForType.find((t) => t.isDefault) ||
      templatesForType[0];
    setSelectedTemplateId(next.id);
    setFormData(toFormData(next));
  }, [selectedType, templates]);

  const handleCreateForType = () => {
    setSelectedTemplateId(null);
    setFormData({
      ...EMPTY_FORM,
      name: `Plantilla ${selectedType}`,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (selectedTemplate) {
        await emailTemplateApi.update(businessUnitId, selectedTemplate.id, {
          name: formData.name,
          description: formData.description || undefined,
          subject: formData.subject,
          fromName: formData.fromName || undefined,
          replyToEmail: formData.replyToEmail || undefined,
          preheader: formData.preheader || undefined,
          htmlContent: formData.htmlContent,
          textContent: formData.textContent || undefined,
          useBranding: formData.useBranding,
          isActive: formData.isActive,
        });
      } else {
        await emailTemplateApi.create(businessUnitId, {
          emailType: selectedType,
          name: formData.name,
          description: formData.description || undefined,
          subject: formData.subject,
          fromName: formData.fromName || undefined,
          replyToEmail: formData.replyToEmail || undefined,
          preheader: formData.preheader || undefined,
          htmlContent: formData.htmlContent,
          textContent: formData.textContent || undefined,
          useBranding: formData.useBranding,
          isActive: formData.isActive,
        });
      }

      setSuccess("Plantilla guardada correctamente");
      await loadTemplates();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "No se pudo guardar la plantilla",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedTemplate) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await emailTemplateApi.setDefault(businessUnitId, selectedTemplate.id);
      setSuccess("Plantilla marcada como predeterminada");
      await loadTemplates();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "No se pudo marcar la plantilla como predeterminada",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedTemplate) return;

    if (selectedTemplate.isActive && isLastActiveTemplateForType) {
      setError(
        "No puedes desactivar la última plantilla activa de este tipo. Activa o crea otra plantilla primero.",
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await emailTemplateApi.setActive(
        businessUnitId,
        selectedTemplate.id,
        !selectedTemplate.isActive,
      );
      setSuccess("Estado de plantilla actualizado");
      await loadTemplates();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "No se pudo cambiar el estado de la plantilla",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    if (isLastActiveTemplateForType) {
      setError(
        "No puedes eliminar la última plantilla activa de este tipo. Activa o crea otra plantilla primero.",
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la plantilla "${selectedTemplate.name}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await emailTemplateApi.delete(businessUnitId, selectedTemplate.id);
      setSuccess("Plantilla eliminada correctamente");
      setSelectedTemplateId(null);
      await loadTemplates();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "No se pudo eliminar la plantilla",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card text-center py-10">
        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary-400" />
        <p className="text-dark-400">Cargando plantillas de email...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Plantillas de Email</h3>
          <p className="text-sm text-dark-400 mt-1">
            Personaliza los emails automáticos enviados a tus clientes
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={handleCreateForType}
          type="button"
        >
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </button>
      </div>

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="card bg-green-900/20 border-green-800 text-green-400">
          <p>{success}</p>
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 p-4 border-b border-dark-700">
          {EMAIL_TYPES.map((type) => {
            const count = templates.filter(
              (template) => template.emailType === type.id,
            ).length;
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                type="button"
                className={`text-left p-3 rounded border transition-colors ${
                  isSelected
                    ? "border-primary-500 bg-primary-900/20"
                    : "border-dark-700 bg-dark-800/40 hover:border-dark-600"
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{type.label}</span>
                  <span className="text-xs text-dark-400">{count}</span>
                </div>
                <p className="text-xs text-dark-400">{type.description}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          <div className="border-r border-dark-700 p-4 space-y-3">
            <h4 className="font-medium text-sm text-dark-300">
              Plantillas del tipo
            </h4>
            {templatesForType.length === 0 ? (
              <div className="text-sm text-dark-400">
                No hay plantillas para este tipo.
              </div>
            ) : (
              templatesForType.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setFormData(toFormData(template));
                  }}
                  className={`w-full text-left p-3 rounded border ${
                    selectedTemplateId === template.id
                      ? "border-primary-500 bg-primary-900/20"
                      : "border-dark-700 bg-dark-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{template.name}</span>
                    <div className="flex items-center gap-1">
                      {isLastActiveTemplate(template) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-200">
                          Última activa
                        </span>
                      )}
                      {template.isDefault && (
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {!template.isActive && (
                        <Power className="w-3.5 h-3.5 text-dark-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">
                    {template.subject}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-2 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {selectedTemplate ? "Editar plantilla" : "Nueva plantilla"}
              </h4>
              <div className="flex items-center gap-2">
                {selectedTemplate && (
                  <button
                    type="button"
                    className="btn-secondary flex items-center gap-2 text-red-400"
                    onClick={handleDelete}
                    disabled={saving || isLastActiveTemplateForType}
                    title={
                      isLastActiveTemplateForType
                        ? "No puedes eliminar la última plantilla activa de este tipo"
                        : "Eliminar plantilla"
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
                {selectedTemplate && (
                  <button
                    type="button"
                    className="btn-secondary flex items-center gap-2"
                    onClick={handleToggleActive}
                    disabled={
                      saving ||
                      (selectedTemplate.isActive && isLastActiveTemplateForType)
                    }
                    title={
                      selectedTemplate.isActive && isLastActiveTemplateForType
                        ? "No puedes desactivar la última plantilla activa de este tipo"
                        : undefined
                    }
                  >
                    <Power className="w-4 h-4" />
                    {selectedTemplate.isActive ? "Desactivar" : "Activar"}
                  </button>
                )}
                {selectedTemplate && !selectedTemplate.isDefault && (
                  <button
                    type="button"
                    className="btn-secondary flex items-center gap-2"
                    onClick={handleSetDefault}
                    disabled={saving}
                  >
                    <Star className="w-4 h-4" />
                    Predeterminada
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary flex items-center gap-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Nombre"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Asunto"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Remitente (opcional)"
                value={formData.fromName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fromName: e.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Reply-To (opcional)"
                value={formData.replyToEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    replyToEmail: e.target.value,
                  }))
                }
              />
              <input
                className="input md:col-span-2"
                placeholder="Preheader (opcional)"
                value={formData.preheader}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preheader: e.target.value,
                  }))
                }
              />
              <textarea
                className="input md:col-span-2"
                rows={2}
                placeholder="Descripción interna"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm text-dark-300">
                <input
                  type="checkbox"
                  checked={formData.useBranding}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      useBranding: e.target.checked,
                    }))
                  }
                />
                Aplicar branding de la BU
              </label>

              <label className="flex items-center gap-2 text-sm text-dark-300">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Plantilla activa
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">HTML</label>
              <textarea
                className="input w-full min-h-[220px] font-mono text-sm"
                value={formData.htmlContent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    htmlContent: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Texto plano (opcional)
              </label>
              <textarea
                className="input w-full min-h-[120px]"
                value={formData.textContent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    textContent: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
