import { tripApi } from '@/api/trips';
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import InfoSection from "../components/InfoSection";
import SectionNav from "../components/SectionNav";
import Hotels from "../components/Hotels";
import PlacesToVisit from "../components/PlacesToVisit";
import Restaurants from "../components/Restaurants";
import Markets from "../components/Markets";
import Extras from "../components/Extras";
import GettingAround from "../components/GettingAround";
import LocalEssentials from "../components/LocalEssentials";
import Neighbourhoods from "../components/Neighbourhoods";
import SuggestedDayTrips from "../components/SuggestedDayTrips";

function Viewtrip() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const data = await tripApi.getById(tripId);
        if (data.trip) {
          setTrip(data.trip);
        } else {
          toast("No Trip Found");
          setTrip(null);
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
        toast("Error fetching trip");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]);

  /**
   * Used to get Trip Information form Firebase
   */

  if (loading) {
    return (
      <div className="p-10 md:px-20 lg:px-44 xl:px-56">
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-10 md:px-20 lg:px-44 xl:px-56">
        <p className="text-muted-foreground">No trip found.</p>
      </div>
    );
  }

  const sections = [
    { id: "hotels", label: "Hotels" },
    { id: "restaurants", label: "Restaurants" },
    { id: "places", label: "Places To Visit" },
    { id: "dayTrips", label: "Suggested Day Trips" },
    { id: "neighbourhoods", label: "Neighbourhoods" },
    { id: "markets", label: "Markets for Shopping" },
    { id: "extras", label: "Extras" },
    { id: "localEssentials", label: "Local Essentials" },
    { id: "gettingAround", label: "Getting Around" },
  ];

  return (
    <div>
      {/* Landing section (full-screen) */}
      {trip && <InfoSection trip={trip} />}

      {/* Content with left-side section navigation */}
      <div className="px-2 md:px-4 lg:px-6 xl:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8">
          <SectionNav sections={sections} />

          <div>
            {/* 1) Recommended Hotels */}
            <section id="hotels" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <Hotels trip={trip} />}
              </div>
            </section>

            {/* 2) Recommended Restaurants */}
            <section id="restaurants" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <Restaurants trip={trip} />}
              </div>
            </section>

            {/* 3) Places To Visit */}
            <section id="places" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <PlacesToVisit trip={trip} />}
              </div>
            </section>

            {/* 4) Suggested Day Trips */}
            <section id="dayTrips" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <SuggestedDayTrips trip={trip} />}
              </div>
            </section>

            {/* 5) Neighbourhoods */}
            <section id="neighbourhoods" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <Neighbourhoods trip={trip} />}
              </div>
            </section>

            {/* 6) Markets for Shopping */}
            <section id="markets" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <Markets trip={trip} />}
              </div>
            </section>

            {/* 7) Extras */}
            <section id="extras" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <Extras trip={trip} />}
              </div>
            </section>

            {/* 8) Local Essentials */}
            <section id="localEssentials" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <LocalEssentials trip={trip} />}
              </div>
            </section>

            {/* 9) Getting Around */}
            <section id="gettingAround" data-section className="scroll-mt-24 min-h-[100svh]">
              <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]">
                {trip && <GettingAround trip={trip} />}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Viewtrip;
