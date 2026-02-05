import React, {
  useLayoutEffect,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
  useRef,
} from "react";
import SmartImage from "@/components/ui/SmartImage";
import { useImageLuminance } from "@/lib/useImageLuminance";
import Hero from "@/components/custom/Hero";
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
    scrollToId: (_id) => { },
    onGetStarted: () => { },
    onLearnMore: () => { },
  },
});



// 2) Popular Destinations
function DestinationsSection({ destinations }) {
  const { images } = useContext(AppContext);
  const trackRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Triple the items for continuous loop (Buffer -> Main -> Buffer)
  const items = useMemo(() => [...destinations, ...destinations, ...destinations], [destinations]);

  // Handle initialization and infinite loop
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // 1. Initial Position: Scroll to the middle set immediately
    // We need to wait for layout paint slightly or assume items are rendered.
    // Since items are data-driven, let's assume they are there.
    // Calculate width of one set.
    // We can measure the first child * number of destinations roughly, or just measure offset of item[N].

    const initScroll = () => {
      if (track.children.length > destinations.length) {
        const itemWidth = track.children[0].getBoundingClientRect().width;
        const gap = 24; // 1.5rem = 24px (from gap-6)
        // Calculate width of one entire set including gaps
        // Actually, simpler: finding the offsetLeft of the (destinations.length)-th item
        const singleSetWidth = track.children[destinations.length].offsetLeft - track.children[0].offsetLeft;

        // Scroll to start of 2nd set
        track.scrollLeft = singleSetWidth;
        return true;
      }
      return false;
    };

    // Try immediately
    if (!initScroll()) {
      // Retry shortly if images/layout pending? 
      // For now, assume it works or effect re-runs.
    }
  }, [destinations]);

  // Autoscroll & Loop Animation
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId;
    let lastTime = performance.now();
    const speed = 30; // px/s

    const animate = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      // 1. Auto-scroll
      if (!isPaused) {
        track.scrollLeft += (speed * delta) / 1000;
      }

      // 2. Loop Logic (Bidirectional)
      if (track.children.length >= destinations.length * 3) {
        const firstItem = track.children[0];
        const setLength = destinations.length;

        // Start of Set 2
        const set2Start = track.children[setLength].offsetLeft;
        // Start of Set 3
        const set3Start = track.children[setLength * 2].offsetLeft;

        // Period is the width of one set
        const period = set2Start - firstItem.offsetLeft;

        // If we've scrolled past the end of Set 2 (into Set 3), jump back to Set 2
        // Actually, if we are in Set 3, we can subtract period to be in Set 2.
        if (track.scrollLeft >= set3Start) {
          track.scrollLeft -= period;
        }
        // If we've scrolled back into Set 1, jump forward to Set 2
        else if (track.scrollLeft <= 0) { // Or simpler: if (track.scrollLeft < set2Start - period) ...
          // Ideally we want to keep it in the "middle" range.
          // If < set2Start - some_buffer? 
          // Simplest: if (track.scrollLeft <= 0) scrollLeft += period is for 0-based.
          // We started at set2Start.
          // If we go left and hit 0 (start of Set 1), we look like start of Set 2.
          track.scrollLeft += period;
        }
        // Refined backward check: if we are comfortably inside Set 1, jump to Set 2.
        // Let's say if scrollLeft < (period / 2)? No, we want seamless.
        // Set 1 is identical to Set 2.
        // If scrollLeft < set2Start, we are in Set 1.
        // We want to allow user to scroll left into Set 1, but when they reach the *start* of Set 1 (0), we jump to start of Set 2.
        // Wait, strictly:
        // Visual content at Scroll=0 (Start Set 1) is same as Scroll=period (Start Set 2).
        // So if Scroll <= 0, Scroll = period.
      }

      // 3. Scale/Opacity based on distance to center
      const center = track.scrollLeft + track.clientWidth / 2;
      const children = track.children;
      let closestDist = Infinity;
      let closestIndex = 0;

      for (let i = 0; i < children.length; i++) {
        const wrapper = children[i];
        // Wrapper center relative to track visible area?
        // offsetLeft is relative to track content start.
        // We want distance from 'center' (which is in content coordinates).
        const wrapperCenter = wrapper.offsetLeft + wrapper.clientWidth / 2;
        const dist = Math.abs(wrapperCenter - center);

        // Scale calculation
        // Viewport width
        const viewW = track.clientWidth;
        // Scale 1.0 at center, drops to 0.9 at edges
        const scale = Math.max(0.9, 1 - (dist / viewW) * 0.3);
        const opacity = Math.max(0.6, 1 - (dist / viewW) * 0.6);

        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.opacity = opacity;

        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      }

      // Update active index for progress bar (Map large index back to 0..length-1)
      const realIndex = closestIndex % destinations.length;
      setCurrentIdx(prev => prev !== realIndex ? realIndex : prev);

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, destinations.length]);

  // Tilt Handlers
  const handleMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max 15 degrees
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    // Apply transform with perspective
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, []);

  const handleMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  }, []);

  // Manual Navigation Helpers
  const scrollBy = (amount) => {
    if (trackRef.current) {
      trackRef.current.scrollLeft += amount;
    }
  };

  return (
    <section
      id="destinations"
      data-section
      className="h-[100svh] flex flex-col justify-start pt-20 md:pt-24 pb-2 bg-gradient-to-b from-background via-secondary/20 to-background overflow-hidden snap-start snap-always"
      aria-label="Popular Destinations"
      style={{ scrollMarginTop: "var(--app-header-offset)" }}
    >
      <div className="container px-6 mx-auto flex-none mb-2 md:mb-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            {/* <span className="text-primary font-semibold tracking-wide uppercase text-xs md:text-sm bg-primary/10 px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
              Inspiration for your next trip
            </span> */}
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Popular Destinations
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
              Discover the most breathtaking places across the globe, curated just for you.
            </p>
          </div>

          {/* Controls */}
          <div
            className="hidden md:flex items-center gap-3"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <button
              aria-label="Previous destination"
              onClick={() => scrollBy(-300)}
              className="h-12 w-12 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-ios-subtle flex items-center justify-center hover:scale-105 transition-all active:scale-95 text-foreground"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              aria-label="Next destination"
              onClick={() => scrollBy(300)}
              className="h-12 w-12 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-ios-subtle flex items-center justify-center hover:scale-105 transition-all active:scale-95 text-foreground"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-width Carousel */}
      <div className="w-full relative group flex-1 min-h-0 flex flex-col justify-center">
        <div
          ref={trackRef}
          id="destinations-carousel"
          className="flex overflow-x-auto gap-4 md:gap-6 px-[5vw] md:px-[10vw] no-scrollbar py-2 md:py-4 will-change-transform items-center h-full"
          role="listbox"
          aria-label="Popular destinations carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {items.map((d, i) => (
            <div
              key={`${d.id}-${i}`}
              // Adjusted to height-based sizing to fit viewport
              className="relative flex-shrink-0 h-[85%] w-auto aspect-[3/4] transition-all duration-300 ease-out will-change-transform"
            >
              <article
                className="w-full h-full rounded-3xl overflow-hidden cursor-pointer shadow-2xl transition-transform duration-100 ease-out will-change-transform relative"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="absolute inset-0 bg-muted animate-pulse" />

                <SmartImage
                  query={d.title || d.city || "travel destination"}
                  alt={d.city}
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  draggable="false"
                  pexelsFallback={true}
                  width={800}
                  height={1200}
                  sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 85vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 pointer-events-none" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white pointer-events-none">
                  <div className="mb-3">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/10">
                      {d.city}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-2 drop-shadow-lg">
                    {d.title}
                  </h3>
                  <p className="text-white/80 text-sm line-clamp-2 mb-4">
                    Discover the best spots, hidden gems, and local favorites in {d.city}.
                  </p>
                  {/* Explore Guide Button REMOVED */}
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar (Mobile) */}
      <div className="md:hidden flex justify-center px-6 mt-4">
        <div className="h-1 bg-muted rounded-full w-full max-w-[200px] overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((currentIdx + 1) / destinations.length) * 100}%` }}
          />
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
          className="min-h-[100svh] flex flex-col justify-center pt-28 md:pt-32 pb-16 [content-visibility:auto] [contain-intrinsic-size:1px_1000px] snap-start snap-always"
          style={{ scrollMarginTop: "var(--app-header-offset)" }}
          aria-label={`How it works - ${s.title}`}
        >
          <div className="h-full grid md:grid-cols-2 items-center gap-6 px-6 md:px-16">
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

