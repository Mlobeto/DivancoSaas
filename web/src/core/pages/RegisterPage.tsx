import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/core/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { RegisterRequest } from "@/core/types/api.types";

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState<RegisterRequest>({
    tenantName: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      // El backend devuelve businessUnits (array), extraer el primero
      const firstBusinessUnit = data.businessUnits?.[0];
      setAuth({
        user: data.user,
        tenant: data.tenant!,
        businessUnit: firstBusinessUnit
          ? {
              id: firstBusinessUnit.id,
              name: firstBusinessUnit.name,
              slug: firstBusinessUnit.slug,
              description: firstBusinessUnit.description,
            }
          : undefined,
        role: firstBusinessUnit?.role, // Role within the selected BU
        permissions: data.permissions || [], // Permissions from backend
      });
      navigate("/dashboard");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DivancoSaaS</h1>
          <p className="text-dark-400">Crear nueva cuenta</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Registro</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                className="input"
                placeholder="Mi Empresa"
                value={formData.tenantName}
                onChange={(e) =>
                  setFormData({ ...formData, tenantName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña (mínimo 8 caracteres)
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={8}
              />
            </div>

            {registerMutation.error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                {registerMutation.error instanceof Error
                  ? registerMutation.error.message
                  : "Error al registrar"}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? "Creando cuenta..."
                : "Crear Cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
