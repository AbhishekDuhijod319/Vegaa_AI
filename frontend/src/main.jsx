import React, { useEffect, useLayoutEffect, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";
// Eagerly load components needed immediately
import Header from "./components/custom/Header.jsx";
import Footer from "./components/custom/Footer.jsx";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ErrorBoundary from "./components/misc/ErrorBoundary.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

// Lazy load route components for code splitting
const App = lazy(() => import("./App.jsx"));
const CreateTrip = lazy(() => import("./create-trip/index.jsx"));
const ViewTrip = lazy(() => import("./view-trip/[tripId]/index.jsx"));
const MyTrips = lazy(() => import("./my-trips/index.jsx"));
const EditTrip = lazy(() => import("./edit-trip/[tripId]/index.jsx"));
const AboutPage = lazy(() => import("./about/index.jsx"));
const Profile = lazy(() => import("./profile/index.jsx"));
const AuthPage = lazy(() => import("./auth/index.jsx"));

/**
 * ScrollManager — robust scroll-to-top on route changes.
 */
const ScrollManager = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch { }

    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        html.style.scrollBehavior = prevBehavior || '';
      });
    });

  }, [location.pathname, location.search]);
  return null;
};

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <div
          className="w-14 h-14 rounded-full border-2 border-primary/10 absolute inset-0 animate-ping"
          style={{ animationDuration: "2s" }}
        />
        <div
          className="w-14 h-14 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"
          style={{ animationDuration: "0.8s" }}
        />
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">Loading...</p>
    </div>
  </div>
);

const Layout = ({ children, hideFooter }) => (
  <>
    <Header />
    <ScrollManager />
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
    {!hideFooter && <Footer />}
  </>
);

/**
 * MinimalLayout — used for full-screen overlays (auth, etc.)
 */
const MinimalLayout = ({ children }) => (
  <>
    <ScrollManager />
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <App />
      </Layout>
    ),
  },
  {
    path: "/about",
    element: (
      <Layout>
        <AboutPage />
      </Layout>
    ),
  },
  {
    path: "/create-trip",
    element: (
      <Layout hideFooter>
        <ProtectedRoute><CreateTrip /></ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/view-trip/:tripId",
    element: (
      <Layout>
        <ProtectedRoute><ViewTrip /></ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/my-trips",
    element: (
      <Layout>
        <ProtectedRoute><MyTrips /></ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/profile",
    element: (
      <Layout>
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/edit-trip/:tripId",
    element: (
      <Layout hideFooter>
        <ProtectedRoute><EditTrip /></ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/auth",
    element: (
      <MinimalLayout>
        <AuthPage />
      </MinimalLayout>
    ),
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_startTransition: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <RouterProvider router={router} />
            <Toaster richColors position="top-center" />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
