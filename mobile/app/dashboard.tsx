import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useBrandingStore } from "@/store/branding.store";
import api from "@/lib/api";

// ─── Módulos web disponibles ────────────────────────────────────────────────

interface WebModule {
  id: string;
  title: string;
  subtitle: string;
  permission: string; // permiso requerido
  path: string; // ruta dentro del frontend web
  icon: string;
  color: string;
}

const ALL_MODULES: WebModule[] = [
  {
    id: "clients",
    title: "Cuentas de Clientes",
    subtitle: "Gestión de clientes y contratos",
    permission: "clients:read",
    path: "/clients",
    icon: "👥",
    color: "#0369a1",
  },
  {
    id: "quotations",
    title: "Cotizaciones",
    subtitle: "Presupuestos y propuestas",
    permission: "quotations:read",
    path: "/quotations",
    icon: "📋",
    color: "#7c3aed",
  },
  {
    id: "purchase-orders",
    title: "Órdenes de Compra",
    subtitle: "Solicitudes y aprobaciones",
    permission: "purchase-orders:read",
    path: "/purchase-orders",
    icon: "🛒",
    color: "#b45309",
  },
];

// ─── Tipo para asignaciones del Operario ────────────────────────────────────

interface Assignment {
  id: string;
  asset: { name: string; code: string };
  contract: { code: string; client: { name: string } };
  today: {
    startComplete: boolean;
    endComplete: boolean;
    adhocCount: number;
  };
}

// ─── Pantalla principal ──────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const fullName = useAuthStore((s) => s.fullName);
  const user = useAuthStore((s) => s.user);
  const logoUrl = useBrandingStore((s) => s.logoUrl);
  const primaryColor = useBrandingStore((s) => s.primaryColor);
  const businessUnitName = useBrandingStore((s) => s.businessUnitName);

  const permissions = user?.permissions ?? [];
  const isPrivileged =
    user?.role === "SUPER_ADMIN" || user?.buRole?.toLowerCase() === "owner";

  // Módulos visibles según permisos del usuario
  const visibleModules = ALL_MODULES.filter(
    (m) => isPrivileged || permissions.includes(m.permission),
  );

  // Si tiene módulos web → dashboard de gestión; si no → dashboard de operario
  const showModules = visibleModules.length > 0;

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      {/* ── Header común ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.logoPlaceholder,
                { backgroundColor: primaryColor },
              ]}
            >
              <Text style={styles.logoPlaceholderText}>
                {businessUnitName ? businessUnitName[0].toUpperCase() : "D"}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting} numberOfLines={1}>
              Hola, {fullName()}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {user?.buRole ? `${user.buRole} · ` : ""}
              {businessUnitName || "DivancoSaaS"}
            </Text>
          </View>
        </View>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutLink}>Salir</Text>
        </Pressable>
      </View>

      {/* ── Contenido dinámico según rol ── */}
      {showModules ? (
        <ModulesView modules={visibleModules} />
      ) : (
        <AssignmentsView primaryColor={primaryColor} />
      )}
    </View>
  );
}

// ─── Vista de módulos (Compras, Contable, Owner…) ────────────────────────────

function ModulesView({ modules }: { modules: WebModule[] }) {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 20 * 2 - 12) / 2; // 2 columnas con gap

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.modulesGrid}
    >
      <Text style={styles.sectionTitle}>Módulos disponibles</Text>
      <View style={styles.gridRow}>
        {modules.map((mod) => (
          <Pressable
            key={mod.id}
            style={[
              styles.moduleCard,
              { width: cardWidth, borderTopColor: mod.color },
            ]}
            onPress={() =>
              router.push({
                pathname: "/webview",
                params: { url: mod.path, title: mod.title },
              })
            }
          >
            <Text style={styles.moduleIcon}>{mod.icon}</Text>
            <Text style={styles.moduleTitle}>{mod.title}</Text>
            <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
            <View
              style={[
                styles.moduleArrow,
                { backgroundColor: mod.color + "22" },
              ]}
            >
              <Text style={[styles.moduleArrowText, { color: mod.color }]}>
                Abrir →
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Vista de asignaciones (Operario) ────────────────────────────────────────

function AssignmentsView({ primaryColor }: { primaryColor: string }) {
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery<Assignment[]>({
    queryKey: ["my-assignments"],
    queryFn: async () => {
      const res = await api.get("/mobile/my-assignments");
      return res.data.data;
    },
  });

  const renderAssignment = ({ item }: { item: Assignment }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/assignment/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.assetName}>{item.asset.name}</Text>
        <Text style={styles.assetCode}>{item.asset.code}</Text>
      </View>
      <Text style={styles.contractText}>
        {item.contract.code} · {item.contract.client.name}
      </Text>
      <View style={styles.progressRow}>
        <ProgressBadge done={item.today.startComplete} label="Apertura" />
        <ProgressBadge done={item.today.endComplete} label="Cierre" />
        {item.today.adhocCount > 0 && (
          <View style={[styles.badge, styles.badgeInfo]}>
            <Text style={styles.badgeText}>{item.today.adhocCount} extras</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <ActivityIndicator
        color="#0284c7"
        size="large"
        style={{ marginTop: 40 }}
      />
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>Error al cargar contratos</Text>
        <Pressable
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: primaryColor }]}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={renderAssignment}
      ListHeaderComponent={
        <Text style={styles.sectionTitle}>Contratos asignados hoy</Text>
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No tienes contratos activos asignados
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─── Badge de progreso ───────────────────────────────────────────────────────

function ProgressBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <View style={[styles.badge, done ? styles.badgeDone : styles.badgePending]}>
      <Text style={styles.badgeText}>
        {done ? "✓" : "○"} {label}
      </Text>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f1f5f9",
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  logoutLink: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  // Modules grid
  modulesGrid: {
    paddingBottom: 20,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  moduleCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6,
  },
  moduleIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  moduleSubtitle: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  moduleArrow: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moduleArrowText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Assignment cards
  card: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  assetName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f1f5f9",
    flex: 1,
  },
  assetCode: {
    fontSize: 12,
    color: "#64748b",
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contractText: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDone: {
    backgroundColor: "#14532d",
  },
  badgePending: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  badgeInfo: {
    backgroundColor: "#1e3a5f",
  },
  badgeText: {
    fontSize: 12,
    color: "#f1f5f9",
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
