import axios from "axios";

// Usar la URL del backend desde variables de entorno
// En desarrollo: http://localhost:3000/api/v1 (con proxy de Vite)
// En producción: https://divancosaas-production.up.railway.app/api/v1
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token y contexto multitenancy
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Agregar contexto de tenant y business unit desde localStorage
  const authData = localStorage.getItem("divanco-auth-storage");
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const state = parsed.state;

      if (state?.tenant?.id) {
        config.headers["X-Tenant-Id"] = state.tenant.id;
      }
      if (state?.businessUnit?.id) {
        config.headers["X-Business-Unit-Id"] = state.businessUnit.id;
      }
    } catch (error) {
      console.error("Error parsing auth data:", error);
    }
  }

  return config;
});

// Interceptor para manejar errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
