/**
 * PRODUCT TOUR: Asset Templates
 *
 * Onboarding tour for the asset templates list page
 */

import { Step } from "react-joyride";
import React from "react";

export const assetTemplatesListTour: Step[] = [
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        { className: "text-lg font-bold mb-2" },
        "👋 ¡Bienvenido a Plantillas de Activos!",
      ),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Las plantillas te permiten definir ",
        React.createElement("strong", null, "tipos de activos"),
        " con sus especificaciones técnicas, precios de alquiler y reglas de negocio.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        'Por ejemplo: "Retroexcavadora CAT", "Andamio Tubular", "Vibrador Compactador".',
      ),
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="templates-stats"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Aquí ves un resumen de tus plantillas: cuántas tienes, cuántos activos has creado con ellas, y cuáles requieren mantenimiento preventivo.",
      ),
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="template-card"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm mb-2" },
        "Las plantillas que ya vienen creadas son ejemplos para el vertical de alquiler de maquinaria y equipos de construcción.",
      ),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Puedes ",
        React.createElement("strong", null, "editarlas"),
        ", ",
        React.createElement("strong", null, "duplicarlas"),
        " o crear nuevas desde cero.",
      ),
    ),
    placement: "top",
  },
  {
    target: '[data-tour="new-template-btn"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Haz clic aquí para ",
        React.createElement("strong", null, "crear una nueva plantilla"),
        " con el wizard guiado.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Te pedirá: categoría, especificaciones técnicas, modalidades de alquiler y reglas de negocio.",
      ),
    ),
    placement: "left",
  },
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        { className: "text-lg font-bold mb-2" },
        "📝 Próximo paso:",
      ),
      React.createElement(
        "p",
        { className: "text-sm mb-2" },
        "Una vez tengas tus plantillas configuradas, podrás ",
        React.createElement("strong", null, "crear activos"),
        " basados en ellas.",
      ),
      React.createElement(
        "p",
        { className: "text-sm" },
        'Por ejemplo: "Retroexcavadora CAT 420F - Placa ABC-123" usando la plantilla "Retroexcavadora".',
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-3 text-blue-300" },
        "💡 Puedes volver a ver este tour desde el menú de ayuda en cualquier momento.",
      ),
    ),
    placement: "center",
  },
];

export const assetTemplatesCreateTour: Step[] = [
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        { className: "text-lg font-bold mb-2" },
        "🎨 Wizard de Plantillas",
      ),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Este asistente te guiará paso a paso para crear una plantilla completa.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Puedes cargar ejemplos predefinidos o configurar todo desde cero.",
      ),
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="wizard-steps"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Aquí ves los pasos del wizard. Los pasos se adaptan según la categoría que elijas.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        'Por ejemplo, vehículos incluyen paso de "Modalidades de Alquiler".',
      ),
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="load-example"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "⚡ ",
        React.createElement("strong", null, "Atajo rápido:"),
        " Carga un ejemplo predefinido y modifícalo.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Incluye especificaciones técnicas, precios sugeridos y reglas típicas.",
      ),
    ),
    placement: "left",
  },
];
