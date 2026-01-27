import { useAuthStore } from '@/store/auth.store';

export function DashboardPage() {
  const { user, tenant, businessUnit, role } = useAuthStore();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Usuario</h3>
          <p className="text-dark-400 text-sm">{user?.firstName} {user?.lastName}</p>
          <p className="text-dark-500 text-xs">{user?.email}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Tenant</h3>
          <p className="text-dark-400 text-sm">{tenant?.name}</p>
          <p className="text-dark-500 text-xs">Plan: {tenant?.plan}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Business Unit</h3>
          <p className="text-dark-400 text-sm">{businessUnit?.name || 'N/A'}</p>
          <p className="text-dark-500 text-xs">Rol: {role || 'N/A'}</p>
        </div>
      </div>
      
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4">Bienvenido a DivancoSaaS</h3>
        <p className="text-dark-400">
          Sistema de gestión modular multitenant. La arquitectura permite
          activar módulos según las necesidades de cada Business Unit.
        </p>
      </div>
    </div>
  );
}
