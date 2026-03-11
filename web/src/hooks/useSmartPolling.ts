/**
 * Smart Polling Hook
 * Pausa el refetch cuando la pestaña no está visible
 * para reducir carga en el servidor y evitar throttling
 */

import { useEffect, useState } from "react";

export function useSmartPolling(baseInterval: number | false) {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Si baseInterval es false, mantener deshabilitado
  if (baseInterval === false) return false;

  // Solo hacer polling si la página está visible
  return isVisible ? baseInterval : false;
}
