import { ContactInfo } from "../../types/branding.types";

interface ContactSectionProps {
  value: ContactInfo;
  onChange: (value: ContactInfo) => void;
}

export function ContactSection({ value, onChange }: ContactSectionProps) {
  const handleChange = (field: keyof ContactInfo, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Estos datos se mostrarán en el pie de página de tus documentos cuando
        actives "Mostrar Datos de Contacto".
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de Contacto
          </label>
          <input
            type="email"
            value={value.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="contacto@empresa.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={value.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+57 300 123 4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sitio Web
          </label>
          <input
            type="url"
            value={value.website || ""}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="https://www.empresa.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <input
            type="text"
            value={value.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Calle 123 #45-67, Ciudad, País"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <strong>Nota:</strong> Estos datos son opcionales. Si no los
            configuras, el pie de página solo mostrará la información del
            disclaimer (si está activado) y la fecha de generación del
            documento.
          </div>
        </div>
      </div>
    </div>
  );
}
