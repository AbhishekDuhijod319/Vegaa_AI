import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "user", newValue: null })
    );
    navigate("/");
  };

  if (!user) return null;

  return (
    <main className="min-h-[80svh] px-6 md:px-20 lg:px-44 xl:px-56 py-10 mt-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your account information.
        </p>
      </div>

      {/* User Info Card */}
      <section className="mt-8 rounded-xl border border-border bg-card">
        {/* Avatar row */}
        <div className="flex items-center gap-4 p-5">
          <div className="flex-1">
            <div className="font-medium">Avatar</div>
            <div className="text-sm text-muted-foreground">
              Your profile Photo
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={user?.picture || "https://ui-avatars.com/api/?name=User"}
              alt={user?.name || "User"}
              className="h-14 w-14 rounded-md object-cover border"
            />
          </div>
        </div>
        <div className="border-t border-border" />
        {/* Name row */}
        <div className="flex items-center gap-4 p-5">
          <div className="flex-1">
            <div className="font-medium">Name</div>
            <div className="text-sm text-muted-foreground">
              Your profile name
            </div>
          </div>
          <div className="w-full sm:w-1/2 md:w-1/3 end">
            <div className="font-semibold">
              {user?.name || "Anonymous User"}
            </div>
          </div>
        </div>
        <div className="border-t border-border" />
        {/* Gmail row */}
        <div className="flex items-center gap-4 p-5">
          <div className="flex-1">
            <div className="font-medium">Gmail ID</div>
            <div className="text-sm text-muted-foreground">
              Your login method
            </div>
          </div>
          <div className="w-full sm:w-1/2 md:w-1/3">
            <div className="font-semibold truncate">
              {user?.email || "Unknown"}
            </div>
          </div>
        </div>
      </section>

      {/* Account Access */}
      <section className="mt-10 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="font-medium">Log Out Current Account</div>
          </div>
          <Button variant="secondary" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mt-6 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="font-medium">Delete Account</div>
            <div className="text-sm text-muted-foreground">
              Permanently delete your account data.
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() =>
              toast("Account deletion is not available in this demo.")
            }
          >
            Delete
          </Button>
        </div>
      </section>
    </main>
  );
}
