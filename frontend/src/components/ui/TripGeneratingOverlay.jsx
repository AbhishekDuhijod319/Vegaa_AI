import React, { useEffect, useState, useMemo } from "react";
import { Plane, MapPin, Compass, Utensils, Hotel, Camera, Sparkles, Globe } from "lucide-react";

/**
 * Rotating messages shown during trip generation to keep users engaged.
 * Grouped by phase to feel like real progress.
 */
const GENERATION_MESSAGES = [
  { text: "Analyzing your travel preferences...", icon: Sparkles },
  { text: "Searching for the best destinations...", icon: MapPin },
  { text: "Finding hidden gems near your route...", icon: Compass },
  { text: "Curating top-rated hotels for you...", icon: Hotel },
  { text: "Discovering must-try local restaurants...", icon: Utensils },
  { text: "Planning the perfect day-by-day itinerary...", icon: Globe },
  { text: "Mapping out scenic routes & attractions...", icon: Camera },
  { text: "Checking weather forecasts & best times...", icon: Sparkles },
  { text: "Optimizing your budget allocation...", icon: Sparkles },
  { text: "Adding insider tips from local guides...", icon: MapPin },
  { text: "Polishing your personalized travel plan...", icon: Plane },
  { text: "Almost there! Finalizing your itinerary...", icon: Sparkles },
];

/**
 * TripGeneratingOverlay — premium full-screen overlay shown during AI trip generation.
 * Features:
 *  - Themed animated spinner with glow
 *  - Rotating travel tips/status messages
 *  - Smooth cross-fade transitions
 *  - Progress dots indicator
 */
export default function TripGeneratingOverlay({ isVisible = false }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Cycle messages every 3.5s with cross-fade
  useEffect(() => {
    if (!isVisible) return;
    setMessageIndex(0);
    setFadeIn(true);

    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length);
        setFadeIn(true);
      }, 400); // 400ms fade-out before switching
    }, 3500);

    return () => clearInterval(interval);
  }, [isVisible]);

  const current = useMemo(() => GENERATION_MESSAGES[messageIndex], [messageIndex]);
  const IconComponent = current.icon;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-8 max-w-md px-8 text-center animate-in fade-in duration-500">

        {/* Animated travel icon ring */}
        <div className="relative">
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "2.5s" }} />
          {/* Middle rotating ring */}
          <div className="w-24 h-24 rounded-full border-[3px] border-primary/10 border-t-primary animate-spin" style={{ animationDuration: "1.2s" }} />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Plane className="w-8 h-8 text-primary animate-bounce" style={{ animationDuration: "2s" }} />
          </div>
        </div>

        {/* Main title */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Crafting Your Perfect Trip
          </h3>
          <p className="text-sm text-muted-foreground">
            Our AI is building a personalized itinerary just for you
          </p>
        </div>

        {/* Rotating status message with icon */}
        <div
          className={`flex items-center gap-3 px-6 py-3 rounded-xl bg-primary/5 border border-primary/10 transition-all duration-400 ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <IconComponent className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground/80">
            {current.text}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {GENERATION_MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === messageIndex
                  ? "w-6 bg-primary"
                  : i < messageIndex
                  ? "w-1.5 bg-primary/40"
                  : "w-1.5 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* Subtle tip */}
        <p className="text-xs text-muted-foreground/60 mt-4">
          This usually takes 30-60 seconds. Please don't close this page.
        </p>
      </div>
    </div>
  );
}
