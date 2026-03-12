/**
 * EVIDENCE SCREEN  — app/assignment/[id].tsx
 *
 * Muestra los grupos de evidencia del día (Apertura / Cierre / Adicionales)
 * para un contrato asignado al operario.
 *
 * Flujo por ítem:
 *  1. Operario toca "Tomar foto" → acción: Cámara o Galería
 *  2. Selecciona imagen → preview + campo de notas opcionales
 *  3. Confirma → sube via POST /mobile/assignments/:id/evidence (multipart)
 *  4. Lista se refresca y muestra el thumb de la foto subida
 */

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import api from "@/lib/api";
import { useBrandingStore } from "@/store/branding.store";

// ─── TYPES ────────────────────────────────────────────────────

type PhotoType =
  | "ASSET_START"
  | "HOUROMETER"
  | "ASSET_END"
  | "WORK_PROGRESS"
  | "INCIDENT"
  | "OTHER";

interface SubmittedEvidence {
  id: string;
  photoUrl: string;
  notes: string | null;
  submittedAt: string;
}

interface EvidenceItem {
  photoType: PhotoType;
  label: string;
  required: boolean;
  submitted?: SubmittedEvidence;
}

interface EvidenceGroup {
  type: "START" | "END" | "ADHOC";
  label: string;
  items: EvidenceItem[];
}

interface EvidenceData {
  reportId: string | null;
  date: string;
  groups: EvidenceGroup[];
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────

interface UploadModalProps {
  visible: boolean;
  item: EvidenceItem | null;
  assignmentId: string;
  primaryColor: string;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({
  visible,
  item,
  assignmentId,
  primaryColor,
  onClose,
  onSuccess,
}: UploadModalProps) {
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [notes, setNotes] = useState("");

  // Reset state when modal opens with a new item
  useEffect(() => {
    if (visible) {
      setSelectedImage(null);
      setNotes("");
    }
  }, [visible, item?.photoType]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage || !item) throw new Error("No image selected");

      const formData = new FormData();
      formData.append("photo", {
        uri: selectedImage.uri,
        name: selectedImage.fileName ?? "evidence.jpg",
        type: selectedImage.mimeType ?? "image/jpeg",
      } as any);
      formData.append("photoType", item.photoType);
      if (notes.trim()) formData.append("notes", notes.trim());

      await api.post(`/mobile/assignments/${assignmentId}/evidence`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      Alert.alert(
        "Error al subir",
        err?.response?.data?.error?.message ?? "No se pudo subir la evidencia",
      );
    },
  });

