import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useBrandingStore } from "@/store/branding.store";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const resetBranding = useBrandingStore((s) => s.reset);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      // data.data.token  — JWT
      // data.data.user   — { id, email, firstName, lastName, role, ... }
      // data.data.context — { businessUnitId, tenantId }
      const { token, user, context } = data.data;
      resetBranding(); // limpiar branding anterior antes de cargar el nuevo
      setAuth(token, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: context?.tenantId ?? user.tenantId ?? null,
        businessUnitId: context?.businessUnitId ?? null,
      });
      router.replace("/dashboard");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ??
        err?.message ??
        "Error al iniciar sesión";
      setErrorMsg(msg);
    },
  });

  const handleLogin = () => {
    loginMutation.mutate({ email, password });
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </Pressable>
        </View>

        {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

        <Pressable
          style={[
            styles.button,
            loginMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loginMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {loginMutation.isPending ? "Iniciando..." : "Iniciar Sesión"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#f1f5f9",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12,
    color: "#f1f5f9",
    marginBottom: 16,
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12,
    paddingRight: 48,
    color: "#f1f5f9",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: "#0284c7",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
  },
});
