import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useBrandingStore } from "@/store/branding.store";
import api from "@/lib/api";

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

export default function DashboardScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const fullName = useAuthStore((s) => s.fullName);
  const logoUrl = useBrandingStore((s) => s.logoUrl);
  const primaryColor = useBrandingStore((s) => s.primaryColor);
  const businessUnitName = useBrandingStore((s) => s.businessUnitName);

  const { data, isLoading, isError, refetch } = useQuery<Assignment[]>({
    queryKey: ["my-assignments"],
    queryFn: async () => {
      const res = await api.get("/mobile/my-assignments");
      return res.data.data;
    },
  });

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

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

  return (
    <View style={styles.container}>
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
          <View>
            <Text style={styles.greeting}>Hola, {fullName()}</Text>
            <Text style={styles.date}>
              {businessUnitName || "Contratos asignados hoy"}
            </Text>
          </View>
        </View>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutLink}>Salir</Text>
        </Pressable>
      </View>

      {isLoading && (
        <ActivityIndicator
          color="#0284c7"
          size="large"
          style={{ marginTop: 40 }}
        />
      )}

      {isError && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Error al cargar contratos</Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: primaryColor }]}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No tienes contratos activos asignados
          </Text>
        </View>
      )}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignment}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function ProgressBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <View style={[styles.badge, done ? styles.badgeDone : styles.badgePending]}>
      <Text style={styles.badgeText}>
        {done ? "✓" : "○"} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1f5f9",
  },
  date: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  logoutLink: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
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
    backgroundColor: "#0284c7",
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
