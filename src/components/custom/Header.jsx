// imports (add icon import)
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { cn } from "@/lib/utils";
import Brand from "./header/Brand";
import Nav from "./header/Nav";
import UserMenu from "./header/UserMenu";
import { Menu } from "lucide-react";

/**
 * App header with logo, simple nav links, and user menu.
 * - When signed out: shows Sign In (Google).
 * - When signed in: shows avatar; hover to reveal menu (My Trips, Subscription, Logout).
 */
const Header = () => {
  const navigate = useNavigate();

  // Keep a local copy of the user for reactive UI
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    // Sync when other parts of the app update localStorage
    const onStorage = (e) => {
      if (e.key === "user") {
        try {
          setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setCurrentUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Start Google OAuth login
  const login = useGoogleLogin({
    onSuccess: async (tokenInfo) => {
      try {
        const profile = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenInfo.access_token}` },
          }
        ).then((r) => r.json());

        const sanitized = {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          sub: profile.sub,
        };

        localStorage.setItem("user", JSON.stringify(sanitized));
        setCurrentUser(sanitized);

        // Redirect to create-trip after successful sign-in
        navigate("/create-trip");
      } catch (err) {
        console.error("Failed to fetch Google profile", err);
      }
    },
    onError: (error) => {
      console.error("Google login error:", error);
    },
    flow: "implicit",
  });

  // Removed unused userInitial that caused useMemo error

  const onLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/");
  };
  
  // Mobile menu open state
  const [menuOpen, setMenuOpen] = useState(false);

  // Smoothly scroll to sections from any route; closes menu on navigation
  const goTo = (id) => {
    const scrollToId = () => {
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
      } catch {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(scrollToId, 50);
    } else {
      scrollToId();
    }
    setMenuOpen(false);
  };

  return (
    <div
      className={cn(
        // Overlay wrapper: fixed, centered, high z-index
        "fixed inset-x-0 z-50 top-[clamp(0.25rem,0.5vw,0.75rem)]",
        // Let clicks pass only to the inner header (prevents layout issues at edges)
        "pointer-events-none"
      )}
      style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div
        className={cn(
          "max-w-7xl w-full mx-auto",
          // Spacing and layout
          "px-[clamp(0.75rem,1rem+1vw,2rem)] py-[clamp(0.5rem,0.75rem+0.5vw,1rem)]",
          "flex items-center justify-between",
          "gap-[clamp(0.5rem,0.6rem+0.8vw,1.25rem)]",
          // Visual style: pill, subtle border/shadow, semi-transparent
          "rounded-[clamp(0.75rem,1.5vw,1.25rem)] border bg-background shadow-lg",
          // Enable interactions on the header, while wrapper remains non-interactive
          "pointer-events-auto"
        )}
      >
        {/* Left: Brand only */}
        <div className="flex items-center">
          <Brand />
        </div>
        {/* Center: Nav (desktop only, lg and up) */}
        <Nav currentUser={currentUser} />
        {/* Right: Theme + Auth + Mobile menu (hamburger on sm/md) */}
        <div className="flex items-center gap-[clamp(0.5rem,0.6rem+0.8vw,1.25rem)]">
          {/* Theme toggle removed for light-only */}
          {!currentUser ? (
            <Button
              className="transition-colors hidden lg:inline-flex text-[clamp(0.9rem,0.85rem+0.25vw,1rem)] px-[clamp(0.6rem,0.5rem+0.7vw,1.2rem)] py-[clamp(0.4rem,0.3rem+0.5vw,0.65rem)]"
              onClick={() => login()}
            >
              Sign In
            </Button>
          ) : (
            <div className="hidden lg:block">
              <UserMenu user={currentUser} onLogout={onLogout} />
            </div>
          )}

          {/* Mobile/Tablet: Hamburger menu at top-right, aligned with header */}
          <div className="relative lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Open menu"
              className="h-[clamp(40px,7vw,48px)] w-[clamp(40px,7vw,48px)] rounded-md"
              title="Open menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Menu aria-hidden />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[clamp(16rem,80vw,22rem)] rounded-xl border bg-white shadow-lg">
                <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 bg-card border-l border-t" aria-hidden />
                <nav className="grid gap-1 p-2" aria-label="Mobile navigation">
                  <Button
                    variant="ghost"
                    className="justify-start h-[clamp(2.5rem,6.5vw,3rem)] text-[clamp(0.95rem,0.85rem+0.25vw,1rem)]"
                    onClick={() => goTo("hero")}
                  >
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-[clamp(2.5rem,6.5vw,3rem)] text-[clamp(0.95rem,0.85rem+0.25vw,1rem)]"
                    onClick={() => navigate('/about')}
                  >
                    About Us
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-[clamp(2.5rem,6.5vw,3rem)] text-[clamp(0.95rem,0.85rem+0.25vw,1rem)]"
                    onClick={() => goTo("faq")}
                  >
                    FAQ
                  </Button>
                  {currentUser && (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start h-[clamp(2.5rem,6.5vw,3rem)] text-[clamp(0.95rem,0.85rem+0.25vw,1rem)]"
                        onClick={() => {
                          navigate("/my-trips");
                          setMenuOpen(false);
                        }}
                      >
                        Trips
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start h-[clamp(2.5rem,6.5vw,3rem)] text-[clamp(0.95rem,0.85rem+0.25vw,1rem)]"
                        onClick={() => {
                          navigate("/profile");
                          setMenuOpen(false);
                        }}
                      >
                        Profile
                      </Button>
                    </>
                  )}
                  <div className="my-2 border-t" />
                  {!currentUser ? (
                    <Button className="justify-start h-[clamp(2.5rem,6.5vw,3rem)] text-[clamp(0.95rem,0.85rem+0.25vw,1rem)]" onClick={() => { login(); setMenuOpen(false); }}>
                      Sign In
                    </Button>
                  ) : (
                    <Button variant="destructive" className="justify-start h-[clamp(2.5rem,6.5vw,3rem)] text-[clamp(0.95rem,0.85rem+0.25vw,1rem)]" onClick={() => { setMenuOpen(false); onLogout(); }}>
                      Logout
                    </Button>
                  )}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
