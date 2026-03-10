/**
 * CUSTOM HOOK: Product Tours
 *
 * Manages onboarding tours for different screens using react-joyride
 * Tours are shown once per user, with option to replay from navbar
 */

import { useState, useEffect } from "react";
import { Step } from "react-joyride";

export type TourName =
  | "asset-templates-list"
  | "asset-templates-create"
  | "asset-create"
  | "quotations-create"
  | "branding-setup"
  | "email-templates";

interface UseTourOptions {
  tourName: TourName;
  steps: Step[];
  autoStart?: boolean; // Auto-start if not completed
}

interface TourState {
  run: boolean;
}

export function useTour({ tourName, steps, autoStart = true }: UseTourOptions) {
  const [tourState, setTourState] = useState<TourState>({
    run: false,
  });

  const storageKey = `tour-completed-${tourName}`;

  // Check if tour was already completed
  useEffect(() => {
    const completed = localStorage.getItem(storageKey);

    if (!completed && autoStart) {
      // Small delay to let the page render
      setTimeout(() => {
        setTourState({ run: true });
      }, 500);
    }
  }, [storageKey, autoStart]);

  const startTour = () => {
    setTourState({ run: true });
  };

  const stopTour = () => {
    setTourState({ run: false });
  };

  const completeTour = () => {
    localStorage.setItem(storageKey, "true");
    stopTour();
  };

  const resetTour = () => {
    localStorage.removeItem(storageKey);
    startTour();
  };

  const handleJoyrideCallback = (data: any) => {
    const { status, action } = data;

    if (status === "finished" || status === "skipped") {
      completeTour();
    } else if (action === "close") {
      stopTour();
    }
  };

  return {
    tourState,
    steps,
    startTour,
    stopTour,
    resetTour,
    handleJoyrideCallback,
  };
}
