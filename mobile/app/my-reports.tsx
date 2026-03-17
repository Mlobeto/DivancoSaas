/**
 * MY REPORTS — app/my-reports.tsx
 *
 * Pantalla de reportes del operario:
 *  • Sección "Pendiente de envío"  — evidencias guardadas offline (SQLite)
 *  • Botón Sincronizar             — sube todo cuando hay conexión
 *  • Sección "Hoy"                 — resumen de progreso por contrato (API)
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBrandingStore } from "@/store/branding.store";
import {
  useOfflineQueueStore,
  type PendingUpload,
} from "@/store/offline-queue.store";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PHOTO_ICONS: Record<string, string> = {
  ASSET_START: "🌅",
  HOUROMETER: "⏱️",
  ASSET_END: "🌇",
  WORK_PROGRESS: "📸",
  INCIDENT: "⚠️",
  OTHER: "📋",
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

// ─── Pending item row ─────────────────────────────────────────────────────────

function PendingRow({ item }: { item: PendingUpload }) {
  return (
    <View style={styles.pendingRow}>
      <Text style={styles.pendingIcon}>
        {PHOTO_ICONS[item.photoType] ?? "📷"}
      </Text>
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingLabel}>{item.label}</Text>
        <Text style={styles.pendingAsset} numberOfLines={1}>
          {item.assetName}
        </Text>
        <Text style={styles.pendingTime}>{timeAgo(item.enqueuedAt)}</Text>
      </View>
      <View style={styles.pendingStatus}>
        <Text style={styles.pendingStatusIcon}>⏳</Text>
        {item.retries > 0 && (
          <Text style={styles.pendingRetries}>{item.retries}x</Text>
        )}
      </View>
    </View>
  );
}

// ─── Assignment summary row ───────────────────────────────────────────────────

function AssignmentRow({ item }: { item: Assignment }) {
  const allDone = item.today.startComplete && item.today.endComplete;

  return (
    <View style={[styles.assignmentRow, allDone && styles.assignmentRowDone]}>
      <View style={styles.assignmentLeft}>
        <Text style={styles.assignmentName} numberOfLines={1}>
          {item.asset.name}
        </Text>
        <Text style={styles.assignmentContract} numberOfLines={1}>
          {item.contract.code} · {item.contract.client.name}
        </Text>
      </View>
      <View style={styles.assignmentBadges}>
        <Text
          style={[
            styles.badge,
            item.today.startComplete ? styles.badgeDone : styles.badgePending,
          ]}
        >
          {item.today.startComplete ? "✓" : "○"} Apertura
        </Text>
        <Text
          style={[
            styles.badge,
            item.today.endComplete ? styles.badgeDone : styles.badgePending,
          ]}
        >
          {item.today.endComplete ? "✓" : "○"} Cierre
        </Text>
        {item.today.adhocCount > 0 && (
          <Text style={[styles.badge, styles.badgeInfo]}>
            {item.today.adhocCount} extra
            {item.today.adhocCount !== 1 ? "s" : ""}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MyReportsScreen() {
  const navigation = useNavigation();
  const primaryColor = useBrandingStore((s) => s.primaryColor);
  const queryClient = useQueryClient();

  const pending = useOfflineQueueStore((s) => s.pending);
  const isSyncing = useOfflineQueueStore((s) => s.isSyncing);
  const syncAll = useOfflineQueueStore((s) => s.syncAll);

  useEffect(() => {
    navigation.setOptions({ title: "Mis Reportes" });
  }, []);

  const {
    data: assignments = [],
    isLoading,
    refetch,
  } = useQuery<Assignment[]>({
    queryKey: ["my-assignments"],
    queryFn: async () => {
      const res = await api.get("/mobile/my-assignments");
      return res.data.data;
    },
  });

  const handleSync = async () => {
    const result = await syncAll();
    if (result.success > 0) {
      queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
      refetch();
      Alert.alert(
        "✅ Sincronizado",
        `${result.success} evidencia${result.success !== 1 ? "s" : ""} enviada${result.success !== 1 ? "s" : ""} correctamente.`,
      );
    } else if (result.failed > 0) {
      Alert.alert(
        "Sin conexión",
        `No se pudo sincronizar. Verifica tu conexión e intenta de nuevo.`,
      );
    }
  };

  const completedCount = assignments.filter(
    (a) => a.today.startComplete && a.today.endComplete,
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Pending offline section ── */}
      {pending.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleLeft}>
              <Text style={styles.sectionTitle}>Pendiente de envío</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pending.length}</Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.syncBtn,
                { backgroundColor: primaryColor },
                isSyncing && styles.syncBtnDisabled,
              ]}
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.syncBtnText}>↑ Sincronizar</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.card}>
            {pending.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={styles.divider} />}
                <PendingRow item={item} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.allSyncedBanner}>
          <Text style={styles.allSyncedText}>✓ Todo sincronizado</Text>
        </View>
      )}

      {/* ── Today's assignments summary ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hoy</Text>
          {!isLoading && assignments.length > 0 && (
            <Text style={styles.sectionCount}>
              {completedCount} / {assignments.length} completos
            </Text>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator
            color={primaryColor}
            size="large"
            style={{ marginTop: 24 }}
          />
        ) : assignments.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.emptyText}>
              No tienes contratos activos hoy
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {assignments.map((a, idx) => (
              <View key={a.id}>
                {idx > 0 && <View style={styles.divider} />}
                <AssignmentRow item={a} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12,
    color: "#64748b",
  },
  countBadge: {
    backgroundColor: "#c2410c",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  syncBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 110,
    alignItems: "center",
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  emptyCard: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#0f172a",
  },
  // Pending row
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  pendingIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  pendingInfo: {
    flex: 1,
  },
  pendingLabel: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "500",
  },
  pendingAsset: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 1,
  },
  pendingTime: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  pendingStatus: {
    alignItems: "center",
    gap: 2,
  },
  pendingStatusIcon: {
    fontSize: 16,
  },
  pendingRetries: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "700",
  },
  // Assignment row
  assignmentRow: {
    padding: 12,
    gap: 8,
  },
  assignmentRowDone: {
    opacity: 0.65,
  },
  assignmentLeft: {
    marginBottom: 4,
  },
  assignmentName: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "600",
  },
  assignmentContract: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 1,
  },
  assignmentBadges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeDone: {
    backgroundColor: "#14532d",
    color: "#86efac",
  },
  badgePending: {
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    borderWidth: 1,
    borderColor: "#334155",
  },
  badgeInfo: {
    backgroundColor: "#1e3a5f",
    color: "#93c5fd",
  },
  // All synced banner
  allSyncedBanner: {
    backgroundColor: "#14532d",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  allSyncedText: {
    color: "#86efac",
    fontWeight: "700",
    fontSize: 14,
  },
});
