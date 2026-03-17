/**
 * AUTH STORE (Zustand + persist)
 *
 * Estado global de autenticación.
 * Se persiste en AsyncStorage del dispositivo — el usuario NO
 * tiene que hacer login cada vez que abre la app.
 *
 * Uso en cualquier pantalla:
 *   const token = useAuthStore((s) => s.token);
 *   const user  = useAuthStore((s) => s.user);
 *   const logout = useAuthStore((s) => s.logout);
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TYPES ────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // rol global (SUPER_ADMIN | USER)
  buRole: string | null; // nombre del rol en la BU (Operario, Compras, Contable...)
  tenantId: string | null;
  businessUnitId: string | null;
  permissions: string[]; // permisos de la BU activa
}

interface AuthState {
  // Data
  token: string | null;
  user: AuthUser | null;

  // Actions
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;

  // Computed helpers (getters)
  isAuthenticated: () => boolean;
  fullName: () => string;
}

// ─── STORE ────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      /**
       * Llamado después de un login exitoso.
       * Guarda el token y los datos del usuario.
       */
      setAuth: (token, user) => set({ token, user }),

      /**
       * Borra el token y los datos del usuario.
       * La pantalla que llame a esto debe navegar al login.
       */
      logout: () => set({ token: null, user: null }),

      // Helpers para no repetir verificaciones en pantallas
      isAuthenticated: () => get().token !== null && get().user !== null,
      fullName: () => {
        const u = get().user;
        if (!u) return "";
        return `${u.firstName} ${u.lastName}`.trim();
      },
    }),
    {
      name: "divanco-auth", // clave en AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
