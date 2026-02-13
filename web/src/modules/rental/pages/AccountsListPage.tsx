import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { Wallet } from "lucide-react";

export function AccountsListPage() {
  const { businessUnit } = useAuthStore();

  return (
    <Layout
      title="Estados de Cuenta"
      subtitle={`Gestión de cuentas corrientes y saldos - ${businessUnit?.name}`}
      actions={
        <a href="/dashboard" className="btn-ghost">
          ← Dashboard
        </a>
      }
    >
      <div className="card">
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 mx-auto text-dark-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Estados de Cuenta</h3>
          <p className="text-dark-400 mb-6">Esta página mostrará:</p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-dark-300">
            <li>✓ Cuentas corrientes por cliente</li>
            <li>✓ Saldo actual disponible</li>
            <li>✓ Historial de movimientos (cargos y abonos)</li>
            <li>✓ Recargas de saldo</li>
            <li>✓ Alertas de saldo bajo</li>
            <li>✓ Estados de cuenta en PDF</li>
            <li>✓ Cargo automático de herramientas</li>
          </ul>
          <p className="text-sm text-dark-500 mt-6">🚧 Próximamente</p>
        </div>
      </div>
    </Layout>
  );
}
