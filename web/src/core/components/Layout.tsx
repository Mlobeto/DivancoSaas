import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { businessUnitService } from "@/core/services/businessUnit.service";
import type { BusinessUnit } from "@/core/types/api.types";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Layout({ children, title, subtitle, actions }: LayoutProps) {
  const { user, tenant, businessUnit, setAuth, clearAuth } = useAuthStore();
  const [showBuSelector, setShowBuSelector] = useState(false);

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

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Top Bar - Context & User Info */}
      <div className="header px-6 py-2 flex items-center justify-between border-b border-dark-700">
        {/* Left: Tenant/BU Context */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded flex items-center justify-center text-white text-xs font-bold">
              {tenant?.name?.substring(0, 2).toUpperCase() || "DV"}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-white leading-tight">
                {tenant?.name || "DivancoSaaS"}
              </div>
              <div className="text-dark-400 text-xs leading-tight">
                Plan: {tenant?.plan || "Free"}
              </div>
            </div>
          </div>

          {/* Business Unit Selector */}
          {businessUnit && (
            <>
              <div className="text-dark-600">›</div>
              <button
                onClick={() => setShowBuSelector(!showBuSelector)}
                className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-dark-700 transition-colors text-sm"
              >
                <div className="w-6 h-6 bg-dark-700 rounded flex items-center justify-center text-primary-400 text-xs">
                  {businessUnit.name?.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-white font-medium">
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
                <div className="absolute top-14 left-48 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 min-w-[240px]">
                  <div className="p-2 border-b border-dark-700">
                    <div className="text-xs text-dark-400 font-medium px-2">
                      Cambiar Business Unit
                    </div>
                  </div>
                  <div className="p-2">
                    {userBusinessUnits.map((bu) => (
                      <button
                        key={bu.id}
                        onClick={() => handleSwitchBu(bu)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-dark-700 transition-colors text-sm ${
                          bu.id === businessUnit.id
                            ? "bg-dark-700 text-primary-400"
                            : "text-white"
                        }`}
                      >
                        <div className="w-6 h-6 bg-dark-600 rounded flex items-center justify-center text-xs">
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
            </>
          )}
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="text-white font-medium leading-tight">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-dark-400 text-xs leading-tight">
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm rounded hover:bg-dark-700 transition-colors text-dark-300 hover:text-white"
            title="Cerrar Sesión"
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
          </button>
        </div>
      </div>

      {/* Main Header - Page Title & Actions */}
      {(title || actions) && (
        <div className="header px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-white">{title}</h1>
              )}
              {subtitle && (
                <p className="text-dark-400 text-sm mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">{actions}</div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">{children}</div>

      {/* Close dropdown on click outside */}
      {showBuSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowBuSelector(false)}
        />
      )}
    </div>
  );
}
