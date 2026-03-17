/**
 * WebViewScreen
 *
 * Pantalla genérica que abre el frontend web dentro de la app mobile.
 * Recibe `url` y `title` como parámetros de ruta (expo-router).
 *
 * Al cargarse inyecta el JWT del usuario en el localStorage del WebView
 * para que el frontend web lo reconozca y autentique automáticamente.
 * También inyecta businessUnitId y tenantId para que el contexto quede listo.
 *
 * Uso desde cualquier pantalla:
 *   router.push({ pathname: "/webview", params: { url: "/purchase-orders", title: "Órdenes de Compra" } });
 */

import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Text,
} from "react-native";
import { WebView } from "react-native-webview";
import { useAuthStore } from "@/store/auth.store";

const WEB_BASE =
  process.env.EXPO_PUBLIC_WEB_URL ?? "https://divanco-saas.vercel.app";

export default function WebViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Construir URL completa
  const path = params.url ?? "/";
  const fullUrl = path.startsWith("http") ? path : `${WEB_BASE}${path}`;

  /**
   * Script que se inyecta apenas el WebView carga el HTML.
   * Guarda el token y el contexto de BU en localStorage para que
   * el frontend web los detecte y autentique la sesión.
   */
  const injectedJS = `
    (function() {
      try {
        var token = ${JSON.stringify(token ?? "")};
        var user = ${JSON.stringify(user ?? {})};
        if (token) {
          localStorage.setItem("auth-token", token);
          localStorage.setItem("token", token);
          // Algunos frameworks guardan el estado en formato JSON
          var authState = {
            state: {
              token: token,
              user: user,
            },
            version: 0
          };
          localStorage.setItem("divanco-auth", JSON.stringify(authState));
        }
      } catch(e) {}
      true;
    })();
  `;

  const webviewRef = useRef<WebView>(null);

  if (!token) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Sesión no disponible.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: params.title ?? "DivancoSaaS",
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f1f5f9",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />

      <View style={styles.container}>
        <WebView
          ref={webviewRef}
          source={{ uri: fullUrl }}
          injectedJavaScriptBeforeContentLoaded={injectedJS}
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          allowsInlineMediaPlayback
          style={{ flex: 1 }}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0284c7" />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No se pudo cargar la página.</Text>
            <Pressable
              onPress={() => webviewRef.current?.reload()}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>Reintentar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: "#0284c7",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
