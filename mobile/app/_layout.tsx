import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useBrandingStore } from "@/store/branding.store";
import api from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * BrandingLoader — componente interno que escucha el token del auth store.
 * Cuando hay un usuario autenticado, carga el branding de su BU desde el API
 * y lo guarda en el branding store (persiste en disco para uso offline).
 */
function BrandingLoader() {
  const token = useAuthStore((s) => s.token);
  const setBranding = useBrandingStore((s) => s.setBranding);
  const resetBranding = useBrandingStore((s) => s.reset);

  useEffect(() => {
    if (!token) {
      resetBranding();
      return;
    }

    api
      .get("/mobile/branding")
      .then((res) => setBranding(res.data.data))
      .catch(() => {
        // Si falla (offline), el persist ya tiene el último branding cacheado
      });
  }, [token]);

  return null;
}

export default function RootLayout() {
  const primaryColor = useBrandingStore((s) => s.primaryColor);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <BrandingLoader />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1e293b",
          },
          headerTintColor: "#f1f5f9",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: "DivancoSaaS" }} />
        <Stack.Screen name="login" options={{ title: "Iniciar Sesión" }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen
          name="assignment/[id]"
          options={{
            title: "Evidencias del día",
            headerStyle: { backgroundColor: primaryColor },
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
