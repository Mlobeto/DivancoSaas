import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Tenant, BusinessUnit } from "@/core/types/api.types";

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  businessUnit: BusinessUnit | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    user: User;
    tenant?: Tenant; // ← Optional for SUPER_ADMIN
    businessUnit?: BusinessUnit;
    role?: string;
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      businessUnit: null,
      role: null,
      isAuthenticated: false,

      setAuth: (data) =>
        set({
          user: data.user,
          tenant: data.tenant || null,
          businessUnit: data.businessUnit || null,
          role: data.role || null,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          tenant: null,
          businessUnit: null,
          role: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "divanco-auth-storage", // nombre único para localStorage
    },
  ),
);
