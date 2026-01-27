/**
 * EJEMPLO: Módulo de Proyectos
 * 
 * Este es un módulo de ejemplo que muestra cómo implementar
 * un módulo de negocio siguiendo los principios arquitectónicos.
 * 
 * Este módulo NO es parte del core.
 */

import { Router } from 'express';
import { ModuleContract, ModulePermission, ModuleWorkflow } from '@core/contracts/module.contract';

export class ProjectsModule implements ModuleContract {
  readonly name = 'projects';
  readonly version = '1.0.0';
  
  async initialize(): Promise<void> {
    console.log(`[Module] ${this.name} v${this.version} initialized`);
  }
  
  getRoutes(): Router {
    const router = Router();
    
    // GET /api/v1/modules/projects/projects
    router.get('/projects', async (req, res) => {
      res.json({
        success: true,
        data: {
          message: 'Projects module - List projects',
          context: req.context,
        },
      });
    });
    
    // POST /api/v1/modules/projects/projects
    router.post('/projects', async (req, res) => {
      res.json({
        success: true,
        data: {
          message: 'Projects module - Create project',
        },
      });
    });
    
    return router;
  }
  
  getRequiredPermissions(): ModulePermission[] {
    return [
      {
        resource: 'projects',
        action: 'create',
        description: 'Create new projects',
      },
      {
        resource: 'projects',
        action: 'read',
        description: 'View projects',
      },
      {
        resource: 'projects',
        action: 'update',
        description: 'Edit projects',
      },
      {
        resource: 'projects',
        action: 'delete',
        description: 'Delete projects',
      },
      {
        resource: 'project-tasks',
        action: 'create',
        description: 'Create project tasks',
      },
      {
        resource: 'project-tasks',
        action: 'read',
        description: 'View project tasks',
      },
      {
        resource: 'project-tasks',
        action: 'update',
        description: 'Edit project tasks',
      },
    ];
  }
  
  getDefaultWorkflows(): ModuleWorkflow[] {
    return [
      {
        name: 'project-lifecycle',
        description: 'Default project lifecycle workflow',
        states: [
          {
            id: 'draft',
            name: 'Draft',
            color: '#94a3b8',
            order: 1,
            isInitial: true,
          },
          {
            id: 'planned',
            name: 'Planned',
            color: '#3b82f6',
            order: 2,
          },
          {
            id: 'in-progress',
            name: 'In Progress',
            color: '#f59e0b',
            order: 3,
          },
          {
            id: 'on-hold',
            name: 'On Hold',
            color: '#ef4444',
            order: 4,
          },
          {
            id: 'completed',
            name: 'Completed',
            color: '#10b981',
            order: 5,
            isFinal: true,
          },
          {
            id: 'cancelled',
            name: 'Cancelled',
            color: '#6b7280',
            order: 6,
            isFinal: true,
          },
        ],
        transitions: [
          { from: 'draft', to: 'planned', label: 'Plan' },
          { from: 'planned', to: 'in-progress', label: 'Start' },
          { from: 'in-progress', to: 'on-hold', label: 'Pause' },
          { from: 'on-hold', to: 'in-progress', label: 'Resume' },
          { from: 'in-progress', to: 'completed', label: 'Complete' },
          { from: 'draft', to: 'cancelled', label: 'Cancel' },
          { from: 'planned', to: 'cancelled', label: 'Cancel' },
          { from: 'in-progress', to: 'cancelled', label: 'Cancel', requiredRole: 'Admin' },
        ],
      },
    ];
  }
  
  async cleanup(): Promise<void> {
    console.log(`[Module] ${this.name} cleanup completed`);
  }
}

// Para registrar el módulo:
// ModuleRegistry.register(new ProjectsModule());
