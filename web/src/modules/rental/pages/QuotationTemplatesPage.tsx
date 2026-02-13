import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { templateService } from "../services/template.service";
import { Template, TemplateType } from "../types/quotation.types";
import { Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";

export function QuotationTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const [typeFilter, setTypeFilter] = useState<TemplateType | "">("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", tenant?.id, businessUnit?.id, typeFilter],
    queryFn: () => templateService.list(typeFilter ? { type: typeFilter } : {}),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      templateService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const handleToggleActive = (template: Template) => {
    toggleActiveMutation.mutate({
      id: template.id,
      isActive: !template.isActive,
    });
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="p-8">
          <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
            <p>
              No se ha seleccionado un tenant o business unit. Por favor,
              configura tu contexto antes de trabajar con plantillas.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Plantillas PDF"
      subtitle={`Gestión de plantillas personalizadas con Handlebars + Puppeteer - ${businessUnit.name}`}
      actions={
        <>
          <button
            onClick={() => navigate("/quotations/templates/new")}
            className="btn-primary"
          >
            + Nueva Plantilla
          </button>
          <a href="/quotations" className="btn-ghost">
            ← Cotizaciones
          </a>
        </>
      }
    >
      {/* Helper card */}
      <div className="card mb-6 bg-dark-800/80 border-dark-600">
        <h2 className="text-sm font-semibold text-primary-300 mb-2">
          🎨 Plantillas Personalizables
        </h2>
        <p className="text-sm text-gray-300 mb-2">
          Crea plantillas HTML con Handlebars para generar PDFs profesionales.
          Cada BusinessUnit puede tener múltiples plantillas activas.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="text-xs font-semibold text-dark-300 mb-2">
              ✨ Características:
            </h3>
            <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
              <li>HTML + CSS personalizado</li>
              <li>Variables Handlebars: {`{{quotationCode}}`}</li>
              <li>Logo y branding de la empresa</li>
              <li>Header y footer personalizados</li>
              <li>Exportación a PDF con Puppeteer</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-dark-300 mb-2">
              🔧 Helpers disponibles:
            </h3>
            <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
              <li>
                <code className="text-primary-400">
                  {`{{formatCurrency valor}}`}
                </code>
              </li>
              <li>
                <code className="text-primary-400">
                  {`{{formatDate fecha}}`}
                </code>
              </li>
              <li>
                <code className="text-primary-400">
                  {`{{formatNumber numero}}`}
                </code>
              </li>
              <li>
                <code className="text-primary-400">
                  {`{{#each items}}...{{/each}}`}
                </code>
              </li>
              <li>
                <code className="text-primary-400">{`{{multiply a b}}`}</code>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm text-dark-300">Filtrar por tipo:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TemplateType | "")}
            className="form-input w-64"
          >
            <option value="">Todos los tipos</option>
            <option value="quotation">Cotización</option>
            <option value="contract">Contrato</option>
            <option value="invoice">Factura</option>
            <option value="receipt">Recibo</option>
            <option value="report">Reporte</option>
            <option value="certificate">Certificado</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-dark-400">
            Cargando plantillas...
          </div>
        ) : templates && templates.length === 0 ? (
          <div className="col-span-full card p-8 text-center">
            <p className="text-dark-400 mb-4">No hay plantillas creadas aún</p>
            <button
              onClick={() => navigate("/quotations/templates/new")}
              className="btn-primary"
            >
              + Crear primera plantilla
            </button>
          </div>
        ) : (
          templates?.map((template: Template) => (
            <div
              key={template.id}
              className={`card ${
                template.isActive
                  ? "border-primary-800 bg-dark-800"
                  : "border-dark-700 bg-dark-900/50 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {template.name}
                  </h3>
                  <span className="text-xs text-dark-400 uppercase">
                    {template.type}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleActive(template)}
                  className={`p-2 rounded-lg transition-colors ${
                    template.isActive
                      ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                      : "bg-dark-700 text-dark-400 hover:bg-dark-600"
                  }`}
                  title={
                    template.isActive
                      ? "Activa"
                      : "Inactiva - Click para activar"
                  }
                >
                  {template.isActive ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Logo preview */}
              {template.logoUrl && (
                <div className="mb-4 bg-dark-700 p-4 rounded-lg text-center">
                  <img
                    src={template.logoUrl}
                    alt="Logo"
                    className="max-h-16 mx-auto object-contain"
                  />
                </div>
              )}

              {/* Variables count */}
              <div className="text-sm text-dark-400 mb-4">
                {template.variables.length} variables disponibles
              </div>

              {/* Metadata */}
              <div className="text-xs text-dark-500 mb-4">
                Creada: {new Date(template.createdAt).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    navigate(`/quotations/templates/${template.id}/preview`)
                  }
                  className="btn-ghost btn-sm flex-1"
                  title="Vista previa"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </button>
                <button
                  onClick={() =>
                    navigate(`/quotations/templates/${template.id}/edit`)
                  }
                  className="btn-secondary btn-sm flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="btn-ghost btn-sm text-red-400 hover:bg-red-900/30"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Start Guide */}
      {templates && templates.length === 0 && (
        <div className="card mt-6 bg-dark-800/50 border-dark-600">
          <h3 className="text-sm font-semibold text-primary-300 mb-3">
            📝 Guía de Inicio Rápido
          </h3>
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <strong>1. Crea una plantilla:</strong> Click en "Nueva Plantilla"
              y elige un tipo (cotización, contrato, etc.).
            </p>
            <p>
              <strong>2. Diseña el HTML:</strong> Usa Handlebars para variables
              dinámicas como {`{{quotationCode}}`} o {`{{clientName}}`}.
            </p>
            <p>
              <strong>3. Añade estilos:</strong> Personaliza el CSS para que
              coincida con tu branding.
            </p>
            <p>
              <strong>4. Configura logo:</strong> Sube tu logo y configura
              header/footer.
            </p>
            <p>
              <strong>5. Activa la plantilla:</strong> Solo las plantillas
              activas se usan para generar PDFs.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}
