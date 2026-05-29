import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useSmartDevice, type DeviceReading, type DeviceStatus } from "@/lib/smart-device";
import {
  Cloud,
  CloudFog,
  Thermometer,
  Droplet,
  Brain,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Volume2,
  VolumeX,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Shell } from "@/components/Shell";
import { MetricCard } from "@/components/MetricCard";
import {
  airQualityStatus,
  coStatus,
  humidityStatus,
  overallStatus,
  predictNext,
  tempStatus,
  type Reading,
} from "@/lib/aero-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AeroSense — Real-time Air Quality Dashboard" },
      {
        name: "description",
        content:
          "AI-powered air quality monitoring with live readings, predictions, and health precautions.",
      },
    ],
  }),
  component: Dashboard,
});

const statusTone: Record<string, string> = {
  safe: "bg-[color:var(--aero-green)]/10 text-[color:var(--aero-green)] border-[color:var(--aero-green)]/30",
  moderate:
    "bg-[color:var(--aero-yellow)]/15 text-[color:var(--aero-orange)] border-[color:var(--aero-orange)]/30",
  warning:
    "bg-[color:var(--aero-orange)]/10 text-[color:var(--aero-orange)] border-[color:var(--aero-orange)]/30",
  danger: "bg-[color:var(--aero-red)]/10 text-[color:var(--aero-red)] border-[color:var(--aero-red)]/30",
};

// SmartDevice polling lives in src/lib/smart-device.ts as a singleton so it
// can be shared across routes (dashboard, /live, etc.) without double-polling.

