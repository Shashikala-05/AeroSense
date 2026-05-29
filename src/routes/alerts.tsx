import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, X, CheckCheck, BellOff, ShieldCheck, Plus } from "lucide-react";
import { Shell } from "@/components/Shell";
import type { AlertCategory, AlertSeverity } from "@/lib/aero-data";
import {
  useSmartDevice,
  dismissAlert,
  markAlertRead,
  markAllAlertsRead,
  addMuteRule,
  removeMuteRule,
} from "@/lib/smart-device";
import logo from "@/assets/aerosense-logo.png";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts — AeroSense" }] }),
  component: AlertsPage,
});

const sevColors: Record<AlertSeverity, string> = {
  low: "bg-[color:var(--aero-green)] text-white",
  moderate: "bg-[color:var(--aero-yellow)] text-foreground",
  high: "bg-[color:var(--aero-orange)] text-white",
  severe: "bg-[color:var(--aero-red)] text-white",
};

const categoryLabel: Record<AlertCategory, string> = {
  air: "Air Quality",
  co: "CO Level",
  temp: "Temperature",
  humidity: "Humidity",
};

type StatusFilter = "all" | "active" | "cleared" | "unread";

function AlertsPage() {
  const { alerts, muteRules } = useSmartDevice();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [sevFilter, setSevFilter] = useState<AlertSeverity | "all">("all");
  const [catFilter, setCatFilter] = useState<AlertCategory | "all">("all");
  const [newRule, setNewRule] = useState<{
    category: AlertCategory | "all";
    severity: AlertSeverity | "all";
  }>({ category: "all", severity: "low" });

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (status === "active" && !a.active) return false;
      if (status === "cleared" && a.active) return false;
      if (status === "unread" && a.read) return false;
      if (sevFilter !== "all" && a.severity !== sevFilter) return false;
      if (catFilter !== "all" && a.category !== catFilter) return false;
      return true;
    });
  }, [alerts, status, sevFilter, catFilter]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <Shell title="Health Alerts" subtitle="Stay safe with personalized warnings">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)] flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 mr-auto">
              <div className="h-9 w-9 rounded-xl bg-[color:var(--aero-blue)]/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-[color:var(--aero-blue)]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {filtered.length} alert{filtered.length === 1 ? "" : "s"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </div>
              </div>
            </div>
            <button
              onClick={markAllAlertsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-[color:var(--aero-green)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)] space-y-3">
            <FilterRow label="Status">
              {(["all", "active", "cleared", "unread"] as StatusFilter[]).map(
                (s) => (
                  <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                    {s}
                  </Chip>
                ),
              )}
            </FilterRow>
            <FilterRow label="Severity">
              {(["all", "low", "moderate", "high", "severe"] as const).map((s) => (
                <Chip
                  key={s}
                  active={sevFilter === s}
                  onClick={() => setSevFilter(s)}
                >
                  {s}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Source">
              {(["all", "air", "co", "temp", "humidity"] as const).map((c) => (
                <Chip
                  key={c}
                  active={catFilter === c}
                  onClick={() => setCatFilter(c)}
                >
                  {c === "all" ? "all" : categoryLabel[c]}
                </Chip>
              ))}
            </FilterRow>
          </div>

          {/* Alerts list */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="bg-card rounded-2xl p-12 border border-border text-center text-muted-foreground">
                No alerts match your filters.
              </div>
            )}
            {filtered.map((a) => (
              <div
                key={a.id}
                className={`bg-card rounded-2xl p-5 border shadow-[var(--shadow-card)] flex items-start gap-4 transition ${
                  a.read ? "border-border opacity-80" : "border-[color:var(--aero-blue)]/30"
                }`}
              >
                <img
                  src={logo}
                  alt="AeroSense"
                  className="h-12 w-12 rounded-2xl object-cover shrink-0 bg-muted/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!a.read && (
                      <span className="h-2 w-2 rounded-full bg-[color:var(--aero-blue)]" />
                    )}
                    <div className="font-semibold text-foreground">{a.message}</div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sevColors[a.severity]}`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {categoryLabel[a.category]}
                    </span>
                    {!a.active && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        cleared
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {a.time.toLocaleString([], {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-[color:var(--aero-green)]/8 border border-[color:var(--aero-green)]/20 p-3">
                    <ShieldCheck className="h-4 w-4 text-[color:var(--aero-green)] mt-0.5 shrink-0" />
                    <div className="text-sm text-foreground">
                      <span className="font-semibold text-[color:var(--aero-green)]">
                        Precaution:{" "}
                      </span>
                      {a.precaution}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {!a.read && (
                    <button
                      onClick={() => markAlertRead(a.id)}
                      className="text-xs font-medium text-[color:var(--aero-blue)] hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  {a.active && (
                    <button
                      onClick={() => dismissAlert(a.id)}
                      className="text-muted-foreground hover:text-foreground transition"
                      aria-label="Dismiss"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mute rules sidebar */}
        <aside className="bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)] h-fit space-y-4">
          <div className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-[color:var(--aero-purple)]" />
            <h3 className="font-semibold text-foreground">Mute Rules</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Suppress new alerts that match these conditions.
          </p>

          <div className="space-y-2">
            {muteRules.length === 0 && (
              <div className="text-xs text-muted-foreground italic">
                No mute rules active.
              </div>
            )}
            {muteRules.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 bg-muted/50 rounded-xl px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {r.category === "all" ? "All sources" : categoryLabel[r.category]}
                  </span>
                  <span className="text-muted-foreground"> · {r.severity}</span>
                </div>
                <button
                  onClick={() => removeMuteRule(i)}
                  className="text-muted-foreground hover:text-[color:var(--aero-red)]"
                  aria-label="Remove rule"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Add rule
            </div>
            <label className="block text-xs text-muted-foreground">
              Source
              <select
                value={newRule.category}
                onChange={(e) =>
                  setNewRule((r) => ({
                    ...r,
                    category: e.target.value as AlertCategory | "all",
                  }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              >
                <option value="all">All sources</option>
                <option value="air">Air Quality</option>
                <option value="co">CO Level</option>
                <option value="temp">Temperature</option>
                <option value="humidity">Humidity</option>
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              Severity
              <select
                value={newRule.severity}
                onChange={(e) =>
                  setNewRule((r) => ({
                    ...r,
                    severity: e.target.value as AlertSeverity | "all",
                  }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              >
                <option value="all">All severities</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="severe">Severe</option>
              </select>
            </label>
            <button
              onClick={() => addMuteRule(newRule)}
              className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-xl text-sm font-medium bg-[color:var(--aero-purple)] text-white hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" />
              Add mute rule
            </button>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16 shrink-0">
        {label}
      </span>
      <div className="flex gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
        active
          ? "bg-[color:var(--aero-green)] text-white"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {children}
    </button>
  );
}
