import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

type CelebrationTrigger = 
  | "lead-verified" 
  | "email-sent" 
  | "goal-reached" 
  | "subscription-activated"
  | "bulk-complete";

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

// Create a singleton for the confetti trigger
let triggerCelebration: ((trigger: CelebrationTrigger) => void) | null = null;

export function useCelebration() {
  const celebrate = useCallback((trigger: CelebrationTrigger) => {
    if (triggerCelebration) {
      triggerCelebration(trigger);
    }
  }, []);

  return { celebrate };
}

export default function ConfettiCelebration() {
  useEffect(() => {
    triggerCelebration = (trigger: CelebrationTrigger) => {
      const configs: Record<CelebrationTrigger, ConfettiOptions> = {
        "lead-verified": {
          particleCount: 50,
          spread: 60,
          origin: { x: 0.5, y: 0.6 },
          colors: ["#22c55e", "#16a34a", "#15803d"],
        },
        "email-sent": {
          particleCount: 80,
          spread: 80,
          origin: { x: 0.5, y: 0.5 },
          colors: ["#3b82f6", "#2563eb", "#1d4ed8"],
        },
        "goal-reached": {
          particleCount: 150,
          spread: 120,
          origin: { x: 0.5, y: 0.6 },
          colors: ["#f59e0b", "#eab308", "#ca8a04"],
        },
        "subscription-activated": {
          particleCount: 200,
          spread: 180,
          origin: { x: 0.5, y: 0.5 },
          colors: ["#a855f7", "#9333ea", "#7e22ce", "#22c55e"],
        },
        "bulk-complete": {
          particleCount: 100,
          spread: 100,
          origin: { x: 0.5, y: 0.5 },
          colors: ["#22c55e", "#3b82f6", "#f59e0b"],
        },
      };

      const config = configs[trigger];

      // Fire confetti
      confetti({
        particleCount: config.particleCount,
        spread: config.spread,
        origin: config.origin,
        colors: config.colors,
        disableForReducedMotion: true,
      });

      // For bigger celebrations, fire multiple bursts
      if (trigger === "subscription-activated" || trigger === "goal-reached") {
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: config.colors,
          });
        }, 150);

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: config.colors,
          });
        }, 300);
      }
    };

    return () => {
      triggerCelebration = null;
    };
  }, []);

  return null;
}
