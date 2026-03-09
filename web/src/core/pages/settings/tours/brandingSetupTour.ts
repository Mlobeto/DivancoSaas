/**
 * PRODUCT TOUR: Branding Setup
 *
 * Onboarding tour for branding configuration
 */

import { Step } from "react-joyride";
import React from "react";

export const brandingSetupTour: Step[] = [
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        { className: "text-lg font-bold mb-2" },
        "🎨 Configuración de Branding",
      ),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Personaliza la identidad visual de tu negocio. Los cambios se aplicarán automáticamente a todas tus plantillas de email.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Vamos a configurar tu logo, colores y plantillas de correo.",
      ),
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="tab-logo"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Paso 1: Logo"),
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Sube el logo de tu empresa. Este aparecerá en todos los emails que envíes a tus clientes.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2 text-yellow-300" },
        "💡 Formatos soportados: PNG, JPG, SVG",
      ),
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="logo-upload"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        "Haz clic aquí para ",
        React.createElement("strong", null, "subir tu logo"),
        ".",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Se recomienda un logo horizontal con fondo transparente para mejor visualización.",
      ),
    ),
    placement: "right",
  },
  {
    target: '[data-tour="tab-colors"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Paso 2: Colores"),
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Define los colores principales de tu marca. Estos se aplicarán automáticamente a los botones y encabezados de tus emails.",
      ),
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="color-primary"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Color primario"),
        ": El color principal de tu marca.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Se usa para botones principales, encabezados y elementos destacados.",
      ),
    ),
    placement: "right",
  },
  {
    target: '[data-tour="color-secondary"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Color secundario"),
        ": Complementa al color primario.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Se usa para secciones de fondo, bordes y elementos secundarios.",
      ),
    ),
    placement: "right",
  },
  {
    target: '[data-tour="tab-email"]',
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement("strong", null, "Paso 3: Plantillas de Email"),
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2" },
        "Configura las plantillas de correo que se enviarán automáticamente a tus clientes.",
      ),
      React.createElement(
        "p",
        { className: "text-sm mt-2 text-blue-300" },
        "✨ Las plantillas usarán automáticamente el logo y colores que configuraste.",
      ),
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        { className: "text-lg font-bold mb-2" },
        "✅ ¡Perfecto!",
      ),
      React.createElement(
        "p",
        { className: "text-sm mb-2" },
        "Ahora veamos cómo configurar las plantillas de email...",
      ),
    ),
    placement: "center",
  },
];
