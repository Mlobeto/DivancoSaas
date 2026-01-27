/**
 * MODULE CONTRACT
 * Todos los módulos de negocio deben implementar esta interfaz
 */

import { Router } from 'express';

export interface ModuleContract {
  /**
   * Nombre único del módulo
   */
  readonly name: string;
  
  /**
   * Versión del módulo
   */
  readonly version: string;
  
  /**
   * Inicializar el módulo
   * Se ejecuta cuando el módulo es cargado
   */
  initialize(): Promise<void>;
  
  /**
   * Obtener las rutas del módulo
   */
  getRoutes(): Router;
  
  /**
   * Obtener permisos requeridos por el módulo
   */
  getRequiredPermissions(): ModulePermission[];
  
  /**
   * Obtener workflows por defecto del módulo
   */
  getDefaultWorkflows?(): ModuleWorkflow[];
  
  /**
   * Limpiar recursos al desactivar el módulo
   */
  cleanup?(): Promise<void>;
}

export interface ModulePermission {
  resource: string;
  action: string;
  description: string;
}

export interface ModuleWorkflow {
  name: string;
  description: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

export interface WorkflowState {
  id: string;
  name: string;
  color: string;
  order: number;
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
  requiredRole?: string;
}

/**
 * REGISTRY DE MÓDULOS
 * Mantiene registro de todos los módulos disponibles
 */
export class ModuleRegistry {
  private static modules = new Map<string, ModuleContract>();
  
  static register(module: ModuleContract): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`);
    }
    this.modules.set(module.name, module);
  }
  
  static get(name: string): ModuleContract | undefined {
    return this.modules.get(name);
  }
  
  static getAll(): ModuleContract[] {
    return Array.from(this.modules.values());
  }
  
  static has(name: string): boolean {
    return this.modules.has(name);
  }
}
