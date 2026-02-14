import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { businessUnitService } from "@/core/services/businessUnit.service";
import type { BusinessUnit } from "@/core/types/api.types";
import { LayoutDashboard, Box, ShoppingCart, Users } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Layout({ children, title, subtitle, actions }: LayoutProps) {
  const location = useLocation();
  const { user, tenant, businessUnit, role, setAuth, clearAuth } =
    useAuthStore();
  const [showBuSelector, setShowBuSelector] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch user's business units
  const { data: userBusinessUnits = [] } = useQuery({
    queryKey: ["userBusinessUnits", user?.id],
    queryFn: () => businessUnitService.getMyBusinessUnits(),
    enabled: !!user?.id,
  });

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSwitchBu = (bu: BusinessUnit) => {
    // Update auth store with new business unit
    if (user && tenant) {
      setAuth({
        user,
        tenant,
        businessUnit: bu,
      });
    }
    setShowBuSelector(false);
  };

  // Navigation menu items
  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: "Inventario",
      icon: Box,
      path: "/machinery",
      subItems: [
        { label: "Plantillas", path: "/machinery/templates" },
        { label: "Activos", path: "/machinery" },
      ],
    },
    {
      label: "Compras",
      icon: ShoppingCart,
      path: "/purchases",
      subItems: [
        { label: "Categorías", path: "/purchases/categories" },
        { label: "Suministros", path: "/supplies" },
        { label: "Proveedores", path: "/suppliers" },
        { label: "Órdenes", path: "/purchase-orders" },
      ],
    },
    {
      label: "Clientes",
      icon: Users,
      path: "/clients",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Top Navbar */}
      <nav className="header border-b border-dark-700 sticky top-0 z-50 bg-dark-800/95 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Logo + Menu Button */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showMobileMenu ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              {/* Logo/Brand */}
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {tenant?.name?.substring(0, 2).toUpperCase() || "DV"}
                </div>
                <div className="hidden sm:block">
                  <div className="font-bold text-white text-sm leading-tight">
                    {tenant?.name || "DivancoSaaS"}
                  </div>
                  <div className="text-dark-400 text-xs leading-tight">
                    {tenant?.plan || "Free"}
                  </div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1 ml-8">
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.path} className="relative group">
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isActive(item.path)
                            ? "bg-primary-600 text-white"
                            : "text-dark-300 hover:text-white hover:bg-dark-700"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </Link>

                      {/* Dropdown for subitems */}
                      {item.subItems && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <div className="py-2">
                            {item.subItems.map((subItem) => (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`block px-4 py-2 text-sm transition-colors ${
                                  location.pathname === subItem.path
                                    ? "bg-dark-700 text-primary-400"
                                    : "text-dark-300 hover:bg-dark-700 hover:text-white"
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: BU Selector + User Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Business Unit Selector */}
              {businessUnit && (
                <div className="relative">
                  <button
                    onClick={() => setShowBuSelector(!showBuSelector)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <div className="w-6 h-6 bg-dark-700 rounded flex items-center justify-center text-primary-400 text-xs font-bold">
                      {businessUnit.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-white font-medium text-sm">
                      {businessUnit.name}
                    </span>
                    {userBusinessUnits.length > 1 && (
                      <svg
                        className="w-4 h-4 text-dark-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>

                  {/* BU Selector Dropdown */}
                  {showBuSelector && userBusinessUnits.length > 1 && (
                    <div className="absolute top-full right-0 mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 min-w-[240px]">
                      <div className="p-2 border-b border-dark-700">
                        <div className="text-xs text-dark-400 font-medium px-2">
                          Cambiar Business Unit
                        </div>
                      </div>
                      <div className="p-2 max-h-80 overflow-y-auto">
                        {userBusinessUnits.map((bu) => (
                          <button
                            key={bu.id}
                            onClick={() => handleSwitchBu(bu)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700 transition-colors text-sm ${
                              bu.id === businessUnit.id
                                ? "bg-dark-700 text-primary-400"
                                : "text-white"
                            }`}
                          >
                            <div className="w-6 h-6 bg-dark-600 rounded flex items-center justify-center text-xs font-bold">
                              {bu.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{bu.name}</div>
                              {bu.slug && (
                                <div className="text-xs text-dark-400">
                                  {bu.slug}
                                </div>
                              )}
                            </div>
                            {bu.id === businessUnit.id && (
                              <svg
                                className="w-4 h-4 text-primary-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-white font-medium text-sm leading-tight">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-dark-400 text-xs leading-tight">
                      {user?.email}
                    </div>
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-dark-700">
                      <div className="font-medium text-white">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-sm text-dark-400">{user?.email}</div>
                      {role && (
                        <div className="mt-2 px-2 py-1 bg-dark-700 rounded text-xs inline-block text-primary-400">
                          {role}
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-b border-dark-700 space-y-2">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Tenant</div>
                        <div className="text-sm text-white font-medium">
                          {tenant?.name}
                        </div>
                        <div className="text-xs text-dark-400">
                          Plan: {tenant?.plan}
                        </div>
                      </div>
                      {businessUnit && (
                        <div>
                          <div className="text-xs text-dark-500 mb-1">
                            Business Unit
                          </div>
                          <div className="text-sm text-white font-medium">
                            {businessUnit.name}
                          </div>
                          {businessUnit.slug && (
                            <div className="text-xs text-dark-400">
                              {businessUnit.slug}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-dark-700 bg-dark-800">
            <div className="px-4 py-4 space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-primary-600 text-white"
                          : "text-dark-300 hover:text-white hover:bg-dark-700"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>

                    {/* Mobile Subitems */}
                    {item.subItems && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => setShowMobileMenu(false)}
                            className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                              location.pathname === subItem.path
                                ? "bg-dark-700 text-primary-400"
                                : "text-dark-400 hover:text-white hover:bg-dark-700"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </nav>
      {/* Main Header - Page Title & Actions */}
      {(title || actions) && (
        <div className="bg-dark-800 border-b border-dark-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-dark-400 text-sm mt-1">{subtitle}</p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Backdrop for dropdowns */}
      {(showBuSelector || showUserMenu || showMobileMenu) && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent"
          onClick={() => {
            setShowBuSelector(false);
            setShowUserMenu(false);
            setShowMobileMenu(false);
          }}
        />
      )}
    </div>
  );
}
