/**
 * PRODUCT TOUR: Email Templates
 *
 * Onboarding tour for email template configuration
 */

import { Step } from "react-joyride";
import React from "react";

export const emailTemplatesTour: Step[] = [
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        { className: "text-lg font-bold mb-2" },
        "📧 Plantillas de Email",
      ),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Personaliza los emails automáticos que se envían a tus clientes en diferentes momentos del ciclo de alquiler.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Cada plantilla usa automáticamente el branding que configuraste (logo y colores).",
      ),
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="email-types"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Aquí ves los ",
        React.createElement("strong", null, "tipos de email"),
        " disponibles:",
      ),
      React.createElement(
        "ul",
        { className: "text-sm space-y-1 list-disc list-inside mt-2" },
        React.createElement("li", null, "Bienvenida"),
        React.createElement("li", null, "Cotización enviada"),
        React.createElement("li", null, "Contrato firmado"),
        React.createElement("li", null, "Recordatorio de pago"),
        React.createElement(
          "li",
          null,
          React.createElement("strong", null, "Corte de contrato"),
          " (informe periódico)",
        ),
      ),
    ),
    placement: "right",
  },
  {
    target: '[data-tour="email-type-button"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Haz clic en un tipo de email para ver y editar sus plantillas.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Puedes tener múltiples plantillas por tipo (por ejemplo, diferentes versiones para diferentes clientes).",
      ),
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="template-list"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Aquí aparecen todas las ",
        React.createElement("strong", null, "plantillas creadas"),
        " para el tipo seleccionado.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Una plantilla puede estar marcada como predeterminada ⭐.",
      ),
    ),
    placement: "right",
  },
  {
    target: '[data-tour="create-template"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Haz clic aquí para ",
        React.createElement("strong", null, "crear una nueva plantilla"),
        " del tipo seleccionado.",
      ),
    ),
    placement: "left",
  },
  {
    target: '[data-tour="template-name"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Nombre de la plantilla"),
        ": Para identificarla internamente.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        'Por ejemplo: "Bienvenida VIP", "Cotización Estándar".',
      ),
    ),
    placement: "right",
  },
  {
    target: '[data-tour="template-subject"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Asunto del email"),
        ": Lo que verá el cliente en su bandeja.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2 text-yellow-300" },
        "💡 Puedes usar variables como {{clientName}}, {{contractCode}}, etc.",
      ),
    ),
    placement: "right",
  },
  {
    target: '[data-tour="use-branding"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Aplicar branding"),
        ": Activa esto para usar tu logo y colores.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Si lo desactivas, el email usará un diseño neutro sin branding.",
      ),
    ),
    placement: "top",
  },
  {
    target: '[data-tour="html-content"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Contenido HTML"),
        ": El cuerpo del mensaje.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Puedes escribir HTML directamente o texto simple. Las variables se reemplazan automáticamente.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2 text-blue-300" },
        "Variables disponibles: {{clientName}}, {{amount}}, {{dueDate}}, {{contractCode}}, etc.",
      ),
    ),
    placement: "top",
  },
  {
    target: '[data-tour="save-template"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Haz clic en ",
        React.createElement("strong", null, "Guardar"),
        " para almacenar la plantilla.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Una vez guardada, se enviará automáticamente cuando ocurra el evento correspondiente.",
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
        "🎉 ¡Excelente!",
      ),
      React.createElement(
        "p",
        { className: "text-sm mb-2" },
        "Ahora tus emails tendrán un aspecto profesional con tu branding.",
      ),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Los clientes recibirán notificaciones automáticas en cada etapa del proceso de alquiler.",
      ),
    ),
    placement: "center",
  },
];
