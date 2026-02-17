/**
 * EmailLayoutTab
 * Tab for managing email templates
 */

import { Mail, Plus, Eye, Send } from "lucide-react";

interface EmailLayoutTabProps {
  businessUnitId: string;
}

export function EmailLayoutTab({
  businessUnitId: _businessUnitId,
}: EmailLayoutTabProps) {
  // TODO: Implementar CRUD de EmailTemplate
  // - Lista de plantillas de email
  // - Crear nueva plantilla
  // - Editar plantilla existente
  // - Preview en cliente de email
  // - Test send
  // - Variables Handlebars

  const emailTypes = [
    {
      id: "welcome",
      label: "Bienvenida",
      description: "Email de bienvenida a nuevos clientes",
    },
    {
      id: "quotation_sent",
      label: "Cotización Enviada",
      description: "Notificación de cotización",
    },
    {
      id: "contract_signed",
      label: "Contrato Firmado",
      description: "Confirmación de contrato",
    },
    {
      id: "payment_reminder",
      label: "Recordatorio de Pago",
      description: "Recordatorio de pago pendiente",
    },
    { id: "invoice", label: "Factura", description: "Envío de factura" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Plantillas de Email</h3>
          <p className="text-sm text-dark-400 mt-1">
            Personaliza los emails automáticos enviados a tus clientes
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" disabled>
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </button>
      </div>

      {/* Coming Soon Card */}
      <div className="card bg-dark-800/50 border-dark-700 text-center py-12">
        <Mail className="w-16 h-16 mx-auto mb-4 text-primary-400 opacity-50" />
        <h4 className="text-xl font-semibold mb-2 text-dark-300">
          Próximamente: Sistema de Plantillas de Email
        </h4>
        <p className="text-dark-400 mb-6 max-w-md mx-auto">
          Configura emails automáticos con tu branding, variables dinámicas,
          editor WYSIWYG y envío de prueba para validar antes de activar.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-dark-500">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Editor WYSIWYG</span>
          </div>
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            <span>Test send</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>Preview responsive</span>
          </div>
        </div>
      </div>

      {/* Ejemplo de tipos de email */}
      <div className="opacity-50 pointer-events-none">
        <h4 className="text-sm font-medium mb-3 text-dark-400">
          Tipos de Email Disponibles
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {emailTypes.map((type) => (
            <div key={type.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary-400 mt-0.5" />
                  <div>
                    <h5 className="font-medium">{type.label}</h5>
                    <p className="text-sm text-dark-400 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded bg-dark-700 text-dark-400">
                  No configurado
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
