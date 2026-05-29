import { createFileRoute } from "@tanstack/react-router";
import { Wind, Cpu, Brain, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import logo from "@/assets/aerosense-logo.png";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — AeroSense" }] }),
  component: AboutPage,
});

const features = [
  { icon: Cpu, title: "Hardware Sensors", desc: "MQ135, MQ7, and DHT11 sensors for accurate readings." },
  { icon: Brain, title: "AI Prediction", desc: "Machine learning forecasts pollution trends 2 hours ahead." },
  { icon: ShieldCheck, title: "Health Guidance", desc: "Personalized precautions for sensitive groups." },
  { icon: Wind, title: "Real-time Monitoring", desc: "Bluetooth-connected dashboard updates live every 3s." },
];

function AboutPage() {
  return (
    <Shell title="About AeroSense" subtitle="Breathe Smart. Live Smart.">
      <div className="max-w-3xl">
        <div className="bg-gradient-to-br from-[color:var(--aero-green)]/10 to-[color:var(--aero-blue)]/10 rounded-2xl p-8 border border-border shadow-[var(--shadow-card)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-white rounded-2xl p-3 shadow-[var(--shadow-card)] border border-border shrink-0">
              <img
                src={logo}
                alt="AeroSense logo"
                className="h-16 w-auto sm:h-20 object-contain"
              />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">AeroSense</h2>
              <p className="text-sm text-muted-foreground">Breathe Smart. Live Smart.</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            AeroSense is an AI-powered real-time air quality monitoring system. Combining IoT sensors,
            machine learning predictions, and personalized health guidance, it helps you and your loved
            ones breathe cleaner, safer air every day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)]"
              >
                <div className="h-10 w-10 rounded-xl bg-[color:var(--aero-green)]/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[color:var(--aero-green)]" />
                </div>
                <div className="font-semibold text-foreground mt-3">{f.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground mt-8">
          Version 1.0.0 · © 2026 AeroSense
        </div>
      </div>
    </Shell>
  );
}
