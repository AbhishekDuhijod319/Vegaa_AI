import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user: currentUser, isAuthenticated, googleLogin: authGoogleLogin, logout } = useAuth();

  // Start Google OAuth login
  const login = useGoogleLogin({
    onSuccess: async (tokenInfo) => {
      try {
        await authGoogleLogin(tokenInfo.access_token);
        navigate("/create-trip");
      } catch (err) {
        console.error("Google login failed", err);
      }
    },
    onError: (error) => {
      console.error("Google login error:", error);
    },
    flow: "implicit",
  });

  const onLogout = async () => {
    await logout();
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
        "fixed inset-x-0 z-[100] top-4 md:top-6 pointer-events-none flex justify-center px-4"
      )}
    >
      <header
        className={cn(
          "relative w-full max-w-5xl mx-auto",
          // Spacing and layout
          "px-2 py-2 pl-6",
          "flex items-center justify-between",
          // Visual style: Glassmorphism, pill shape, soft shadow
          "rounded-full border border-white/40 bg-white/70 backdrop-blur-3xl shadow-soft",
          // Enable interactions on the header
          "pointer-events-auto transition-all duration-500 ease-spring",
          // Hover effect for the container
          "hover:shadow-lg hover:scale-[1.002]"
        )}
      >
        {/* Left: Brand only */}
        <div className="flex items-center">
          <Brand />
        </div>
        
        {/* Center: Nav (desktop only) */}
        <Nav currentUser={currentUser} />
        
        {/* Right: Theme + Auth + Mobile menu */}
        <div className="flex items-center gap-3 pr-2">
          {/* Auth Button */}
          {!currentUser ? (
            <div className="relative group">
              <Button
                className="relative bg-black text-white hover:bg-black/80 rounded-full px-8 py-5 h-10 text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-transparent"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
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
              aria-label="Open menu"
              className="rounded-full text-foreground/80 hover:bg-black/5 hover:text-foreground transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Menu className="w-6 h-6" aria-hidden />
            </Button>
            
            {/* Mobile Menu Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-4 w-[90vw] max-w-sm rounded-3xl border border-white/40 bg-white/90 backdrop-blur-3xl shadow-2xl p-4 animate-in slide-in-from-top-4 fade-in duration-300 origin-top-right">
                <nav className="grid gap-2" aria-label="Mobile navigation">
                  <Button
                    variant="ghost"
                    className="justify-start text-lg font-medium text-foreground/90 rounded-2xl h-14 pl-6 hover:bg-black/5 transition-colors"
                    onClick={() => goTo("hero")}
                  >
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-lg font-medium text-foreground/90 rounded-2xl h-14 pl-6 hover:bg-black/5 transition-colors"
                    onClick={() => navigate('/about')}
                  >
                    About Us
                  </Button>
                  {currentUser && (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start text-lg font-medium text-foreground/90 rounded-2xl h-14 pl-6 hover:bg-black/5 transition-colors"
                        onClick={() => {
                          navigate("/my-trips");
                          setMenuOpen(false);
                        }}
                      >
                        Trips
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start text-lg font-medium text-foreground/90 rounded-2xl h-14 pl-6 hover:bg-black/5 transition-colors"
                        onClick={() => {
                          navigate("/profile");
                          setMenuOpen(false);
                        }}
                      >
                        Profile
                      </Button>
                    </>
                  )}
                  <div className="my-2 border-t border-black/5" />
                  {!currentUser ? (
                    <Button 
                      className="justify-center text-lg font-bold rounded-2xl h-14 w-full bg-black text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all" 
                      onClick={() => { navigate('/auth'); setMenuOpen(false); }}
                    >
                      Sign In
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      className="justify-center text-lg font-bold rounded-2xl h-14 w-full shadow-soft hover:scale-[1.01] transition-transform" 
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
