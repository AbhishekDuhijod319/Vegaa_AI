import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
  useRef,
} from "react";
import SmartImage from "@/components/ui/SmartImage";
import { useImageLuminance } from "@/lib/useImageLuminance";
import { Button } from "./components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useNavigate } from "react-router-dom";
import {
  getMonthlyFirstImageForQuery,
  getStableFirstImageForQuery,
} from "@/lib/pexels";

// Simple app-level context to share common state and actions across sections
const AppContext = React.createContext({
  hero: { bgUrl: "", isDarkTextSafe: null },
  images: { stableDestImages: {}, stableStepImages: {} },
  actions: {
    scrollToId: (_id) => {},
    onGetStarted: () => {},
    onLearnMore: () => {},
  },
});

// 1) Hero Section
function HeroSection() {
  const { hero, actions } = useContext(AppContext);
  const { bgUrl, isDarkTextSafe } = hero;
  const { onGetStarted, onLearnMore } = actions;

  const titleTextClass =
    isDarkTextSafe === null
      ? "text-foreground"
      : isDarkTextSafe
      ? "text-white"
      : "text-foreground";
  const descTextClass = isDarkTextSafe
    ? "text-white/85"
    : "text-muted-foreground";

  const overlayClass = `absolute inset-0 ${
    isDarkTextSafe === null
      ? "bg-black/30"
      : isDarkTextSafe
      ? "bg-black/20"
      : "bg-black/50"
  }`;

  return (
    <section
      id="hero"
      data-section
      className="relative scroll-mt-24 min-h-[100svh] grid md:grid-cols-2 [content-visibility:auto] [contain-intrinsic-size:1px_1000px]"
      aria-label="Hero"
      style={{
        backgroundImage: bgUrl ? `url('${bgUrl}')` : "none",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {bgUrl && <div className={overlayClass} aria-hidden />}

      {/* Left: Heading + description */}
      <div className="relative flex flex-col justify-center px-6 md:px-8 lg:px-16 gap-4 mx-auto w-full max-w-3xl">
        <h1
          className={`font-bold text-white leading-tight drop-shadow-md text-4xl sm:text-5xl md:text-6xl ${titleTextClass}`}
        >
          Plan smarter trips in minutes
        </h1>
        <p className={`max-w-xl text-base sm:text-lg text-white ${descTextClass}`}>
          Describe your trip goals, budget, and companions. Get a personalized
          itinerary with curated places to visit, hotels to stay, and
          experiences to enjoy.
        </p>
        <a
          href="https://www.pexels.com/photo/maldives-island-1450340/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-white/80 hover:text-white underline underline-offset-2 mt-2"
        >
          Photo by Asad Photo Maldives from Pexels
        </a>
      </div>

      {/* Right: CTA card */}
      <div className="relative flex items-center justify-center mx-auto w-full max-w-md">
        <div className="rounded-2xl p-6 md:p-8 shadow-lg w-[90%] md:w-[80%] max-w-sm bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div className="space-y-4">
            <Button
              className="w-full font-bold"
              size="lg"
              onClick={onGetStarted}
            >
              Get Started
            </Button>
            <Button
              className="w-full font-bold"
              size="lg"
              variant="outline"
              onClick={onLearnMore}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// 2) Popular Destinations
function DestinationsSection({ destinations }) {
  const { images, actions } = useContext(AppContext);
  const { stableDestImages } = images;
  const trackRef = useRef(null);
  const rafId = useRef(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const updateActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.children;
    if (!slides || !slides.length) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < slides.length; i++) {
      const el = slides[i];
      const elCenter = el.offsetLeft - track.offsetLeft + el.clientWidth / 2;
      const dist = Math.abs(elCenter - center);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    setCurrentIdx(closestIdx);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      updateActive();
    });
  }, [updateActive]);

  const goTo = useCallback((idx) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.children;
    if (!slides || !slides.length) return;
    const clamped = Math.max(0, Math.min(idx, slides.length - 1));
    const el = slides[clamped];
    const left = el.offsetLeft - track.offsetLeft;
    track.scrollTo({ left, behavior: "smooth" });
    setCurrentIdx(clamped);
  }, []);

  const prev = useCallback(() => {
    goTo(currentIdx - 1);
  }, [goTo, currentIdx]);
  const next = useCallback(() => {
    goTo(currentIdx + 1);
  }, [goTo, currentIdx]);

  useEffect(() => {
    if (!autoplay || isPaused) return;
    const id = setInterval(() => {
      next();
    }, 5000);
    return () => clearInterval(id);
  }, [autoplay, isPaused, next]);

  return (
    <section
      id="destinations"
      data-section
      className="min-h-[100svh] flex flex-col items-center [contain-intrinsic-size:1px_1000px]"
      aria-label="Popular Destinations"
      style={{
        // Align start using dynamic header offset and add bottom margin so pagination remains visible
        scrollMarginTop: "var(--app-header-offset)",
        scrollMarginBottom: "max(16px, calc(var(--app-header-offset) / 2))",
      }}
    >
      <div className="px-6 md:px-8 lg:px-16 py-8 sm:py-9 md:py-10 lg:py-12 max-w-8xl mx-auto w-full">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Popular Destinations to Visit
            </h2>
            <p className="text-muted-foreground mt-1">
              Popular places across the globe to visit
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 px-6 md:px-8 lg:px-16 pb-8 sm:pb-10 md:pb-12 max-w-8xl mx-auto w-full">
        <div className="relative">
          <button
            aria-label="Previous"
            onClick={prev}
            className="md:hidden absolute left-1 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card/80 bg-white hover:bg-muted transition-colors disabled:opacity-40"
            disabled={currentIdx === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next"
            onClick={next}
            className="md:hidden absolute right-1 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card/80 bg-white hover:bg-muted transition-colors disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={trackRef}
            id="destinations-carousel"
            className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth py-2"
            role="listbox"
            aria-label="Popular destinations carousel"
            tabIndex={0}
            onScroll={handleScroll}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                prev();
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                next();
              }
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {destinations.map((d, i) => (
              <article
                key={d.id}
                className="group relative rounded-2xl overflow-hidden border bg-card aspect-[3/4] snap-center shadow-sm"
                role="option"
                aria-selected={i === currentIdx}
              >
                <SmartImage
                  query={d.title || d.city || "travel destination"}
                  alt={d.city}
                  className="absolute inset-0 w-full h-full object-cover"
                  pexelsFallback={true}
                  width={1200}
                  height={1600}
                  sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  fetchpriority={i === currentIdx ? "high" : "low"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col">
                  <span className="inline-flex items-center rounded-lg px-3 py-1 text-[13px] font-medium text-white/95 bg-white/20 backdrop-blur-sm">
                    {d.city}
                  </span>
                  <h3 className="mt-auto text-white text-base sm:text-lg font-semibold leading-snug drop-shadow-md">
                    {d.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>

          <div
            className="flex justify-center mt-4 no-scrollbar"
            aria-label="Carousel pagination"
          >
            <div className="inline-flex items-center gap-2">
              {destinations.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === currentIdx ? "true" : undefined}
                  onClick={() => goTo(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    i === currentIdx ? "bg-foreground w-6" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 3) How It Works
function HowItWorksSections({ steps }) {
  const { images } = useContext(AppContext);
  const { stableStepImages } = images;
  return (
    <>
      {steps.map((s) => (
        <section
          key={s.id}
          id={s.id}
          data-section
          className="scroll-mt-24 min-h-[100svh] [content-visibility:auto] [contain-intrinsic-size:1px_1000px]"
          aria-label={`How it works - ${s.title}`}
        >
          <div className="h-full grid md:grid-cols-2 items-center gap-6 px-6 md:px-16 py-8 sm:py-9 md:py-10 lg:py-12 mt-24">
            <div className="max-w-xl">
              <h3 className="text-2xl md:text-3xl font-semibold mb-3">
                {s.title}
              </h3>
              <p className="text-muted-foreground">{s.desc}</p>
            </div>
            <div className="w-full">
              <div className="relative rounded-2xl overflow-hidden border bg-card shadow-sm">
                <div className="w-full h-[50vh] md:h-[60vh]">
                  <SmartImage
                    query={s.query || s.title}
                    alt={s.title}
                    className="w-full h-full object-cover"
                    pexelsFallback={true}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    width={1200}
                    height={800}
                    fetchpriority="low"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

// 4) FAQ Section
function FaqSection() {
  const { faq } = useContext(AppContext);
  const { faqs, newQuestion, setNewQuestion, onSubmitQuestion } = faq;
  return (
    <section
      id="faq"
      data-section
      className="scroll-mt-24 min-h-[100svh] flex flex-col [content-visibility:auto] [contain-intrinsic-size:1px_1000px]"
      aria-label="FAQ"
    >
      <div className="px-6 md:px-8 lg:px-16 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 max-w-8xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground mt-1">
          Find quick answers or ask a new question.
        </p>
      </div>
      <div className="px-6 md:px-8 lg:px-16 mt-6 grid md:grid-cols-5 gap-6 flex-1 max-w-8xl mx-auto w-full">
        <div className="md:col-span-3 pr-1">
          <div className="space-y-3">
            {faqs.map((item, idx) => (
              <details key={idx} className="rounded-xl border bg-card p-4">
                <summary className="font-medium cursor-pointer select-none">
                  {item.q}
                </summary>
                <p className="text-muted-foreground mt-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <form
            onSubmit={onSubmitQuestion}
            className="rounded-xl border bg-card p-4 space-y-3"
          >
            <label htmlFor="newQuestion" className="font-medium">
              Ask a question
            </label>
            <textarea
              id="newQuestion"
              className="w-full min-h-24 rounded-md border bg-background p-3 text-base md:text-sm"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Type your question here"
            />
            <div className="flex justify-end">
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

// ---------- Main App ----------
export default function App() {
  // Navigation actions
  const navigate = useNavigate();
  const onGetStarted = useCallback(() => {
    navigate("/create-trip");
  }, [navigate]);

  // Smooth programmatic navigation
  const scrollToId = useCallback((id) => {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      const root = document.documentElement;
      const offsetVar = getComputedStyle(root)
        .getPropertyValue("--app-header-offset")
        .trim();
      const headerOffset = parseInt(offsetVar || "0", 10) || 0;
      const rect = el.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const targetTop = Math.max(0, absoluteTop - headerOffset);
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    } catch (e) {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);
  const onLearnMore = useCallback(() => {
    scrollToId("how1");
  }, [scrollToId]);

  // Content data
  const destinations = useMemo(
    () => [
      {
        id: "paris",
        city: "Paris, France",
        title: "Explore the City of Lights – Eiffel Tower, Louvre & more",
      },
      {
        id: "nyc",
        city: "New York, USA",
        title: "Experience NYC – Times Square, Central Park, Broadway",
      },
      {
        id: "tokyo",
        city: "Tokyo, Japan",
        title: "Discover Tokyo – Shibuya, Cherry Blossoms, Temples",
      },
      {
        id: "rome",
        city: "Rome, Italy",
        title: "Walk through History – Colosseum, Vatican, Roman Forum",
      },
      {
        id: "bali",
        city: "Bali, Indonesia",
        title: "Relax in Paradise – Beaches, Temples, Rice Terraces",
      },
      {
        id: "london",
        city: "London, UK",
        title: "Iconic London – Big Ben, Tower Bridge, Museums",
      },
      {
        id: "sydney",
        city: "Sydney, Australia",
        title: "Harbour City – Opera House, Bondi Beach",
      },
      {
        id: "barcelona",
        city: "Barcelona, Spain",
        title: "Gaudí’s Masterpieces – Sagrada Família, Park Güell",
      },
      {
        id: "cape",
        city: "Cape Town, South Africa",
        title: "Table Mountain, Waterfront & Winelands",
      },
      {
        id: "dubai",
        city: "Dubai, UAE",
        title: "Skyscrapers & Souks – Burj Khalifa, Desert Safari",
      },
    ],
    []
  );

  const steps = useMemo(
    () => [
      {
        id: "how1",
        title: "Tell us about your trip",
        desc: "Pick a destination, set your dates and budget.",
        query: "trip planning",
      },
      {
        id: "how2",
        title: "We craft your itinerary",
        desc: "We combine data and AI to build a plan tailored to you.",
        query: "itinerary planning",
      },
      {
        id: "how3",
        title: "Edit and share",
        desc: "Change anything you like and share with friends.",
        query: "friends travel",
      },
    ],
    []
  );

  // FAQ state
  const [faqs, setFaqs] = useState([
    {
      q: "How does itinerary generation work?",
      a: "We combine your preferences with popular travel data to build day-by-day suggestions.",
    },
    {
      q: "Can I edit the plan after it's generated?",
      a: "Absolutely. You can adjust places, activities, and day order to fit your needs.",
    },
    {
      q: "Do you support different themes?",
      a: "We currently use a clean light theme for optimal readability.",
    },
    {
      q: "Is there a cost to use the app?",
      a: "You can start for free; premium features may be introduced later.",
    },
  ]);
  const [newQuestion, setNewQuestion] = useState("");
  const onSubmitQuestion = useCallback(
    (e) => {
      e.preventDefault();
      const text = newQuestion.trim();
      if (!text) return;
      setFaqs((prev) => [
        { q: text, a: "Thanks! We'll answer shortly." },
        ...prev,
      ]);
      setNewQuestion("");
    },
    [newQuestion]
  );

  // Hero background via Pexels monthly rotation + luminance-based text contrast
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const { isDark: heroIsDark } = useImageLuminance(heroBgUrl);
  useEffect(() => {
    let cancelled = false;
    const loadMonthly = async () => {
      try {
        const set = await getMonthlyFirstImageForQuery(
          "travel destination landscape"
        );
        if (!cancelled) setHeroBgUrl(set.src);
      } catch {
        if (!cancelled) setHeroBgUrl("/hero/hero-3.jpg");
      }
    };
    loadMonthly();
    let lastMonth = new Date().getMonth();
    const interval = setInterval(() => {
      const m = new Date().getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        loadMonthly();
      }
    }, 1000 * 60 * 60 * 12);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Stable Pexels images for consistent home cards
  const [stableDestImages, setStableDestImages] = useState({});
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const entries = await Promise.all(
          destinations.map(async (d) => {
            try {
              const set = await getStableFirstImageForQuery(d.title || d.city);
              return [d.id, set.src];
            } catch {
              return [d.id, undefined];
            }
          })
        );
        if (!ignore) setStableDestImages(Object.fromEntries(entries));
      } catch (err) {
        console.error("Failed to load destination images", err);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [destinations]);

  const [stableStepImages, setStableStepImages] = useState({});
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const entries = await Promise.all(
          steps.map(async (s) => {
            try {
              const set = await getStableFirstImageForQuery(s.query || s.title);
              return [s.id, set.src];
            } catch {
              return [s.id, undefined];
            }
          })
        );
        if (!ignore) setStableStepImages(Object.fromEntries(entries));
      } catch (err) {
        console.error("Failed to load step images", err);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [steps]);

  // Provide app-level state via context
  const contextValue = useMemo(
    () => ({
      hero: { bgUrl: heroBgUrl, isDarkTextSafe: heroIsDark },
      images: { stableDestImages, stableStepImages },
      actions: { scrollToId, onGetStarted, onLearnMore },
      faq: { faqs, newQuestion, setNewQuestion, onSubmitQuestion },
    }),
    [
      heroBgUrl,
      heroIsDark,
      stableDestImages,
      stableStepImages,
      scrollToId,
      onGetStarted,
      onLearnMore,
      faqs,
      newQuestion,
      onSubmitQuestion,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      <main>
        <HeroSection />
        <DestinationsSection destinations={destinations} />
        <HowItWorksSections steps={steps} />
        <FaqSection />
      </main>
    </AppContext.Provider>
  );
}
