import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  notificationService,
  type NotificationRecipient,
} from "@/core/services/notification.service";
import { Send, X } from "lucide-react";

interface ManualNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualNotificationModal({
  isOpen,
  onClose,
}: ManualNotificationModalProps) {
  const [useCase, setUseCase] = useState<
    | "GENERAL_ANNOUNCEMENT"
    | "SITE_UPDATE"
    | "QUOTATION_CREATED"
    | "CLIENT_PICKUP_APPROVED"
    | "CLIENT_PICKUP_ARRIVED"
  >("GENERAL_ANNOUNCEMENT");
  const [deliveryMode, setDeliveryMode] = useState<"notification" | "chat">(
    "notification",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "specific">("all");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>(
    [],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: recipients = [], isLoading: loadingRecipients } = useQuery({
    queryKey: ["notificationRecipients"],
    queryFn: () => notificationService.listRecipients(),
    enabled: isOpen,
  });

  const recipientsByRole = useMemo(() => {
    const grouped = new Map<string, NotificationRecipient[]>();
    recipients.forEach((recipient) => {
      const role = recipient.roleName || "Sin rol";
      if (!grouped.has(role)) {
        grouped.set(role, []);
      }
      grouped.get(role)!.push(recipient);
    });
    return Array.from(grouped.entries());
  }, [recipients]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      return notificationService.sendManual({
        title: title.trim(),
        body: body.trim(),
        recipientMode,
        recipientIds:
          recipientMode === "specific" ? selectedRecipientIds : undefined,
        type: "manual_message",
        useCase,
        deliveryMode,
      });
    },
    onSuccess: (result) => {
      setSuccessMessage(`Notificación enviada a ${result.sent} usuario(s).`);
      setFormError(null);
      setTitle("");
      setBody("");
      setSelectedRecipientIds([]);
      setRecipientMode("all");
      setUseCase("GENERAL_ANNOUNCEMENT");
      setDeliveryMode("notification");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "No se pudo enviar la notificación.";
      setFormError(message);
      setSuccessMessage(null);
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setBody("");
      setRecipientMode("all");
      setSelectedRecipientIds([]);
      setUseCase("GENERAL_ANNOUNCEMENT");
      setDeliveryMode("notification");
      setFormError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const useCaseLabelMap: Record<string, string> = {
    GENERAL_ANNOUNCEMENT: "Mensaje general (solo OWNER)",
    SITE_UPDATE: "Actualización de obra",
    QUOTATION_CREATED: "Cotización creada",
    CLIENT_PICKUP_APPROVED: "Cliente aprobado para retiro",
    CLIENT_PICKUP_ARRIVED: "Cliente llegó a retirar",
  };

  const useCaseHintMap: Record<string, string> = {
    GENERAL_ANNOUNCEMENT:
      "Difusión general para todo el equipo. Recomendado para OWNER.",
    SITE_UPDATE:
      "Aviso operativo de obra/equipo para coordinación entre áreas.",
    QUOTATION_CREATED:
      "Dispara comunicación a OWNER, comercial, contabilidad y mantenimiento (según política).",
    CLIENT_PICKUP_APPROVED:
      "Ventas/comercial avisa que el cliente ya está autorizado para retirar.",
    CLIENT_PICKUP_ARRIVED:
      "Mantenimiento/operación avisa que el cliente llegó a retiro.",
  };

  const isSubmitDisabled =
    sendMutation.isPending ||
    title.trim().length < 3 ||
    body.trim().length < 3 ||
    (recipientMode === "specific" && selectedRecipientIds.length === 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-dark-900 border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Enviar notificación manual</h3>
          <button type="button" className="btn-ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="form-label">Tipo de flujo</label>
            <select
              className="input"
              value={useCase}
              onChange={(event) =>
                setUseCase(
                  event.target.value as
                    | "GENERAL_ANNOUNCEMENT"
                    | "SITE_UPDATE"
                    | "QUOTATION_CREATED"
                    | "CLIENT_PICKUP_APPROVED"
                    | "CLIENT_PICKUP_ARRIVED",
                )
              }
            >
              <option value="GENERAL_ANNOUNCEMENT">
                {useCaseLabelMap.GENERAL_ANNOUNCEMENT}
              </option>
              <option value="SITE_UPDATE">{useCaseLabelMap.SITE_UPDATE}</option>
              <option value="QUOTATION_CREATED">
                {useCaseLabelMap.QUOTATION_CREATED}
              </option>
              <option value="CLIENT_PICKUP_APPROVED">
                {useCaseLabelMap.CLIENT_PICKUP_APPROVED}
              </option>
              <option value="CLIENT_PICKUP_ARRIVED">
                {useCaseLabelMap.CLIENT_PICKUP_ARRIVED}
              </option>
            </select>
            <p className="text-xs text-dark-400 mt-2">
              {useCaseHintMap[useCase]}
            </p>
          </div>

          <div>
            <label className="form-label">Canal</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={deliveryMode === "notification"}
                  onChange={() => setDeliveryMode("notification")}
                />
                Notificación funcional
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={deliveryMode === "chat"}
                  onChange={() => setDeliveryMode("chat")}
                />
                Chat interno (pendiente)
              </label>
            </div>
            {deliveryMode === "chat" && (
              <p className="text-xs text-yellow-400">
                Chat está pendiente para definición con cliente; para el demo se
                recomienda usar notificación funcional.
              </p>
            )}
          </div>

          <div>
            <label className="form-label">Título</label>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Actualización de operación"
              maxLength={120}
            />
          </div>

          <div>
            <label className="form-label">Mensaje</label>
            <textarea
              className="input min-h-[120px]"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Escribe el mensaje que quieres enviar al equipo"
              maxLength={1000}
            />
          </div>

          <div>
            <label className="form-label">Destinatarios</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={recipientMode === "all"}
                  onChange={() => setRecipientMode("all")}
                  disabled={
                    useCase !== "GENERAL_ANNOUNCEMENT" &&
                    useCase !== "QUOTATION_CREATED"
                  }
                />
                Todos en la Business Unit
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={recipientMode === "specific"}
                  onChange={() => setRecipientMode("specific")}
                />
                Usuarios específicos
              </label>
            </div>

            {useCase !== "GENERAL_ANNOUNCEMENT" &&
              useCase !== "QUOTATION_CREATED" && (
                <p className="text-xs text-dark-400 mb-3">
                  Para este flujo, el backend limita destinatarios por función
                  para evitar notificaciones fuera de contexto.
                </p>
              )}

            {recipientMode === "specific" && (
              <div className="card bg-dark-800 border-dark-700 max-h-[260px] overflow-y-auto">
                {loadingRecipients ? (
                  <p className="text-dark-400 text-sm">
                    Cargando destinatarios...
                  </p>
                ) : recipients.length === 0 ? (
                  <p className="text-dark-400 text-sm">
                    No hay destinatarios disponibles en esta Business Unit.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recipientsByRole.map(([roleName, roleRecipients]) => (
                      <div key={roleName}>
                        <p className="text-xs uppercase tracking-wide text-dark-400 mb-2">
                          {roleName}
                        </p>
                        <div className="space-y-2">
                          {roleRecipients.map((recipient) => (
                            <label
                              key={recipient.id}
                              className="flex items-center gap-3 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedRecipientIds.includes(
                                  recipient.id,
                                )}
                                onChange={() => toggleRecipient(recipient.id)}
                              />
                              <span className="text-white">
                                {recipient.firstName} {recipient.lastName}
                              </span>
                              <span className="text-dark-400">
                                {recipient.email}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {formError && (
            <div className="card bg-red-900/20 border-red-800 text-red-400 text-sm">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="card bg-green-900/20 border-green-800 text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cerrar
            </button>
            <button
              type="button"
              className="btn-primary flex items-center gap-2"
              disabled={isSubmitDisabled}
              onClick={() => sendMutation.mutate()}
            >
              <Send className="w-4 h-4" />
              {sendMutation.isPending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
