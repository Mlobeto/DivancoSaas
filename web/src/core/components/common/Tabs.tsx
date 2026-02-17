/**
 * Tabs Component
 * Reusable tab navigation component
 */

import { useState, ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: (activeTab: string) => ReactNode;
}

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const handleTabChange = (tabId: string) => {
    if (tabs.find((t) => t.id === tabId && t.disabled)) return;
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-dark-700">
        <nav className="flex gap-2 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-dark-400 hover:text-dark-200 hover:border-dark-600"
                }
                ${tab.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary-900/30 text-primary-400">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{children(activeTab)}</div>
    </div>
  );
}
