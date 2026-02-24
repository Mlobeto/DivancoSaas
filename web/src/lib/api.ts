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
  console.log(
    "[API] Token from localStorage:",
    token ? `${token.substring(0, 20)}...` : "NO TOKEN",
  );

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Agregar contexto de tenant y business unit desde localStorage
  const authData = localStorage.getItem("divanco-auth-storage");
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const state = parsed.state;

      console.log("[API] Auth context:", {
        tenantId: state?.tenant?.id,
        businessUnitId: state?.businessUnit?.id,
        hasToken: !!token,
      });

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
  (response) => {
    // Log response details for blob responses (debugging)
    if (response.config.responseType === "blob") {
      console.log("[API] Blob response received:", {
        url: response.config.url,
        status: response.status,
        dataType: typeof response.data,
        dataSize: response.data?.size || response.data?.length,
        contentType: response.headers["content-type"],
      });
    }
    return response;
  },
  (error) => {
    // Handle blob errors specially
    if (
      error.config?.responseType === "blob" &&
      error.response?.data instanceof Blob
    ) {
      return error.response.data.text().then((text) => {
        try {
          const errorData = JSON.parse(text);
          console.error("[API] Blob request failed:", errorData);
          return Promise.reject(
            new Error(errorData.message || "Error en la solicitud"),
          );
        } catch {
          console.error("[API] Blob request failed:", text);
          return Promise.reject(new Error(text || "Error desconocido"));
        }
      });
    }

    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
