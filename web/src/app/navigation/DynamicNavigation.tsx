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
 * Navigation Link Component - Horizontal variant for navbar
 */
interface NavLinkProps {
  item: NavigationItem;
  isActive: boolean;
  depth?: number;
  isMobile?: boolean;
}

function NavLink({
  item,
  isActive,
  depth = 0,
  isMobile = false,
}: NavLinkProps) {
  const hasChildren = item.children && item.children.length > 0;
  const [isOpen, setIsOpen] = React.useState(isActive);

  // Mobile: vertical sidebar style
  if (isMobile) {
    const baseClasses =
      "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors";
    const activeClasses = "bg-primary-600 text-white";
    const inactiveClasses = "text-dark-300 hover:text-white hover:bg-dark-700";
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
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && item.children && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => (
                <NavigationLink
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  isMobile={true}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!item.path) return null;

    return (
      <Link
        to={item.path}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${indentClasses}`}
      >
        {getIcon(item.icon)}
        {item.label}
      </Link>
    );
  }

  // Desktop: horizontal navbar style with dropdown
  if (hasChildren) {
    return (
      <div className="relative group">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isActive
              ? "bg-primary-600 text-white"
              : "text-dark-300 hover:text-white hover:bg-dark-700"
          }`}
        >
          {getIcon(item.icon)}
          <span className="text-sm font-medium">{item.label}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Dropdown for children */}
        <div className="absolute top-full left-0 mt-1 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="py-2">
            {item.children?.map((child) => (
              <Link
                key={child.id}
                to={child.path || "#"}
                className={`block px-4 py-2 text-sm transition-colors ${
                  child.path && location.pathname === child.path
                    ? "bg-dark-700 text-primary-400"
                    : "text-dark-300 hover:bg-dark-700 hover:text-white"
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!item.path) return null;

  return (
    <Link
      to={item.path}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-primary-600 text-white"
          : "text-dark-300 hover:text-white hover:bg-dark-700"
      }`}
    >
      {getIcon(item.icon)}
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

/**
 * Navigation Link with active detection
 */
function NavigationLink({
  item,
  depth = 0,
  isMobile = false,
}: {
  item: NavigationItem;
  depth?: number;
  isMobile?: boolean;
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

  return (
    <NavLink
      item={item}
      isActive={isActive}
      depth={depth}
      isMobile={isMobile}
    />
  );
}

/* Supports both horizontal (desktop navbar) and vertical (mobile sidebar) layouts
 */
export default function DynamicNavigation({
  isMobile = false,
}: {
  isMobile?: boolean;
}) {
  const { user, tenant, businessUnit, role } = useAuthStore();

  // Build navigation from modules
  const navigation = React.useMemo(() => {
    if (!user || !tenant) return [];

    // Load module assignments from localStorage (temporary)
    let assignedModules: string[] = [];
    if (businessUnit) {
      const key = `module-assignments-${tenant.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const assignments = JSON.parse(stored);
          assignedModules = assignments[businessUnit.id] || [];
        } catch (error) {
          console.error("Failed to parse module assignments:", error);
        }
      }
    }

    // TODO: Derive permissions from role or fetch from backend
    const permissions: string[] = role ? [role] : [];

    const context = createModuleContext(
      tenant.id,
      businessUnit?.id || "",
      permissions,
    );

    const allNavigation = navigationBuilder.buildNavigation(context);

    // Filter by assigned modules (if assignments exist)
    if (assignedModules.length > 0) {
      return allNavigation.filter((item) => assignedModules.includes(item.id));
    }

    return allNavigation;
  }, [user, tenant, businessUnit, role]);

  if (navigation.length === 0) {
    return (
      <div className={isMobile ? "px-3" : "flex items-center gap-1"}>
        <p className="text-sm text-dark-400 px-4 py-2">No modules available</p>
      </div>
    );
  }

  // Mobile: vertical layout
  if (isMobile) {
    return (
      <nav className="space-y-1">
        {navigation.map((item) => (
          <NavigationLink key={item.id} item={item} isMobile={true} />
        ))}
      </nav>
    );
  }

  // Desktop: horizontal layout
  return (
    <nav className="flex items-center gap-1">
      {navigation.map((item) => (
        <NavigationLink key={item.id} item={item} isMobile={false} />
      ))}
    </nav>
  );
}