  const pickImage = async (source: "camera" | "library") => {
    // Request permissions
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a la cámara");
        return;
      }
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a la galería");
        return;
      }
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            quality: 0.75,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            quality: 0.75,
            allowsEditing: false,
          });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handlePickSource = () => {
    Alert.alert("Agregar foto", "¿De dónde quieres tomar la foto?", [
      { text: "Cámara", onPress: () => pickImage("camera") },
      { text: "Galería", onPress: () => pickImage("library") },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{item.label}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          {/* Photo area */}
          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.preview}
                resizeMode="cover"
              />
              <Pressable
                style={styles.changePhotoBtn}
                onPress={handlePickSource}
              >
                <Text style={styles.changePhotoText}>Cambiar foto</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.pickPhotoBtn} onPress={handlePickSource}>
              <Text style={styles.pickPhotoIcon}>📷</Text>
              <Text style={styles.pickPhotoText}>Tomar o seleccionar foto</Text>
            </Pressable>
          )}

          {/* Notes */}
          <Text style={styles.notesLabel}>Notas (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Agrega observaciones..."
            placeholderTextColor="#64748b"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          {/* Submit */}
          <Pressable
            style={[
              styles.submitBtn,
              { backgroundColor: selectedImage ? primaryColor : "#334155" },
            ]}
            onPress={() => uploadMutation.mutate()}
            disabled={!selectedImage || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {selectedImage
                  ? "Subir evidencia"
                  : "Selecciona una foto primero"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── EVIDENCE ITEM ROW ───────────────────────────────────────

interface ItemRowProps {
  item: EvidenceItem;
  primaryColor: string;
  onAdd: (item: EvidenceItem) => void;
}

function ItemRow({ item, primaryColor, onAdd }: ItemRowProps) {
  const done = !!item.submitted;

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemLeft}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: done ? "#16a34a" : "#475569" },
          ]}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          {item.submitted?.notes && (
            <Text style={styles.itemNotes}>{item.submitted.notes}</Text>
          )}
          {item.submitted && (
            <Text style={styles.itemTime}>
              {new Date(item.submitted.submittedAt).toLocaleTimeString("es", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.itemRight}>
        {item.submitted ? (
          <Image
            source={{ uri: item.submitted.photoUrl }}
            style={styles.thumb}
          />
        ) : (
          <Pressable
            style={[styles.addBtn, { borderColor: primaryColor }]}
            onPress={() => onAdd(item)}
          >
            <Text style={[styles.addBtnText, { color: primaryColor }]}>
              + Foto
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── GROUP SECTION ───────────────────────────────────────────

interface GroupSectionProps {
  group: EvidenceGroup;
  primaryColor: string;
  onAdd: (item: EvidenceItem) => void;
  onAddAdhoc: () => void;
}

const GROUP_ICONS: Record<string, string> = {
  START: "🌅",
  END: "🌇",
  ADHOC: "⚠️",
};

function GroupSection({
  group,
  primaryColor,
  onAdd,
  onAddAdhoc,
}: GroupSectionProps) {
  const submitted = group.items.filter((i) => i.submitted).length;
  const total = group.items.length;
  const allDone = submitted === total && total > 0;

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupIcon}>{GROUP_ICONS[group.type]}</Text>
        <Text style={styles.groupLabel}>{group.label}</Text>
        <View
          style={[
            styles.groupBadge,
            allDone ? styles.groupBadgeDone : styles.groupBadgePending,
          ]}
        >
          <Text style={styles.groupBadgeText}>
            {group.type === "ADHOC" ? `${total}` : `${submitted}/${total}`}
          </Text>
        </View>
      </View>

      {group.items.map((item) => (
        <ItemRow
          key={item.photoType}
          item={item}
          primaryColor={primaryColor}
          onAdd={onAdd}
        />
      ))}

      {group.type === "ADHOC" && (
        <Pressable
          style={[styles.adhocAddBtn, { borderColor: primaryColor }]}
          onPress={onAddAdhoc}
        >
          <Text style={[styles.adhocAddText, { color: primaryColor }]}>
            + Agregar reporte adicional
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────

export default function AssignmentEvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const primaryColor = useBrandingStore((s) => s.primaryColor);

  const [modalItem, setModalItem] = useState<EvidenceItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<EvidenceData>({
    queryKey: ["evidence", id],
    queryFn: async () => {
      const res = await api.get(`/mobile/assignments/${id}/evidence`);
      return res.data.data;
    },
  });

  // Update header title with contract info once loaded
  useEffect(() => {
    if (data) {
      navigation.setOptions({ title: "Evidencias del día" });
    }
  }, [data]);

  const openModal = (item: EvidenceItem) => {
    setModalItem(item);
    setModalVisible(true);
  };

  const openAdhocModal = () => {
    // Let user choose between INCIDENT or OTHER
    Alert.alert("Tipo de reporte", "¿Qué deseas reportar?", [
      {
        text: "Incidente / Daño",
        onPress: () =>
          openModal({
            photoType: "INCIDENT",
            label: "Reporte de incidente",
            required: false,
          }),
      },
      {
        text: "Otro",
        onPress: () =>
          openModal({
            photoType: "OTHER",
            label: "Reporte adicional",
            required: false,
          }),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["evidence", id] });
    queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={primaryColor} size="large" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error al cargar evidencias</Text>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: primaryColor }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateLabel}>
          {new Date(data.date).toLocaleDateString("es", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>

        {data.groups.map((group) => (
          <GroupSection
            key={group.type}
            group={group}
            primaryColor={primaryColor}
            onAdd={openModal}
            onAddAdhoc={openAdhocModal}
          />
        ))}
      </ScrollView>

      <UploadModal
        visible={modalVisible}
        item={modalItem}
        assignmentId={id}
        primaryColor={primaryColor}
        onClose={() => setModalVisible(false)}
        onSuccess={handleUploadSuccess}
      />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    color: "#94a3b8",
    fontSize: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  dateLabel: {
    color: "#64748b",
    fontSize: 13,
    textTransform: "capitalize",
    marginBottom: 16,
  },

  // Group
  group: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  groupIcon: {
    fontSize: 18,
  },
  groupLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  groupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  groupBadgeDone: {
    backgroundColor: "#14532d",
  },
  groupBadgePending: {
    backgroundColor: "#1e3a5f",
  },
  groupBadgeText: {
    fontSize: 12,
    color: "#f1f5f9",
    fontWeight: "600",
  },

  // Item row
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#0f172a",
    gap: 10,
  },
  itemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "500",
  },
  itemNotes: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  itemTime: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Adhoc add button
  adhocAddBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
  },
  adhocAddText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#f1f5f9",
    fontSize: 17,
    fontWeight: "bold",
    flex: 1,
  },
  modalClose: {
    color: "#64748b",
    fontSize: 18,
    padding: 4,
  },

  // Photo picker
  pickPhotoBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  pickPhotoIcon: {
    fontSize: 36,
  },
  pickPhotoText: {
    color: "#94a3b8",
    fontSize: 15,
  },
  previewContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  changePhotoBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changePhotoText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // Notes
  notesLabel: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 12,
    color: "#f1f5f9",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },

  // Submit
  submitBtn: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
