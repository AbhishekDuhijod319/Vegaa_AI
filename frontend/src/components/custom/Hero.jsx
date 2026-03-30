import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDynamicHeroImages } from "@/lib/imageService";

const Hero = ({ onGetStarted, onLearnMore }) => {
  const [heroImages, setHeroImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  // Initialize dynamic images
  useEffect(() => {
    const images = getDynamicHeroImages();
    setHeroImages(images);
  }, []);

  // Force recalculate hero dimensions on load/resize to prevent layout shifts
  useEffect(() => {
    const adjustHeroHeight = () => {
      if (heroRef.current) {
        const vh = window.innerHeight;
        heroRef.current.style.height = `${vh}px`;

        // Debugging logs
        console.log(`[Hero] Height adjusted to: ${vh}px`);
        console.log(`[Hero] Window Dimensions: ${window.innerWidth}x${window.innerHeight}`);
      }
    };

    // Run immediately
    adjustHeroHeight();

    // Run on load to handle asset loading
    const handleLoad = () => {
      console.log("[Hero] Window load event fired");
      adjustHeroHeight();
      // Double check after a short delay for any reflows
      setTimeout(adjustHeroHeight, 100);
    };

    window.addEventListener("load", handleLoad);
    window.addEventListener("resize", adjustHeroHeight);

    // Cleanup
    return () => {
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("resize", adjustHeroHeight);
    };
  }, []);

  // Auto-play
  useEffect(() => {
    if (heroImages.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroImages]);

  // Preload next image logic handled by browser via the hidden img tags in the map, 
  // but we can ensure they are fetched by rendering them.

  // Parallax Effect
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Touch handlers for Swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe Left -> Next
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      } else {
        // Swipe Right -> Prev
        setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
      }
    }
  };

  if (heroImages.length === 0) return null; // or a loading skeleton

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative w-full overflow-hidden bg-black z-0 snap-start snap-always"
      style={{ height: "100vh", scrollMarginTop: "calc(-1 * var(--app-header-offset))" }} // Default fallback
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Slideshow"
    >
      {/* Background Slideshow */}
      {heroImages.map((src, index) => (
        <div
          key={src}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-transform",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
          style={{
            transform: `translateY(${scrollY * 0.3}px) scale(1.05)`,
            zIndex: 0
          }}
          aria-hidden={index !== currentSlide}
        >
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
          {/* Gradients for iOS feel & text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pt-20">
        <div className="space-y-6 max-w-4xl animate-slide-in-from-bottom-8">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md shadow-sm mb-2">
            <span>✨ AI-Powered Travel Planning</span>
          </div>

          <h1 className="font-bold text-white leading-tight drop-shadow-lg text-4xl sm:text-6xl md:text-7xl tracking-tight">
            Plan Smarter. <br /> Travel Better.
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/90 leading-relaxed font-medium drop-shadow-md">
            AI-crafted itineraries, hotels and places tailored to your style and pace. Experience the future of travel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center items-center">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="h-14 px-8 text-lg font-semibold rounded-full bg-white text-black hover:bg-white/90 shadow-lg hover:scale-105 transition-transform duration-200 w-full sm:w-auto"
            >
              Start Planning Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLearnMore}
              className="h-14 px-8 text-lg font-semibold rounded-full border-2 border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:border-white/50 transition-all duration-200 w-full sm:w-auto"
            >
              Learn How It Works
            </Button>
          </div>
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-3 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 shadow-sm backdrop-blur-sm",
              index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
