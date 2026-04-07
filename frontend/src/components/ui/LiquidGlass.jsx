import React from 'react';
import { cn } from '@/lib/utils';

/**
 * LiquidGlassFilter — Renders a hidden SVG that defines the frosted-glass
 * filter used by all `.liquid-glass` elements.  Mount once near the app root.
 *
 * Inspired by iOS 26 Liquid Glass:
 *   feGaussianBlur  → frosted refraction
 *   feColorMatrix   → saturation boost (colors bleed through vividly)
 *   feComponentTransfer → slight brightness lift
 */
export function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Standard frosted glass */}
        <filter id="frosted" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            type="saturate"
            values="1.8"
            result="saturated"
          />
          <feComponentTransfer in="saturated" result="bright">
            <feFuncR type="linear" slope="1.1" intercept="0.05" />
            <feFuncG type="linear" slope="1.1" intercept="0.05" />
            <feFuncB type="linear" slope="1.1" intercept="0.05" />
          </feComponentTransfer>
          <feComposite in="bright" in2="SourceGraphic" operator="over" />
        </filter>

        {/* Lighter variant for small chips / pills */}
        <filter id="frosted-light" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" type="saturate" values="1.4" result="sat" />
          <feComposite in="sat" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * LiquidGlassPanel — Reusable wrapper that applies the liquid glass effect.
 *
 * @param {'default'|'subtle'|'strong'|'dark'} variant
 * @param {string} className  — additional classes
 * @param {React.ReactNode} children
 */
export function LiquidGlassPanel({
  variant = 'default',
  className,
  children,
  as: Component = 'div',
  ...props
}) {
  const variantClass = {
    default: 'liquid-glass',
    subtle: 'liquid-glass-subtle',
    strong: 'liquid-glass-strong',
    dark: 'liquid-glass-dark',
  }[variant] || 'liquid-glass';

  return (
    <Component className={cn(variantClass, className)} {...props}>
      {children}
    </Component>
  );
}

export default LiquidGlassFilter;
