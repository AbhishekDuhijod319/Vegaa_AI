import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Brand from "./header/Brand";
import Nav from "./header/Nav";
import UserMenu from "./header/UserMenu";
import { Menu, X, Sun, Moon } from "lucide-react";

/**
 * App header with logo, nav links, dark mode toggle and user menu.
 * Uses proper CSS glassmorphism (.glass-nav) for the floating navbar.
 */
const Header = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  // Mobile menu open state
  const [menuOpen, setMenuOpen] = useState(false);

  // Smoothly scroll to sections from any route
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

  const handleSignIn = () => {
    try {
      navigate('/auth');
    } catch (err) {
      console.error("Navigation to auth failed:", err);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[100] top-2 sm:top-4 md:top-6 pointer-events-none flex justify-center px-3 sm:px-4"
      )}
    >
      <header
        className={cn(
          "relative w-full max-w-5xl mx-auto",
          "px-2 py-1.5 pl-3 sm:pl-6",
          "flex items-center justify-between",
          // Proper CSS glassmorphism navbar
          "rounded-full glass-nav",
          // Enable interactions
          "pointer-events-auto transition-all duration-500 ease-in-out",
        )}
      >
        {/* Left: Brand */}
        <div className="flex items-center">
          <Brand />
        </div>

        {/* Center: Nav (desktop only) */}
        <Nav currentUser={currentUser} />

        {/* Right: Theme toggle + Auth + Mobile menu */}
        <div className="flex items-center gap-2 pr-2">

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" aria-hidden />
              : <Moon className="w-4 h-4" aria-hidden />
            }
          </Button>

          {/* Auth Button */}
          {!currentUser ? (
            <Button
              className="relative bg-foreground text-background hover:bg-foreground/85 rounded-full px-6 h-9 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={handleSignIn}
            >
              Sign In
            </Button>
          ) : (
            <div className="hidden lg:block">
              <UserMenu user={currentUser} onLogout={onLogout} />
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <div className="relative lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="rounded-full w-9 h-9 text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
            </Button>

            {/* Mobile Menu Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-3 w-[92vw] max-w-sm rounded-3xl glass-strong p-4 anim-scale-in origin-top-right">
                <nav className="grid gap-1.5" aria-label="Mobile navigation">
                  <Button
                    variant="ghost"
                    className="justify-start text-base font-medium text-foreground/90 rounded-2xl h-12 pl-5 hover:bg-accent transition-colors"
                    onClick={() => goTo("hero")}
                  >
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-base font-medium text-foreground/90 rounded-2xl h-12 pl-5 hover:bg-accent transition-colors"
                    onClick={() => { navigate('/about'); setMenuOpen(false); }}
                  >
                    About Us
                  </Button>
                  {currentUser && (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start text-base font-medium text-foreground/90 rounded-2xl h-12 pl-5 hover:bg-accent transition-colors"
                        onClick={() => { navigate("/my-trips"); setMenuOpen(false); }}
                      >
                        My Trips
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start text-base font-medium text-foreground/90 rounded-2xl h-12 pl-5 hover:bg-accent transition-colors"
                        onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                      >
                        Profile
                      </Button>
                    </>
                  )}
                  <div className="my-1.5 border-t border-border/40" />
                  {/* Theme toggle in mobile menu */}
                  <Button
                    variant="ghost"
                    className="justify-start text-base font-medium text-foreground/90 rounded-2xl h-12 pl-5 hover:bg-accent transition-colors gap-3"
                    onClick={() => { toggleTheme(); setMenuOpen(false); }}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </Button>
                  <div className="my-1.5 border-t border-border/40" />
                  {!currentUser ? (
                    <Button
                      className="justify-center text-base font-bold rounded-2xl h-12 w-full bg-foreground text-background shadow hover:bg-foreground/80 transition-all"
                      onClick={() => { handleSignIn(); setMenuOpen(false); }}
                    >
                      Sign In
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="justify-center text-base font-bold rounded-2xl h-12 w-full"
                      onClick={() => { setMenuOpen(false); onLogout(); }}
                    >
                      Logout
                    </Button>
                  )}
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
