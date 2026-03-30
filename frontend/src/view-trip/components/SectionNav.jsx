import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Left-side section navigation with scrollspy and smooth scroll
 * Props:
 * - sections: Array<{ id: string, label: string }>
 */
export default function SectionNav({ sections = [] }) {
  const [active, setActive] = useState(sections?.[0]?.id || null);
  const observerRef = useRef(null);

  const ids = useMemo(() => sections.map((s) => s.id), [sections]);

  useEffect(() => {
    if (!ids.length) return;
    const options = { root: null, rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] };
    const cb = (entries) => {
      const vis = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const top = vis[0]?.target?.id;
      if (top) setActive(top);
    };
    const obs = new IntersectionObserver(cb, options);
    observerRef.current = obs;
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => {
      try { obs.disconnect(); } catch {}
      observerRef.current = null;
    };
  }, [ids]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Compute precise offset to stop exactly beneath the fixed header
    try {
      const root = document.documentElement;
      const offsetVar = getComputedStyle(root).getPropertyValue('--app-header-offset').trim();
      const headerOffset = parseInt(offsetVar || '0', 10) || 0;
      const rect = el.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const targetTop = Math.max(0, absoluteTop - headerOffset);
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    } catch {
      // Fallback to native smooth scroll if computation fails
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActive(id);
  };

  return (
    <aside
      className="hidden lg:block sticky top-24 self-start w-56 pr-3"
      aria-label="Section navigation"
    >
      <nav className="px-1 py-1 rounded-md mt-28">
        <ul className="space-y-1">
          {sections.map((s) => {
            const isActive = active === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-full transition-colors text-sm flex items-center gap-2 ${
                    isActive
                      ? "bg-foreground/5 border border-accent text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full}`}
                    aria-hidden="true"
                  />
                  <span className="inline-block align-middle">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}