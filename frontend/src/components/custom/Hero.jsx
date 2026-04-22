import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDynamicHeroImages } from "@/lib/imageService";

/**
 * Hero — fullscreen slideshow with scroll-driven scale-down effect.
 * Features:
 *  • Preloads images before showing (no blank black flashes)
 *  • Falls back to cinematic gradients if images fail to load
 *  • Text always has a matte overlay guarantee for readability
 *  • Scale-down creates a cinematic zoom-out into the next section
 */
const Hero = ({ onGetStarted, onLearnMore }) => {
  const [slides, setSlides] = useState([]); // [{type, value}]
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const heroRef = useRef(null);
  const sectionRef = useRef(null);

  // ── Load & preload images ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Show skeleton placeholders immediately while images load
    const placeholders = Array.from({ length: 4 }, (_, i) => ({
      type: "skeleton",
      value: `skeleton-${i}`,
    }));
    setSlides(placeholders);

    const loadSlides = async () => {
      const urls = getDynamicHeroImages(4);

      // Preload all images concurrently with a 5s timeout each
      const results = await Promise.allSettled(
        urls.map(
          (url) =>
            new Promise((resolve, reject) => {
              const img = new Image();
              const timer = setTimeout(() => {
                img.onload = img.onerror = null;
                reject(new Error("timeout"));
              }, 5000);
              img.onload = () => {
                clearTimeout(timer);
                resolve(url);
              };
              img.onerror = () => {
                clearTimeout(timer);
                reject(new Error("load failed"));
              };
              img.src = url;
            })
        )
      );

      if (cancelled) return;

      // Build slide list: use loaded images, keep skeletons for failures
      const loadedSlides = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          loadedSlides.push({ type: "image", value: result.value });
        } else {
          loadedSlides.push({ type: "skeleton", value: `skeleton-${i}` });
        }
      });

      setSlides(loadedSlides);
      setImagesReady(true);
    };

    loadSlides();

    return () => { cancelled = true; };
  }, []);

  // ── Auto-play slideshow ────────────────────────────────────
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // ── Scroll-driven scale effect ─────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const vh = window.innerHeight;
        const progress = Math.min(1, Math.max(0, window.scrollY / (vh * 0.85)));
        setScrollProgress(progress);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Computed transforms ────────────────────────────────────
  const transforms = useMemo(() => {
    const p = scrollProgress;
    return {
      scale: 1 - p * 0.18,
      radius: p * 32,
      contentOpacity: Math.max(0, 1 - p * 2.5),
      parallaxY: p * window.innerHeight * 0.15,
    };
  }, [scrollProgress]);

  // ── Touch swipe ────────────────────────────────────────────
  const touchStartX = useRef(0);
  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setCurrentSlide((prev) =>
        diff > 0
          ? (prev + 1) % slides.length
          : (prev - 1 + slides.length) % slides.length
      );
    }
  };

  if (slides.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full z-0"
      style={{ height: "100vh", scrollMarginTop: "calc(-1 * var(--app-header-offset))" }}
      aria-label="Hero Slideshow"
    >
      {/* Scaling container */}
      <div
        ref={heroRef}
        className="sticky top-0 w-full overflow-hidden will-change-transform"
        style={{
          height: "100vh",
          transform: `scale(${transforms.scale})`,
          borderRadius: `${transforms.radius}px`,
          transformOrigin: "center top",
          backgroundColor: "#0a0a0a",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Slides — images OR gradients */}
        {slides.map((slide, index) => (
          <div
            key={`slide-${index}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === currentSlide ? "opacity-100" : "opacity-0"
            )}
            style={
              slide.type === "image"
                ? {
                    transform: `translateY(${transforms.parallaxY}px) scale(1.08)`,
                    willChange: "transform",
                  }
                : {
                    backgroundColor: "#0a0a1a",
                  }
            }
            aria-hidden={index !== currentSlide}
          >
            {slide.type === "image" && (
              <img
                src={slide.value}
                alt=""
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  // If an image breaks after initial load, show dark bg
                  e.target.style.display = "none";
                  e.target.parentElement.style.backgroundColor = "#0a0a1a";
                }}
              />
            )}
            {slide.type === "skeleton" && (
              <div className="w-full h-full relative">
                <div className="absolute inset-0 bg-[#0a0a1a]" />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "skeleton-shimmer 2s ease-in-out infinite",
                  }}
                />
              </div>
            )}
          </div>
        ))}

        {/* ── Text readability overlay ──
             Multi-layered gradient ensures white text is ALWAYS readable
             regardless of the underlying image brightness ──────────── */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {/* Top gradient for navbar area */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
          {/* Bottom gradient for hero text */}
          <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          {/* Overall matte for text safety */}
          <div className="absolute inset-0 bg-black/25" />
        </div>

        {/* Content Overlay — fades out on scroll */}
        <div
          className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pt-20"
          style={{
            opacity: transforms.contentOpacity,
            transform: `translateY(${scrollProgress * -30}px)`,
            pointerEvents: transforms.contentOpacity < 0.3 ? "none" : "auto",
          }}
        >
          <div className="space-y-4 sm:space-y-6 max-w-4xl anim-slide-in">
            <div className="inline-flex items-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium text-white glass-dark shadow-sm mb-2">
              <span>✨ AI-Powered Travel Planning</span>
            </div>

            <h1
              className="text-fluid-hero font-bold leading-tight tracking-tight"
              style={{
                color: "#ffffff",
                textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              Plan Smarter. <br /> Travel Better.
            </h1>

            <p
              className="max-w-2xl mx-auto text-fluid-lg leading-relaxed font-medium"
              style={{
                color: "rgba(255,255,255,0.92)",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              AI-crafted itineraries, hotels and places tailored to your style
              and pace. Experience the future of travel.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 w-full justify-center items-center">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="h-11 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-full bg-white text-black hover:bg-white/90 shadow-lg hover:scale-105 transition-transform duration-200 w-full sm:w-auto"
              >
                Start Planning Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onLearnMore}
                className="h-11 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-full border border-white/25 text-white glass-dark hover:bg-white/10 hover:border-white/40 transition-all duration-200 w-full sm:w-auto"
              >
                Learn How It Works
              </Button>
            </div>
          </div>
        </div>

        {/* Pagination dots */}
        <div
          className="absolute bottom-6 sm:bottom-10 left-1/2 flex -translate-x-1/2 gap-2 sm:gap-3 z-20"
          style={{ opacity: transforms.contentOpacity }}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 shadow-sm",
                index === currentSlide
                  ? "w-8 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
