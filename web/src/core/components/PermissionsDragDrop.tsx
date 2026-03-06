/**
 * Permissions Drag & Drop Component - Simplified
 *
 * Two-column interface:
 * - Left: Available permissions to add
 * - Right: Assigned permissions (from role + additional)
 */

import { useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string | null;
}

interface PermissionsDragDropProps {
  allPermissions: Permission[];
  rolePermissionIds: Set<string>;
  selectedAdditionalPermissionIds: string[];
  onTogglePermission: (permissionId: string) => void;
  roleName?: string;
}

export function PermissionsDragDrop({
  allPermissions,
  rolePermissionIds,
  selectedAdditionalPermissionIds,
  onTogglePermission,
  roleName = "el rol seleccionado",
}: PermissionsDragDropProps) {
  const [draggedPermission, setDraggedPermission] = useState<string | null>(
    null,
  );
  const [searchAvailable, setSearchAvailable] = useState("");
  const [searchAssigned, setSearchAssigned] = useState("");

  // Available permissions: NOT in role and NOT in additional
  const availablePermissions = allPermissions.filter(
    (p) =>
      !rolePermissionIds.has(p.id) &&
      !selectedAdditionalPermissionIds.includes(p.id),
  );

  // All assigned permissions: role base + additional
  const allAssignedPermissions = allPermissions.filter(
    (p) =>
      rolePermissionIds.has(p.id) ||
      selectedAdditionalPermissionIds.includes(p.id),
  );

  // Separate role base permissions from additional
  const roleBasePermissions = allPermissions.filter((p) =>
    rolePermissionIds.has(p.id),
  );

  const assignedAdditionalPermissions = allPermissions.filter((p) =>
    selectedAdditionalPermissionIds.includes(p.id),
  );

  // Filter by search
  const filteredAvailable = availablePermissions.filter(
    (p) =>
      searchAvailable === "" ||
      `${p.resource}:${p.action}`
        .toLowerCase()
        .includes(searchAvailable.toLowerCase()) ||
      (p.description || "")
        .toLowerCase()
        .includes(searchAvailable.toLowerCase()),
  );

  const filteredAssigned = allAssignedPermissions.filter(
    (p) =>
      searchAssigned === "" ||
      `${p.resource}:${p.action}`
        .toLowerCase()
        .includes(searchAssigned.toLowerCase()) ||
      (p.description || "")
        .toLowerCase()
        .includes(searchAssigned.toLowerCase()),
  );

  // Group permissions by resource
  const groupByResource = (permissions: Permission[]) => {
    return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
      if (!acc[p.resource]) acc[p.resource] = [];
      acc[p.resource].push(p);
      return acc;
    }, {});
  };

  const groupedAvailable = groupByResource(filteredAvailable);
  const groupedAssigned = groupByResource(filteredAssigned);

  // Drag handlers
  const handleDragStart = (permissionId: string) => {
    // Only allow dragging if it's an additional permission (not from role)
    if (!rolePermissionIds.has(permissionId)) {
      setDraggedPermission(permissionId);
    }
  };

  const handleDragEnd = () => {
    setDraggedPermission(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToAssigned = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedPermission) {
      onTogglePermission(draggedPermission);
      setDraggedPermission(null);
    }
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedPermission) {
      onTogglePermission(draggedPermission);
      setDraggedPermission(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info box */}
      <div className="rounded-lg border border-blue-700/30 bg-blue-900/10 p-3 text-xs text-blue-200">
        <p className="font-medium mb-1">💡 Cómo funciona:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-300/80">
          <li>
            <strong>Permisos del rol ({roleName}):</strong> se asignan
            automáticamente (no se pueden quitar)
          </li>
          <li>
            <strong>Permisos adicionales:</strong> arrastra desde "Disponibles"
            a "Asignados" para agregarlos
          </li>
          <li>
            Usa los botones de flecha o arrastra las tarjetas entre columnas
          </li>
        </ul>
      </div>

      {/* Two columns: Available | Assigned */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left column: Available */}
        <div
          className={`rounded-lg border-2 border-dashed ${
            draggedPermission &&
            selectedAdditionalPermissionIds.includes(draggedPermission)
              ? "border-primary-500 bg-primary-950/20"
              : "border-dark-700"
          } transition-colors`}
          onDragOver={handleDragOver}
          onDrop={handleDropToAvailable}
        >
          <div className="bg-dark-800/50 border-b border-dark-700 p-3">
            <h3 className="text-sm font-semibold text-dark-100 flex items-center justify-between mb-2">
              <span>Permisos Disponibles ({filteredAvailable.length})</span>
              {availablePermissions.length > 0 && (
                <span className="text-xs text-dark-400">Arrastra →</span>
              )}
            </h3>
            <input
              type="text"
              placeholder="Buscar permisos disponibles..."
              value={searchAvailable}
              onChange={(e) => setSearchAvailable(e.target.value)}
              className="w-full px-3 py-1.5 bg-dark-900 border border-dark-700 rounded text-xs text-dark-100 placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="p-3 max-h-96 overflow-y-auto space-y-3">
            {Object.keys(groupedAvailable).length === 0 ? (
              <p className="text-xs text-dark-400 text-center py-6">
                {searchAvailable
                  ? "No se encontraron permisos"
                  : "Todos los permisos están asignados"}
              </p>
            ) : (
              Object.entries(groupedAvailable)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([resource, perms]) => (
                  <div key={resource} className="space-y-1.5">
                    <p className="text-xs font-medium text-dark-300 capitalize sticky top-0 bg-dark-900/90 py-1">
                      {resource}
                    </p>
                    <div className="space-y-1.5">
                      {perms
                        .sort((a, b) => a.action.localeCompare(b.action))
                        .map((p) => (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={() => handleDragStart(p.id)}
                            onDragEnd={handleDragEnd}
                            className={`group flex items-center justify-between gap-2 px-3 py-2 bg-dark-800 border border-dark-700 rounded cursor-move hover:border-primary-500 hover:bg-dark-750 transition-all ${
                              draggedPermission === p.id
                                ? "opacity-50 scale-95"
                                : ""
                            }`}
                            title={p.description || undefined}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-dark-100 truncate">
                                {p.action}
                              </p>
                              {p.description && (
                                <p className="text-xs text-dark-400 truncate">
                                  {p.description}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => onTogglePermission(p.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary-900/50 rounded transition-opacity"
                              title="Agregar permiso"
                            >
                              <ChevronRight className="w-4 h-4 text-primary-400" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right column: Assigned Additional */}
        <div
          className={`rounded-lg border-2 border-dashed ${
            draggedPermission &&
            !selectedAdditionalPermissionIds.includes(draggedPermission)
              ? "border-primary-500 bg-primary-950/20"
              : "border-primary-700/30 bg-primary-950/5"
          } transition-colors`}
          onDragOver={handleDragOver}
          onDrop={handleDropToAssigned}
        >
          <div className="bg-primary-900/20 border-b border-primary-700/30 p-3">
            <h3 className="text-sm font-semibold text-primary-200 flex items-center justify-between mb-2">
              <span>Permisos Adicionales ({filteredAssigned.length})</span>
              {assignedAdditionalPermissions.length > 0 && (
                <span className="text-xs text-primary-400">← Arrastra</span>
              )}
            </h3>
            <input
              type="text"
              placeholder="Buscar permisos asignados..."
              value={searchAssigned}
              onChange={(e) => setSearchAssigned(e.target.value)}
              className="w-full px-3 py-1.5 bg-dark-900 border border-primary-700/50 rounded text-xs text-dark-100 placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="p-3 max-h-96 overflow-y-auto space-y-3">
            {Object.keys(groupedAssigned).length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-xs text-dark-400">
                  {searchAssigned
                    ? "No se encontraron permisos"
                    : "No hay permisos adicionales asignados"}
                </p>
                <p className="text-xs text-dark-500">
                  {searchAssigned
                    ? ""
                    : "Arrastra permisos desde la columna izquierda"}
                </p>
              </div>
            ) : (
              Object.entries(groupedAssigned)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([resource, perms]) => (
                  <div key={resource} className="space-y-1.5">
                    <p className="text-xs font-medium text-primary-300 capitalize sticky top-0 bg-dark-900/90 py-1">
                      {resource}
                    </p>
                    <div className="space-y-1.5">
                      {perms
                        .sort((a, b) => a.action.localeCompare(b.action))
                        .map((p) => (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={() => handleDragStart(p.id)}
                            onDragEnd={handleDragEnd}
                            className={`group flex items-center justify-between gap-2 px-3 py-2 bg-primary-900/30 border border-primary-700/50 rounded cursor-move hover:border-primary-500 hover:bg-primary-900/50 transition-all ${
                              draggedPermission === p.id
                                ? "opacity-50 scale-95"
                                : ""
                            }`}
                            title={p.description || undefined}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-primary-100 truncate">
                                {p.action}
                              </p>
                              {p.description && (
                                <p className="text-xs text-primary-400 truncate">
                                  {p.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onTogglePermission(p.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dark-700 rounded transition-opacity"
                                title="Remover permiso"
                              >
                                <ChevronLeft className="w-4 h-4 text-dark-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onTogglePermission(p.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/50 rounded transition-opacity"
                                title="Quitar permiso"
                              >
                                <X className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-dark-400 bg-dark-900/40 rounded-lg p-3 border border-dark-700">
        <div>
          <span className="text-emerald-400 font-medium">
            {roleBasePermissions.length}
          </span>{" "}
          permisos del rol
          {assignedAdditionalPermissions.length > 0 && (
            <>
              {" + "}
              <span className="text-primary-400 font-medium">
                {assignedAdditionalPermissions.length}
              </span>{" "}
              adicionales
            </>
          )}
        </div>
        <div className="text-dark-100 font-medium">
          Total:{" "}
          <span className="text-lg">
            {roleBasePermissions.length + assignedAdditionalPermissions.length}
          </span>{" "}
          permisos
        </div>
      </div>
    </div>
  );
}
