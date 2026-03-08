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
  | "quotations-create";

interface UseTourOptions {
  tourName: TourName;
  steps: Step[];
  autoStart?: boolean; // Auto-start if not completed
}

interface TourState {
  run: boolean;
  stepIndex: number;
}

export function useTour({ tourName, steps, autoStart = true }: UseTourOptions) {
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    stepIndex: 0,
  });

  const storageKey = `tour-completed-${tourName}`;

  // Check if tour was already completed
  useEffect(() => {
    const completed = localStorage.getItem(storageKey);

    if (!completed && autoStart) {
      // Small delay to let the page render
      setTimeout(() => {
        setTourState({ run: true, stepIndex: 0 });
      }, 500);
    }
  }, [storageKey, autoStart]);

  const startTour = () => {
    setTourState({ run: true, stepIndex: 0 });
  };

  const stopTour = () => {
    setTourState({ run: false, stepIndex: 0 });
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
    const { status, action, index } = data;

    if (status === "finished" || status === "skipped") {
      completeTour();
    } else if (action === "close") {
      stopTour();
    } else if (action === "next" || action === "prev") {
      setTourState((prev) => ({
        ...prev,
        stepIndex: index + (action === "next" ? 1 : -1),
      }));
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
