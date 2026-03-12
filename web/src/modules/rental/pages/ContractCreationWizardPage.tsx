/**
 * CONTRACT CREATION WIZARD
 * Wizard para crear Contratos Marco (v7.0) desde una cotización aprobada.
 * 4 pasos: Revisión → Cláusulas → Configuración → Confirmar
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { quotationService } from "../services/quotation.service";
import { contractService } from "../services/contract.service";
import { clauseTemplateService } from "../services/clause-template.service";
import { accountService } from "../services/account.service";
import { CLAUSE_CATEGORIES } from "../services/clause-template.service";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  DollarSign,
  Calendar,
  Shield,
  AlertCircle,
  Loader2,
  User,
  CreditCard,
  Clock,
  Package,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface WizardData {
  // Step 3
  startDate: string;
  estimatedEndDate: string;
  agreedCreditLimit: string;
  agreedTimeLimit: string;
  notes: string;
  // Step 2
  selectedClauseIds: string[];
}

// ============================================
// STEP INDICATOR
// ============================================

const STEPS = [
  { label: "Revisión", icon: FileText },
  { label: "Cláusulas", icon: Shield },
  { label: "Configuración", icon: Calendar },
  { label: "Confirmar", icon: CheckCircle },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isCompleted
                    ? "bg-green-600 border-green-600 text-white"
                    : isCurrent
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-dark-800 border-dark-600 text-dark-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs mt-1 hidden sm:block ${
                  isCurrent
                    ? "text-primary-400 font-medium"
                    : isCompleted
                      ? "text-green-400"
                      : "text-dark-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-20 mx-1 transition-colors ${
                  i < currentStep ? "bg-green-600" : "bg-dark-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// STEP 1: REVISIÓN
// ============================================

function StepRevision({
  quotation,
  account,
}: {
  quotation: any;
  account: any;
}) {
  const fmt = (n: number, currency = "USD") =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(n);

  const hasPaymentProof = !!(
    quotation.metadata?.paymentReceiptToken ||
    quotation.metadata?.receiptToken ||
    quotation.metadata?.paymentProofUrl
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dark-100 mb-1">
          Revisión de la cotización
        </h2>
        <p className="text-sm text-dark-400">
          Verifica que la cotización esté aprobada y el comprobante de pago
          recibido antes de generar el Contrato Marco.
        </p>
      </div>

      {/* Quotation header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-dark-400 uppercase tracking-wide">
              Cotización
            </p>
            <p className="text-xl font-bold text-dark-100">{quotation.code}</p>
          </div>
          <span
            className={`badge ${
              quotation.clientResponse === "approved"
                ? "badge-success"
                : "badge-warning"
            }`}
          >
            {quotation.clientResponse === "approved"
              ? "✓ Aprobada"
              : quotation.clientResponse || "Sin respuesta"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Cliente</p>
              <p className="text-sm font-medium text-dark-100">
                {quotation.client?.name || quotation.client?.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Total cotización</p>
              <p className="text-sm font-semibold text-green-400">
                {fmt(quotation.totalAmount, quotation.currency)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Ítems</p>
              <p className="text-sm font-medium text-dark-100">
                {quotation.items?.length || 0} activo(s)
              </p>
            </div>
          </div>
        </div>

        {/* Items list */}
        {quotation.items && quotation.items.length > 0 && (
          <div className="mt-4 border-t border-dark-700 pt-4">
            <p className="text-xs text-dark-400 uppercase tracking-wide mb-2">
              Activos incluidos
            </p>
            <div className="space-y-1">
              {quotation.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-dark-300">
                    {item.description || item.asset?.name}
                  </span>
                  <span className="text-dark-400">
                    {fmt(item.total, quotation.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment status */}
      <div
        className={`card border ${
          hasPaymentProof
            ? "border-green-800 bg-green-900/10"
            : "border-yellow-800 bg-yellow-900/10"
        }`}
      >
        <div className="flex items-center gap-3">
          {hasPaymentProof ? (
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          )}
          <div>
            <p
              className={`text-sm font-medium ${hasPaymentProof ? "text-green-400" : "text-yellow-400"}`}
            >
              {hasPaymentProof
                ? "Comprobante de pago recibido"
                : "Sin comprobante de pago"}
            </p>
            <p className="text-xs text-dark-400 mt-0.5">
              {hasPaymentProof
                ? "El cliente subió su comprobante. Puedes continuar."
                : "El cliente aún no ha subido el comprobante de pago. Puedes continuar igual si ya verificaste el pago por otro medio."}
            </p>
          </div>
        </div>
      </div>

      {/* Account info */}
      {account && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-dark-200">
              Cuenta del cliente
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-dark-400">Saldo disponible</p>
              <p className="text-lg font-bold text-green-400">
                {fmt(account.balance || 0, account.currency || "USD")}
              </p>
            </div>
            <div>
              <p className="text-xs text-dark-400">Límite crédito</p>
              <p className="text-sm font-semibold text-dark-200">
                {account.creditLimit
                  ? fmt(account.creditLimit, account.currency || "USD")
                  : "Sin límite"}
              </p>
            </div>
            <div>
              <p className="text-xs text-dark-400">Límite tiempo</p>
              <p className="text-sm font-semibold text-dark-200">
                {account.timeLimit ? `${account.timeLimit} días` : "Sin límite"}
              </p>
            </div>
            <div>
              <p className="text-xs text-dark-400">Contratos activos</p>
              <p className="text-sm font-semibold text-dark-200">
                {account.activeContracts ?? 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {account === null && (
        <div className="card border border-blue-800 bg-blue-900/10">
          <div className="flex items-center gap-2 text-blue-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">
              Este cliente no tiene cuenta. Se creará automáticamente al generar
              el contrato.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP 2: CLÁUSULAS
// ============================================

function StepClauses({
  clauses,
  selectedIds,
  onToggle,
}: {
  clauses: any[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "general",
  );

  const byCategory = clauses.reduce(
    (acc, c) => {
      const cat = c.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  const getCategoryLabel = (cat: string): string => {
    return (
      CLAUSE_CATEGORIES.find((c) => c.value === cat)?.label ||
      cat.charAt(0).toUpperCase() + cat.slice(1)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dark-100 mb-1">
          Selección de cláusulas
        </h2>
        <p className="text-sm text-dark-400">
          Las cláusulas predeterminadas ya están seleccionadas. Puedes agregar o
          quitar según el acuerdo con el cliente.
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-dark-400">
          {clauses.length} cláusulas disponibles
        </span>
        <span className="text-primary-400 font-medium">
          {selectedIds.length} seleccionadas
        </span>
      </div>

      <div className="space-y-3">
        {Object.entries(byCategory).map(([cat, catClauses]) => (
          <div key={cat} className="card p-0 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 text-left hover:bg-dark-700/50 transition-colors"
              onClick={() =>
                setExpandedCategory(expandedCategory === cat ? null : cat)
              }
            >
              <span className="text-sm font-medium text-dark-200">
                {getCategoryLabel(cat)}
                <span className="ml-2 text-xs text-dark-400">
                  (
                  {
                    (catClauses as any[]).filter((c: any) =>
                      selectedIds.includes(c.id),
                    ).length
                  }
                  /{(catClauses as any[]).length})
                </span>
              </span>
              {expandedCategory === cat ? (
                <ChevronUp className="w-4 h-4 text-dark-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-dark-400" />
              )}
            </button>

            {expandedCategory === cat && (
              <div className="border-t border-dark-700">
                {(catClauses as any[]).map((clause: any) => {
                  const selected = selectedIds.includes(clause.id);
                  return (
                    <button
                      key={clause.id}
                      type="button"
                      onClick={() => onToggle(clause.id)}
                      className={`w-full flex items-start gap-3 p-3 text-left transition-colors border-b border-dark-700/50 last:border-0 ${
                        selected ? "bg-primary-900/20" : "hover:bg-dark-700/30"
                      }`}
                    >
                      {selected ? (
                        <CheckSquare className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-dark-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-dark-200">
                            {clause.name}
                          </p>
                          {clause.isDefault && (
                            <span className="text-xs bg-primary-900/50 text-primary-400 px-1.5 py-0.5 rounded">
                              Por defecto
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">
                          {clause.content}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// STEP 3: CONFIGURACIÓN
// ============================================

function StepConfig({
  data,
  onChange,
  account,
}: {
  data: WizardData;
  onChange: (field: keyof WizardData, value: string) => void;
  account: any;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dark-100 mb-1">
          Configuración del contrato
        </h2>
        <p className="text-sm text-dark-400">
          Define las fechas y límites acordados para este Contrato Marco.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha inicio */}
        <div>
          <label className="form-label">
            Fecha de inicio <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={data.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            required
          />
        </div>

        {/* Fecha fin estimada */}
        <div>
          <label className="form-label">Fecha fin estimada</label>
          <input
            type="date"
            className="form-input"
            value={data.estimatedEndDate}
            onChange={(e) => onChange("estimatedEndDate", e.target.value)}
          />
          <p className="text-xs text-dark-400 mt-1">Opcional. Referencial.</p>
        </div>

        {/* Límite de crédito acordado */}
        <div>
          <label className="form-label">Límite de crédito acordado</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="number"
              className="form-input pl-9"
              placeholder={
                account?.creditLimit
                  ? `Por defecto: ${account.creditLimit.toLocaleString()}`
                  : "Sin límite"
              }
              value={data.agreedCreditLimit}
              onChange={(e) => onChange("agreedCreditLimit", e.target.value)}
              min={0}
            />
          </div>
          <p className="text-xs text-dark-400 mt-1">
            Si no se especifica, se usará el límite actual de la cuenta.
          </p>
        </div>

        {/* Límite de tiempo acordado */}
        <div>
          <label className="form-label">Límite de tiempo acordado (días)</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="number"
              className="form-input pl-9"
              placeholder={
                account?.timeLimit
                  ? `Por defecto: ${account.timeLimit} días`
                  : "Sin límite"
              }
              value={data.agreedTimeLimit}
              onChange={(e) => onChange("agreedTimeLimit", e.target.value)}
              min={0}
            />
          </div>
          <p className="text-xs text-dark-400 mt-1">
            Número máximo de días de renta activa simultánea.
          </p>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="form-label">Notas internas</label>
        <textarea
          className="form-input min-h-[100px] resize-none"
          placeholder="Acuerdos especiales, condiciones particulares, observaciones..."
          value={data.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}

// ============================================
// STEP 4: CONFIRMACIÓN
// ============================================

function StepConfirm({
  quotation,
  data,
  clauses,
  account,
}: {
  quotation: any;
  data: WizardData;
  clauses: any[];
  account: any;
}) {
  const fmt = (n: number, currency = "USD") =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(n);

  const selectedClauses = clauses.filter((c) =>
    data.selectedClauseIds.includes(c.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dark-100 mb-1">
          Confirmar Contrato Marco
        </h2>
        <p className="text-sm text-dark-400">
          Revisa el resumen antes de crear el contrato. Esta acción no se puede
          deshacer.
        </p>
      </div>

      <div className="space-y-4">
        {/* Cotización */}
        <div className="card">
          <h3 className="text-xs text-dark-400 uppercase tracking-wide mb-3">
            Cotización base
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-dark-100">
                {quotation.code}
              </p>
              <p className="text-xs text-dark-400">
                {quotation.client?.name || quotation.client?.businessName}
              </p>
            </div>
            <p className="text-sm font-bold text-green-400">
              {fmt(quotation.totalAmount, quotation.currency)}
            </p>
          </div>
        </div>

        {/* Fechas y límites */}
        <div className="card">
          <h3 className="text-xs text-dark-400 uppercase tracking-wide mb-3">
            Configuración del contrato
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-dark-400 text-xs">Inicio</p>
              <p className="text-dark-100 font-medium">
                {data.startDate
                  ? new Date(data.startDate + "T12:00:00").toLocaleDateString(
                      "es-MX",
                    )
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-dark-400 text-xs">Fin estimado</p>
              <p className="text-dark-100 font-medium">
                {data.estimatedEndDate
                  ? new Date(
                      data.estimatedEndDate + "T12:00:00",
                    ).toLocaleDateString("es-MX")
                  : "Sin fecha"}
              </p>
            </div>
            <div>
              <p className="text-dark-400 text-xs">Límite crédito acordado</p>
              <p className="text-dark-100 font-medium">
                {data.agreedCreditLimit
                  ? fmt(Number(data.agreedCreditLimit), account?.currency)
                  : account?.creditLimit
                    ? fmt(account.creditLimit, account?.currency)
                    : "Sin límite"}
              </p>
            </div>
            <div>
              <p className="text-dark-400 text-xs">Límite tiempo acordado</p>
              <p className="text-dark-100 font-medium">
                {data.agreedTimeLimit
                  ? `${data.agreedTimeLimit} días`
                  : account?.timeLimit
                    ? `${account.timeLimit} días`
                    : "Sin límite"}
              </p>
            </div>
          </div>
          {data.notes && (
            <div className="mt-3 pt-3 border-t border-dark-700">
              <p className="text-dark-400 text-xs mb-1">Notas</p>
              <p className="text-dark-300 text-sm">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Cláusulas seleccionadas */}
        <div className="card">
          <h3 className="text-xs text-dark-400 uppercase tracking-wide mb-3">
            Cláusulas ({selectedClauses.length})
          </h3>
          {selectedClauses.length === 0 ? (
            <p className="text-sm text-dark-400">Sin cláusulas seleccionadas</p>
          ) : (
            <div className="space-y-1">
              {selectedClauses.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 text-sm text-dark-300"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-900/10 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Nota:</strong> Al confirmar se crea el Contrato Marco. Las
          entregas de maquinaria se gestionan como Addendums desde la vista del
          contrato. El PDF con las cláusulas se puede generar posteriormente.
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN WIZARD
// ============================================

export function ContractCreationWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get("quotationId");

  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    startDate: new Date().toISOString().split("T")[0],
    estimatedEndDate: "",
    agreedCreditLimit: "",
    agreedTimeLimit: "",
    notes: "",
    selectedClauseIds: [],
  });

  // Fetch quotation
  const { data: quotation, isLoading: loadingQuotation } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => quotationService.getById(quotationId!),
    enabled: !!quotationId,
  });

  // Fetch client account info
  const { data: accountInfo } = useQuery({
    queryKey: ["account-by-client", quotation?.clientId],
    queryFn: () => accountService.getByClientId(quotation!.clientId!),
    enabled: !!quotation?.clientId,
  });

  // Fetch clauses and pre-select defaults
  const { data: clauses = [], isLoading: loadingClauses } = useQuery({
    queryKey: ["clause-templates-defaults"],
    queryFn: async () => {
      const all = await clauseTemplateService.list({ isActive: true });
      // Pre-select default clauses on first load
      setData((prev) => {
        if (prev.selectedClauseIds.length === 0) {
          const defaults = all
            .filter((c: any) => c.isDefault)
            .map((c: any) => c.id);
          return { ...prev, selectedClauseIds: defaults };
        }
        return prev;
      });
      return all;
    },
    staleTime: 60_000,
  });

  // Create contract mutation
  const createMutation = useMutation({
    mutationFn: () =>
      contractService.createMasterContract({
        quotationId: quotationId!,
        startDate: data.startDate,
        estimatedEndDate: data.estimatedEndDate || undefined,
        agreedCreditLimit: data.agreedCreditLimit
          ? Number(data.agreedCreditLimit)
          : undefined,
        agreedTimeLimit: data.agreedTimeLimit
          ? Number(data.agreedTimeLimit)
          : undefined,
        clauseIds: data.selectedClauseIds,
        notes: data.notes || undefined,
      }),
    onSuccess: (contract) => {
      navigate(`/rental/contracts/${contract.id}`);
    },
  });

  const handleFieldChange = (field: keyof WizardData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleClause = (id: string) => {
    setData((prev) => ({
      ...prev,
      selectedClauseIds: prev.selectedClauseIds.includes(id)
        ? prev.selectedClauseIds.filter((x) => x !== id)
        : [...prev.selectedClauseIds, id],
    }));
  };

  const canProceed = () => {
    if (step === 2 && !data.startDate) return false;
    return true;
  };

  // Guard: no quotationId provided
  if (!quotationId) {
    return (
      <Layout title="Crear Contrato Marco">
        <div className="max-w-2xl mx-auto py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-100 mb-2">
            Cotización no especificada
          </h2>
          <p className="text-dark-400 mb-6">
            Accede a este wizard desde una cotización aprobada.
          </p>
          <button
            onClick={() => navigate("/rental/quotations")}
            className="btn-secondary"
          >
            Ver cotizaciones
          </button>
        </div>
      </Layout>
    );
  }

  if (loadingQuotation) {
    return (
      <Layout title="Crear Contrato Marco">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            <p className="text-sm text-dark-400">Cargando cotización...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!quotation) {
    return (
      <Layout title="Crear Contrato Marco">
        <div className="max-w-2xl mx-auto py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-100 mb-2">
            Cotización no encontrada
          </h2>
          <button
            onClick={() => navigate("/rental/quotations")}
            className="btn-secondary"
          >
            Ver cotizaciones
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Crear Contrato Marco"
      subtitle={`Cotización ${quotation.code} · ${quotation.client?.name || (quotation.client as any)?.businessName}`}
      actions={
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      }
    >
      <div className="max-w-3xl mx-auto">
        <StepIndicator currentStep={step} />

        {/* Step content */}
        <div className="min-h-[400px]">
          {step === 0 && (
            <StepRevision quotation={quotation} account={accountInfo ?? null} />
          )}
          {step === 1 && (
            <StepClauses
              clauses={clauses as any[]}
              selectedIds={data.selectedClauseIds}
              onToggle={handleToggleClause}
            />
          )}
          {step === 2 && (
            <StepConfig
              data={data}
              onChange={handleFieldChange}
              account={accountInfo ?? null}
            />
          )}
          {step === 3 && (
            <StepConfirm
              quotation={quotation}
              data={data}
              clauses={clauses as any[]}
              account={accountInfo ?? null}
            />
          )}
        </div>

        {/* Error */}
        {createMutation.isError && (
          <div className="mt-4 card border border-red-800 bg-red-900/10">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : "Error al crear el contrato"}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-700">
          <button
            type="button"
            onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
            className="btn-secondary flex items-center gap-2"
            disabled={createMutation.isPending}
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 0 ? "Cancelar" : "Anterior"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="btn-primary flex items-center gap-2"
              disabled={!canProceed() || (step === 1 && loadingClauses)}
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              className="btn-primary flex items-center gap-2"
              disabled={createMutation.isPending || !data.startDate}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando contrato...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Crear Contrato Marco
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
