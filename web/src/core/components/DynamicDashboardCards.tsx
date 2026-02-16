/**
 * Dynamic Dashboard Cards
 *
 * Renders module cards dynamically from registered modules.
 * Replaces hardcoded dashboard module cards.
 * Groups modules by category/vertical.
 */

import React from "react";
import {
  createModuleContext,
  moduleRegistry,
  verticalRegistry,
} from "@/product";
import { useAuthStore } from "@/store/auth.store";
import {
  Box,
  ShoppingCart,
  Users,
  FileSignature,
  Package,
  Building2,
  FileText,
  DollarSign,
  List,
  UserPlus,
  Archive,
  Layout as LayoutIcon,
  AlertCircle,
  FilePlus,
  Shapes,
  Wallet,
} from "lucide-react";

/**
 * Icon mapping for module icons
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  inventory: Archive,
  box: Box,
  package: Package,
  purchases: ShoppingCart,
  "shopping-cart": ShoppingCart,
  clients: Users,
  users: Users,
  rental: FileSignature,
  "file-signature": FileSignature,
  building: Building2,
  "file-text": FileText,
  "dollar-sign": DollarSign,
  list: List,
  "user-plus": UserPlus,
  layout: LayoutIcon,
  "alert-circle": AlertCircle,
  "file-plus": FilePlus,
  shapes: Shapes,
  wallet: Wallet,
};

/**
 * Get icon component by name
 */
function getIcon(
  iconName?: string,
): React.ComponentType<{ className?: string }> {
  if (!iconName) return Box;
  return iconMap[iconName] || Box;
}

/**
 * Group modules by category/vertical
 */
interface ModuleGroup {
  id: string;
  label: string;
  icon: string;
  color: string; // border color class
  items: Array<{
    id: string;
    label: string;
    path: string;
    icon?: string;
  }>;
}

export function DynamicDashboardCards() {
  const { user, tenant, businessUnit, role } = useAuthStore();

  const moduleGroups = React.useMemo(() => {
    if (!user) return [];

    // SUPER_ADMIN: Show platform administration cards
    if (user.role === "SUPER_ADMIN") {
      return [
        {
          id: "platform-admin",
          label: "Administración de Plataforma",
          icon: "building",
          color: "border-primary-800",
          items: [
            {
              id: "tenants",
              label: "Gestión de Tenants",
              path: "/admin/tenants",
              icon: "building",
            },
            // TODO: Add module management
            // {
            //   id: "modules",
            //   label: "Gestión de Módulos",
            //   path: "/admin/modules",
            //   icon: "package",
            // },
            // TODO: Add vertical management
            // {
            //   id: "verticals",
            //   label: "Gestión de Verticales",
            //   path: "/admin/verticals",
            //   icon: "shapes",
            // },
          ],
        },
      ] as ModuleGroup[];
    }

    // Regular users: require tenant
    if (!tenant) return [];

    // Get enabled modules from tenant (from API)
    // Fallback to businessUnit.enabledModules if tenant doesn't have them
    const assignedModules =
      tenant.enabledModules || businessUnit?.enabledModules || [];

    // Create module context
    const permissions: string[] = role ? [role] : [];

    // Include tenant config (enabledModules, vertical) in context
    const config = {
      enabledModules: tenant.enabledModules || [],
      vertical: tenant.vertical || null,
    };

    const context = createModuleContext(
      tenant.id,
      businessUnit?.id || "",
      permissions,
      config,
    );

    const groups: ModuleGroup[] = [];

    // Get legacy modules navigation
    const legacyNavigation = moduleRegistry.getNavigation(context);

    // Get vertical modules navigation
    const verticalNavigation = verticalRegistry.getNavigation(context);

    // Process legacy modules (inventory, clients, purchases)
    legacyNavigation.forEach((navItem) => {
      // Filter by assigned modules (if assignments exist)
      if (assignedModules.length > 0 && !assignedModules.includes(navItem.id)) {
        return; // Skip non-assigned modules
      }

      if (navItem.children && navItem.children.length > 0) {
        groups.push({
          id: navItem.id,
          label: navItem.label,
          icon: navItem.icon || "box",
          color: getColorForModule(navItem.id),
          items: navItem.children
            .filter((child) => child.path) // Only items with paths
            .map((child) => ({
              id: child.id,
              label: child.label,
              path: child.path!,
              icon: child.icon,
            })),
        });
      }
    });

    // Process vertical modules (rental)
    verticalNavigation.forEach((navItem) => {
      // Filter by assigned modules (if assignments exist)
      if (assignedModules.length > 0 && !assignedModules.includes(navItem.id)) {
        return; // Skip non-assigned modules
      }

      if (navItem.children && navItem.children.length > 0) {
        groups.push({
          id: navItem.id,
          label: navItem.label,
          icon: navItem.icon || "file-signature",
          color: getColorForModule(navItem.id),
          items: navItem.children
            .filter((child: any) => child.path)
            .map((child: any) => ({
              id: child.id,
              label: child.label,
              path: child.path!,
              icon: child.icon,
            })),
        });
      }
    });

    return groups;
  }, [user, tenant, businessUnit, role]);

  if (moduleGroups.length === 0) {
    return (
      <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
        <p className="text-sm">
          No hay módulos habilitados para este Business Unit. Contacta al
          administrador para activar módulos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {moduleGroups.map((group) => {
        const IconComponent = getIcon(group.icon);

        return (
          <div key={group.id} className={`card bg-dark-800 ${group.color}`}>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <IconComponent className="w-4 h-4" />
              {group.label.toUpperCase()}
            </h4>
            <div className="space-y-2">
              {group.items.map((item) => {
                const ItemIcon = getIcon(item.icon);

                return (
                  <a
                    key={item.id}
                    href={item.path}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                  >
                    <ItemIcon className="w-4 h-4" />
                    {item.label} →
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get border color class for module
 */
function getColorForModule(moduleId: string): string {
  const colorMap: Record<string, string> = {
    inventory: "border-primary-800",
    purchases: "border-blue-800",
    clients: "border-green-800",
    rental: "border-purple-800",
    cotizaciones: "border-purple-800",
  };

  return colorMap[moduleId] || "border-dark-700";
}
