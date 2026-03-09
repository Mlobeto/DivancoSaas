import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { businessUnitService } from "@/core/services/businessUnit.service";
import { AlertCircle, Clock3, Save, DollarSign } from "lucide-react";

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "Europe/Madrid",
];

const CURRENCY_OPTIONS = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "COP", name: "Peso colombiano", symbol: "$" },
  { code: "MXN", name: "Peso mexicano", symbol: "$" },
  { code: "PEN", name: "Sol peruano", symbol: "S/" },
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "ARS", name: "Peso argentino", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
];

export function TimezonePage() {
  const navigate = useNavigate();
  const { businessUnit } = useAuthStore();
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Limpiar mensajes de éxito automáticamente y redirigir
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
        navigate("/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  useEffect(() => {
    const loadBusinessUnit = async () => {
      if (!businessUnit?.id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await businessUnitService.getRentalSettings(
          businessUnit.id,
        );
        setTimezone(response.timezone || "UTC");
        setCurrency(response.defaultCurrency || "USD");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la configuración regional",
        );
      } finally {
        setLoading(false);
      }
    };

    loadBusinessUnit();
  }, [businessUnit?.id]);

  const handleSave = async () => {
    if (!businessUnit?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await businessUnitService.updateRentalSettings(businessUnit.id, {
        timezone,
        defaultCurrency: currency,
      });
      setSuccess("Configuración regional actualizada correctamente");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la configuración regional",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!businessUnit) {
    return (
      <Layout title="Configuración Regional">
        <div className="p-8">
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>No hay unidad de negocio seleccionada</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Configuración Regional"
      subtitle={`Configura la zona horaria y moneda de ${businessUnit.name}`}
    >
      <div className="p-8">
        <div className="max-w-2xl space-y-6">
          {error && (
            <div className="card bg-red-900/20 border-red-800 text-red-400">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="card bg-green-900/20 border-green-800 text-green-400">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p>{success}</p>
              </div>
            </div>
          )}

          <div className="card space-y-6">
            <h2 className="font-semibold text-dark-100 flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-primary-400" />
              Configuración regional
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Zona horaria
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input"
                  disabled={loading || saving}
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-dark-400">
                  Esta zona horaria se usa para operaciones y fechas de la
                  unidad de negocio.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-200 mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Moneda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input"
                  disabled={loading || saving}
                >
                  {CURRENCY_OPTIONS.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name} ({curr.code})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-dark-400">
                  Esta moneda se usará por defecto en contratos, cotizaciones y
                  transacciones.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar configuración
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
