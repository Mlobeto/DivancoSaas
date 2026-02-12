/**
 * CSV Import Upload Component
 * Generic component for CSV file upload with progress and results display
 */

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Download,
} from "lucide-react";

export interface ImportResult {
  success: boolean;
  created: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  summary: string;
}

interface CSVImportUploadProps {
  title: string;
  description?: string;
  templateName: string;
  templateUrl: string;
  onImport: (file: File) => Promise<ImportResult>;
  onClose: () => void;
}

export function CSVImportUpload({
  title,
  description,
  templateName,
  templateUrl,
  onImport,
  onClose,
}: CSVImportUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      setResult(null);
    } else {
      alert("Por favor selecciona un archivo CSV válido");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const importResult = await onImport(file);
      setResult(importResult);
    } catch (error: any) {
      setResult({
        success: false,
        created: 0,
        errors: [
          { row: 0, error: error.message || "Error al importar archivo" },
        ],
        summary: "Error al procesar el archivo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">
                  Descargar plantilla
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Descarga la plantilla CSV con el formato correcto y ejemplos.
                </p>
                <a
                  href={templateUrl}
                  download={templateName}
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Descargar {templateName}
                </a>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {!result && (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }
                `}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {file ? (
                  <div>
                    <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      Arrastra tu archivo CSV aquí
                    </p>
                    <p className="text-xs text-gray-500">
                      o haz clic para seleccionar
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="flex gap-3 justify-end">
                {file && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={`
                    px-6 py-2 rounded-lg font-medium transition-colors
                    ${
                      file && !isUploading
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  {isUploading ? "Importando..." : "Importar"}
                </button>
              </div>
            </>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div
                className={`
                border rounded-lg p-4
                ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }
              `}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${result.success ? "text-green-900" : "text-yellow-900"}`}
                    >
                      {result.success
                        ? "Importación exitosa"
                        : "Importación con errores"}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${result.success ? "text-green-700" : "text-yellow-700"}`}
                    >
                      {result.summary}
                    </p>
                    <div className="mt-2 text-sm">
                      <span
                        className={`font-medium ${result.success ? "text-green-900" : "text-yellow-900"}`}
                      >
                        ✓ {result.created} registros creados
                      </span>
                      {result.errors.length > 0 && (
                        <span className="ml-4 text-red-700">
                          ✗ {result.errors.length} errores
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Errors Detail */}
              {result.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                    <h4 className="font-medium text-red-900 text-sm">
                      Detalle de errores ({result.errors.length})
                    </h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 border-b border-red-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                            Fila {error.row}
                          </span>
                          <p className="text-sm text-red-800 flex-1">
                            {error.error}
                          </p>
                        </div>
                        {error.data && (
                          <pre className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(error.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Importar otro archivo
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
