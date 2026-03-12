import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  clauseTemplateService,
  CLAUSE_CATEGORIES,
  type ClauseTemplate,
} from "../services/clause-template.service";

export function ClauseTemplatesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showDefaultsOnly, setShowDefaultsOnly] = useState(false);

  // Query
  const { data: clauses, isLoading } = useQuery({
    queryKey: [
      "clauseTemplates",
      tenant?.id,
      businessUnit?.id,
      categoryFilter,
      statusFilter,
    ],
    queryFn: () =>
      clauseTemplateService.list({
        businessUnitId: businessUnit?.id,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",
        isDefault: showDefaultsOnly ? true : undefined,
      }),
    enabled: !!tenant?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => clauseTemplateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clauseTemplates"] });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      clauseTemplateService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clauseTemplates"] });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      clauseTemplateService.duplicate(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clauseTemplates"] });
    },
  });

  // Filter clauses by search
  const filteredClauses =
    clauses?.filter(
      (clause) =>
        clause.name.toLowerCase().includes(search.toLowerCase()) ||
        clause.content.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  // Group by category
  const clausesByCategory = filteredClauses.reduce(
    (acc, clause) => {
      if (!acc[clause.category]) {
        acc[clause.category] = [];
      }
      acc[clause.category].push(clause);
      return acc;
    },
    {} as Record<string, ClauseTemplate[]>,
  );

  const handleDelete = (clause: ClauseTemplate) => {
    if (window.confirm(`¿Eliminar la cláusula "${clause.name}"?`)) {
      deleteMutation.mutate(clause.id);
    }
  };

  const handleDuplicate = (clause: ClauseTemplate) => {
    const newName = window.prompt(
      "Nombre para la copia:",
      `${clause.name} (Copia)`,
    );
    if (newName) {
      duplicateMutation.mutate({ id: clause.id, newName });
    }
  };

  const getCategoryInfo = (category: string) => {
    return (
      CLAUSE_CATEGORIES.find((c) => c.value === category) || {
        label: category,
        description: "",
      }
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-500/20 text-blue-400",
      safety: "bg-red-500/20 text-red-400",
      maintenance: "bg-yellow-500/20 text-yellow-400",
      insurance: "bg-purple-500/20 text-purple-400",
      liability: "bg-orange-500/20 text-orange-400",
      termination: "bg-gray-500/20 text-gray-400",
      custom: "bg-green-500/20 text-green-400",
    };
    return colors[category] || colors.general;
  };

  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          No se ha seleccionado un tenant o business unit
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Cláusulas de Contrato"
      subtitle="Plantillas reutilizables de cláusulas para contratos"
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/rental/templates")}
            className="btn-ghost"
          >
            ← Plantillas
          </button>
          <button
            onClick={() => navigate("/rental/clause-templates/new")}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cláusula
          </button>
        </div>
      }
    >
      {/* Filtros */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Buscar cláusulas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input pl-10"
              >
                <option value="all">Todas las categorías</option>
                {CLAUSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estado */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="form-input"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>

        {/* Toggle defaults */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="showDefaults"
            checked={showDefaultsOnly}
            onChange={(e) => setShowDefaultsOnly(e.target.checked)}
            className="rounded border-dark-600 bg-dark-800 text-primary-600"
          />
          <label htmlFor="showDefaults" className="text-sm text-dark-300">
            Mostrar solo cláusulas por defecto
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-dark-800/50">
          <div className="text-2xl font-bold text-dark-100">
            {filteredClauses.length}
          </div>
          <div className="text-xs text-dark-400">Total cláusulas</div>
        </div>
        <div className="card bg-dark-800/50">
          <div className="text-2xl font-bold text-green-400">
            {filteredClauses.filter((c) => c.isActive).length}
          </div>
          <div className="text-xs text-dark-400">Activas</div>
        </div>
        <div className="card bg-dark-800/50">
          <div className="text-2xl font-bold text-blue-400">
            {filteredClauses.filter((c) => c.isDefault).length}
          </div>
          <div className="text-xs text-dark-400">Por defecto</div>
        </div>
        <div className="card bg-dark-800/50">
          <div className="text-2xl font-bold text-purple-400">
            {Object.keys(clausesByCategory).length}
          </div>
          <div className="text-xs text-dark-400">Categorías</div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8 text-dark-400">
          Cargando cláusulas...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredClauses.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-300 mb-2">
            No hay cláusulas
          </h3>
          <p className="text-dark-400 mb-4">
            {search || categoryFilter !== "all"
              ? "No se encontraron cláusulas con los filtros aplicados"
              : "Crea tu primera plantilla de cláusula"}
          </p>
          <button
            onClick={() => navigate("/rental/clause-templates/new")}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cláusula
          </button>
        </div>
      )}

      {/* Clauses by category */}
      {!isLoading && filteredClauses.length > 0 && (
        <div className="space-y-6">
          {Object.entries(clausesByCategory)
            .sort(([catA], [catB]) => {
              const orderA =
                CLAUSE_CATEGORIES.findIndex((c) => c.value === catA) ?? 999;
              const orderB =
                CLAUSE_CATEGORIES.findIndex((c) => c.value === catB) ?? 999;
              return orderA - orderB;
            })
            .map(([category, clauses]) => {
              const categoryInfo = getCategoryInfo(category);
              return (
                <div key={category}>
                  <h2 className="text-lg font-semibold text-dark-200 mb-3 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(category)}`}
                    >
                      {categoryInfo.label}
                    </span>
                    <span className="text-sm text-dark-400">
                      ({clauses.length})
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 gap-3">
                    {clauses
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((clause) => (
                        <div
                          key={clause.id}
                          className={`card hover:border-primary-700 transition-colors ${
                            !clause.isActive ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary-400" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1">
                                  <h3 className="text-base font-semibold text-dark-100 mb-1">
                                    {clause.name}
                                    {clause.isDefault && (
                                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                                        <Shield className="w-3 h-3 inline mr-1" />
                                        Por defecto
                                      </span>
                                    )}
                                  </h3>
                                  <p className="text-sm text-dark-400 mb-2 line-clamp-2">
                                    {clause.content}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-dark-500">
                                    <span>Orden: {clause.displayOrder}</span>
                                    {clause.applicableAssetTypes.length > 0 && (
                                      <span>
                                        Aplica a:{" "}
                                        {clause.applicableAssetTypes.join(", ")}
                                      </span>
                                    )}
                                    {clause.applicableAssetTypes.length ===
                                      0 && (
                                      <span>Aplica a: Todos los activos</span>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/rental/clause-templates/${clause.id}`,
                                      )
                                    }
                                    className="p-2 rounded hover:bg-dark-700 text-primary-400 hover:text-primary-300"
                                    title="Ver detalles"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/rental/clause-templates/${clause.id}/edit`,
                                      )
                                    }
                                    className="p-2 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-200"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicate(clause)}
                                    className="p-2 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-200"
                                    title="Duplicar"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      toggleActiveMutation.mutate({
                                        id: clause.id,
                                        isActive: !clause.isActive,
                                      })
                                    }
                                    className={`p-2 rounded hover:bg-dark-700 ${
                                      clause.isActive
                                        ? "text-green-400"
                                        : "text-gray-400"
                                    }`}
                                    title={
                                      clause.isActive ? "Desactivar" : "Activar"
                                    }
                                  >
                                    {clause.isActive ? (
                                      <ToggleRight className="w-4 h-4" />
                                    ) : (
                                      <ToggleLeft className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(clause)}
                                    className="p-2 rounded hover:bg-dark-700 text-red-400 hover:text-red-300"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Layout>
  );
}
