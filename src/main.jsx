import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import {
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";
import CreateTrip from "./create-trip/index.jsx";
import Header from "./components/custom/Header.jsx";
import Footer from "./components/custom/Footer.jsx";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ViewTrip from "./view-trip/[tripId]/index.jsx";
import MyTrips from "./my-trips/index.jsx";
import EditTrip from "./edit-trip/[tripId]/index.jsx";
import ErrorBoundary from "./components/misc/ErrorBoundary.jsx";
import AboutPage from "./about/index.jsx";
import Profile from "./profile/index.jsx";

// Scroll manager: reset to top on route changes; preserve scroll during component updates
const ScrollManager = () => {
  const location = useLocation();
  useEffect(() => {
    try {
      window.history.scrollRestoration = "manual";
    } catch {}
    // On route change, scroll to top immediately (no smooth to avoid fighting with snap/offset)
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);
  return null;
};

const Layout = ({ children, hideFooter }) => (
  <>
    <Header />
    <ScrollManager />
    {children}
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
        <CreateTrip />
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
        <MyTrips />
      </Layout>
    ),
  },
  {
    path: "/profile",
    element: (
      <Layout>
        <Profile />
      </Layout>
    ),
  },
  {
    path: "/edit-trip/:tripId",
    element: (
      <Layout hideFooter>
        <EditTrip />
      </Layout>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster richColors position="top-center" />
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
