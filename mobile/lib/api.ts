/**
 * API CLIENT
 *
 * Instancia de Axios preconfigurada para todos los requests al backend.
 *
 * Hace automáticamente:
 *  - Agrega el header Authorization: Bearer <token>
 *  - Agrega el header x-business-unit-id
 *  - Apunta a EXPO_PUBLIC_API_URL (o localhost:3000 como fallback)
 *
 * Uso:
 *   import api from "@/lib/api";
 *   const res = await api.get("/mobile/my-assignments");
 */

import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000") + "/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ─────────────────────────────────────
// Antes de cada request, inyecta el token y el businessUnitId del store.
// De esta forma cada pantalla puede usar `api` sin pensar en headers.
api.interceptors.request.use((config) => {
  // Leemos el store directamente (fuera de un componente React está permitido
  // con Zustand usando getState())
  const { token, user } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (user?.businessUnitId) {
    config.headers["x-business-unit-id"] = user.businessUnitId;
  }

  return config;
});

// ── Response interceptor ────────────────────────────────────
// Si el backend responde 401 (token expirado o inválido),
// limpiamos el store para forzar re-login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
