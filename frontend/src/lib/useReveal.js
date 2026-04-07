import { useEffect, useRef } from 'react';

/**
 * useReveal — Lightweight IntersectionObserver hook that adds the `.revealed`
 * class to child elements marked with `.reveal`.
 *
 * Usage:
 *   const containerRef = useReveal();
 *   <div ref={containerRef}>
 *     <div className="reveal">...</div>           // fires when visible
 *     <div className="reveal" data-reveal-delay="100">...</div>  // staggered
 *   </div>
 *
 * The `.reveal` base class (in index.css) sets `opacity: 0; transform: translateY(20px)`.
 * On intersection, `.revealed` transitions those to `opacity: 1; transform: none`.
 *
 * @param {object}  options
 * @param {number}  options.threshold  – visibility fraction (0–1, default 0.15)
 * @param {string}  options.rootMargin – observer margin
 * @param {boolean} options.once       – unobserve after first reveal (default true)
 */
export function useReveal({
  threshold = 0.15,
  rootMargin = '0px 0px -40px 0px',
  once = true,
} = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect prefers-reduced-motion
    const prefersReduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    const targets = container.querySelectorAll('.reveal');
    if (targets.length === 0 || prefersReduced) {
      // If reduced motion is preferred, reveal everything immediately
      targets.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            // Stagger delay support
            const delay = el.dataset.revealDelay;
            if (delay) {
              setTimeout(() => el.classList.add('revealed'), Number(delay));
            } else {
              el.classList.add('revealed');
            }
            if (once) observer.unobserve(el);
          }
        });
      },
      { threshold, rootMargin }
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return containerRef;
}

export default useReveal;
