import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Layout } from "@/core/components/Layout";
import { clientService } from "../services/client.service";
import {
  ClientType,
  ClientStatus,
  Client,
  ClientTaxProfile,
} from "../types/client.types";

// Colombia: tipos de documento disponibles por tipo de cliente
const CO_DOC_TYPES_COMPANY = [
  { value: "NIT", label: "NIT (Número de Identificación Tributaria)" },
  { value: "CE", label: "CE (Cédula de Extranjería)" },
  { value: "PP", label: "PP (Pasaporte)" },
];
const CO_DOC_TYPES_PERSON = [
  { value: "CC", label: "CC (Cédula de Ciudadanía)" },
  { value: "CE", label: "CE (Cédula de Extranjería)" },
  { value: "NIT", label: "NIT (Persona Natural con NIT)" },
  { value: "PP", label: "PP (Pasaporte)" },
  { value: "TI", label: "TI (Tarjeta de Identidad)" },
];

const CO_TAX_REGIMES = [
  { value: "RESPONSABLE_IVA", label: "Responsable de IVA (Régimen Común)" },
  {
    value: "NO_RESPONSABLE_IVA",
    label: "No Responsable de IVA (Régimen Simplificado)",
  },
  { value: "GRAN_CONTRIBUYENTE", label: "Gran Contribuyente" },
  {
    value: "REGIMEN_ESPECIAL",
    label: "Régimen Especial (Entidades sin ánimo de lucro)",
  },
  { value: "REGIMEN_SIMPLE", label: "Régimen Simple de Tributación (SIMPLE)" },
];

const CO_FISCAL_RESPONSIBILITIES = [
  { value: "O-13", label: "O-13 – Gran contribuyente" },
  { value: "O-14", label: "O-14 – Agente de retención en la fuente" },
  { value: "O-15", label: "O-15 – Autorretenedor" },
  { value: "O-16", label: "O-16 – Obligado a llevar contabilidad" },
  { value: "O-23", label: "O-23 – No obligado a llevar contabilidad" },
  { value: "O-47", label: "O-47 – Régimen simple de tributación" },
  { value: "R-99-PN", label: "R-99-PN – No aplica – Otros" },
];

