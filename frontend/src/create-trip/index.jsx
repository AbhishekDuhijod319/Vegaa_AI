import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import Select from "react-select";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters, AiOutlineCalendar } from "react-icons/ai";
import { FaRoute } from "react-icons/fa";
import TripGeneratingOverlay from "@/components/ui/TripGeneratingOverlay";

import { useAuth } from '@/contexts/AuthContext';
import { generateTrip, saveAiTrip } from "@/services/tripService";
import {
  placesAutocompleteStyles,
  currencySelectStyles,
  currencyOptions,
  transportSelectStyles,
  transportOptions,
} from "@/constants/uiStyles";
import { logger } from "@/utils/logger";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Click-only select component (removed hover functionality)
const ClickSelect = ({
  instanceId,
  inputId,
  options,
  value,
  onChange,
  placeholder,
  styles,
}) => {
  return (
    <Select
      instanceId={instanceId}
      inputId={inputId}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      openMenuOnClick
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      styles={{
        ...styles,
        container: (base) => ({
          ...(styles.container ? styles.container(base) : base),
          width: "100%",
        }),
        menu: (base) => ({
          ...(styles.menu ? styles.menu(base) : base),
          width: "100%",
        }),
      }}
    />
  );
};

const CreateTrip = () => {
  const [startLocation, setStartLocation] = useState();
  const [destination, setDestination] = useState();
  const [formData, setFormData] = useState({
    currency: "INR",
    numTravelers: 1,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestedAfterLogin, setRequestedAfterLogin] = useState(false);
  // Refs for programmatic calendar control
  const startRef = useRef(null);
  const endRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, googleLogin: authGoogleLogin } = useAuth();

  const PLACES_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  useEffect(() => {
    if (!PLACES_KEY) {
      toast.error(
        "Missing Google Places API key. Set VITE_GOOGLE_PLACES_API_KEY in .env.local and restart the dev server."
      );
    }
  }, []);

  const handlePlacesLoadFailed = (error) => {
    const e = (error?.message || String(error || "")).toLowerCase();
    let msg =
      "Could not load Google Places. Please check your network/API key.";
    if (e.includes("quota") || e.includes("rate")) {
      msg = "Google Places quota exceeded. Try again later.";
    } else if (e.includes("api key") || e.includes("invalid")) {
      msg = "Invalid Google Places API key. Verify your .env configuration.";
    } else if (e.includes("billing") || e.includes("project")) {
      msg =
        "Google Cloud billing/project issue. Ensure Places API is enabled with billing.";
    }
    toast.error(msg);
  };
  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenInfo) => {
      try {
        await authGoogleLogin(tokenInfo.access_token);
        setOpenDialog(false);
        if (requestedAfterLogin) {
          setRequestedAfterLogin(false);
          handleGenerateTrip();
        }
      } catch {
        toast.error("Login failed.");
      }
    },
    onError: (error) => {
      logger.error("Google login error:", error);
      toast.error("Login failed. Please check popup blockers.");
    },
    flow: "implicit",
  });

  /**
   * Validate form fields before generating.
   * Ensures required data and sensible ranges for accessible error feedback.
   */
  const validateForm = () => {
    const errors = [];
    const d = formData?.destination;
    const sd = formData?.startDate;
    const ed = formData?.endDate;
    const amt = Number(formData?.amount);
    const curr = formData?.currency;
    const travelers = Number(formData?.numTravelers);

    if (!d) errors.push("Destination is required.");
    if (!sd) errors.push("Start date is required.");
    if (!ed) errors.push("End date is required.");
    if (sd && ed && !isNaN(Date.parse(sd)) && !isNaN(Date.parse(ed))) {
      if (new Date(ed) < new Date(sd))
        errors.push("End date must be after start date.");
      const diffDays = Math.floor((new Date(ed) - new Date(sd)) / 86400000) + 1;
      if (diffDays > 20)
        errors.push("The trip duration cannot exceed 20 days.");
    }
    if (!curr) errors.push("Currency is required.");
    if (!(amt > 0)) errors.push("Budget amount must be greater than 0.");
    if (!(travelers >= 1)) errors.push("Please specify at least 1 traveler.");
    if (travelers > 15) errors.push("Please limit to at most 15 travelers.");

    return { ok: errors.length === 0, errors };
  };

  const handleGenerateTrip = async () => {
    if (!isAuthenticated) {
      setRequestedAfterLogin(true);
      setOpenDialog(true);
      return;
    }

    const { ok, errors } = validateForm();
    if (!ok) {
      errors.forEach((e) => toast(e));
      return;
    }

    setLoading(true);

    await generateTrip(
      formData,
      async ({ tripData, docId, enrichedFormData, coverPhotoUrl }) => {
        try {
          const result = await saveAiTrip(
            tripData,
            docId,
            user,
            enrichedFormData,
            coverPhotoUrl
          );
          toast.success("Trip plan generated successfully!");
          navigate("/view-trip/" + (result?._id || docId));
        } catch (error) {
          logger.error("Error saving trip:", error);
          toast.error("Failed to save trip. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        const msg = error?.message || "Failed to generate trip. Please try again.";
        toast.error(msg);
        setLoading(false);
      }
    );
  };

  return (
    <section
      className="h-screen w-full bg-gradient-to-b from-background via-secondary/20 to-background flex items-center justify-center overflow-hidden"
      aria-label="Create Trip Form"
    >
      <div className="w-full max-w-6xl px-6 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col h-full max-h-[900px] justify-center">

        {/* Compact Header */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight mb-2">
            Plan Your Journey
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed md:mx-0 mx-auto">
            Tell us about your trip, and we'll craft a personalized itinerary.
          </p>
        </div>

        {/* Main Form Content */}
        <div className="space-y-6 md:space-y-8">

          {/* Row 1: Destinations */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-2 relative z-50">
              <label className="text-sm font-semibold text-foreground/90 ml-1">
                Where are you starting from?
              </label>
              <div className="relative group">
                <div className="transition-all duration-300 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30">
                  <GooglePlacesAutocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                    debounce={350}
                    withSessionToken
                    onLoadFailed={handlePlacesLoadFailed}
                    selectProps={{
                      value: startLocation,
                      onChange: (v) => {
                        setStartLocation(v);
                        handleInputChange("startLocation", v);
                      },
                      placeholder: "Search starting point...",
                      styles: placesAutocompleteStyles,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 relative z-50">
              <label className="text-sm font-semibold text-foreground/90 ml-1">
                Where do you want to go?
              </label>
              <div className="relative group">
                <div className="transition-all duration-300 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30">
                  <GooglePlacesAutocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                    debounce={350}
                    withSessionToken
                    onLoadFailed={handlePlacesLoadFailed}
                    selectProps={{
                      value: destination,
                      onChange: (v) => {
                        setDestination(v);
                        handleInputChange("destination", v);
                      },
                      placeholder: "Search destination...",
                      styles: placesAutocompleteStyles,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Dates */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-2 relative z-40">
              <label className="text-sm font-semibold text-foreground/90 ml-1">
                Start Date
              </label>
              <div className="relative group">
                <div
                  className="transition-all duration-300 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30 flex items-center h-14 cursor-pointer"
                  onClick={() => {
                    startRef.current?.setOpen(true);
                  }}
                >
                  <DatePicker
                    ref={startRef}
                    selected={formData?.startDate ? new Date(formData.startDate) : null}
                    onChange={(date) => {
                      const y = date?.getFullYear();
                      const m = String((date?.getMonth() ?? 0) + 1).padStart(2, "0");
                      const d = String(date?.getDate() ?? 1).padStart(2, "0");
                      const formatted = date ? `${y}-${m}-${d}` : "";
                      handleInputChange("startDate", formatted);
                    }}
                    placeholderText="Select date"
                    dateFormat="dd/MM/yyyy"
                    className="w-full h-full bg-transparent border-none text-foreground placeholder:text-muted-foreground px-4 text-base focus:ring-0 focus:outline-none rounded-xl cursor-pointer"
                    minDate={formData?.endDate ? new Date(new Date(formData.endDate).getTime() - 20 * 86400000) : undefined}
                    maxDate={formData?.endDate ? new Date(formData.endDate) : undefined}
                    popperPlacement="bottom-start"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRef.current?.setOpen(true);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <AiOutlineCalendar className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 relative z-40">
              <label className="text-sm font-semibold text-foreground/90 ml-1">
                End Date
              </label>
              <div className="relative group">
                <div
                  className="transition-all duration-300 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30 flex items-center h-14 cursor-pointer"
                  onClick={() => {
                    endRef.current?.setOpen(true);
                  }}
                >
                  <DatePicker
                    ref={endRef}
                    selected={formData?.endDate ? new Date(formData.endDate) : null}
                    onChange={(date) => {
                      const y = date?.getFullYear();
                      const m = String((date?.getMonth() ?? 0) + 1).padStart(2, "0");
                      const d = String(date?.getDate() ?? 1).padStart(2, "0");
                      const formatted = date ? `${y}-${m}-${d}` : "";
                      handleInputChange("endDate", formatted);
                    }}
                    placeholderText="Select date"
                    dateFormat="dd/MM/yyyy"
                    className="w-full h-full bg-transparent border-none text-foreground placeholder:text-muted-foreground px-4 text-base focus:ring-0 focus:outline-none rounded-xl cursor-pointer"
                    minDate={formData?.startDate ? new Date(formData.startDate) : undefined}
                    maxDate={formData?.startDate ? new Date(new Date(formData.startDate).getTime() + 20 * 86400000) : undefined}
                    popperPlacement="bottom-start"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      endRef.current?.setOpen(true);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <AiOutlineCalendar className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Budget, Currency, Transport, Travelers */}
          <div className="grid md:grid-cols-12 gap-x-6 gap-y-4">

            {/* Budget & Currency (5 cols) */}
            <div className="md:col-span-5 grid grid-cols-2 gap-4 relative z-30">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/90 ml-1">Budget</label>
                <div className="transition-all duration-300 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30 h-14 flex items-center px-2">
                  <Input
                    className="border-none bg-transparent shadow-none h-full text-lg placeholder:text-muted-foreground focus-visible:ring-0 number-input"
                    type="number"
                    placeholder="Ex. 1200"
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/90 ml-1">Currency</label>
                <div className="transition-all duration-300 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30">
                  <ClickSelect
                    instanceId="currency-select"
                    inputId="currency-select"
                    options={currencyOptions}
                    value={currencyOptions.find((o) => o.value === formData?.currency) || null}
                    onChange={(opt) => handleInputChange("currency", opt?.value)}
                    styles={currencySelectStyles}
                    placeholder="₹"
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                </div>
              </div>
            </div>

            {/* Transport (3 cols) */}
            <div className="md:col-span-3 space-y-2 relative z-30">
              <label className="text-sm font-semibold text-foreground/90 ml-1">Transport</label>
              <div className="transition-all duration-300 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30">
                <ClickSelect
                  instanceId="transport-select"
                  inputId="transport-select"
                  options={transportOptions}
                  value={transportOptions.find((o) => o.value === formData?.transportMode) || null}
                  onChange={(opt) => handleInputChange("transportMode", opt?.value)}
                  styles={transportSelectStyles}
                  placeholder="Mode"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />
              </div>
            </div>

            {/* Travelers (4 cols) */}
            <div className="md:col-span-4 space-y-2 relative z-20">
              <label className="text-sm font-semibold text-foreground/90 ml-1">Travelers</label>
              <div className="h-14 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-sm flex items-center justify-between px-4 ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                  onClick={() => { const c = formData?.numTravelers || 1; if (c > 1) handleInputChange("numTravelers", c - 1); }}
                >
                  -
                </Button>
                <span className="font-semibold text-foreground">
                  {formData?.numTravelers ?? 1} {formData?.numTravelers === 1 ? 'Person' : 'People'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                  onClick={() => { const c = formData?.numTravelers || 1; if (c < 15) handleInputChange("numTravelers", c + 1); }}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 md:pt-6 flex justify-end">
            <Button
              loading={loading}
              disabled={loading}
              onClick={handleGenerateTrip}
              className="w-full md:w-auto rounded-xl px-10 py-6 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-primary text-primary-foreground"
            >
              Generate Itinerary
            </Button>
          </div>
        </div>

        {/* Login Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                Sign In Required
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-2">
                Join us to start generating your personalized adventure.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Button
                onClick={login}
                className="w-full h-12 rounded-xl text-base flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 border border-gray-200 shadow-sm transition-all"
              >
                <FcGoogle className="h-6 w-6" />
                <span>Continue with Google</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Full-screen generating overlay */}
      <TripGeneratingOverlay isVisible={loading} />
    </section>
  );
};

export default CreateTrip;
