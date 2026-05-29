import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/aerosense-logo.png";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[color:var(--aero-blue)]/5 via-background to-[color:var(--aero-green)]/5 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex justify-center mb-6">
          <img src={logo} alt="AeroSense" className="h-16 object-contain" />
        </Link>
        <div className="bg-card rounded-3xl border border-border shadow-[var(--shadow-card)] p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Breathe Smart, Live Smart
        </p>
      </div>
    </div>
  );
}