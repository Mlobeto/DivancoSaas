import { create } from 'zustand';
import type { User, Tenant, BusinessUnit } from '@/types/api.types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  businessUnit: BusinessUnit | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    user: User;
    tenant: Tenant;
    businessUnit?: BusinessUnit;
    role?: string;
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  businessUnit: null,
  role: null,
  isAuthenticated: false,
  
  setAuth: (data) => set({
    user: data.user,
    tenant: data.tenant,
    businessUnit: data.businessUnit || null,
    role: data.role || null,
    isAuthenticated: true,
  }),
  
  clearAuth: () => set({
    user: null,
    tenant: null,
    businessUnit: null,
    role: null,
    isAuthenticated: false,
  }),
}));
