import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DivancoSaaS</Text>
      <Text style={styles.subtitle}>
        Sistema de gestión modular multitenant
      </Text>

      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </Pressable>
      </View>

      <Text style={styles.info}>
        Aplicación móvil con soporte offline-first para operaciones en campo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 40,
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  button: {
    backgroundColor: "#0284c7",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  info: {
    marginTop: 40,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});
