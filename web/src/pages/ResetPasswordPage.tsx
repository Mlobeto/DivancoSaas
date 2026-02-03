import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/auth.service";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      navigate("/login?passwordReset=true");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de recuperación no válido");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: formData.newPassword,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="mb-4 text-red-400 text-5xl">⚠</div>
            <h2 className="text-xl font-semibold mb-4">Token Inválido</h2>
            <p className="text-dark-400 mb-6">
              El enlace de recuperación no es válido o ha expirado.
            </p>
            <button
              onClick={() => navigate("/forgot-password")}
              className="btn-primary w-full"
            >
              Solicitar Nuevo Enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DivancoSaaS</h1>
          <p className="text-dark-400">Restablecer contraseña</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Nueva Contraseña</h2>
          <p className="text-dark-400 text-sm mb-6">
            Ingresa tu nueva contraseña.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                minLength={8}
              />
            </div>

            {(error || resetPasswordMutation.error) && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                {error ||
                  (resetPasswordMutation.error instanceof Error
                    ? resetPasswordMutation.error.message
                    : "Error al restablecer contraseña")}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending
                ? "Restableciendo..."
                : "Restablecer Contraseña"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              ← Volver al login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
