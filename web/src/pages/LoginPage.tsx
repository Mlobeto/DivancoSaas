import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { LoginRequest } from "@/types/api.types";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const passwordReset = searchParams.get("passwordReset");
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
    tenantSlug: "",
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data);
      navigate("/dashboard");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DivancoSaaS</h1>
          <p className="text-dark-400">
            Sistema de gestión modular multitenant
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Iniciar Sesión</h2>

          {passwordReset && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded text-green-400 text-sm">
              Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                Contraseña
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tenant (opcional)
              </label>
              <input
                type="text"
                className="input"
                placeholder="nombre-empresa"
                value={formData.tenantSlug}
                onChange={(e) =>
                  setFormData({ ...formData, tenantSlug: e.target.value })
                }
              />
            </div>

            {loginMutation.error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                {loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : "Error al iniciar sesión"}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Iniciando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-dark-400 hover:text-primary-400 text-sm"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-dark-700 text-center">
            <a
              href="/register"
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              ¿No tienes cuenta? Regístrate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