// 4) FAQ Section (Redesigned iOS Style)
import { Search, Plus, Minus } from "lucide-react";

function FaqSection() {
  const { faq } = useContext(AppContext);
  const { faqs, newQuestion, setNewQuestion, onSubmitQuestion } = faq;
  const [searchTerm, setSearchTerm] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  // Group FAQs for iOS "Grouped List" feel
  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section
      id="faq"
      data-section
      className="min-h-[100svh] flex flex-col justify-center pt-28 md:pt-32 pb-24 bg-[#F2F2F7] dark:bg-black font-sans snap-start snap-always"
      style={{ scrollMarginTop: "var(--app-header-offset)" }}
      aria-label="FAQ"
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Find answers to common questions about Vegaa AI.
          </p>
        </div>

        {/* iOS Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white dark:bg-[#1C1C1E] text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* iOS Grouped List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
              {filteredFaqs.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={idx} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[17px] font-semibold text-foreground pr-4">
                        {item.q}
                      </span>
                      <span className={`text-primary transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
                        <Plus className="h-5 w-5" />
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="p-5 pt-0 text-[16px] text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No results found.
            </div>
          )}
        </div>

        {/* "Ask a Question" Card */}
        <div className="mt-8 bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Have more questions?</h3>
          <form onSubmit={onSubmitQuestion} className="space-y-4">
            <textarea
              className="w-full min-h-[100px] p-4 rounded-xl bg-[#F2F2F7] dark:bg-black border-none text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
              placeholder="Type your question here..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" className="rounded-full px-6 font-semibold">
                Submit Question
              </Button>
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
      <main className="w-full">
        <Hero onGetStarted={onGetStarted} onLearnMore={onLearnMore} />
        <DestinationsSection destinations={destinations} />
        <HowItWorksSections steps={steps} />
        <FaqSection />
      </main>
    </AppContext.Provider>
  );
}
