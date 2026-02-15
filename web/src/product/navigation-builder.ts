/**
 * Navigation Builder - Platform Architecture
 *
 * Dynamically builds navigation structure from PLATFORM architecture:
 * - Gets active VERTICAL navigation (priority)
 * - Includes required CORE module navigation
 * - Includes LEGACY module navigation (during migration)
 * - Handles permissions, ordering, and conditional visibility
 */

import { NavigationItem, ModuleContext } from "./types/module.types";
import { verticalRegistry } from "./vertical-registry";
import { moduleRegistry } from "./module-registry";

/**
 * Navigation builder service
 */
export class NavigationBuilder {
  /**
   * Build navigation tree for current context
   * Merges vertical, core, and legacy module navigation
   */
  buildNavigation(context: ModuleContext): NavigationItem[] {
    // Get navigation from active vertical (includes core navigation)
    const verticalItems = verticalRegistry.getNavigation(context);

    // Get navigation from legacy modules (during migration)
    const legacyItems = moduleRegistry.getNavigation(context);

    // Merge both navigation sets (verticals have priority)
    const allItems = [...verticalItems, ...legacyItems];

    // Filter by permissions
    const filtered = this.filterByPermissions(allItems, context.permissions);

    // Sort by order
    const sorted = this.sortByOrder(filtered);

    return sorted;
  }

  /**
   * Filter navigation items by user permissions
   */
  private filterByPermissions(
    items: NavigationItem[],
    userPermissions: string[],
  ): NavigationItem[] {
    return items.filter((item) => {
      // If no permissions required, show item
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }

      // Check if user has at least one required permission
      const hasPermission = item.permissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        return false;
      }

      // Recursively filter children
      if (item.children) {
        item.children = this.filterByPermissions(
          item.children,
          userPermissions,
        );
      }

      return true;
    });
  }

  /**
   * Sort navigation items by order property
   */
  private sortByOrder(items: NavigationItem[]): NavigationItem[] {
    const sorted = [...items].sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });

    // Recursively sort children
    sorted.forEach((item) => {
      if (item.children) {
        item.children = this.sortByOrder(item.children);
      }
    });

    return sorted;
  }

  /**
   * Find navigation item by path
   */
  findByPath(items: NavigationItem[], path: string): NavigationItem | null {
    for (const item of items) {
      if (item.path === path) {
        return item;
      }

      if (item.children) {
        const found = this.findByPath(item.children, path);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Get breadcrumbs for a path
   */
  getBreadcrumbs(items: NavigationItem[], path: string): NavigationItem[] {
    const breadcrumbs: NavigationItem[] = [];

    const findPath = (
      navItems: NavigationItem[],
      targetPath: string,
      ancestors: NavigationItem[] = [],
    ): boolean => {
      for (const item of navItems) {
        if (item.path === targetPath) {
          breadcrumbs.push(...ancestors, item);
          return true;
        }

        if (item.children) {
          if (findPath(item.children, targetPath, [...ancestors, item])) {
            return true;
          }
        }
      }
      return false;
    };

    findPath(items, path);
    return breadcrumbs;
  }

  /**
   * Flatten navigation tree (for search, sitemap, etc.)
   */
  flatten(items: NavigationItem[]): NavigationItem[] {
    const flattened: NavigationItem[] = [];

    const traverse = (navItems: NavigationItem[]) => {
      for (const item of navItems) {
        flattened.push(item);
        if (item.children) {
          traverse(item.children);
        }
      }
    };

    traverse(items);
    return flattened;
  }
}

/**
 * Global navigation builder instance
 */
export const navigationBuilder = new NavigationBuilder();
