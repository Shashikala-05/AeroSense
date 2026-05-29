import { useEffect, useState } from "react";

export interface Reading {
  time: Date;
  airQuality: number; // PPB
  coLevel: number; // PPM
  temperature: number; // °C
  humidity: number; // %
}

export type AlertSeverity = "low" | "moderate" | "high" | "severe";
export type AlertCategory = "air" | "co" | "temp" | "humidity";

export interface AlertItem {
  id: string;
  time: Date;
  message: string;
  precaution: string;
  severity: AlertSeverity;
  category: AlertCategory;
  active: boolean;
  read: boolean;
}

export interface MuteRule {
  category: AlertCategory | "all";
  severity: AlertSeverity | "all";
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function generateReading(prev?: Reading): Reading {
  const base = prev ?? {
    time: new Date(),
    airQuality: 120,
    coLevel: 12,
    temperature: 29,
    humidity: 60,
  };
  return {
    time: new Date(),
    airQuality: clamp(base.airQuality + (Math.random() - 0.45) * 8, 60, 280),
    coLevel: clamp(base.coLevel + (Math.random() - 0.5) * 2, 2, 40),
    temperature: clamp(base.temperature + (Math.random() - 0.5) * 0.4, 18, 38),
    humidity: clamp(base.humidity + (Math.random() - 0.5) * 1.5, 30, 90),
  };
}

// Seed initial history
function seedHistory(count: number): Reading[] {
  const out: Reading[] = [];
  let prev: Reading | undefined;
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const r = generateReading(prev);
    r.time = new Date(now - i * 10 * 60 * 1000); // every 10 min
    out.push(r);
    prev = r;
  }
  return out;
}

// Global singleton store so all pages share data
type Listener = () => void;
const listeners = new Set<Listener>();
let history: Reading[] = seedHistory(30);
let alerts: AlertItem[] = [
  {
    id: "a1",
    time: new Date(Date.now() - 12 * 60 * 1000),
    message: "Air Quality may increase in next 2 hours",
    precaution: "Close windows, limit outdoor activity, and keep inhalers nearby.",
    severity: "moderate",
    category: "air",
    active: true,
    read: false,
  },
  {
    id: "a2",
    time: new Date(Date.now() - 45 * 60 * 1000),
    message: "Humidity rising above comfort zone",
    precaution: "Use a dehumidifier and stay hydrated to avoid discomfort.",
    severity: "low",
    category: "humidity",
    active: false,
    read: true,
  },
  {
    id: "a3",
    time: new Date(Date.now() - 90 * 60 * 1000),
    message: "CO Level briefly elevated",
    precaution: "Ventilate the room and check gas appliances for leaks.",
    severity: "high",
    category: "co",
    active: false,
    read: false,
  },
];
let wifiConnected = true;
let muteRules: MuteRule[] = [];

function notify() {
  listeners.forEach((l) => l());
}

// Start ticking only in browser
function isMuted(category: AlertCategory, severity: AlertSeverity) {
  return muteRules.some(
    (r) =>
      (r.category === "all" || r.category === category) &&
      (r.severity === "all" || r.severity === severity),
  );
}

function pushAlert(a: Omit<AlertItem, "id" | "time" | "active" | "read">) {
  if (isMuted(a.category, a.severity)) return;
  alerts = [
    {
      ...a,
      id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date(),
      active: true,
      read: false,
    },
    ...alerts,
  ].slice(0, 30);
}

if (typeof window !== "undefined") {
  setInterval(() => {
    const next = generateReading(history[history.length - 1]);
    history = [...history.slice(-99), next];
    if (next.airQuality > 200 && Math.random() > 0.7) {
      pushAlert({
        message: `High Air Quality reading: ${next.airQuality.toFixed(0)} PPB`,
        precaution:
          "Wear an N95 mask outdoors, avoid strenuous activity, and run an air purifier indoors.",
        severity: "high",
        category: "air",
      });
    }
    if (next.coLevel > 28 && Math.random() > 0.6) {
      pushAlert({
        message: `Elevated CO Level: ${next.coLevel.toFixed(0)} PPM`,
        precaution: "Ventilate the area immediately and avoid running gas appliances.",
        severity: "severe",
        category: "co",
      });
    }
    if (next.humidity > 80 && Math.random() > 0.8) {
      pushAlert({
        message: `High Humidity: ${next.humidity.toFixed(0)}%`,
        precaution: "Use a dehumidifier and stay hydrated throughout the day.",
        severity: "low",
        category: "humidity",
      });
    }
    notify();
  }, 3000);
}

