import React from "react";

/**
 * LoadingSpinner — themed animated spinner matching the app design.
 * Supports multiple sizes and an optional label.
 *
 * @param {"sm"|"md"|"lg"|"xl"} size — spinner size preset
 * @param {string} label — optional text below spinner
 * @param {string} className — extra container classes
 */
const SIZES = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-[3px]",
  lg: "w-12 h-12 border-4",
  xl: "w-16 h-16 border-4",
};

export default function LoadingSpinner({ size = "md", label, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className={`${SIZES[size]} rounded-full border-primary/10 absolute inset-0 animate-ping`}
          style={{ animationDuration: "2s" }}
        />
        {/* Main spinner */}
        <div
          className={`${SIZES[size]} rounded-full border-primary/20 border-t-primary animate-spin`}
          style={{ animationDuration: "0.8s" }}
        />
      </div>
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}
