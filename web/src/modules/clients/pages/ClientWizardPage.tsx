import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { clientService } from "../services/client.service";
import { ClientType, ClientStatus, Client } from "../types/client.types";

export function ClientWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    displayName: "",
    type: ClientType.COMPANY,
    countryCode: "CO",
    email: "",
    phone: "",
    status: ClientStatus.ACTIVE,
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");

  const { data: existingClient, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientService.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingClient) {
      setFormData({
        name: existingClient.name,
        displayName: existingClient.displayName,
        type: existingClient.type,
        countryCode: existingClient.countryCode,
        email: existingClient.email,
        phone: existingClient.phone,
        status: existingClient.status,
        tags: existingClient.tags || [],
      });
    }
  }, [existingClient]);

  const mutation = useMutation({
    mutationFn: (data: Partial<Client>) => {
      if (isEditing) {
        return clientService.update(id!, data);
      }
      return clientService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clientSummary", id] });
      navigate("/clients");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = formData.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((tag) => tag !== tagToRemove),
    });
  };

  if (isEditing && isLoadingClient) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEditing ? "Editar Cliente" : "Nuevo Cliente"}
      subtitle={
        isEditing
          ? "Modificar datos del cliente"
          : "Registrar un cliente en esta Business Unit"
      }
      actions={
        <button onClick={() => navigate("/clients")} className="btn-ghost">
          Cancelar
        </button>
      }
    >
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-primary-300 mb-4 border-b border-dark-700 pb-2">
                Información Principal
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label">Razón Social / Nombre *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre Comercial / Alias</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: El Norte"
                value={formData.displayName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Cliente</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as ClientType,
                  })
                }
              >
                <option value={ClientType.COMPANY}>Empresa</option>
                <option value={ClientType.PERSON}>Persona Natural</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">País</label>
              <select
                className="form-input"
                value={formData.countryCode || ""}
                onChange={(e) =>
                  setFormData({ ...formData, countryCode: e.target.value })
                }
              >
                <option value="CO">Colombia</option>
                <option value="MX">México</option>
                <option value="US">Estados Unidos</option>
                <option value="AR">Argentina</option>
                <option value="CL">Chile</option>
                {/* Add more as needed */}
              </select>
            </div>

            {/* Contact Info */}
            <div className="col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-primary-300 mb-4 border-b border-dark-700 pb-2">
                Datos de Contacto
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label">Email Principal</label>
              <input
                type="email"
                className="form-input"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            {/* Business Unit Configuration */}
            <div className="col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-primary-300 mb-4 border-b border-dark-700 pb-2">
                Configuración en esta Unidad de Negocio
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ClientStatus,
                  })
                }
              >
                <option value={ClientStatus.ACTIVE}>Activo</option>
                <option value={ClientStatus.INACTIVE}>Inactivo</option>
                <option value={ClientStatus.BLOCKED}>Bloqueado</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Define si este cliente puede operar en esta unidad de negocio.
              </p>
            </div>

            <div className="col-span-2">
              <label className="form-label">Etiquetas (Tags)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="form-input flex-1"
                  placeholder="Ej: VIP, Sector Salud, Riesgo Alto..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn-secondary"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-dark-700 border border-dark-600 text-sm text-gray-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-dark-700">
            <button
              type="button"
              onClick={() => navigate("/clients")}
              className="btn-ghost"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Guardando..."
                : isEditing
                  ? "Actualizar Cliente"
                  : "Crear Cliente"}
            </button>
          </div>

          {mutation.error && (
            <div className="p-3 rounded bg-red-900/20 border border-red-800 text-red-400 text-sm">
              Error:{" "}
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Error desconocido"}
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}
