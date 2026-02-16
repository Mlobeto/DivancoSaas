import api from "@/lib/api";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
} from "@/core/types/api.types";

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      data,
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Login failed");
    }

    const authData = response.data.data!;

    // Log tenant data for debugging
    console.log("[AuthService] Login response:", {
      tenant: authData.tenant,
      user: authData.user,
      businessUnits: authData.businessUnits,
    });

    // Guardar token
    if (authData.token) {
      localStorage.setItem("token", authData.token);
    }

    return authData;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      data,
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Registration failed");
    }

    const authData = response.data.data!;

    // Guardar token
    if (authData.token) {
      localStorage.setItem("token", authData.token);
    }

    return authData;
  },

  async forgotPassword(email: string): Promise<void> {
    const response = await api.post<ApiResponse<void>>(
      "/auth/forgot-password",
      { email },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to send reset email",
      );
    }
  },

  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    const response = await api.post<ApiResponse<void>>(
      "/auth/reset-password",
      data,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to reset password",
      );
    }
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("divanco-auth-storage"); // Limpiar el estado persistido
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
