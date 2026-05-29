import { createFileRoute } from "@tanstack/react-router";
import { Brain, TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Shell } from "@/components/Shell";
import { predictNext } from "@/lib/aero-data";
import { useSmartDevice } from "@/lib/smart-device";

export const Route = createFileRoute("/prediction")({
  head: () => ({ meta: [{ title: "Prediction — AeroSense" }] }),
  component: PredictionPage,
});

const MIN_SAMPLES = 5;

function PredictionPage() {
  const device = useSmartDevice();
  const history = device.history;
  const hasEnough = history.length >= MIN_SAMPLES;

  if (!hasEnough) {
    return (
      <Shell title="AI Prediction" subtitle="Machine learning forecast for the next 2 hours">
        <div className="bg-card rounded-2xl p-10 sm:p-14 border border-border shadow-[var(--shadow-card)] flex flex-col items-center text-center">
          {device.status === "connected" ? (
            <Brain className="h-12 w-12 text-[color:var(--aero-blue)] animate-pulse mb-3" />
          ) : device.status === "connecting" ? (
            <Wifi className="h-12 w-12 text-muted-foreground animate-pulse mb-3" />
          ) : (
            <WifiOff className="h-12 w-12 text-[color:var(--aero-orange)] mb-3" />
          )}
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {device.status === "connected"
              ? `Collecting samples… (${history.length}/${MIN_SAMPLES})`
              : device.status === "connecting"
                ? "Waiting for device…"
                : "No device connected"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            The forecast needs at least {MIN_SAMPLES} live readings before it can estimate a
            trend. Keep the device online and the prediction will populate automatically.
          </p>
        </div>
      </Shell>
    );
  }

  const p = predictNext(history);
  const TrendIcon =
    p.trend === "INCREASE" ? TrendingUp : p.trend === "DECREASE" ? TrendingDown : Minus;
  const trendColor =
    p.trend === "INCREASE"
      ? "text-[color:var(--aero-red)]"
      : p.trend === "DECREASE"
        ? "text-[color:var(--aero-green)]"
        : "text-[color:var(--aero-orange)]";

  return (
    <Shell title="AI Prediction" subtitle="Machine learning forecast for the next 2 hours">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-[color:var(--aero-blue)]/10 flex items-center justify-center shrink-0">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-[color:var(--aero-blue)]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Trend</div>
              <div className={`text-xl sm:text-2xl font-bold flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                {p.trend}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on the last {Math.min(history.length, 12)} live readings from the device,
            pollution levels are expected to {p.trend.toLowerCase()}.
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-[var(--shadow-card)]">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Confidence</div>
          <div className="text-3xl sm:text-4xl font-bold text-foreground mt-2">{p.confidence}%</div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-[color:var(--aero-blue)]"
              style={{ width: `${p.confidence}%` }}
            />
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-[var(--shadow-card)] sm:col-span-2 lg:col-span-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Forecast Window</div>
          <div className="text-3xl sm:text-4xl font-bold text-foreground mt-2">2h</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3">
            7 points · ±{p.points[p.points.length - 1].range} ppm band at +2h
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-3 sm:p-4 md:p-6 border border-border shadow-[var(--shadow-card)] mt-4 sm:mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
          <h3 className="font-semibold text-foreground text-sm sm:text-base">
            Predicted Air Quality (ppm)
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--aero-blue)]/25" />
              95% band
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 bg-[color:var(--aero-blue)]" />
              Forecast
            </span>
          </div>
        </div>
        <div className="h-56 xs:h-64 sm:h-72 md:h-80 -mx-1 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%" debounce={150}>
            <ComposedChart
              data={p.points}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.6 0.2 245)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="oklch(0.6 0.2 245)" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 230)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={12}
                tickMargin={6}
              />
              <YAxis tick={{ fontSize: 11 }} width={36} tickMargin={4} />
              <Tooltip
                cursor={{ stroke: "oklch(0.6 0.2 245)", strokeOpacity: 0.2 }}
                wrapperStyle={{ outline: "none", zIndex: 50 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid oklch(0.92 0.012 230)",
                  fontSize: 12,
                  padding: "8px 10px",
                  boxShadow: "0 8px 24px -10px oklch(0.4 0.05 240 / 0.25)",
                  background: "oklch(1 0 0)",
                  lineHeight: 1.35,
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4, color: "oklch(0.2 0.04 250)" }}
                itemStyle={{ padding: 0 }}
                formatter={(value: number | number[], name) => {
                  if (Array.isArray(value)) {
                    return [`${value[0]}–${value[1]} ppm`, name as string];
                  }
                  return [`${value} ppm`, name as string];
                }}
              />
              <Area
                type="monotone"
                dataKey={(d: { lower: number; upper: number }) => [d.lower, d.upper]}
                stroke="none"
                fill="url(#bandFill)"
                name="95% band"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Forecast"
                stroke="oklch(0.6 0.2 245)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "oklch(0.6 0.2 245)" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Shell>
  );
}
