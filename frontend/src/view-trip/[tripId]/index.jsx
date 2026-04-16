import { tripApi } from '@/api/trips';
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        // Pass share token if present in URL
        const shareToken = searchParams.get('share') || searchParams.get('token');
        const data = await tripApi.getByIdWithShare(tripId, shareToken);
        if (data.trip) {
          setTrip(data.trip);
        } else {
          toast("No Trip Found");
          setTrip(null);
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
        if (error.response?.status === 403) {
          toast.error("You don't have access to this trip. Ask the owner for a share link.");
        } else {
          toast("Error fetching trip");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, searchParams]);

  if (loading) {
    return (
      <div className="p-10 md:px-20 lg:px-44 xl:px-56" style={{ paddingTop: 'calc(var(--app-header-offset, 80px) + 2rem)' }}>
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-10 md:px-20 lg:px-44 xl:px-56" style={{ paddingTop: 'calc(var(--app-header-offset, 80px) + 2rem)' }}>
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

  // Shared section styles
  const sectionClass = "scroll-mt-[calc(var(--app-header-offset,80px)+1rem)]";
  const innerClass = "px-2 md:px-6 lg:px-8 xl:px-10 py-8 md:py-10 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]";
  const divider = <hr className="border-t border-border/50 mx-4 md:mx-8" />;

  return (
    <div>
      {/* Landing section */}
      {trip && <InfoSection trip={trip} />}

      {/* Content with left-side section navigation */}
      <div className="px-2 md:px-4 lg:px-6 xl:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8">
          <SectionNav sections={sections} />

          <div>
            {/* 1) Recommended Hotels */}
            <section id="hotels" data-section className={sectionClass}>
              <div className={innerClass}>
                {trip && <Hotels trip={trip} />}
              </div>
            </section>

            {divider}

            {/* 2) Recommended Restaurants */}
            <section id="restaurants" data-section className={sectionClass}>
              <div className={innerClass}>
                {trip && <Restaurants trip={trip} />}
              </div>
            </section>

            {divider}

            {/* 3) Places To Visit */}
            <section id="places" data-section className={sectionClass}>
              <div className={innerClass}>
                {trip && <PlacesToVisit trip={trip} />}
              </div>
            </section>

            {divider}

            {/* 4) Suggested Day Trips */}
            <section id="dayTrips" data-section className={sectionClass}>
              <div className={innerClass}>
                {trip && <SuggestedDayTrips trip={trip} />}
              </div>
            </section>

            {divider}

            {/* 5) Neighbourhoods */}
            <section id="neighbourhoods" data-section className={sectionClass}>
              <div className={innerClass}>
                {trip && <Neighbourhoods trip={trip} />}
              </div>
            </section>

            {divider}

            {/* 6) Markets for Shopping */}
            <section id="markets" data-section className={sectionClass}>
              <div className={innerClass}>
                {trip && <Markets trip={trip} />}
              </div>
            </section>

            {divider}

            {/* 7) Extras */}
            <section id="extras" data-section className={sectionClass}>
              <div className={innerClass}>
                {trip && <Extras trip={trip} />}
              </div>
            </section>

            {divider}

            {/* 8) Local Essentials */}
            <section id="localEssentials" data-section className={sectionClass}>
              <div className={innerClass}>
                {trip && <LocalEssentials trip={trip} />}
              </div>
            </section>

            {divider}

            {/* 9) Getting Around */}
            <section id="gettingAround" data-section className={sectionClass}>
              <div className={innerClass}>
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
