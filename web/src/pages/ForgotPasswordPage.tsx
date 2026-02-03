import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      setSuccess(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate(email);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="mb-4 text-green-400 text-5xl">✓</div>
            <h2 className="text-xl font-semibold mb-4">Email Enviado</h2>
            <p className="text-dark-400 mb-6">
              Hemos enviado un enlace de recuperación a{" "}
              <strong className="text-white">{email}</strong>. Revisa tu bandeja
              de entrada y sigue las instrucciones.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="btn-primary w-full"
            >
              Volver al Login
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
          <p className="text-dark-400">Recuperar contraseña</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-2">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-dark-400 text-sm mb-6">
            Ingresa tu email y te enviaremos un enlace para recuperar tu
            contraseña.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {forgotPasswordMutation.error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                {forgotPasswordMutation.error instanceof Error
                  ? forgotPasswordMutation.error.message
                  : "Error al enviar email"}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending
                ? "Enviando..."
                : "Enviar Enlace"}
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
