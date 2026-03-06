import { useEffect, useState } from "react";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { businessUnitService } from "@/core/services/businessUnit.service";
import { AlertCircle, Clock3, Save } from "lucide-react";

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

export function TimezonePage() {
  const { businessUnit } = useAuthStore();
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinessUnit = async () => {
      if (!businessUnit?.id) return;

      try {
        setLoading(true);
        setError(null);
        const bu = await businessUnitService.getById(businessUnit.id);
        setTimezone(bu.timezone || "UTC");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la zona horaria actual",
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

      await businessUnitService.update(businessUnit.id, { timezone });
      setSuccess("Zona horaria actualizada correctamente");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la zona horaria",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!businessUnit) {
    return (
      <Layout title="Zona horaria">
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
      title="Zona horaria"
      subtitle={`Configura la zona horaria de ${businessUnit.name}`}
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

          <div className="card space-y-4">
            <h2 className="font-semibold text-dark-100 flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-primary-400" />
              Configuración de zona horaria
            </h2>

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
                Esta zona horaria se usa para operaciones y fechas de la unidad
                de negocio.
              </p>
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
                    Guardar zona horaria
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