const CO_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
  "Bogotá D.C.",
];

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
  const [showBilling, setShowBilling] = useState(true);
  const [showRentalAccount, setShowRentalAccount] = useState(false);

  // Estado para configuración de cuenta rental (opcional)
  const [rentalAccount, setRentalAccount] = useState<{
    initialBalance?: number;
    creditLimit?: number;
    timeLimit?: number;
    alertAmount?: number;
    statementFrequency?: "weekly" | "biweekly" | "monthly" | "manual";
    notes?: string;
  }>({});

  // Estado separado para el perfil tributario/facturación
  const [taxProfile, setTaxProfile] = useState<
    Partial<
      Omit<ClientTaxProfile, "id" | "clientId" | "createdAt" | "updatedAt">
    >
  >({
    countryCode: "CO",
    taxIdType: "",
    taxIdNumber: "",
    taxRegime: "",
    fiscalResponsibility: "",
    fiscalAddressLine1: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // Dígito de verificación (solo para NIT)
  const [nitDV, setNitDV] = useState("");

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

      // Cargar perfil tributario existente (primero del array)
      const existingTax = existingClient.taxProfiles?.[0];
      if (existingTax) {
        setTaxProfile({
          countryCode: existingTax.countryCode,
          taxIdType: existingTax.taxIdType,
          taxIdNumber: existingTax.taxIdNumber,
          taxRegime: existingTax.taxRegime || "",
          fiscalResponsibility: existingTax.fiscalResponsibility || "",
          fiscalAddressLine1: existingTax.fiscalAddressLine1 || "",
          city: existingTax.city || "",
          state: existingTax.state || "",
          postalCode: existingTax.postalCode || "",
        });
        // Extraer DV si el número es "123456789-5"
        if (
          existingTax.taxIdType === "NIT" &&
          existingTax.taxIdNumber?.includes("-")
        ) {
          const parts = existingTax.taxIdNumber.split("-");
          setNitDV(parts[1] || "");
          setTaxProfile((prev) => ({ ...prev, taxIdNumber: parts[0] }));
        }
      }
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

    // Construir taxProfile: si tiene tipo y número, agregarlo al payload
    const hasTaxProfile = taxProfile.taxIdType && taxProfile.taxIdNumber;
    const taxIdNumberFull =
      taxProfile.taxIdType === "NIT" && nitDV
        ? `${taxProfile.taxIdNumber}-${nitDV}`
        : taxProfile.taxIdNumber;

    // Incluir rentalAccount solo si tiene al menos un campo configurado
    const hasRentalAccount = Object.values(rentalAccount).some(
      (val) => val !== undefined && val !== "",
    );

    const payload: any = {
      ...formData,
      ...(hasTaxProfile
        ? {
            taxProfile: {
              ...taxProfile,
              countryCode: formData.countryCode || "CO",
              taxIdNumber: taxIdNumberFull,
              // Limpiar campos vacíos
              taxRegime: taxProfile.taxRegime || undefined,
              fiscalResponsibility:
                taxProfile.fiscalResponsibility || undefined,
              fiscalAddressLine1: taxProfile.fiscalAddressLine1 || undefined,
              city: taxProfile.city || undefined,
              state: taxProfile.state || undefined,
              postalCode: taxProfile.postalCode || undefined,
            },
          }
        : {}),
      ...(hasRentalAccount
        ? {
            rentalAccount: {
              initialBalance: rentalAccount.initialBalance || 0,
              creditLimit: rentalAccount.creditLimit || 0,
              timeLimit: rentalAccount.timeLimit || 30,
              alertAmount: rentalAccount.alertAmount,
              statementFrequency: rentalAccount.statementFrequency || "monthly",
              notes: rentalAccount.notes,
            },
          }
        : {}),
    };

    mutation.mutate(payload);
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

            {/* ─── Cuenta de Alquiler (Rental) ─── */}
            <div className="col-span-2 mt-2">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-semibold text-primary-300 w-full border-b border-dark-700 pb-2"
                onClick={() => setShowRentalAccount((v) => !v)}
              >
                {showRentalAccount ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Configuración de Cuenta de Alquiler
                <span className="text-xs font-normal text-dark-400 ml-1">
                  (opcional - límites de crédito y tiempo)
                </span>
              </button>
            </div>

            {showRentalAccount && (
              <>
                <div className="col-span-2">
                  <p className="text-sm text-dark-300 italic">
                    Si configuras una cuenta de alquiler, el cliente podrá usar
                    contratos maestros con límites de crédito y tiempo.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Saldo Inicial
                    <span className="text-xs text-dark-400 ml-2">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    step="1000"
                    value={rentalAccount.initialBalance || ""}
                    onChange={(e) =>
                      setRentalAccount({
                        ...rentalAccount,
                        initialBalance: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    Saldo de crédito disponible al crear la cuenta.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Límite de Crédito
                    <span className="text-xs text-dark-400 ml-2">
                      (default: 0)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    step="100000"
                    value={rentalAccount.creditLimit || ""}
                    onChange={(e) =>
                      setRentalAccount({
                        ...rentalAccount,
                        creditLimit: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    Monto máximo que el cliente puede tener en alquiler
                    simultáneamente.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Límite de Tiempo (días)
                    <span className="text-xs text-dark-400 ml-2">
                      (default: 30)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="30"
                    min="1"
                    step="1"
                    value={rentalAccount.timeLimit || ""}
                    onChange={(e) =>
                      setRentalAccount({
                        ...rentalAccount,
                        timeLimit: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    Días máximos que el cliente puede tener equipos rentados.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Monto de Alerta
                    <span className="text-xs text-dark-400 ml-2">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    step="10000"
                    value={rentalAccount.alertAmount || ""}
                    onChange={(e) =>
                      setRentalAccount({
                        ...rentalAccount,
                        alertAmount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    Si el saldo cae por debajo de este monto, se enviará una
                    alerta.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Frecuencia de Estado de Cuenta
                  </label>
                  <select
                    className="form-input"
                    value={rentalAccount.statementFrequency || "monthly"}
                    onChange={(e) =>
                      setRentalAccount({
                        ...rentalAccount,
                        statementFrequency: e.target.value as any,
                      })
                    }
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                    <option value="manual">Manual</option>
                  </select>
                  <p className="text-xs text-dark-400 mt-1">
                    Con qué frecuencia se genera el estado de cuenta.
                  </p>
                </div>

                <div className="col-span-2 form-group">
                  <label className="form-label">Notas de la Cuenta</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Ej: Cliente VIP, revisar límites trimestralmente..."
                    value={rentalAccount.notes || ""}
                    onChange={(e) =>
                      setRentalAccount({
                        ...rentalAccount,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            {/* ─── Facturación ─── */}
            <div className="col-span-2 mt-2">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-semibold text-primary-300 w-full border-b border-dark-700 pb-2"
                onClick={() => setShowBilling((v) => !v)}
              >
                {showBilling ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Información de Facturación
                <span className="text-xs font-normal text-dark-400 ml-1">
                  (tributario / DIAN)
                </span>
              </button>
            </div>

            {showBilling && (
              <>
                {/* Tipo de documento */}
                <div className="form-group">
                  <label className="form-label">Tipo de Documento</label>
                  <select
                    className="form-input"
                    value={taxProfile.taxIdType || ""}
                    onChange={(e) =>
                      setTaxProfile({
                        ...taxProfile,
                        taxIdType: e.target.value,
                        taxIdNumber: "",
                      })
                    }
                  >
                    <option value="">-- Sin documento tributario --</option>
                    {(formData.type === ClientType.COMPANY
                      ? CO_DOC_TYPES_COMPANY
                      : CO_DOC_TYPES_PERSON
                    ).map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número de documento */}
                <div className="form-group">
                  <label className="form-label">
                    {taxProfile.taxIdType === "NIT"
                      ? "NIT (sin dígito de verificación)"
                      : taxProfile.taxIdType
                        ? `Número de ${taxProfile.taxIdType}`
                        : "Número de Documento"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="form-input flex-1"
                      placeholder={
                        taxProfile.taxIdType === "NIT" ? "ej: 800123456" : ""
                      }
                      value={taxProfile.taxIdNumber || ""}
                      onChange={(e) =>
                        setTaxProfile({
                          ...taxProfile,
                          taxIdNumber: e.target.value,
                        })
                      }
                    />
                    {taxProfile.taxIdType === "NIT" && (
                      <div className="flex flex-col items-center">
                        <label className="text-xs text-dark-400 mb-1">DV</label>
                        <input
                          type="text"
                          maxLength={1}
                          className="form-input w-14 text-center"
                          placeholder="5"
                          value={nitDV}
                          onChange={(e) =>
                            setNitDV(e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </div>
                    )}
                  </div>
                  {taxProfile.taxIdType === "NIT" && (
                    <p className="text-xs text-dark-400 mt-1">
                      Se guardará como{" "}
                      <span className="text-primary-300">
                        {taxProfile.taxIdNumber || "000"}-{nitDV || "0"}
                      </span>
                    </p>
                  )}
                </div>

                {/* Régimen tributario — solo Colombia */}
                {(formData.countryCode === "CO" || !formData.countryCode) && (
                  <div className="form-group">
                    <label className="form-label">Régimen Tributario</label>
                    <select
                      className="form-input"
                      value={taxProfile.taxRegime || ""}
                      onChange={(e) =>
                        setTaxProfile({
                          ...taxProfile,
                          taxRegime: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Seleccionar régimen --</option>
                      {CO_TAX_REGIMES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Responsabilidad fiscal — solo Colombia */}
                {(formData.countryCode === "CO" || !formData.countryCode) && (
                  <div className="form-group">
                    <label className="form-label">
                      Responsabilidad Fiscal (DIAN)
                    </label>
                    <select
                      className="form-input"
                      value={taxProfile.fiscalResponsibility || ""}
                      onChange={(e) =>
                        setTaxProfile({
                          ...taxProfile,
                          fiscalResponsibility: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        -- Seleccionar responsabilidad --
                      </option>
                      {CO_FISCAL_RESPONSIBILITIES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dirección fiscal */}
                <div className="col-span-2 form-group">
                  <label className="form-label">Dirección Fiscal</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Cra 15 # 88-64, Ofic 501"
                    value={taxProfile.fiscalAddressLine1 || ""}
                    onChange={(e) =>
                      setTaxProfile({
                        ...taxProfile,
                        fiscalAddressLine1: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Ciudad */}
                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Bogotá"
                    value={taxProfile.city || ""}
                    onChange={(e) =>
                      setTaxProfile({ ...taxProfile, city: e.target.value })
                    }
                  />
                </div>

                {/* Departamento */}
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  {formData.countryCode === "CO" || !formData.countryCode ? (
                    <select
                      className="form-input"
                      value={taxProfile.state || ""}
                      onChange={(e) =>
                        setTaxProfile({ ...taxProfile, state: e.target.value })
                      }
                    >
                      <option value="">-- Seleccionar --</option>
                      {CO_DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Estado / Provincia"
                      value={taxProfile.state || ""}
                      onChange={(e) =>
                        setTaxProfile({ ...taxProfile, state: e.target.value })
                      }
                    />
                  )}
                </div>

                {/* Código postal */}
                <div className="form-group">
                  <label className="form-label">Código Postal</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: 110111"
                    value={taxProfile.postalCode || ""}
                    onChange={(e) =>
                      setTaxProfile({
                        ...taxProfile,
                        postalCode: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
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
