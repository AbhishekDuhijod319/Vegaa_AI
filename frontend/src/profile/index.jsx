import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MapPin, Calendar, Globe, LogOut,
  Plane, Loader2, Camera, Pencil, X, Check,
  AlertTriangle, Trash2, Users, Wallet
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { tripApi } from '@/api/trips';
import SmartImage from "@/components/ui/SmartImage";
import { useReveal } from "@/lib/useReveal";
import { toast } from "sonner";
import { imageApi } from '@/api/images';

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, delay }) => (
  <div
    className="reveal relative p-6 rounded-2xl glass-card overflow-hidden group transition-all duration-300"
    data-reveal-delay={delay * 1000}
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
  </div>
);

// Helper: format currency
const formatCurrency = (amount, currency = 'INR') => {
  if (!amount && amount !== 0) return null;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
};

// Recent Trip Card — Enhanced with budget, days, travelers
const TripCard = ({ trip, delay }) => {
  const selection = trip?.userSelection || {};
  const city = selection?.destination?.label || selection?.location?.label || selection?.destination || "Unknown Destination";
  const dateStr = selection?.startDate
    ? new Date(selection.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Planned Trip';
  const days = selection?.noOfDays || null;
  const budget = formatCurrency(selection?.amount, selection?.currency);
  const travelers = selection?.numTravelers || 1;

  return (
    <div
      className="reveal group relative rounded-2xl overflow-hidden bg-card border border-border hover:shadow-lg transition-all duration-300 h-full"
      data-reveal-delay={delay * 1000}
    >
      <Link to={`/view-trip/${trip._id || trip.id}`} className="block h-full">
        <div className="aspect-[16/9] relative overflow-hidden">
          <SmartImage
            query={city}
            alt={city}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            width={600}
            height={400}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-xl font-semibold mb-1 line-clamp-1">{city}</h3>
            <div className="flex items-center gap-3 text-sm text-white/80 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {dateStr}
              </span>
              {days && (
                <span className="flex items-center gap-1">• {days} days</span>
              )}
              {budget && (
                <span className="flex items-center gap-1">
                  <Wallet size={13} />
                  {budget}
                </span>
              )}
              {travelers > 1 && (
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {travelers}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser, updateProfile, scheduleDeletion, cancelDeletion } = useAuth();

  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const containerRef = useReveal();

  // Fetch trips and stats once the user is confirmed authenticated
  // (fault-tolerant — one failing won't block the other)
  useEffect(() => {
    if (!user) return; // Wait until auth is resolved

    let cancelled = false;
    const fetchData = async () => {
      try {
        const [tripsResult, statsResult] = await Promise.allSettled([
          tripApi.list(),
          tripApi.getStats(),
        ]);

        if (cancelled) return;

        if (tripsResult.status === 'fulfilled') {
          setTrips(tripsResult.value.trips || []);
        } else {
          console.error("Failed to fetch trips:", tripsResult.reason);
        }

        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value.stats || null);
        } else {
          console.error("Failed to fetch stats:", statsResult.reason);
        }
      } catch (err) {
        if (!cancelled) console.error("Error fetching profile data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Initialize edit fields when user changes or edit mode entered
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
    }
  }, [user]);

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  // ─── Profile Edit ─────────────────────────────────
  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();

    if (!trimmedName || trimmedName.length > 100) {
      toast.error('Name must be between 1 and 100 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Only send changed fields
    const updates = {};
    if (trimmedName !== user.name) updates.name = trimmedName;
    if (trimmedEmail !== user.email) updates.email = trimmedEmail;

    if (!Object.keys(updates).length) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateProfile(updates);
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update profile.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setIsEditing(false);
  };

  // ─── Schedule Account Deletion ─────────────────────
  const handleScheduleDeletion = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const result = await scheduleDeletion();
      toast.success(result.message);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      // Log user out
      await logout();
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to schedule deletion.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      await cancelDeletion();
      toast.success('Account deletion cancelled! Your account is active.');
    } catch (err) {
      toast.error('Failed to cancel deletion.');
    }
  };

  // ─── Avatar Upload ─────────────────────────────────
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image (JPEG, PNG, WebP, or GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const result = await imageApi.uploadAvatar(file);
      updateUser({ picture: result.picture });
      toast.success('Profile picture updated!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to upload avatar. Please try again.';
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Derived Stats (from API)
  const processedStats = useMemo(() => {
    if (stats) {
      const lastTripDate = trips.length > 0 && trips[0].createdAt
        ? new Date(trips[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : "None";
      return [
        { icon: Plane, label: "Total Plans", value: stats.totalTrips?.toString() || '0' },
        { icon: MapPin, label: "Destinations", value: stats.uniqueDestinations?.toString() || '0' },
        { icon: Calendar, label: "Last Active", value: lastTripDate },
      ];
    }
    // Fallback to client-side
    const total = trips.length;
    const uniqueLocs = new Set(trips.map(t => {
      const sel = t.userSelection;
      return sel?.destination?.label || sel?.location?.label || sel?.destination || null;
    }).filter(Boolean));
    const lastTripDate = trips.length > 0 && trips[0].createdAt
      ? new Date(trips[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : "None";

    return [
      { icon: Plane, label: "Total Plans", value: total.toString() },
      { icon: MapPin, label: "Destinations", value: uniqueLocs.size.toString() },
      { icon: Calendar, label: "Last Active", value: lastTripDate },
    ];
  }, [trips, stats]);

  if (!user) return null;

  const hasPendingDeletion = !!user.deletionScheduledAt;
  const deletionDate = hasPendingDeletion ? new Date(user.deletionScheduledAt) : null;

  return (
    <main className="min-h-screen bg-background pb-24" ref={containerRef}>

      {/* Deletion Warning Banner */}
      {hasPendingDeletion && (
        <div className="bg-red-500/10 border-b border-red-500/20" style={{ paddingTop: 'calc(var(--app-header-offset, 80px) + 0.5rem)' }}>
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={20} />
              <div>
                <p className="font-semibold">Account scheduled for deletion</p>
                <p className="text-sm text-red-500">
                  Your account will be permanently deleted on{' '}
                  <strong>{deletionDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
                  Cancel now to keep your account active.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={handleCancelDeletion}
            >
              Cancel Deletion
            </Button>
          </div>
        </div>
      )}

      {/* Profile Card Section */}
      <section className="px-4 sm:px-6" style={{ paddingTop: hasPendingDeletion ? '2rem' : 'calc(var(--app-header-offset, 80px) + 2rem)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
            {/* Profile Header */}
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Avatar with Upload */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-border shadow-md">
                    {uploadingAvatar ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <img
                        src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&size=256`}
                        alt={user?.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                    aria-label="Change profile picture"
                  >
                    <div className="flex flex-col items-center gap-0.5 text-white">
                      <Camera size={18} />
                      <span className="text-[10px] font-medium">Change</span>
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                    aria-hidden="true"
                  />
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                  {isEditing ? (
                    <div className="space-y-3 max-w-sm">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                          placeholder="Your name"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div className="flex gap-2 justify-center sm:justify-start pt-1">
                        <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="rounded-full gap-1.5 text-sm">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check size={14} />}
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saving} className="rounded-full gap-1.5 text-sm">
                          <X size={14} /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-1 truncate">
                        {user?.name || "Traveler"}
                      </h1>
                      <p className="text-sm text-muted-foreground mb-3">{user?.email || ""}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Globe size={12} />
                          Explorer
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-full h-7 px-3"
                        >
                          <Pencil size={12} /> Edit
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5 text-sm"
                    onClick={onLogout}
                  >
                    <LogOut size={14} /> Log Out
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Row — inside the card */}
            <div className="border-t border-border">
              {loading ? (
                <div className="grid grid-cols-3 divide-x divide-border">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="p-5 text-center animate-pulse">
                      <div className="h-7 w-12 bg-muted rounded mx-auto mb-1" />
                      <div className="h-3 w-16 bg-muted/60 rounded mx-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 divide-x divide-border">
                  {processedStats.map((stat) => (
                    <div key={stat.label} className="p-3 sm:p-4 md:p-5 text-center">
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                      <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-1">
                        <stat.icon size={11} />
                        <span className="truncate">{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Adventures */}
      <section className="px-4 sm:px-6 mt-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Adventures</h2>
            {trips.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/my-trips')} className="text-primary hover:text-primary/80 text-sm">
                View All →
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-2xl border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted/60 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : trips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {trips.slice(0, 3).map((trip, idx) => (
                <TripCard key={trip._id || trip.id} trip={trip} delay={idx * 0.1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-card border border-dashed border-border">
              <Plane size={40} className="mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="text-muted-foreground mb-4 text-sm">No trips planned yet. Start your adventure!</p>
              <Button size="sm" onClick={() => navigate('/create-trip')}>Start Planning</Button>
            </div>
          )}
        </div>
      </section>

      {/* Danger Zone — Account Deletion */}
      <section className="px-4 sm:px-6 mt-10">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-red-200/60 bg-red-50/30 p-5">
            <h3 className="text-sm font-semibold text-red-600 mb-1.5 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Danger Zone
            </h3>
            <p className="text-xs text-red-500/70 mb-4 leading-relaxed">
              Once you delete your account, there is no going back. Your account will be scheduled
              for permanent deletion after 30 days. Log in within 30 days to cancel.
            </p>

            {showDeleteConfirm ? (
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-red-600 mb-1.5">
                    Type <strong>DELETE</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-red-300 bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    placeholder="Type DELETE here"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleScheduleDeletion}
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                    className="gap-1.5 text-sm"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 size={14} />}
                    Schedule Deletion
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-100 gap-1.5 text-sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={hasPendingDeletion}
              >
                <Trash2 size={14} />
                {hasPendingDeletion ? `Deletion scheduled for ${deletionDate.toLocaleDateString()}` : 'Delete Account'}
              </Button>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}
