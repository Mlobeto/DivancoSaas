/**
 * BRANDING STORE (Zustand + persist)
 *
 * Almacena el branding de la BusinessUnit del operario logueado:
 * logo, colores primario y secundario, nombre de la empresa.
 *
 * Se carga una vez después del login y se persiste en disco
 * para que esté disponible incluso offline.
 *
 * Uso:
 *   const primary = useBrandingStore((s) => s.primaryColor);
 *   const logo    = useBrandingStore((s) => s.logoUrl);
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TYPES ────────────────────────────────────────────────────

export interface BrandingData {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  businessUnitName: string;
}

interface BrandingState extends BrandingData {
  isLoaded: boolean;
  setBranding: (data: BrandingData) => void;
  reset: () => void;
}

const DEFAULTS: BrandingData = {
  logoUrl: null,
  primaryColor: "#1E40AF", // DivancoSaaS navy-blue fallback
  secondaryColor: "#64748B",
  businessUnitName: "",
};

// ─── STORE ────────────────────────────────────────────────────

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      isLoaded: false,

      setBranding: (data) =>
        set({
          ...data,
          isLoaded: true,
        }),

      reset: () => set({ ...DEFAULTS, isLoaded: false }),
    }),
    {
      name: "divanco-branding",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
