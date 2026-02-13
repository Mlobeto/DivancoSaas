import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { FileText } from "lucide-react";

export function ContractsListPage() {
  const { businessUnit } = useAuthStore();

  return (
    <Layout
      title="Contratos de Renta"
      subtitle={`Gestión de contratos activos - ${businessUnit?.name}`}
      actions={
        <a href="/dashboard" className="btn-ghost">
          ← Dashboard
        </a>
      }
    >
      <div className="card">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-dark-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Contratos de Renta</h3>
          <p className="text-dark-400 mb-6">Esta página mostrará:</p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-dark-300">
            <li>✓ Listado de contratos activos</li>
            <li>✓ Assets rentados por contrato</li>
            <li>✓ Fechas de inicio y fin</li>
            <li>✓ Estado de pagos</li>
            <li>✓ Reportes de uso diario</li>
            <li>✓ Proyección de consumo</li>
            <li>✓ Devolución de equipos</li>
          </ul>
          <p className="text-sm text-dark-500 mt-6">🚧 Próximamente</p>
        </div>
      </div>
    </Layout>
  );
}
