import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useSmartDevice } from "@/lib/smart-device";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — AeroSense" }] }),
  component: SettingsPage,
});

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-[color:var(--aero-green)]" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingsPage() {
  const device = useSmartDevice();
  const [notifications, setNotifications] = useState(true);
  const [aqThreshold, setAqThreshold] = useState(150);
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");

  const statusLabel =
    device.status === "connected"
      ? "Connected"
      : device.status === "connecting"
        ? "Connecting…"
        : "Offline";

  const statusColor =
    device.status === "connected"
      ? "text-[color:var(--aero-green)]"
      : device.status === "connecting"
        ? "text-muted-foreground"
        : "text-[color:var(--aero-red)]";

  const StatusIcon =
    device.status === "connected" ? Wifi : device.status === "connecting" ? Loader2 : WifiOff;

  return (
    <Shell title="Settings" subtitle="Configure your AeroSense experience">
      <div className="max-w-2xl space-y-5">
        <section className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-semibold text-foreground mb-4">Device</h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-foreground">Connection</div>
              <div className="text-xs text-muted-foreground">
                Polling <code className="font-mono">/device-api/data</code> every 2 seconds
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 text-sm font-semibold ${statusColor}`}>
              <StatusIcon
                className={`h-4 w-4 ${device.status === "connecting" ? "animate-spin" : ""}`}
              />
              {statusLabel}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <div className="text-sm font-medium text-foreground">Active URL</div>
              <div className="text-xs text-muted-foreground">
                Configured in <code className="font-mono">vite.config.ts</code> via
                {" "}<code className="font-mono">DEVICE_TARGET</code>
              </div>
            </div>
            <code className="font-mono text-xs text-foreground">
              {device.activeUrl ?? "—"}
            </code>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <div className="text-sm font-medium text-foreground">Last update</div>
              <div className="text-xs text-muted-foreground">
                Timestamp of the latest successful reading
              </div>
            </div>
            <div className="text-sm text-foreground tabular-nums">
              {device.lastUpdate ? device.lastUpdate.toLocaleString() : "—"}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <div className="text-sm font-medium text-foreground">Samples in memory</div>
              <div className="text-xs text-muted-foreground">
                Retained for the current session (table view + CSV export)
              </div>
            </div>
            <div className="text-sm font-semibold text-foreground tabular-nums">
              {device.history.length}
            </div>
          </div>
        </section>

        <section className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-semibold text-foreground mb-4">Alerts</h3>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-foreground">Enable notifications</div>
              <div className="text-xs text-muted-foreground">Get notified of unsafe air conditions</div>
            </div>
            <Toggle checked={notifications} onChange={() => setNotifications((v) => !v)} />
          </div>
          <div className="py-3">
            <label className="text-sm font-medium text-foreground">
              Air Quality alert threshold:{" "}
              <span className="text-[color:var(--aero-orange)]">{aqThreshold} ppm</span>
            </label>
            <input
              type="range"
              min={50}
              max={250}
              value={aqThreshold}
              onChange={(e) => setAqThreshold(+e.target.value)}
              className="w-full mt-2 accent-[color:var(--aero-green)]"
            />
          </div>
        </section>

        <section className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-semibold text-foreground mb-4">Units</h3>
          <div className="flex gap-2">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  unit === u
                    ? "bg-[color:var(--aero-green)] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {u === "metric" ? "Metric (°C)" : "Imperial (°F)"}
              </button>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
