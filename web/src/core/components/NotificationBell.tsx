import React from "react";
import { Bell, Check, CheckCheck, FileText, Info } from "lucide-react";
import { useNotifications } from "@/core/hooks/useNotifications";
import type { Notification } from "@/core/services/notification.service";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function notifIcon(type: string) {
  switch (type) {
    case "payment_receipt_received":
      return <FileText className="w-4 h-4 text-green-400" />;
    case "payment_confirmed":
      return <Check className="w-4 h-4 text-primary-400" />;
    default:
      return <Info className="w-4 h-4 text-dark-400" />;
  }
}

interface NotificationItemProps {
  notif: Notification;
  onRead: (id: string) => void;
}

function NotificationItem({ notif, onRead }: NotificationItemProps) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-dark-700 cursor-pointer transition-colors ${
        !notif.isRead ? "bg-dark-700/50" : ""
      }`}
      onClick={() => !notif.isRead && onRead(notif.id)}
    >
      <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center">
        {notifIcon(notif.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-tight ${notif.isRead ? "text-dark-300" : "text-white"}`}
        >
          {notif.title}
        </p>
        <p className="text-xs text-dark-400 mt-0.5 leading-snug">
          {notif.body}
        </p>
        <p className="text-xs text-dark-500 mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

interface NotificationPanelProps {
  onClose?: () => void;
}

export function NotificationPanel(_props: NotificationPanelProps) {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl z-50 max-h-[520px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-400" />
          <span className="font-semibold text-white text-sm">
            Notificaciones
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => {
              markAllRead();
            }}
            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-dark-400">
            <Bell className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700/50">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notif={n} onRead={markRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Campana con badge — se inserta en el navbar */
export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const { unreadCount } = useNotifications();
  const ref = React.useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-dark-700 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-dark-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