function Dashboard() {
  const device = useSmartDevice();
  const latest = device.reading;
  const history = device.history;

  // Alarm sound + danger popup
  const [muted, setMuted] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const dangerActive = !!latest && (latest.airQuality > 150 || latest.coLevel > 20);
  const dangerKey = latest
    ? `${Math.round(latest.airQuality)}-${Math.round(latest.coLevel)}`
    : "no-data";

  function beep() {
    if (muted || typeof window === "undefined") return;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      [0, 0.25, 0.5].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + t);
        gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.2);
      });
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (dangerActive && dismissedKey !== "active") {
      setShowDanger(true);
      beep();
    } else if (!dangerActive) {
      setShowDanger(false);
      setDismissedKey(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dangerKey, dangerActive]);

  return (
    <Shell title="Dashboard" subtitle="Real-time Air Quality Monitoring">
      {/* Danger Popup */}
      {showDanger && dangerActive && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 animate-fade-in pointer-events-none">
          <div className="pointer-events-auto max-w-lg w-full bg-[color:var(--aero-red)] text-white rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-5 flex items-start gap-3">
            <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base sm:text-lg leading-tight">
                High Pollution Detected
              </div>
              <div className="text-sm opacity-90 mt-0.5">Unsafe Air Quality</div>
              <div className="text-xs opacity-80 mt-1">
                AQ {latest.airQuality.toFixed(0)} PPB · CO {latest.coLevel.toFixed(0)} PPM
              </div>
            </div>
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute alarm" : "Mute alarm"}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                setShowDanger(false);
                setDismissedKey("active");
              }}
              aria-label="Dismiss"
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top-right controls: device status + mute toggle */}
      <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
        {/* Device connection status */}
        {device.status === "connected" ? (
          <span
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-[color:var(--aero-green)]/30 bg-[color:var(--aero-green)]/10 text-[color:var(--aero-green)]"
            title={`${device.activeUrl ?? "Connected"}${device.lastUpdate ? ` · last update ${device.lastUpdate.toLocaleTimeString()}` : ""}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--aero-green)] opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--aero-green)]" />
            </span>
            <Wifi className="h-3.5 w-3.5" />
            Device connected
            {device.activeUrl?.includes("192.168.4.1") && (
              <span className="opacity-70">· via IP</span>
            )}
          </span>
        ) : device.status === "connecting" ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
            <Wifi className="h-3.5 w-3.5 animate-pulse" />
            Searching for device…
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-[color:var(--aero-orange)]/30 bg-[color:var(--aero-orange)]/10 text-[color:var(--aero-orange)]"
            title="Tried smartdevice.local and 192.168.4.1 — both unreachable"
          >
            <WifiOff className="h-3.5 w-3.5" />
            Device offline · no data
          </span>
        )}

        <button
          onClick={() => setMuted((m) => !m)}
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition"
        >
          {muted ? (
            <>
              <VolumeX className="h-3.5 w-3.5" /> Alerts muted
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5 text-[color:var(--aero-blue)]" /> Alert sound on
            </>
          )}
        </button>
      </div>

      {latest ? (
        <LiveReadings latest={latest} history={history} />
      ) : (
        <EmptyDeviceState status={device.status} activeUrl={device.activeUrl} />
      )}
    </Shell>
  );
}

function LiveReadings({
  latest,
  history,
}: {
  latest: DeviceReading;
  history: Reading[];
}) {
  const prediction = predictNext(history);
  const status = overallStatus({ ...latest, time: new Date() });
  const enoughForPrediction = history.length >= 5;

  return (
    <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Air Quality (MQ135)"
          value={latest.airQuality.toFixed(0)}
          unit="PPB"
          status={airQualityStatus(latest.airQuality)}
          icon={Cloud}
          accent="green"
        />
        <MetricCard
          title="CO Level (MQ7)"
          value={latest.coLevel.toFixed(0)}
          unit="PPM"
          status={coStatus(latest.coLevel)}
          icon={CloudFog}
          accent="purple"
        />
        <MetricCard
          title="Temperature (DHT11)"
          value={latest.temperature.toFixed(1)}
          unit="°C"
          status={tempStatus(latest.temperature)}
          icon={Thermometer}
          accent="orange"
        />
        <MetricCard
          title="Humidity (DHT11)"
          value={latest.humidity.toFixed(1)}
          unit="%"
          status={humidityStatus(latest.humidity)}
          icon={Droplet}
          accent="blue"
        />
      </div>

      {/* Prediction + Air Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-semibold text-foreground mb-4">ML Prediction (Next 2 Hours)</h3>
          {enoughForPrediction ? (
            <>
              <div className="bg-muted/40 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-[color:var(--aero-blue)]/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-[color:var(--aero-blue)]" />
                  </div>
                  <div>
                    <div className="text-sm text-foreground">Pollution may</div>
                    <div
                      className={`text-2xl font-bold ${
                        prediction.trend === "INCREASE"
                          ? "text-[color:var(--aero-red)]"
                          : prediction.trend === "DECREASE"
                          ? "text-[color:var(--aero-green)]"
                          : "text-[color:var(--aero-orange)]"
                      }`}
                    >
                      {prediction.trend}
                    </div>
                    <div className="text-sm text-muted-foreground">in next 2 hours</div>
                  </div>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%" debounce={150}>
                    <AreaChart data={prediction.points}>
                      <defs>
                        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.62 0.24 25)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="oklch(0.62 0.24 25)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="oklch(0.62 0.24 25)"
                        strokeWidth={2}
                        fill="url(#pg)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Confidence</span>
                  <span className="font-semibold text-foreground">{prediction.confidence}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[color:var(--aero-blue)] transition-all duration-700"
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-muted/40 rounded-2xl p-6 text-sm text-muted-foreground flex items-center gap-3">
              <Brain className="h-5 w-5 text-[color:var(--aero-blue)]" />
              Collecting samples… ({history.length}/5)
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-semibold text-foreground mb-4">Air Status</h3>
          <div
            className={`rounded-2xl p-6 border flex items-center gap-5 h-[calc(100%-2.5rem)] ${statusTone[status.tone]}`}
          >
            <div className="h-20 w-20 rounded-2xl bg-current/10 flex items-center justify-center">
              {status.tone === "safe" ? (
                <ShieldCheck className="h-10 w-10" />
              ) : status.tone === "danger" ? (
                <AlertTriangle className="h-10 w-10" />
              ) : (
                <ShieldAlert className="h-10 w-10" />
              )}
            </div>
            <div>
              <div className="text-4xl font-bold">{status.label}</div>
              <div className="text-base font-semibold mt-1">
                Environment is {status.tone === "safe" ? "Good" : status.tone === "danger" ? "Hazardous" : "Concerning"}
              </div>
              <div className="text-sm opacity-80 mt-1">
                {status.tone === "safe"
                  ? "All parameters are within safe limits."
                  : "Some parameters require attention."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyDeviceState({
  status,
  activeUrl,
}: {
  status: DeviceStatus;
  activeUrl: string | null;
}) {
  const isSearching = status === "connecting";
  return (
    <div className="bg-card rounded-2xl p-10 sm:p-14 border border-border shadow-[var(--shadow-card)] flex flex-col items-center text-center">
      {isSearching ? (
        <Wifi className="h-12 w-12 text-muted-foreground animate-pulse mb-3" />
      ) : (
        <WifiOff className="h-12 w-12 text-[color:var(--aero-orange)] mb-3" />
      )}
      <h2 className="text-lg sm:text-xl font-semibold text-foreground">
        {isSearching ? "Searching for device…" : "No device connected"}
      </h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        Fetching from <code className="font-mono text-foreground">/device-api/data</code>
        {" "}(proxied to the device by Vite). Readings will appear here as soon as
        the device responds.
      </p>
      {activeUrl && (
        <p className="text-xs text-muted-foreground mt-3">Last active: {activeUrl}</p>
      )}
    </div>
  );
}
