/**
 * ChatPage — Sistema de chat interno estilo WhatsApp
 * Layout de dos columnas: lista de salas (izquierda) + conversación (derecha)
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Search,
  Plus,
  Send,
  Paperclip,
  X,
  Users,
  MessageSquare,
  Trash2,
  Check,
  Image as ImageIcon,
  FileText,
  Megaphone,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import {
  notificationService,
  type NotificationRecipient,
} from "@/core/services/notification.service";
import {
  chatService,
  type ChatRoom,
  type ChatMessage,
  type ChatUser,
  getRoomDisplayName,
  getRoomInitials,
  getUserDisplayName,
  getUserInitials,
} from "@/core/services/chat.service";

// ─── HELPERS ──────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRoomTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) return formatTime(dateStr); // today → time
  if (diff < 7 * 86_400_000) {
    return d.toLocaleDateString([], { weekday: "short" }); // this week → Mon, Tue…
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  if (d >= startOfToday) return "Hoy";
  if (d >= startOfYesterday) return "Ayer";
  return d.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isImageMime(mime?: string): boolean {
  return !!mime && mime.startsWith("image/");
}

// ─── AVATAR ───────────────────────────────────────────────────

function Avatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  const colors = [
    "bg-indigo-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
  ];
  // Pick a stable color from initials
  const idx = initials.charCodeAt(0) % colors.length;
  return (
    <div
      className={`${sizeMap[size]} ${colors[idx]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

// ─── NEW DM MODAL ─────────────────────────────────────────────

function NewDMModal({
  users,
  currentUserId,
  onSelect,
  onClose,
}: {
  users: ChatUser[];
  currentUserId: string;
  onSelect: (user: ChatUser) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) =>
      u.id !== currentUserId &&
      (getUserDisplayName(u).toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
          <h3 className="font-semibold text-white">Nuevo mensaje</h3>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              className="w-full bg-dark-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <ul className="max-h-72 overflow-y-auto pb-2 px-2">
          {filtered.length === 0 && (
            <li className="text-center text-dark-400 text-sm py-6">
              Sin resultados
            </li>
          )}
          {filtered.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => onSelect(u)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700 transition-colors text-left"
              >
                <Avatar initials={getUserInitials(u)} size="sm" />
                <div>
                  <p className="text-sm text-white font-medium">
                    {getUserDisplayName(u)}
                  </p>
                  <p className="text-xs text-dark-400">{u.email}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── NEW GROUP MODAL ───────────────────────────────────────────

function NewGroupModal({
  users,
  currentUserId,
  onCreate,
  onClose,
}: {
  users: ChatUser[];
  currentUserId: string;
  onCreate: (name: string, memberIds: string[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = users.filter(
    (u) =>
      u.id !== currentUserId &&
      (getUserDisplayName(u).toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
          <h3 className="font-semibold text-white">Nuevo grupo</h3>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 space-y-2">
          <input
            className="w-full bg-dark-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Nombre del grupo..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              className="w-full bg-dark-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Agregar participantes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.map((id) => {
                const u = users.find((x) => x.id === id);
                if (!u) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 bg-primary-600 text-white text-xs rounded-full px-2 py-0.5"
                  >
                    {getUserDisplayName(u)}
                    <button onClick={() => toggle(id)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <ul className="max-h-52 overflow-y-auto pb-2 px-2">
          {filtered.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => toggle(u.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700 transition-colors text-left"
              >
                <div className="w-5 h-5 rounded border border-dark-500 flex items-center justify-center flex-shrink-0">
                  {selected.includes(u.id) && (
                    <Check className="w-3.5 h-3.5 text-primary-400" />
                  )}
                </div>
                <Avatar initials={getUserInitials(u)} size="sm" />
                <div>
                  <p className="text-sm text-white font-medium">
                    {getUserDisplayName(u)}
                  </p>
                  <p className="text-xs text-dark-400">{u.email}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 py-3 border-t border-dark-700">
          <button
            disabled={!name.trim() || selected.length === 0}
            onClick={() => onCreate(name.trim(), selected)}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Crear grupo ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGE BUBBLE ────────────────────────────────────────────

function MessageBubble({
  msg,
  isMine,
  onDelete,
}: {
  msg: ChatMessage;
  isMine: boolean;
  onDelete?: () => void;
}) {
  if (msg.deletedAt) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <p className="italic text-xs text-dark-500 px-3 py-1">
          Mensaje eliminado
        </p>
      </div>
    );
  }

  const hasFile = !!msg.fileUrl;
  const isImg = isImageMime(msg.fileMime);

  return (
    <div className={`flex group ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[70%]">
        <div
          className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
            isMine
              ? "bg-primary-600 text-white rounded-br-sm"
              : "bg-dark-700 text-dark-100 rounded-bl-sm"
          }`}
        >
          {/* Sender name (in groups / not mine) */}
          {!isMine && (
            <p className="text-xs font-semibold text-primary-400 mb-0.5">
              {getUserDisplayName(msg.sender)}
            </p>
          )}

          {/* Image attachment */}
          {hasFile && isImg && (
            <a
              href={msg.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="block mb-1"
            >
              <img
                src={msg.fileUrl}
                alt={msg.body}
                className="rounded-lg max-h-48 w-full object-cover"
              />
            </a>
          )}

          {/* File attachment (non-image) */}
          {hasFile && !isImg && (
            <a
              href={msg.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 mb-1 bg-black/20 px-2 py-1.5 rounded-lg"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs truncate max-w-[180px]">{msg.body}</span>
            </a>
          )}

          {/* Text body — only for plain text messages, not file-only */}
          {!hasFile && (
            <p className="leading-snug whitespace-pre-wrap break-words">
              {msg.body}
            </p>
          )}

          {/* Timestamp */}
          <p
            className={`text-[10px] mt-1 text-right ${isMine ? "text-primary-200" : "text-dark-400"}`}
          >
            {formatTime(msg.createdAt)}
          </p>
        </div>

        {/* Delete btn (own messages) */}
        {isMine && onDelete && (
          <button
            onClick={onDelete}
            className="absolute -top-1 -left-7 opacity-0 group-hover:opacity-100 transition-opacity text-dark-500 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CHAT WINDOW ───────────────────────────────────────────────

function ChatWindow({
  room,
  currentUserId,
  onRoomUpdate,
}: {
  room: ChatRoom;
  currentUserId: string;
  onRoomUpdate: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [filePreview, setFilePreview] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await chatService.getMessages(room.id);
      setMessages(res.items);
    } catch {
      // ignore
    }
  }, [room.id]);

  useEffect(() => {
    setMessages([]);
    loadMessages();
    pollingRef.current = setInterval(loadMessages, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [room.id, loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (sending) return;
    if (!text.trim() && !filePreview) return;
    setSending(true);
    try {
      if (filePreview) {
        const msg = await chatService.uploadFile(room.id, filePreview);
        setMessages((prev) => [...prev, msg]);
        setFilePreview(null);
      }
      if (text.trim()) {
        const msg = await chatService.sendMessage(room.id, text.trim());
        setMessages((prev) => [...prev, msg]);
        setText("");
      }
      onRoomUpdate();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFilePreview(file);
    e.target.value = "";
  };

  const handleDelete = async (msgId: string) => {
    try {
      await chatService.deleteMessage(msgId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, deletedAt: new Date().toISOString() } : m,
        ),
      );
    } catch {
      // ignore
    }
  };

  const roomName = getRoomDisplayName(room, currentUserId);
  const roomInitials = getRoomInitials(room, currentUserId);

  // Group messages by day
  type GroupedMessages = { day: string; msgs: ChatMessage[] }[];
  const grouped = messages.reduce<GroupedMessages>((acc, msg) => {
    const dayLabel = formatDayLabel(msg.createdAt);
    const last = acc[acc.length - 1];
    if (last && last.day === dayLabel) {
      last.msgs.push(msg);
    } else {
      acc.push({ day: dayLabel, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700 bg-dark-800">
        <Avatar initials={roomInitials} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{roomName}</p>
          {room.isGroup && (
            <p className="text-xs text-dark-400">
              {room.members.length} participantes
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-dark-900">
        {grouped.map((group) => (
          <div key={group.day}>
            {/* Day separator */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-dark-700" />
              <span className="text-xs text-dark-400 bg-dark-800 px-2 py-0.5 rounded-full">
                {group.day}
              </span>
              <div className="flex-1 h-px bg-dark-700" />
            </div>
            {group.msgs.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.senderId === currentUserId}
                onDelete={
                  msg.senderId === currentUserId
                    ? () => handleDelete(msg.id)
                    : undefined
                }
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* File preview */}
      {filePreview && (
        <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 border-t border-dark-700">
          {filePreview.type.startsWith("image/") ? (
            <ImageIcon className="w-4 h-4 text-primary-400" />
          ) : (
            <FileText className="w-4 h-4 text-primary-400" />
          )}
          <span className="text-sm text-dark-200 flex-1 truncate">
            {filePreview.name}
          </span>
          <button
            onClick={() => setFilePreview(null)}
            className="text-dark-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-dark-700 bg-dark-800 flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="text-dark-400 hover:text-white mb-0.5 flex-shrink-0"
          title="Adjuntar archivo"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKey}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-dark-700 text-white rounded-xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-1 focus:ring-primary-500 placeholder-dark-400 max-h-[120px] overflow-y-auto"
        />

        <button
          onClick={send}
          disabled={sending || (!text.trim() && !filePreview)}
          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 transition-colors mb-0.5"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── ROOMS SIDEBAR ─────────────────────────────────────────────

function RoomItem({
  room,
  currentUserId,
  isActive,
  onClick,
}: {
  room: ChatRoom;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const name = getRoomDisplayName(room, currentUserId);
  const initials = getRoomInitials(room, currentUserId);
  const lastMsg = room.messages?.[0];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left ${
        isActive ? "bg-dark-700" : ""
      }`}
    >
      <Avatar initials={initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-medium text-white truncate flex-1">
            {name}
          </p>
          {lastMsg && (
            <span className="text-[10px] text-dark-400 ml-2 flex-shrink-0">
              {formatRoomTime(lastMsg.createdAt)}
            </span>
          )}
        </div>
        {lastMsg && (
          <p className="text-xs text-dark-400 truncate">
            {lastMsg.deletedAt
              ? "Mensaje eliminado"
              : lastMsg.fileUrl
                ? `📎 ${lastMsg.body}`
                : lastMsg.body}
          </p>
        )}
        {!lastMsg && (
          <p className="text-xs text-dark-500 italic">Sin mensajes</p>
        )}
      </div>
    </button>
  );
}

// ─── BROADCAST MODAL ──────────────────────────────────────────

type BroadcastUseCase =
  | "GENERAL_ANNOUNCEMENT"
  | "SITE_UPDATE"
  | "QUOTATION_CREATED"
  | "CLIENT_PICKUP_APPROVED"
  | "CLIENT_PICKUP_ARRIVED";

const USE_CASE_LABELS: Record<BroadcastUseCase, string> = {
  GENERAL_ANNOUNCEMENT: "Mensaje general",
  SITE_UPDATE: "Actualización",
  QUOTATION_CREATED: "Cotización creada",
  CLIENT_PICKUP_APPROVED: "Crédito  aprobado para retiro",
  CLIENT_PICKUP_ARRIVED: "Cliente llegó a retirar",
};

const USE_CASE_HINTS: Record<BroadcastUseCase, string> = {
  GENERAL_ANNOUNCEMENT: "Difusión general para todo el equipo.",
  SITE_UPDATE: "Aviso operativo de obra/equipo para coordinación entre áreas.",
  QUOTATION_CREATED:
    "Dispara comunicación a OWNER, comercial, contabilidad y mantenimiento.",
  CLIENT_PICKUP_APPROVED:
    "Ventas avisa que el cliente está autorizado para retirar.",
  CLIENT_PICKUP_ARRIVED: "Mantenimiento avisa que el cliente llegó a retiro.",
};

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [useCase, setUseCase] = useState<BroadcastUseCase>(
    "GENERAL_ANNOUNCEMENT",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "specific">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoadingRecipients(true);
    notificationService
      .listRecipients()
      .then(setRecipients)
      .catch(() => {})
      .finally(() => setLoadingRecipients(false));
  }, []);

  const byRole = useMemo(() => {
    const map = new Map<string, NotificationRecipient[]>();
    recipients.forEach((r) => {
      const role = r.roleName || "Sin rol";
      if (!map.has(role)) map.set(role, []);
      map.get(role)!.push(r);
    });
    return Array.from(map.entries());
  }, [recipients]);

  const canSendToAll =
    useCase === "GENERAL_ANNOUNCEMENT" || useCase === "QUOTATION_CREATED";

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const isDisabled =
    sending ||
    title.trim().length < 3 ||
    body.trim().length < 3 ||
    (recipientMode === "specific" && selectedIds.length === 0);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await notificationService.sendManual({
        title: title.trim(),
        body: body.trim(),
        recipientMode,
        recipientIds: recipientMode === "specific" ? selectedIds : undefined,
        type: "manual_message",
        useCase,
        deliveryMode: "notification",
      });
      setSuccess(`Anuncio enviado a ${res.sent} usuario(s).`);
      setTitle("");
      setBody("");
      setSelectedIds([]);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "No se pudo enviar.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-white">Anuncio / Notificación</h3>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="form-label">Tipo de flujo</label>
            <select
              className="input"
              value={useCase}
              onChange={(e) => {
                const val = e.target.value as BroadcastUseCase;
                setUseCase(val);
                if (
                  val !== "GENERAL_ANNOUNCEMENT" &&
                  val !== "QUOTATION_CREATED"
                ) {
                  setRecipientMode("specific");
                }
              }}
            >
              {Object.entries(USE_CASE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <p className="text-xs text-dark-400 mt-1">
              {USE_CASE_HINTS[useCase]}
            </p>
          </div>

          <div>
            <label className="form-label">Título</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Actualización de operación"
              maxLength={120}
            />
          </div>

          <div>
            <label className="form-label">Mensaje</label>
            <textarea
              className="input min-h-[100px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribí el mensaje para el equipo"
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
                  disabled={!canSendToAll}
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
            {!canSendToAll && (
              <p className="text-xs text-dark-400 mb-3">
                Para este flujo el backend limita destinatarios por función.
              </p>
            )}
            {recipientMode === "specific" && (
              <div className="bg-dark-900 border border-dark-700 rounded-lg max-h-52 overflow-y-auto p-3">
                {loadingRecipients ? (
                  <p className="text-dark-400 text-sm">Cargando...</p>
                ) : byRole.length === 0 ? (
                  <p className="text-dark-400 text-sm">
                    Sin destinatarios disponibles.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {byRole.map(([roleName, recs]) => (
                      <div key={roleName}>
                        <p className="text-xs uppercase tracking-wide text-dark-400 mb-1">
                          {roleName}
                        </p>
                        <div className="space-y-1">
                          {recs.map((r) => (
                            <label
                              key={r.id}
                              className="flex items-center gap-3 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(r.id)}
                                onChange={() => toggle(r.id)}
                              />
                              <span className="text-white">
                                {r.firstName} {r.lastName}
                              </span>
                              <span className="text-dark-400">{r.email}</span>
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

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/20 border border-green-800 text-green-400 text-sm rounded-lg px-4 py-3">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cerrar
            </button>
            <button
              type="button"
              className="btn-primary flex items-center gap-2"
              disabled={isDisabled}
              onClick={handleSend}
            >
              <Send className="w-4 h-4" />
              {sending ? "Enviando..." : "Enviar anuncio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────

export function ChatPage() {
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"dm" | "group" | "broadcast" | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const loadRooms = useCallback(async () => {
    try {
      const r = await chatService.listRooms();
      setRooms(r);
    } catch {
      // ignore
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Load users once for DM/Group modals
  useEffect(() => {
    chatService
      .listUsers()
      .then(setUsers)
      .catch(() => {});
  }, []);

  // Poll rooms every 5 s
  useEffect(() => {
    loadRooms();
    const id = setInterval(loadRooms, 5000);
    return () => clearInterval(id);
  }, [loadRooms]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  const filteredRooms = rooms.filter((r) => {
    const name = getRoomDisplayName(r, currentUserId).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleOpenDM = async (targetUser: ChatUser) => {
    setModal(null);
    try {
      const room = await chatService.getOrCreateDM(targetUser.id);
      await loadRooms();
      setActiveRoomId(room.id);
    } catch {
      // ignore
    }
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    setModal(null);
    try {
      const room = await chatService.createGroup(name, memberIds);
      await loadRooms();
      setActiveRoomId(room.id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-dark-900 overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-dark-700 bg-dark-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-400" />
            <h1 className="font-semibold text-white text-lg">Chat</h1>
          </div>

          {/* New chat menu */}
          <div className="relative">
            <button
              onClick={() => setShowNewMenu((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            {showNewMenu && (
              <div className="absolute right-0 top-full mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-20 w-40 py-1">
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    setModal("dm");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:text-white hover:bg-dark-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Nuevo mensaje
                </button>
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    setModal("group");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:text-white hover:bg-dark-600 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Nuevo grupo
                </button>
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    setModal("broadcast");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:text-white hover:bg-dark-600 transition-colors"
                >
                  <Megaphone className="w-4 h-4" />
                  Anuncio
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              className="w-full bg-dark-700 text-white rounded-full pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500 placeholder-dark-400"
              placeholder="Buscar conversación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto divide-y divide-dark-700/50">
          {loadingRooms && (
            <p className="text-center text-dark-400 text-sm py-8">
              Cargando...
            </p>
          )}
          {!loadingRooms && filteredRooms.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-dark-400">
              <MessageSquare className="w-10 h-10 opacity-40" />
              <p className="text-sm">Sin conversaciones</p>
              <p className="text-xs">Presioná + para iniciar un chat</p>
            </div>
          )}
          {filteredRooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              currentUserId={currentUserId}
              isActive={room.id === activeRoomId}
              onClick={() => setActiveRoomId(room.id)}
            />
          ))}
        </div>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeRoom ? (
          <ChatWindow
            key={activeRoom.id}
            room={activeRoom}
            currentUserId={currentUserId}
            onRoomUpdate={loadRooms}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-dark-400">
            <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-dark-300">Chat interno</p>
              <p className="text-sm mt-1">
                Seleccioná una conversación o iniciá una nueva
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      {modal === "dm" && (
        <NewDMModal
          users={users}
          currentUserId={currentUserId}
          onSelect={handleOpenDM}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "group" && (
        <NewGroupModal
          users={users}
          currentUserId={currentUserId}
          onCreate={handleCreateGroup}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "broadcast" && (
        <BroadcastModal onClose={() => setModal(null)} />
      )}
    </div>
  );
}
