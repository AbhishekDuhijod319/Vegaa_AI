import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  MapPin, Calendar, Globe, LogOut,
  Plane, Heart, Loader2
} from "lucide-react";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../sevice/firebaseConfig';
import SmartImage from "@/components/ui/SmartImage";

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="relative p-6 rounded-2xl bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/10 backdrop-blur-xl overflow-hidden group hover:bg-white/80 dark:hover:bg-black/80 transition-all duration-300"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={80} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon size={16} />
        <span className="text-sm font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
    </div>
  </motion.div>
);

// Recent Trip Card
const TripCard = ({ trip, delay }) => {
  const selection = trip?.userSelection || {};
  const city = selection?.destination?.label || selection?.location?.label || selection?.destination || "Unknown Destination";
  // Attempt to format date roughly
  const dateStr = selection?.startDate ? new Date(selection.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Planned Trip';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:shadow-lg transition-all duration-300 h-full"
    >
      <Link to={`/view-trip/${trip.id}`} className="block h-full">
        <div className="aspect-[16/9] relative overflow-hidden">
          <SmartImage
            query={city}
            alt={city}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            width={600}
            height={400}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-xl font-semibold mb-1 line-clamp-1">{city}</h3>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Calendar size={14} />
              <span>{dateStr}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch real trips
  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'AITrips'), where('userEmail', '==', user.email));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by newer first (assuming createdAt is ISO string or close to it)
        // If createdAt is missing, it goes to bottom
        data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setTrips(data);
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [user]);

  const onLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "user", newValue: null })
    );
    navigate("/");
  };

  // Derived Stats
  const processedStats = useMemo(() => {
    const total = trips.length;
    // Count unique "label" from destination object
    const uniqueLocs = new Set(trips.map(t => {
      const sel = t.userSelection;
      return sel?.destination?.label || sel?.location?.label || sel?.destination || null;
    }).filter(Boolean));

    // Most recent trip date
    // (Already sorted, so trips[0])
    const lastTripDate = trips.length > 0 && trips[0].createdAt
      ? new Date(trips[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : "None";

    return [
      { icon: Plane, label: "Total Plans", value: total.toString() },
      { icon: MapPin, label: "Destinations", value: uniqueLocs.size.toString() },
      { icon: Calendar, label: "Last Active", value: lastTripDate },
    ];
  }, [trips]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-secondary/5 to-background pb-24">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-8"
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-black shadow-2xl">
                <img
                  src={user?.picture || "https://ui-avatars.com/api/?name=User"}
                  alt={user?.name || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-2">
                {user?.name || "Traveler"}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">{user?.email || ""}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Globe size={14} />
                  Explorer
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={onLogout}
                title="Log out"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-6 mb-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
              <Loader2 className="animate-spin" size={20} /> Loading stats...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {processedStats.map((stat, idx) => (
                <StatCard key={stat.label} {...stat} delay={idx * 0.1} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Trips */}
      <section className="px-6 mb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-medium text-foreground mb-2">Recent Adventures</h2>
              <p className="text-muted-foreground">Your latest travel plans</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/my-trips')} className="text-primary hover:text-primary/80">
              View All
            </Button>
          </div>

          {loading ? (
            <div className="h-40 bg-muted/30 rounded-2xl animate-pulse" />
          ) : trips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Show only top 3 */}
              {trips.slice(0, 3).map((trip, idx) => (
                <TripCard key={trip.id} trip={trip} delay={idx * 0.1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 dark:bg-black/20 rounded-2xl border border-dashed">
              <p className="text-muted-foreground mb-4">No trips planned yet.</p>
              <Button onClick={() => navigate('/create-trip')}>Start Planning</Button>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
