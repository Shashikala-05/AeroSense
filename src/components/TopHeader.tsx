import { useState } from "react";
import { Clock, Menu, LogOut, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useClock } from "@/lib/aero-data";
import { useSmartDevice } from "@/lib/smart-device";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./AppSidebar";

interface Props {
  title: string;
  subtitle?: string;
}

export function TopHeader({ title, subtitle }: Props) {
  const now = useClock();
  const device = useSmartDevice();
  const wifiConnected = device.status === "connected";
  const connecting = device.status === "connecting";
  const [open, setOpen] = useState(false);
  const { user, signOut, configured } = useAuth();
  const navigate = useNavigate();

  const lastUpdated = device.lastUpdate
    ? device.lastUpdate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 md:px-10 h-16 md:h-20 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Open menu"
              className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border hover:bg-muted transition"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="min-w-0 leading-tight">
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div
          aria-label="Device connection status"
          className="flex items-center gap-2 px-2.5 sm:px-3 h-10 rounded-xl border border-border bg-card"
          title={device.activeUrl ?? undefined}
        >
          <span className="relative inline-flex items-center justify-center">
            {wifiConnected ? (
              <Wifi className="h-4 w-4 text-[color:var(--aero-green)]" />
            ) : connecting ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <WifiOff className="h-4 w-4 text-[color:var(--aero-red)]" />
            )}
            <span
              className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-card ${
                wifiConnected
                  ? "bg-[color:var(--aero-green)] animate-pulse"
                  : connecting
                    ? "bg-muted-foreground"
                    : "bg-[color:var(--aero-red)]"
              }`}
            />
          </span>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span
              className={`text-xs font-semibold ${
                wifiConnected
                  ? "text-[color:var(--aero-green)]"
                  : connecting
                    ? "text-muted-foreground"
                    : "text-[color:var(--aero-red)]"
              }`}
            >
              {wifiConnected
                ? "Device Connected"
                : connecting
                  ? "Connecting…"
                  : "Device Offline"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {wifiConnected ? `Updated ${lastUpdated}` : "Awaiting first reading"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2.5 sm:px-3 h-10 rounded-xl border border-border bg-card">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums">
              {now
                ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </span>
            <span className="hidden sm:inline text-[10px] text-muted-foreground mt-0.5">
              {now
                ? now.toLocaleDateString([], {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : ""}
            </span>
          </div>
        </div>
        {configured && user ? (
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
            aria-label="Sign out"
            className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border hover:bg-muted transition shrink-0"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : configured ? (
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/login"
              className="h-10 inline-flex items-center px-3 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted transition"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="h-10 inline-flex items-center px-3 rounded-xl bg-[color:var(--aero-blue)] text-white text-xs font-semibold hover:opacity-90 transition"
            >
              Sign Up
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}