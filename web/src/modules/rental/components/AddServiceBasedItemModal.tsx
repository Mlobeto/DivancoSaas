import { useState } from "react";
import { X, Briefcase, DollarSign, FileText } from "lucide-react";

interface AddServiceBasedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (itemData: ServiceBasedItemData) => void;
}

export interface ServiceBasedItemData {
  description: string;
  quantity: number;
  fixedPrice: number;
  detailedDescription?: string;
  milestones?: ServiceMilestone[];
}

export interface ServiceMilestone {
  name: string;
  percentage: number;
  amount: number;
}

export function AddServiceBasedItemModal({
  isOpen,
  onClose,
  onAdd,
}: AddServiceBasedItemModalProps) {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [fixedPrice, setFixedPrice] = useState(0);
  const [detailedDescription, setDetailedDescription] = useState("");

  // Milestones (hitos de pago)
  const [useMilestones, setUseMilestones] = useState(false);
  const [milestones, setMilestones] = useState<ServiceMilestone[]>([
    { name: "Adelanto Inicio", percentage: 50, amount: 0 },
    { name: "Pago Final", percentage: 50, amount: 0 },
  ]);

  // Recalcular amounts de milestones cuando cambia el precio
  const updateMilestoneAmounts = (price: number) => {
    setMilestones(
      milestones.map((m) => ({
        ...m,
        amount: (price * m.percentage) / 100,
      })),
    );
  };

  const handlePriceChange = (price: number) => {
    setFixedPrice(price);
    updateMilestoneAmounts(price);
  };

  const handleMilestonePercentageChange = (
    index: number,
    percentage: number,
  ) => {
    const newMilestones = [...milestones];
    newMilestones[index] = {
      ...newMilestones[index],
      percentage,
      amount: (fixedPrice * percentage) / 100,
    };
    setMilestones(newMilestones);
  };

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { name: `Hito ${milestones.length + 1}`, percentage: 0, amount: 0 },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);
  const percentageValid = totalPercentage === 100;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || fixedPrice <= 0) {
      alert("Por favor completa la descripción y el precio");
      return;
    }

    if (useMilestones && !percentageValid) {
      alert("Los porcentajes de los hitos deben sumar 100%");
      return;
    }

    const itemData: ServiceBasedItemData = {
      description,
      quantity,
      fixedPrice,
      detailedDescription: detailedDescription.trim() || undefined,
      milestones: useMilestones ? milestones : undefined,
    };

    onAdd(itemData);

    // Reset form
    setDescription("");
    setQuantity(1);
    setFixedPrice(0);
    setDetailedDescription("");
    setUseMilestones(false);
    setMilestones([
      { name: "Adelanto Inicio", percentage: 50, amount: 0 },
      { name: "Pago Final", percentage: 50, amount: 0 },
    ]);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Definir Servicio/Trabajo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cotización por trabajo con precio fijo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Descripción del Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descripción del Trabajo <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Construcción de 2 km de caminos"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          {/* Descripción Detallada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción Detallada (Opcional)
            </label>
            <textarea
              value={detailedDescription}
              onChange={(e) => setDetailedDescription(e.target.value)}
              rows={4}
              placeholder="Incluye detalles adicionales del trabajo: especificaciones, materiales incluidos, alcance, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Cantidad y Precio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Precio Fijo <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fixedPrice || ""}
                onChange={(e) =>
                  handlePriceChange(parseFloat(e.target.value) || 0)
                }
                placeholder="500000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              />
            </div>
          </div>

          {/* Hitos de Pago (Milestones) */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Hitos de Pago</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMilestones}
                  onChange={(e) => setUseMilestones(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Definir Hitos
                </span>
              </label>
            </div>

            {useMilestones && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Define los hitos de pago para este proyecto (ej: 50% inicio,
                  50% final)
                </p>

                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nombre del Hito
                        </label>
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => {
                            const newMilestones = [...milestones];
                            newMilestones[index].name = e.target.value;
                            setMilestones(newMilestones);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Porcentaje
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={milestone.percentage}
                            onChange={(e) =>
                              handleMilestonePercentageChange(
                                index,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMilestone(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Eliminar hito"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      Monto:{" "}
                      <span className="font-semibold">
                        ${milestone.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMilestone}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + Agregar Hito
                </button>

                {/* Validación de porcentajes */}
                <div
                  className={`p-3 rounded-lg text-sm ${
                    percentageValid
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Porcentajes:</span>
                    <span className="text-lg font-bold">
                      {totalPercentage}%
                    </span>
                  </div>
                  {!percentageValid && (
                    <p className="mt-1 text-xs">
                      ⚠️ El total debe ser exactamente 100%
                    </p>
                  )}
                </div>
              </div>
            )}

            {!useMilestones && (
              <p className="text-sm text-gray-500 italic">
                Se usará pago único al aceptar la cotización
              </p>
            )}
          </div>

          {/* Total */}
          <div className="p-4 bg-blue-600 text-white rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">PRECIO TOTAL:</span>
              <span className="text-2xl font-bold">
                ${(fixedPrice * quantity).toLocaleString()}
              </span>
            </div>
            {quantity > 1 && (
              <p className="text-sm text-blue-100 mt-1">
                ${fixedPrice.toLocaleString()} × {quantity} unidad(es)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={
                !description.trim() ||
                fixedPrice <= 0 ||
                (useMilestones && !percentageValid)
              }
            >
              Agregar Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
