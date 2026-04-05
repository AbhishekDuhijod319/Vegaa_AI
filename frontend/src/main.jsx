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

// Scroll manager: reset to top on route changes; preserve scroll during component updates
const ScrollManager = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch { }

    // Force scroll to top immediately and synchronously
    window.scrollTo(0, 0);

    // Also try after a tiny delay to catch any async content
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]);
  return null;
};

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
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
        <ViewTrip />
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
      <AuthPage />
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
      <AuthProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
          <Toaster richColors position="top-center" />
        </ErrorBoundary>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
