import { useState } from "react";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Search,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
  Filter,
  Plus,
  DollarSign,
  Settings,
} from "lucide-react";
import { accountService } from "@/modules/rental/services/account.service";
import type { AccountListItem } from "@/modules/rental/services/account.service";
import { Link } from "react-router-dom";
import { ManageLimitsModal } from "../components/ManageLimitsModal";

export function AccountsListPage() {
  const { businessUnit, tenant } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "alert" | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<AccountListItem | null>(null);
  const [reloadAmount, setReloadAmount] = useState("");
  const [reloadDescription, setReloadDescription] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["accounts", tenant?.id, businessUnit?.id, search, status, page],
    queryFn: () =>
      accountService.getAll({
        search,
        status: status === "all" ? undefined : status,
        page,
        limit: 12,
      }),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  const reloadMutation = useMutation({
    mutationFn: ({
      accountId,
      amount,
      description,
      proofFile,
    }: {
      accountId: string;
      amount: number;
      description: string;
      proofFile?: File | null;
    }) =>
      accountService.reloadBalance(accountId, {
        amount,
        description,
        proofFile,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accounts", tenant?.id, businessUnit?.id],
      });
      setShowReloadModal(false);
      setSelectedAccount(null);
      setReloadAmount("");
      setReloadDescription("");
      setProofFile(null);
    },
  });

  const handleOpenReloadModal = (account: AccountListItem) => {
    setSelectedAccount(account);
    setShowReloadModal(true);
  };

  const handleOpenLimitsModal = (account: AccountListItem) => {
    setSelectedAccount(account);
    setShowLimitsModal(true);
  };

  const handleReload = () => {
    if (!selectedAccount || !reloadAmount || !reloadDescription) return;

    reloadMutation.mutate({
      accountId: selectedAccount.id,
      amount: Number(reloadAmount),
      description: reloadDescription,
      proofFile,
    });
  };

  // Calcular estadísticas globales
  const stats = {
    totalAccounts: data?.pagination?.total || 0,
    totalBalance: data?.data?.reduce((sum, acc) => sum + acc.balance, 0) || 0,
    totalConsumed:
      data?.data?.reduce((sum, acc) => sum + acc.totalConsumed, 0) || 0,
    alertsCount: data?.data?.filter((acc) => acc.alertTriggered)?.length || 0,
  };

  return (
    <>
      <Layout
        title="Estados de Cuenta"
        subtitle={`Gestión de cuentas corrientes y saldos - ${businessUnit?.name}`}
        actions={
          <a href="/dashboard" className="btn-ghost">
            ← Dashboard
          </a>
        }
      >
        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-dark-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-400">Total cuentas</p>
                <p className="text-2xl font-bold text-dark-100">
                  {stats.totalAccounts}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-primary-400 opacity-50" />
            </div>
          </div>

          <div className="card bg-dark-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-400">Saldo total disponible</p>
                <p className="text-2xl font-bold text-green-400">
                  ${stats.totalBalance.toFixed(0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </div>

          <div className="card bg-dark-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-400">Total consumido</p>
                <p className="text-2xl font-bold text-orange-400">
                  ${stats.totalConsumed.toFixed(0)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </div>

          <div className="card bg-dark-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-400">Alertas activas</p>
                <p className="text-2xl font-bold text-red-400">
                  {stats.alertsCount}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de cliente..."
                  className="form-input pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Filtro de estado */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <select
                className="form-input min-w-[150px]"
                value={status}
                onChange={(e) => {
                  setStatus(
                    e.target.value as "active" | "inactive" | "alert" | "all",
                  );
                  setPage(1);
                }}
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
                <option value="alert">Con alertas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="spinner" />
            <p className="text-dark-400 mt-4">Cargando cuentas...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            <p>Error al cargar las cuentas</p>
            <p className="text-sm mt-2">
              {error instanceof Error ? error.message : "Error desconocido"}
            </p>
          </div>
        )}

        {/* Resultados */}
        {!isLoading && !error && (
          <>
            {data && data.data.length === 0 && (
              <div className="card text-center py-12">
                <Wallet className="w-16 h-16 mx-auto text-dark-600 mb-4" />
                <h3 className="text-lg font-semibold text-dark-200 mb-2">
                  No se encontraron cuentas
                </h3>
                <p className="text-sm text-dark-400">
                  {search || status !== "all"
                    ? "Intenta cambiar los filtros de búsqueda"
                    : "Las cuentas se crean automáticamente cuando un cliente tiene su primer contrato de alquiler"}
                </p>
              </div>
            )}

            {/* Grid de cuentas */}
            {data && data.data.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {data.data.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onReload={handleOpenReloadModal}
                      onManageLimits={handleOpenLimitsModal}
                    />
                  ))}
                </div>

                {/* Paginación */}
                {data && data.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-ghost btn-sm"
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm text-dark-300">
                      Página {page} de {data.pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((p) =>
                          Math.min(data.pagination.totalPages, p + 1),
                        )
                      }
                      disabled={page === data.pagination.totalPages}
                      className="btn-ghost btn-sm"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Layout>

      {/* Modal de recarga */}
      {showReloadModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-400" />
                Recargar Saldo
              </h3>
              <button
                onClick={() => {
                  setShowReloadModal(false);
                  setSelectedAccount(null);
                }}
                className="text-dark-400 hover:text-dark-200"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-dark-900 rounded border border-dark-700">
              <p className="text-xs text-dark-400">Cliente</p>
              <p className="text-sm font-medium text-dark-100">
                {selectedAccount.clientName}
              </p>
              <p className="text-xs text-dark-400 mt-2">Saldo actual</p>
              <p className="text-lg font-bold text-primary-300">
                {selectedAccount.balance.toFixed(2)} {selectedAccount.currency}
              </p>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Monto a recargar *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  min="0"
                  step="100"
                  value={reloadAmount}
                  onChange={(e) => setReloadAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Pago recibido en efectivo"
                  value={reloadDescription}
                  onChange={(e) => setReloadDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Comprobante de pago
                  <span className="text-xs text-dark-400 ml-2">(opcional)</span>
                </label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setProofFile(file || null);
                  }}
                />
                <p className="text-xs text-dark-400 mt-1">
                  Sube el comprobante de transferencia o pago (imágenes o PDF,
                  máx 5MB)
                </p>
                {proofFile && (
                  <p className="text-xs text-primary-400 mt-1">
                    ✓ {proofFile.name}
                  </p>
                )}
              </div>

              {reloadMutation.error && (
                <div className="bg-red-900/20 border border-red-800 rounded p-3 text-sm text-red-300">
                  Error:{" "}
                  {reloadMutation.error instanceof Error
                    ? reloadMutation.error.message
                    : "Error desconocido"}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowReloadModal(false);
                    setSelectedAccount(null);
                  }}
                  className="btn-ghost"
                  disabled={reloadMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReload}
                  className="btn-primary"
                  disabled={
                    reloadMutation.isPending ||
                    !reloadAmount ||
                    !reloadDescription
                  }
                >
                  {reloadMutation.isPending
                    ? "Recargando..."
                    : "Recargar saldo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal gestión de límites */}
      {showLimitsModal && selectedAccount && (
        <ManageLimitsModal
          accountId={selectedAccount.id}
          clientId={selectedAccount.clientId}
          clientName={selectedAccount.clientName}
          currentCreditLimit={selectedAccount.creditLimit}
          currentTimeLimit={selectedAccount.timeLimit}
          currency={selectedAccount.currency}
          onClose={() => {
            setShowLimitsModal(false);
            setSelectedAccount(null);
          }}
          onSuccess={() => {
            setShowLimitsModal(false);
            setSelectedAccount(null);
          }}
        />
      )}
    </>
  );
}

// Componente de tarjeta individual de cuenta
function AccountCard({
  account,
  onReload,
  onManageLimits,
}: {
  account: AccountListItem;
  onReload: (account: AccountListItem) => void;
  onManageLimits: (account: AccountListItem) => void;
}) {
  const balancePercent =
    account.creditLimit > 0 ? (account.balance / account.creditLimit) * 100 : 0;
  const daysPercent =
    account.timeLimit > 0 ? (account.activeDays / account.timeLimit) * 100 : 0;

  return (
    <div
      className={`card hover:border-primary-500/50 transition-all ${
        account.alertTriggered
          ? "border-red-500 bg-red-900/10"
          : "border-dark-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            to={`/clients/${account.clientId}`}
            className="text-sm font-semibold text-dark-100 hover:text-primary-400 transition-colors"
          >
            {account.clientName}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                account.clientStatus === "ACTIVE"
                  ? "bg-green-900/30 text-green-400"
                  : "bg-gray-900/30 text-gray-400"
              }`}
            >
              {account.clientStatus === "ACTIVE" ? "Activo" : "Inactivo"}
            </span>
            {account.alertTriggered && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Alerta
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onReload(account)}
          className="btn-sm bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1 text-[10px] px-2 py-1"
        >
          <Plus className="w-3 h-3" />
          Recargar
        </button>
        <button
          onClick={() => onManageLimits(account)}
          className="btn-sm bg-dark-700 hover:bg-dark-600 text-dark-200 flex items-center gap-1 text-[10px] px-2 py-1"
        >
          <Settings className="w-3 h-3" />
          Límites
        </button>
      </div>

      {/* Saldo */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-dark-300 mb-1">
          <span>Saldo disponible</span>
          <span className="font-mono">
            {account.balance.toFixed(0)} {account.currency}
          </span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all ${
              balancePercent > 50
                ? "bg-green-500"
                : balancePercent > 25
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{
              width: `${Math.max(0, Math.min(100, balancePercent))}%`,
            }}
          />
        </div>
      </div>

      {/* Días activos */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-dark-300 mb-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Días activos
          </span>
          <span>
            {account.activeDays} / {account.timeLimit}
          </span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all ${
              daysPercent < 50
                ? "bg-green-500"
                : daysPercent < 75
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{
              width: `${Math.max(0, Math.min(100, daysPercent))}%`,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-dark-700 text-xs">
        <div>
          <p className="text-dark-400">Contratos activos</p>
          <p className="font-semibold text-dark-100">
            {account.activeContracts}
          </p>
        </div>
        <div>
          <p className="text-dark-400">Rentals activos</p>
          <p className="font-semibold text-dark-100">{account.activeRentals}</p>
        </div>
        <div>
          <p className="text-dark-400">Total consumido</p>
          <p className="font-semibold text-dark-100">
            {account.totalConsumed.toFixed(0)}
          </p>
        </div>
        <div>
          <p className="text-dark-400">Total recargado</p>
          <p className="font-semibold text-dark-100">
            {account.totalReloaded.toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}
