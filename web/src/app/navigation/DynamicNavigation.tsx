/**
 * Dynamic Navigation Component
 *
 * Renders navigation menu dynamically from registered modules.
 * This replaces hardcoded navigation in Layout.tsx.
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  navigationBuilder,
  createModuleContext,
  type NavigationItem,
} from "@/product";
import { useAuthStore } from "@/store/auth.store";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  ChevronDown,
} from "lucide-react";

/**
 * Icon mapping (extendable)
 */
const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="w-5 h-5" />,
  inventory: <Package className="w-5 h-5" />,
  clients: <Users className="w-5 h-5" />,
  purchases: <ShoppingCart className="w-5 h-5" />,
  rental: <FileText className="w-5 h-5" />,
};

/**
 * Get icon component by name
 */
function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) return null;
  return iconMap[iconName] || null;
}

/**
 * Navigation Link Component
 */
interface NavLinkProps {
  item: NavigationItem;
  isActive: boolean;
  depth?: number;
}

function NavLink({ item, isActive, depth = 0 }: NavLinkProps) {
  const hasChildren = item.children && item.children.length > 0;
  const [isOpen, setIsOpen] = React.useState(isActive);

  const baseClasses =
    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors";
  const activeClasses = "bg-primary-50 text-primary-700 font-medium";
  const inactiveClasses = "text-gray-700 hover:bg-gray-100";
  const indentClasses = depth > 0 ? `ml-${depth * 4}` : "";

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${indentClasses} w-full justify-between`}
        >
          <span className="flex items-center gap-2">
            {getIcon(item.icon)}
            {item.label}
            {item.badge && (
              <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                {typeof item.badge === "function" ? item.badge() : item.badge}
              </span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && item.children && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <NavigationLink key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!item.path) {
    return null;
  }

  return (
    <Link
      to={item.path}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${indentClasses}`}
    >
      {getIcon(item.icon)}
      {item.label}
      {item.badge && (
        <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
          {typeof item.badge === "function" ? item.badge() : item.badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Navigation Link with active detection
 */
function NavigationLink({
  item,
  depth = 0,
}: {
  item: NavigationItem;
  depth?: number;
}) {
  const location = useLocation();

  // Check if current path matches or is a child of this nav item
  const isActive = React.useMemo(() => {
    if (item.path && location.pathname === item.path) {
      return true;
    }

    if (item.children) {
      return item.children.some(
        (child) => child.path && location.pathname.startsWith(child.path),
      );
    }

    return false;
  }, [location.pathname, item]);

  return <NavLink item={item} isActive={isActive} depth={depth} />;
}

/**
 * Main Navigation Component
 */
export default function DynamicNavigation() {
  const { user, tenant, businessUnit, role } = useAuthStore();

  // Build navigation from modules
  const navigation = React.useMemo(() => {
    if (!user || !tenant) return [];

    // TODO: Derive permissions from role or fetch from backend
    const permissions: string[] = role ? [role] : [];

    const context = createModuleContext(
      tenant.id,
      businessUnit?.id || "",
      permissions,
    );

    return navigationBuilder.buildNavigation(context);
  }, [user, tenant, businessUnit, role]);

  if (navigation.length === 0) {
    return (
      <nav className="space-y-1 px-3">
        <p className="text-sm text-gray-500 px-4 py-2">No modules available</p>
      </nav>
    );
  }

  return (
    <nav className="space-y-1 px-3">
      {navigation.map((item) => (
        <NavigationLink key={item.id} item={item} />
      ))}
    </nav>
  );
}