export function useAeroStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    history,
    latest: history[history.length - 1],
    alerts,
    muteRules,
    wifiConnected,
    toggleWifi: () => {
      wifiConnected = !wifiConnected;
      notify();
    },
    dismissAlert: (id: string) => {
      alerts = alerts.map((a) => (a.id === id ? { ...a, active: false, read: true } : a));
      notify();
    },
    markAlertRead: (id: string) => {
      alerts = alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
      notify();
    },
    markAllAlertsRead: () => {
      alerts = alerts.map((a) => ({ ...a, read: true }));
      notify();
    },
    addMuteRule: (rule: MuteRule) => {
      if (
        !muteRules.some(
          (r) => r.category === rule.category && r.severity === rule.severity,
        )
      ) {
        muteRules = [...muteRules, rule];
        notify();
      }
    },
    removeMuteRule: (idx: number) => {
      muteRules = muteRules.filter((_, i) => i !== idx);
      notify();
    },
  };
}

export function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return now;
}

export function airQualityStatus(v: number) {
  if (v < 100) return { label: "Good", color: "text-[color:var(--aero-green)]" };
  if (v < 150) return { label: "Moderate", color: "text-[color:var(--aero-yellow)]" };
  if (v < 200) return { label: "Unhealthy", color: "text-[color:var(--aero-orange)]" };
  return { label: "Hazardous", color: "text-[color:var(--aero-red)]" };
}

export function coStatus(v: number) {
  if (v < 20) return { label: "Safe", color: "text-[color:var(--aero-purple)]" };
  if (v < 30) return { label: "Caution", color: "text-[color:var(--aero-orange)]" };
  return { label: "Danger", color: "text-[color:var(--aero-red)]" };
}

export function tempStatus(v: number) {
  if (v < 18) return { label: "Cold", color: "text-[color:var(--aero-blue)]" };
  if (v < 30) return { label: "Normal", color: "text-[color:var(--aero-orange)]" };
  return { label: "Hot", color: "text-[color:var(--aero-red)]" };
}

export function humidityStatus(v: number) {
  if (v < 30) return { label: "Dry", color: "text-[color:var(--aero-orange)]" };
  if (v < 65) return { label: "Comfort", color: "text-[color:var(--aero-blue)]" };
  return { label: "Humid", color: "text-[color:var(--aero-purple)]" };
}

export function overallStatus(r: Reading) {
  const aq = airQualityStatus(r.airQuality);
  if (aq.label === "Hazardous") return { label: "DANGER", tone: "danger" as const };
  if (aq.label === "Unhealthy") return { label: "WARNING", tone: "warning" as const };
  if (aq.label === "Moderate") return { label: "MODERATE", tone: "moderate" as const };
  return { label: "SAFE", tone: "safe" as const };
}

export function predictNext(history: Reading[]) {
  // Use up to last 12 readings for a more stable linear regression.
  const recent = history.slice(-12);
  const n = recent.length;
  const xs = recent.map((_, i) => i);
  const ys = recent.map((r) => r.airQuality);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  // Residual standard deviation — drives the confidence band width.
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    ssRes += (ys[i] - pred) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const sigma = Math.sqrt(ssRes / Math.max(1, n - 2));
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  const trend = slope > 1.2 ? "INCREASE" : slope < -1.2 ? "DECREASE" : "STABLE";

  // Forecast 6 steps (~2 hours, every 20 min).
  const last = ys[n - 1];
  const steps = [
    { label: "Now", offset: 0 },
    { label: "+20m", offset: 2 },
    { label: "+40m", offset: 4 },
    { label: "+1h", offset: 6 },
    { label: "+1h20", offset: 8 },
    { label: "+1h40", offset: 10 },
    { label: "+2h", offset: 12 },
  ];
  const points = steps.map((s, i) => {
    const value = i === 0 ? last : clamp(last + slope * s.offset, 30, 320);
    // 95% band widens with horizon: ~1.96 * sigma * sqrt(1 + step).
    const band = 1.96 * sigma * Math.sqrt(1 + s.offset / 2);
    const lower = clamp(value - band, 0, 360);
    const upper = clamp(value + band, 0, 360);
    return {
      label: s.label,
      value: Math.round(value),
      lower: Math.round(lower),
      upper: Math.round(upper),
      range: Math.round(upper - lower),
    };
  });

  const confidence = Math.round(clamp(50 + r2 * 45, 50, 97));
  return { trend, points, confidence, sigma: Math.round(sigma * 10) / 10 };
}