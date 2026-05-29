import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  unit: string;
  status: { label: string; color: string };
  icon: LucideIcon;
  accent: "green" | "purple" | "orange" | "blue";
}

const accentBg: Record<Props["accent"], string> = {
  green: "bg-[color:var(--aero-green)]/10 text-[color:var(--aero-green)]",
  purple: "bg-[color:var(--aero-purple)]/10 text-[color:var(--aero-purple)]",
  orange: "bg-[color:var(--aero-orange)]/10 text-[color:var(--aero-orange)]",
  blue: "bg-[color:var(--aero-blue)]/10 text-[color:var(--aero-blue)]",
};

export function MetricCard({ title, value, unit, status, icon: Icon, accent }: Props) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="text-sm font-medium text-muted-foreground mb-4">{title}</div>
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${accentBg[accent]}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold tabular-nums ${accentBg[accent].split(" ")[1]}`}>
            {value}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className={`mt-4 text-sm font-semibold ${status.color}`}>{status.label}</div>
    </div>
  );
}