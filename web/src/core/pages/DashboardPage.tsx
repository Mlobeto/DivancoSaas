import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Layout } from "@/core/components/Layout";
import { ChevronDown, ChevronUp, Settings, Briefcase } from "lucide-react";

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  path?: string;
  comingSoon?: boolean;
  action?: "open_manual_notification";
}

export function DashboardPage() {
  const { businessUnit, role, permissions } = useAuthStore();
  const navigate = useNavigate();
  const [showOwnerPanel, setShowOwnerPanel] = useState(true);

  const roleName = role || "USER";
  const userPermissions = permissions || [];

  const hasAccess = (
    allowedRoles: string[] = [],
    requiredPermissions: string[] = [],
  ) => {
    if (roleName === "SUPER_ADMIN" || roleName === "OWNER") return true;
    if (allowedRoles.includes(roleName)) return true;
    if (requiredPermissions.length === 0) return false;
    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
  };

  const canManageConfiguration = hasAccess(
    ["OWNER"],
    ["business_unit:update", "business_units:update", "branding:update"],
  );

  const canAccessOwnerNotificationCenter =
    roleName === "OWNER" || userPermissions.includes("notifications:broadcast");

  const ownerCards = useMemo<DashboardCard[]>(() => {
    const cards: DashboardCard[] = [];

    if (canAccessOwnerNotificationCenter) {
      cards.push({
        id: "chat-notifications",
        title: "Chat y notificaciones",
        description:
          "Centro de comunicación para avisos manuales y coordinación operativa por unidad de negocio.",
        action: "open_manual_notification",
      });
    }

    cards.push(
      {
        id: "quotations",
        title: "Cotizaciones",
        description: "Gestión completa de cotizaciones comerciales y técnicas.",
        path: "/rental/quotations",
      },
      {
        id: "contracts",
        title: "Contratos",
        description: "Seguimiento de contratos activos, firmas y estados.",
        path: "/rental/contracts",
      },
      {
        id: "client-accounts",
        title: "Cuentas de clientes",
        description:
          "Consulta de cuentas corrientes y estado financiero por cliente.",
        path: "/rental/accounts",
      },
      {
        id: "asset-maintenance",
        title: "Mantenimiento de activos",
        description:
          "Tablero para revisar que los mantenimientos se ejecuten correctamente.",
        comingSoon: true,
      },
      {
        id: "reports",
        title: "Informes",
        description:
          "Vista consolidada para indicadores y reportes ejecutivos.",
        comingSoon: true,
      },
    );

    return cards;
  }, [canAccessOwnerNotificationCenter]);

  const workCards = useMemo<DashboardCard[]>(() => {
    const cards: DashboardCard[] = [];

    if (
      hasAccess(
        ["ADMIN", "MANAGER"],
        [
          "rental:quotation:read",
          "rental:quotation:create",
          "contracts:read",
          "clients:read",
        ],
      )
    ) {
      cards.push(
        {
          id: "quotations",
          title: "Cotizaciones",
          description: "Crea, revisa y da seguimiento a cotizaciones.",
          path: "/rental/quotations",
        },
        {
          id: "contracts",
          title: "Contratos",
          description: "Monitorea contratos activos y su ciclo de vida.",
          path: "/rental/contracts",
        },
      );
    }

    if (
      hasAccess(
        ["MAINTENANCE", "OPERATOR", "TECHNICIAN", "MANAGER"],
        ["operators:read", "inventory:read", "assets:read"],
      )
    ) {
      cards.push(
        {
          id: "operators",
          title: "Operadores",
          description: "Administra perfiles, disponibilidad y documentación.",
          path: "/rental/operators",
        },
        {
          id: "inventory",
          title: "Inventario",
          description: "Visualiza activos y estado operativo de equipos.",
          path: "/inventory",
        },
      );
    }

    return cards;
  }, [roleName, userPermissions]);

  const renderCard = (card: DashboardCard) => {
    const cardBaseClass =
      "card bg-dark-900 border border-dark-600 rounded-none shadow-none hover:border-primary-500 hover:bg-dark-800 transition-colors";

    if (card.path && !card.comingSoon) {
      return (
        <Link key={card.id} to={card.path} className={cardBaseClass}>
          <p className="text-[11px] tracking-[0.16em] text-dark-500 uppercase mb-1">
            {card.id.replace(/-/g, " ")}
          </p>
          <h4 className="font-semibold uppercase tracking-wide">
            {card.title}
          </h4>
          <p className="text-dark-400 text-sm mt-1">{card.description}</p>
        </Link>
      );
    }

    if (card.action === "open_manual_notification") {
      return (
        <button
          key={card.id}
          type="button"
          className={`${cardBaseClass} text-left`}
          onClick={() => navigate("/chat")}
        >
          <p className="text-[11px] tracking-[0.16em] text-dark-500 uppercase mb-1">
            {card.id.replace(/-/g, " ")}
          </p>
          <h4 className="font-semibold uppercase tracking-wide">
            {card.title}
          </h4>
          <p className="text-dark-400 text-sm mt-1">{card.description}</p>
        </button>
      );
    }

    return (
      <div
        key={card.id}
        className="card bg-dark-900 border border-dark-700 rounded-none shadow-none"
      >
        <p className="text-[11px] tracking-[0.16em] text-dark-500 uppercase mb-1">
          {card.id.replace(/-/g, " ")}
        </p>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold uppercase tracking-wide">
            {card.title}
          </h4>
          <span className="text-[10px] px-2 py-1 rounded-none bg-dark-700 text-dark-300 uppercase tracking-wide">
            Próximamente
          </span>
        </div>
        <p className="text-dark-400 text-sm mt-1">{card.description}</p>
      </div>
    );
  };

  return (
    <Layout title="Panel principal">
      <div className="p-8">
        {!businessUnit && (
          <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
            <p className="text-sm">
              No hay unidad de negocio activa. Selecciona una desde el menú
              superior.
            </p>
          </div>
        )}

        {businessUnit && canManageConfiguration && (
          <div className="card">
            <button
              onClick={() => setShowOwnerPanel(!showOwnerPanel)}
              className="w-full flex items-center justify-between py-2 hover:text-primary-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <h3 className="text-lg font-semibold tracking-wide uppercase">
                  Panel OWNER · Operación principal
                </h3>
              </div>
              {showOwnerPanel ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {showOwnerPanel && (
              <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ownerCards.map(renderCard)}
                </div>
                <p className="text-xs text-dark-400 uppercase tracking-wide">
                  Configuración inicial (branding, personal y parámetros de la
                  BU) disponible desde el menú de navegación.
                </p>
              </div>
            )}
          </div>
        )}

        {businessUnit && !canManageConfiguration && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5" />
              <h3 className="text-lg font-semibold tracking-wide uppercase">
                Panel de trabajo
              </h3>
            </div>

            {workCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workCards.map(renderCard)}
              </div>
            ) : (
              <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
                <p className="text-sm">
                  No hay módulos operativos habilitados para tu rol/permisos en
                  esta unidad de negocio.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
