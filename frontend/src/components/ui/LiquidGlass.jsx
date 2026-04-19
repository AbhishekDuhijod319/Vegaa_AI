import React from 'react';
import { cn } from '@/lib/utils';

/**
 * GlassCard — Reusable glassmorphism card component.
 * Uses CSS backdrop-filter (no SVG dependency).
 *
 * @param {'default'|'subtle'|'strong'|'dark'|'nav'|'card'} variant
 */
export function GlassCard({
  variant = 'card',
  className,
  children,
  as: Component = 'div',
  ...props
}) {
  const variantClass = {
    default: 'glass',
    subtle:  'glass-subtle',
    strong:  'glass-strong',
    dark:    'glass-dark',
    nav:     'glass-nav',
    card:    'glass-card',
  }[variant] || 'glass-card';

  return (
    <Component className={cn(variantClass, className)} {...props}>
      {children}
    </Component>
  );
}

/**
 * LiquidGlassPanel — Legacy alias for GlassCard.
 * Kept for backward compatibility. Prefer GlassCard in new code.
 */
export function LiquidGlassPanel({
  variant = 'default',
  className,
  children,
  as: Component = 'div',
  ...props
}) {
  return (
    <GlassCard variant={variant} className={className} as={Component} {...props}>
      {children}
    </GlassCard>
  );
}

/**
 * LiquidGlassFilter — Deprecated. Kept as empty component for backward compat.
 * The SVG filter is no longer needed; glass is implemented via CSS backdrop-filter.
 */
export function LiquidGlassFilter() {
  return null;
}

export default LiquidGlassFilter;
