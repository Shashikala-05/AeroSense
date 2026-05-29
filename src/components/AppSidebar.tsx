import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  Brain,
  Bell,
  ShieldAlert,
  Settings,
  Info,
} from "lucide-react";
import logo from "@/assets/aerosense-logo.png";

export const sidebarItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Live Data", url: "/live", icon: Activity },
  { title: "Prediction", url: "/prediction", icon: Brain },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Precautions", url: "/precautions", icon: ShieldAlert },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "About", url: "/about", icon: Info },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="h-16 md:h-20 px-4 border-b border-border flex items-center shrink-0">
        <img
          src={logo}
          alt="AeroSense — Breathe Smart, Live Smart"
          className="max-h-10 md:max-h-12 w-auto object-contain"
        />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {sidebarItems.map((item) => {
          const active = currentPath === item.url;
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              to={item.url}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-muted-foreground border-t border-border">
        © 2026 AeroSense
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}