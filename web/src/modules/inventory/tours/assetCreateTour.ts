/**
 * PRODUCT TOUR: Create Asset
 *
 * Onboarding tour for the asset creation form
 */

import { Step } from "react-joyride";
import React from "react";

export const assetCreateTour: Step[] = [
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        { className: "text-lg font-bold mb-2" },
        "🚜 Crear Activo Individual",
      ),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Ahora vas a registrar un activo específico basado en una plantilla.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        'Por ejemplo: "Retroexcavadora CAT 420F con placa XYZ-789".',
      ),
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="template-select"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Paso 1:"),
        " Selecciona la plantilla que corresponde al tipo de activo.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "La plantilla define qué campos técnicos aparecerán más abajo.",
      ),
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="basic-info"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Código único"),
        " del activo (se sugiere automáticamente).",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        React.createElement("strong", null, "Nombre descriptivo"),
        " para identificarlo fácilmente.",
      ),
    ),
    placement: "right",
  },
  {
    target: '[data-tour="technical-specs"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm mb-2" },
        "Aquí aparecen los ",
        React.createElement("strong", null, "campos técnicos"),
        " definidos en la plantilla.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mb-2" },
        "Por ejemplo: Placa, VIN, Marca, Modelo, ",
        React.createElement("strong", null, "Horómetro inicial"),
        ", etc.",
      ),
      React.createElement(
        "p",
        { className: "text-sm text-yellow-300" },
        "💡 Puedes agregar ",
        React.createElement("strong", null, "campos especiales"),
        " si este activo necesita algo extra.",
      ),
    ),
    placement: "top",
  },
  {
    target: '[data-tour="add-custom-field"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Haz clic aquí si necesitas un ",
        React.createElement("strong", null, "campo adicional"),
        " que no está en la plantilla.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        'Por ejemplo: "Certificado de calibración", "Número de permiso especial".',
      ),
    ),
    placement: "left",
  },
  {
    target: '[data-tour="rental-pricing"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Define los ",
        React.createElement("strong", null, "precios de alquiler"),
        " para este activo específico.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Puedes cobrar por hora, día, semana o mes según tu modelo de negocio.",
      ),
    ),
    placement: "top",
  },
  {
    target: '[data-tour="upload-photos"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Sube ",
        React.createElement("strong", null, "fotos del activo"),
        " para documentar su estado inicial.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Esto es útil para comparar con el estado al momento de devolución.",
      ),
    ),
    placement: "top",
  },
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        { className: "text-lg font-bold mb-2" },
        "✅ ¡Listo!",
      ),
      React.createElement(
        "p",
        { className: "text-sm mb-2" },
        "Una vez creado el activo, podrás:",
      ),
      React.createElement(
        "ul",
        { className: "text-sm space-y-1 list-disc list-inside" },
        React.createElement(
          "li",
          null,
          "Agregarlo a ",
          React.createElement("strong", null, "cotizaciones"),
          " de alquiler",
        ),
        React.createElement(
          "li",
          null,
          "Hacer ",
          React.createElement("strong", null, "seguimiento"),
          " de su uso (horómetro, km)",
        ),
        React.createElement(
          "li",
          null,
          "Programar ",
          React.createElement("strong", null, "mantenimientos preventivos"),
        ),
        React.createElement(
          "li",
          null,
          "Subir ",
          React.createElement("strong", null, "documentos"),
          " (SOAT, seguro, etc.)",
        ),
      ),
    ),
    placement: "center",
  },
];
