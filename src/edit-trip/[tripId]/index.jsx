import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/sevice/firebaseConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import Select from "react-select";
import { getStableFirstImageForQuery } from "@/lib/pexels";
import { AiOutlineCalendar } from "react-icons/ai";
import { FaRoute } from "react-icons/fa";
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
  styles = {},
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
          ...(typeof styles.container === "function"
            ? styles.container(base)
            : base),
          width: "100%",
        }),
        menu: (base) => ({
          ...(typeof styles.menu === "function" ? styles.menu(base) : base),
          width: "100%",
        }),
      }}
    />
  );
};

const EditTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [saving, setSaving] = useState(false);
  const [startLocation, setStartLocation] = useState();
  const [destination, setDestination] = useState();
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
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

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "AITrips", tripId));
        if (snap.exists()) setTrip(snap.data());
        else navigate("/");
      } catch (e) {
        console.error(e);
        toast("Failed to load trip");
      }
    };
    load();
  }, [tripId, navigate]);

  const updateField = (name, value) => {
    setTrip((prev) => ({
      ...prev,
      userSelection: { ...(prev?.userSelection || {}), [name]: value },
    }));
  };

  const daysBetween = (start, end) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(diff, 1);
    } catch {
      return 0;
    }
  };

  const onSave = async () => {
    if (!trip) return;
    const sel = trip.userSelection || {};
    
    // Basic validation
    const d = destination || sel?.destination || sel?.location;
    const sd = sel?.startDate;
    const ed = sel?.endDate;
    const travelers = Number(sel?.numTravelers);

    if (!d) return toast("Destination is required.");
    if (!sd) return toast("Start date is required.");
    if (!ed) return toast("End date is required.");
    if (sd && ed && !isNaN(Date.parse(sd)) && !isNaN(Date.parse(ed))) {
      if (new Date(ed) < new Date(sd)) return toast("End date must be after start date.");
      const diffDays = Math.floor((new Date(ed) - new Date(sd)) / 86400000) + 1;
      if (diffDays > 20) return toast("The trip duration cannot exceed 20 days.");
    }
    if (!(travelers >= 1)) return toast("Please specify at least 1 traveler.");
    if (travelers > 15) return toast("Please limit to at most 15 travelers.");

    setSaving(true);
    try {
      const newDays = daysBetween(sel.startDate, sel.endDate) || sel.noOfDays;

      let nextCover = trip.coverPhotoUrl;
      try {
        const label = sel.destination?.label || sel.location?.label;
        if (label) {
          const set = await getStableFirstImageForQuery(label);
          nextCover = set?.src || nextCover;
        }
      } catch (error) {
        console.error("Failed to update cover photo:", error);
      }

      const updated = {
        ...trip,
        userSelection: {
          ...sel,
          noOfDays: newDays,
        },
        coverPhotoUrl: nextCover || trip.coverPhotoUrl || "",
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "AITrips", tripId), updated, { merge: true });
      toast.success("Trip updated");

      try {
        if (Notification && Notification.permission !== "denied") {
          if (Notification.permission !== "granted") {
            await Notification.requestPermission();
          }
          if (Notification.permission === "granted") {
            new Notification("Trip updated", {
              body: "Your itinerary changes were saved.",
            });
          }
        }
      } catch (error) {
        console.error("Notification error:", error);
      }

      navigate(`/view-trip/${tripId}`);
    } catch (e) {
      console.error(e);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!trip) return <div className="p-5 md:px-16 lg:px-44">Loading...</div>;

  const sel = trip.userSelection || {};

  return (
    <div className="no-caret-glow p-5 md:px-16 lg:px-40 xl:px-56">
      <div className="h-10 rounded-full bg-background border border-border mb-6" />
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
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm mb-2 text-muted-foreground font-bold">
              Enter Your Location
            </h2>
            <div className="group">
              <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
                <GooglePlacesAutocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                  debounce={350}
                  withSessionToken
                  onLoadFailed={handlePlacesLoadFailed}
                  selectProps={{
                    value: startLocation || sel?.startLocation,
                    onChange: (v) => {
                      setStartLocation(v);
                      updateField("startLocation", v);
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
            <div className="group">
              <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
                <GooglePlacesAutocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                  debounce={350}
                  withSessionToken
                  onLoadFailed={handlePlacesLoadFailed}
                  selectProps={{
                    value: destination || sel?.destination || sel?.location,
                    onChange: (v) => {
                      setDestination(v);
                      updateField("destination", v);
                      updateField("location", v);
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
        <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm mb-2 text-muted-foreground font-bold">
            Start Date
          </h2>
          <div className="relative transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
            <DatePicker
              selected={sel?.startDate ? new Date(sel.startDate) : null}
              onChange={(date) => {
                const y = date?.getFullYear();
                const m = String((date?.getMonth() ?? 0) + 1).padStart(2, "0");
                const d = String(date?.getDate() ?? 1).padStart(2, "0");
                const formatted = date ? `${y}-${m}-${d}` : "";
                updateField("startDate", formatted);
              }}
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
              className="w-full pr-12 pl-3 h-12 bg-background backdrop-blur-md border-transparent focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground rounded-md"
              popperPlacement="bottom-end"
              popperModifiers={[
                { name: "offset", options: { offset: [0, 8] } },
              ]}
              minDate={sel?.endDate ? new Date(new Date(sel.endDate).getTime() - 20 * 86400000) : undefined}
              maxDate={sel?.endDate ? new Date(sel.endDate) : undefined}
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
        <div>
          <h2 className="text-sm mb-2 text-muted-foreground font-bold">
            End Date
          </h2>
          <div className="relative transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
            <DatePicker
              selected={sel?.endDate ? new Date(sel.endDate) : null}
              onChange={(date) => {
                const y = date?.getFullYear();
                const m = String((date?.getMonth() ?? 0) + 1).padStart(2, "0");
                const d = String(date?.getDate() ?? 1).padStart(2, "0");
                const formatted = date ? `${y}-${m}-${d}` : "";
                updateField("endDate", formatted);
              }}
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
              className="w-full pr-12 pl-3 h-12 bg-background backdrop-blur-md border-transparent focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground rounded-md"
              popperPlacement="bottom-end"
              popperModifiers={[
                { name: "offset", options: { offset: [0, 8] } },
              ]}
              minDate={sel?.startDate ? new Date(sel.startDate) : undefined}
              maxDate={sel?.startDate ? new Date(new Date(sel.startDate).getTime() + 20 * 86400000) : undefined}
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
        <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <h2 className="text-sm mb-2 text-muted-foreground font-bold">
                Budget Amount
              </h2>
              <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
                <Input
                  className="pl-3 border-transparent bg-background/90 backdrop-blur-md focus-visible:ring-0 number-input"
                  type="number"
                  placeholder="Ex. 1200"
                  value={sel?.amount || ""}
                  onChange={(e) => updateField("amount", e.target.value)}
                />
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
                    currencyOptions.find((o) => o.value === sel?.currency) ||
                    currencyOptions.find((o) => o.value === "INR")
                  }
                  onChange={(opt) => updateField("currency", opt?.value)}
                  styles={currencySelectStyles}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm mb-2 text-muted-foreground font-bold">
              Mode Of Transport to Destination (optional)
            </h2>
            <div className="transition-all duration-200 bg-background rounded-md border border-input ring-1 ring-ring/30 hover:ring-ring/60">
              <ClickSelect
                instanceId="transport-select"
                inputId="transport-select"
                options={transportOptions}
                value={
                  transportOptions.find(
                    (o) => o.value === sel?.transportMode
                  ) || null
                }
                onChange={(opt) => updateField("transportMode", opt?.value)}
                placeholder="Dropdown menu to select mode"
                styles={transportSelectStyles}
              />
            </div>
          </div>
        </div>

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
                  const current = sel?.numTravelers || 1;
                  if (current > 1) updateField("numTravelers", current - 1);
                }}
              >
                -
              </button>
              <Input
                className="w-16 text-center border-transparent bg-background focus-visible:ring-0 number-input font-bold"
                type="number"
                min={1}
                max={15}
                value={sel?.numTravelers ?? 1}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(15, Number(e.target.value) || 1));
                  updateField("numTravelers", val);
                }}
              />
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-accent/10 border border-border flex items-center justify-center text-foreground hover:bg-accent/20 transition-colors"
                onClick={() => {
                  const current = sel?.numTravelers || 1;
                  if (current < 15) updateField("numTravelers", current + 1);
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="my-2 flex justify-end">
        <Button
          disabled={saving}
          onClick={onSave}
          className="rounded-lg px-8 py-6"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default EditTrip;
