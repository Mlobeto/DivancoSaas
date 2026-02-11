/**
 * RENTAL MODULE
 * Módulo para gestión de cotizaciones, firma digital y contratos de alquiler
 */

import { Router } from "express";
import rentalRoutes from "./rental.routes";

export const rentalModule = {
  name: "rental",
  displayName: "Alquiler y Cotizaciones",
  version: "1.0.0",
  routes: rentalRoutes,
  description: "Gestión de cotizaciones con firma digital y contratos",
};

export default rentalModule;
