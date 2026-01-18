import { useEffect, useState } from "react";
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

import {
  fetchGoogleUserProfile,
  isAuthenticated,
} from "@/services/authService";
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
  // DatePicker open state controls for icon-triggered opening
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const navigate = useNavigate();

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
        await fetchGoogleUserProfile(tokenInfo, () => {
          setOpenDialog(false);
        });
        if (requestedAfterLogin) {
          setRequestedAfterLogin(false);
          // Auto-continue after login if user initiated a generate
          handleGenerateTrip();
        }
      } catch {
        // fetchGoogleUserProfile handles toasts
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
    if (!isAuthenticated()) {
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
          const user = JSON.parse(localStorage.getItem("user"));
          await saveAiTrip(
            tripData,
            docId,
            user,
            enrichedFormData,
            coverPhotoUrl
          );
          toast.success("Trip plan generated successfully!");
          navigate("/view-trip/" + docId);
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
    <div className="no-caret-glow p-5 md:px-16 lg:px-40 xl:px-56">
          {/* Plan Your Journey card */}
      <div className="mt-20">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-bold text-4xl mb-2">Plan Your Journey</h2>
            <p className="text-muted-foreground mt-3">
              Tell us about your trip, and we'll craft a personalized itinerary.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-7">
        {/* Row 1: Location (left) + Destination (right) */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm mb-2 text-muted-foreground font-bold">
              Enter Your Location
            </h2>
            <div className="group relative">
              <div className="field transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
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
                    placeholder: "Select Location",
                    menuPortalTarget:
                      typeof document !== "undefined" ? document.body : null,
                    styles: placesAutocompleteStyles,
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-sm mb-2 text-muted-foreground font-bold">
              Enter Destination
            </h2>
            <div className="group relative">
              <div className="field transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
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
                    placeholder: "Select Destination",
                    menuPortalTarget:
                      typeof document !== "undefined" ? document.body : null,
                    styles: placesAutocompleteStyles,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Start Date (left) + End Date (right) */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm mb-2 text-muted-foreground font-bold">
              Start Date
            </h2>
            <div className="relative group">
              <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
                <DatePicker
                  selected={
                    formData?.startDate ? new Date(formData.startDate) : null
                  }
                  onChange={(date) => {
                    const y = date?.getFullYear();
                    const m = String((date?.getMonth() ?? 0) + 1).padStart(
                      2,
                      "0"
                    );
                    const d = String(date?.getDate() ?? 1).padStart(2, "0");
                    const formatted = date ? `${y}-${m}-${d}` : "";
                    handleInputChange("startDate", formatted);
                  }}
                  placeholderText="dd/mm/yyyy"
                  dateFormat="dd/MM/yyyy"
                  className="w-full pr-12 pl-3 h-12 bg-background backdrop-blur-md border-transparent focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground rounded-md"
                  popperPlacement="bottom-end"
                  popperModifiers={[
                    { name: "offset", options: { offset: [0, 8] } },
                  ]}
                  minDate={
                    formData?.endDate
                      ? new Date(
                          new Date(formData.endDate).getTime() - 20 * 86400000
                        )
                      : undefined
                  }
                  maxDate={
                    formData?.endDate ? new Date(formData.endDate) : undefined
                  }
                  open={startOpen}
                  onClickOutside={() => setStartOpen(false)}
                  onSelect={() => setStartOpen(false)}
                />
                <button
                  type="button"
                  aria-label="Open date picker"
                  onClick={() => setStartOpen((o) => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <AiOutlineCalendar className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-sm mb-2 text-muted-foreground font-bold">
              End Date
            </h2>
            <div className="relative group">
              <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
                <DatePicker
                  selected={
                    formData?.endDate ? new Date(formData.endDate) : null
                  }
                  onChange={(date) => {
                    const y = date?.getFullYear();
                    const m = String((date?.getMonth() ?? 0) + 1).padStart(
                      2,
                      "0"
                    );
                    const d = String(date?.getDate() ?? 1).padStart(2, "0");
                    const formatted = date ? `${y}-${m}-${d}` : "";
                    handleInputChange("endDate", formatted);
                  }}
                  placeholderText="dd/mm/yyyy"
                  dateFormat="dd/MM/yyyy"
                  className="w-full pr-12 pl-3 h-12 bg-background backdrop-blur-md border-transparent focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground rounded-md"
                  popperPlacement="bottom-end"
                  popperModifiers={[
                    { name: "offset", options: { offset: [0, 8] } },
                  ]}
                  minDate={
                    formData?.startDate
                      ? new Date(formData.startDate)
                      : undefined
                  }
                  maxDate={
                    formData?.startDate
                      ? new Date(
                          new Date(formData.startDate).getTime() + 20 * 86400000
                        )
                      : undefined
                  }
                  open={endOpen}
                  onClickOutside={() => setEndOpen(false)}
                  onSelect={() => setEndOpen(false)}
                />
                <button
                  type="button"
                  aria-label="Open date picker"
                  onClick={() => setEndOpen((o) => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <AiOutlineCalendar className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Left = Budget + Currency (side-by-side), Right = Travelers box */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <h2 className="text-sm mb-2 text-muted-foreground font-bold">
                  Budget Amount
                </h2>
                <div className="group">
                  <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
                    <Input
                      className="pl-3 border-transparent bg-background focus-visible:ring-0 number-input"
                      type="number"
                      placeholder="Ex. 1200"
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-sm mb-2 text-muted-foreground font-bold">
                  Currency
                </h2>
                <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
                  <ClickSelect
                    instanceId="currency-select"
                    inputId="currency-select"
                    options={currencyOptions}
                    value={
                      currencyOptions.find(
                        (o) => o.value === formData?.currency
                      ) || null
                    }
                    onChange={(opt) =>
                      handleInputChange("currency", opt?.value)
                    }
                    styles={currencySelectStyles}
                  />
                </div>
              </div>
            </div>

            {/* Mode of Transport under budget+currency, same left-column width */}
            <div>
              <h2 className="text-sm mb-2 text-muted-foreground font-bold">
                Mode Of Transport to Destination(optional)
              </h2>
              <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
                <ClickSelect
                  instanceId="transport-select"
                  inputId="transport-select"
                  options={transportOptions}
                  value={
                    transportOptions.find(
                      (o) => o.value === formData?.transportMode
                    ) || null
                  }
                  onChange={(opt) =>
                    handleInputChange("transportMode", opt?.value)
                  }
                  styles={transportSelectStyles}
                />
              </div>
            </div>
          </div>

          {/* Travelers box on the right - fixed width consistency */}
          <div className="flex">
            <div className="bg-card border border-border rounded-2xl p-6 w-full transition-all duration-200 ring-1 ring-ring/20 hover:ring-ring/60">
              <h2 className="text-sm mb-2 text-muted-foreground text-center font-bold">
                Number Of Travelers
              </h2>
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-accent/10 border border-border flex items-center justify-center text-foreground hover:bg-accent/20 transition-colors"
                  onClick={() => {
                    const current = formData?.numTravelers || 1;
                    if (current > 1)
                      handleInputChange("numTravelers", current - 1);
                  }}
                >
                  -
                </button>
                <Input
                  className="w-16 text-center border-transparent bg-background focus-visible:ring-0 number-input font-bold"
                  type="number"
                  min={1}
                  max={15}
                  value={formData?.numTravelers ?? 1}
                  onChange={(e) => {
                    const val = Math.max(
                      1,
                      Math.min(15, Number(e.target.value) || 1)
                    );
                    handleInputChange("numTravelers", val);
                  }}
                />
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-accent/10 border border-border flex items-center justify-center text-foreground hover:bg-accent/20 transition-colors"
                  onClick={() => {
                    const current = formData?.numTravelers || 1;
                    if (current < 15)
                      handleInputChange("numTravelers", current + 1);
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-right big rounded action button remains primary */}
        <div className="my-2 flex justify-end">
          <Button
            loading={loading}
            disabled={loading}
            onClick={handleGenerateTrip}
            className="rounded-lg px-8 py-6"
          >
            Generate Trip
          </Button>
        </div>

        {/* Login Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {/* Replace icon spin with consistent brand spinner if desired */}
                Sign In Required
              </DialogTitle>
              <DialogDescription>
                Please sign in with Google to generate your personalized trip
                plan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                onClick={login}
                className="w-full flex items-center gap-3"
              >
                <span className="inline-flex items-center gap-3">
                  <FcGoogle className="h-5 w-5" />
                  Sign In with Google
                </span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CreateTrip;
