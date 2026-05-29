import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wifi, WifiOff, Table as TableIcon, Download, Trash2, LineChart } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useSmartDevice, clearHistory } from "@/lib/smart-device";
import type { Reading } from "@/lib/aero-data";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/live")({
  head: () => ({ meta: [{ title: "Live Data — AeroSense" }] }),
  component: LivePage,
});

const series = [
  { key: "airQuality", label: "Air Quality (MQ135, ppm)", color: "oklch(0.62 0.18 155)" },
  { key: "coLevel", label: "CO Level (MQ7, ppm)", color: "oklch(0.6 0.22 295)" },
  { key: "temperature", label: "Temperature (°C)", color: "oklch(0.7 0.19 50)" },
  { key: "humidity", label: "Humidity (%)", color: "oklch(0.6 0.2 245)" },
] as const;

const TABLE_ROW_LIMIT = 500;

function buildCsv(rows: Reading[]): string {
  const header = "time,airQuality_ppm,coLevel_ppm,temperature_c,humidity_pct";
  const body = rows.map(
    (r) =>
      `${r.time.toISOString()},${r.airQuality.toFixed(2)},${r.coLevel.toFixed(2)},${r.temperature.toFixed(2)},${r.humidity.toFixed(2)}`,
  );
  return [header, ...body].join("\n") + "\n";
}

function downloadCsv(rows: Reading[]) {
  if (rows.length === 0) return;
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `aerosense-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function LivePage() {
  const device = useSmartDevice();
  const [showTable, setShowTable] = useState(false);

  const chartData = device.history.slice(-30).map((r) => ({
    time: r.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    airQuality: +r.airQuality.toFixed(1),
    coLevel: +r.coLevel.toFixed(1),
    temperature: +r.temperature.toFixed(1),
    humidity: +r.humidity.toFixed(1),
  }));

  // Newest first for the table; cap to keep DOM rendering snappy.
  const tableRows = [...device.history].reverse().slice(0, TABLE_ROW_LIMIT);
  const totalRows = device.history.length;
  const hasData = totalRows > 0;

  return (
    <Shell title="Live Data" subtitle="Real-time sensor feed — updates every 2 seconds">
      {/* Toolbar: status + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {device.status === "connected" ? (
            <span
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-[color:var(--aero-green)]/30 bg-[color:var(--aero-green)]/10 text-[color:var(--aero-green)]"
              title={device.lastUpdate ? `Last update: ${device.lastUpdate.toLocaleTimeString()}` : ""}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--aero-green)] opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--aero-green)]" />
              </span>
              <Wifi className="h-3.5 w-3.5" />
              Device connected · {totalRows} samples
            </span>
          ) : device.status === "connecting" ? (
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
              <Wifi className="h-3.5 w-3.5 animate-pulse" />
              Searching for device…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-[color:var(--aero-orange)]/30 bg-[color:var(--aero-orange)]/10 text-[color:var(--aero-orange)]">
              <WifiOff className="h-3.5 w-3.5" />
              Device offline · no data
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTable((v) => !v)}
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition"
          >
            {showTable ? (
              <>
                <LineChart className="h-3.5 w-3.5" /> View Charts
              </>
            ) : (
              <>
                <TableIcon className="h-3.5 w-3.5" /> View Data
              </>
            )}
          </button>
          <button
            onClick={() => downloadCsv(device.history)}
            disabled={!hasData}
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={hasData ? `Download ${totalRows} rows as CSV` : "No data to download"}
          >
            <Download className="h-3.5 w-3.5" /> Download CSV
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Clear all ${totalRows} stored readings?`)) clearHistory();
            }}
            disabled={!hasData}
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-[color:var(--aero-red)]"
            title="Clear stored history"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-card rounded-2xl p-10 sm:p-14 border border-border shadow-[var(--shadow-card)] flex flex-col items-center text-center">
          {device.status === "connecting" ? (
            <Wifi className="h-12 w-12 text-muted-foreground animate-pulse mb-3" />
          ) : (
            <WifiOff className="h-12 w-12 text-[color:var(--aero-orange)] mb-3" />
          )}
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {device.status === "connecting" ? "Waiting for first reading…" : "No device connected"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Fetching from <code className="font-mono text-foreground">/device-api/data</code>{" "}
            (proxied to the device by Vite). Charts and the data table will populate as readings
            arrive.
          </p>
        </div>
      ) : showTable ? (
        <DataTable rows={tableRows} totalRows={totalRows} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {series.map((s) => (
            <div
              key={s.key}
              className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)]"
            >
              <h3 className="font-semibold text-foreground mb-4">{s.label}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" debounce={150}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 230)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey={s.key}
                      stroke={s.color}
                      strokeWidth={2}
                      fill={`url(#g-${s.key})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

function DataTable({ rows, totalRows }: { rows: Reading[]; totalRows: number }) {
  const truncated = totalRows > rows.length;
  return (
    <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">All readings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalRows} total · newest first
            {truncated && ` · showing latest ${rows.length} (download CSV for full data)`}
          </p>
        </div>
      </div>
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2 font-semibold">Time</th>
              <th className="px-4 py-2 font-semibold text-right">Air Quality (ppm)</th>
              <th className="px-4 py-2 font-semibold text-right">CO (ppm)</th>
              <th className="px-4 py-2 font-semibold text-right">Temp (°C)</th>
              <th className="px-4 py-2 font-semibold text-right">Humidity (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-t border-border/60 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">
                  {r.time.toLocaleString([], {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{r.airQuality.toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.coLevel.toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.temperature.toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.humidity.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
