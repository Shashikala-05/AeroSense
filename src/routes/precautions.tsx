import { createFileRoute } from "@tanstack/react-router";
import { User, Sparkles, Baby, Heart, Activity, Wind } from "lucide-react";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/precautions")({
  head: () => ({ meta: [{ title: "Precautions — AeroSense" }] }),
  component: PrecautionsPage,
});

const groups = [
  {
    title: "For Asthma Patients",
    icon: User,
    accent: "orange",
    tips: [
      "Avoid outdoor activities during high pollution hours",
      "Wear an N95 mask when going outside",
      "Always keep your inhaler within reach",
      "Stay in a well-ventilated area with air purifiers",
    ],
  },
  {
    title: "For Dust Allergy",
    icon: Sparkles,
    accent: "purple",
    tips: [
      "Avoid dusty environments and construction zones",
      "Keep windows and doors closed during peak hours",
      "Use a HEPA air purifier if available",
      "Stay hydrated and rinse nasal passages",
    ],
  },
  {
    title: "For Children",
    icon: Baby,
    accent: "blue",
    tips: [
      "Limit outdoor play during unhealthy air days",
      "Encourage hand washing after coming inside",
      "Keep indoor air clean and humidified",
    ],
  },
  {
    title: "For Heart Patients",
    icon: Heart,
    accent: "green",
    tips: [
      "Avoid strenuous outdoor exercise",
      "Monitor your symptoms closely",
      "Carry prescribed medication at all times",
    ],
  },
  {
    title: "General Wellness",
    icon: Activity,
    accent: "orange",
    tips: [
      "Drink plenty of water throughout the day",
      "Eat antioxidant-rich foods (fruits, vegetables)",
      "Get adequate sleep to support immunity",
    ],
  },
  {
    title: "Indoor Air Tips",
    icon: Wind,
    accent: "blue",
    tips: [
      "Use indoor plants to improve air quality",
      "Vacuum regularly with a HEPA filter",
      "Avoid smoking or burning candles indoors",
    ],
  },
];

const accentMap: Record<string, string> = {
  orange: "text-[color:var(--aero-orange)] bg-[color:var(--aero-orange)]/10",
  purple: "text-[color:var(--aero-purple)] bg-[color:var(--aero-purple)]/10",
  blue: "text-[color:var(--aero-blue)] bg-[color:var(--aero-blue)]/10",
  green: "text-[color:var(--aero-green)] bg-[color:var(--aero-green)]/10",
};

function PrecautionsPage() {
  return (
    <Shell title="Precautions" subtitle="Personalized health guidance based on air quality">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {groups.map((g) => {
          const Icon = g.icon;
          const accent = accentMap[g.accent];
          return (
            <div
              key={g.title}
              className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${accent}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className={`font-semibold ${accent.split(" ")[0]}`}>{g.title}</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {g.tips.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${accent.split(" ")[1]}`} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
