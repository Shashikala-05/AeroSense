import { useEffect, useState } from "react";
import type {
  Reading,
  AlertItem,
  AlertSeverity,
  AlertCategory,
  MuteRule,
} from "./aero-data";

export type DeviceStatus = "connecting" | "connected" | "disconnected";

export type DeviceReading = {
  airQuality: number; // mq135 (ppm)
  coLevel: number; // mq7 (ppm)
  temperature: number; // °C
  humidity: number; // %
};

// Fetched same-origin through Vite's /device-api proxy (vite.config.ts).
// The proxy forwards to the actual device server-side, bypassing the CORS
// block (ESP32 firmware doesn't send Access-Control-Allow-Origin).
const DEVICE_URLS = ["/device-api/data"] as const;
const POLL_MS = 2000;
const TIMEOUT_MS = 3000;
// Retain every reading received during the session so users can view/export
// the full series. Cap at 10k entries (~5.5 hours at 2s polling) for memory
// safety. Charts/predictions slice the last N entries from this.
const HISTORY_LIMIT = 10_000;
const ALERT_LIMIT = 60;

type Listener = () => void;
const listeners = new Set<Listener>();

let status: DeviceStatus = "connecting";
let reading: DeviceReading | null = null;
let history: Reading[] = [];
let lastUpdate: Date | null = null;
let activeUrl: string | null = null;
let alerts: AlertItem[] = [];
let muteRules: MuteRule[] = [];

// Tracks whether each category was above its threshold on the previous
// reading; used to emit an alert only on transition (avoid spamming each tick).
const aboveThreshold: Record<AlertCategory, boolean> = {
  air: false,
  co: false,
  temp: false,
  humidity: false,
};

type ThresholdConfig = {
  value: number;
  severity: AlertSeverity;
  message: (v: number) => string;
  precaution: string;
};

const THRESHOLDS: Record<AlertCategory, ThresholdConfig> = {
  air: {
    value: 150,
    severity: "moderate",
    message: (v) => `Air Quality elevated: ${v.toFixed(0)} ppm`,
    precaution:
      "Wear an N95 mask outdoors, avoid strenuous activity, and run an air purifier indoors.",
  },
  co: {
    value: 20,
    severity: "high",
    message: (v) => `Elevated CO Level: ${v.toFixed(0)} ppm`,
    precaution: "Ventilate the area immediately and avoid running gas appliances.",
  },
  temp: {
    value: 35,
    severity: "moderate",
    message: (v) => `High temperature: ${v.toFixed(1)}°C`,
    precaution: "Stay hydrated, avoid direct sun, and run a fan or AC if available.",
  },
  humidity: {
    value: 80,
    severity: "low",
    message: (v) => `High Humidity: ${v.toFixed(0)}%`,
    precaution: "Use a dehumidifier and stay hydrated to avoid discomfort.",
  },
};

function notify() {
  listeners.forEach((l) => l());
}

function isMuted(category: AlertCategory, severity: AlertSeverity) {
  return muteRules.some(
    (r) =>
      (r.category === "all" || r.category === category) &&
      (r.severity === "all" || r.severity === severity),
  );
}

function pushAlert(input: {
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  precaution: string;
}) {
  if (isMuted(input.category, input.severity)) return;
  alerts = [
    {
      id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date(),
      active: true,
      read: false,
      ...input,
    },
    ...alerts,
  ].slice(0, ALERT_LIMIT);
}

function evaluateAlerts(r: DeviceReading) {
  const values: Record<AlertCategory, number> = {
    air: r.airQuality,
    co: r.coLevel,
    temp: r.temperature,
    humidity: r.humidity,
  };
  for (const cat of Object.keys(THRESHOLDS) as AlertCategory[]) {
    const cfg = THRESHOLDS[cat];
    const value = values[cat];
    const above = value > cfg.value;
    if (above && !aboveThreshold[cat]) {
      pushAlert({
        category: cat,
        severity: cfg.severity,
        message: cfg.message(value),
        precaution: cfg.precaution,
      });
    } else if (!above && aboveThreshold[cat]) {
      // Clear active alerts of this category once value drops back below.
      alerts = alerts.map((a) =>
        a.category === cat && a.active ? { ...a, active: false } : a,
      );
    }
    aboveThreshold[cat] = above;
  }
}

async function tryFetch(url: string): Promise<DeviceReading | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      temp: number;
      hum: number;
      mq7: number;
      mq135: number;
    };
    return {
      temperature: Number(j.temp) || 0,
      humidity: Number(j.hum) || 0,
      coLevel: Number(j.mq7) || 0,
      airQuality: Number(j.mq135) || 0,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function tick() {
  // Prefer the last-known-working URL to skip repeated timeouts.
  const ordered = activeUrl
    ? [activeUrl, ...DEVICE_URLS.filter((u) => u !== activeUrl)]
    : [...DEVICE_URLS];

  for (const url of ordered) {
    const r = await tryFetch(url);
    if (r) {
      activeUrl = url;
      reading = r;
      status = "connected";
      lastUpdate = new Date();
      history = [...history, { ...r, time: lastUpdate }].slice(-HISTORY_LIMIT);
      evaluateAlerts(r);
      notify();
      return;
    }
  }
  activeUrl = null;
  status = "disconnected";
  notify();
}

if (typeof window !== "undefined") {
  void tick();
  setInterval(tick, POLL_MS);
}

export function clearHistory() {
  history = [];
  notify();
}

export function dismissAlert(id: string) {
  alerts = alerts.map((a) => (a.id === id ? { ...a, active: false, read: true } : a));
  notify();
}

export function markAlertRead(id: string) {
  alerts = alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
  notify();
}

export function markAllAlertsRead() {
  alerts = alerts.map((a) => ({ ...a, read: true }));
  notify();
}

export function addMuteRule(rule: MuteRule) {
  if (
    !muteRules.some(
      (r) => r.category === rule.category && r.severity === rule.severity,
    )
  ) {
    muteRules = [...muteRules, rule];
    notify();
  }
}

export function removeMuteRule(idx: number) {
  muteRules = muteRules.filter((_, i) => i !== idx);
  notify();
}

export function useSmartDevice() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    status,
    reading,
    history,
    lastUpdate,
    activeUrl,
    alerts,
    muteRules,
  };
}
