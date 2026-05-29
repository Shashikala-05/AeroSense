import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { useAuth } from "@/lib/auth";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Shell({ title, subtitle, children }: Props) {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (configured && !loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, configured, navigate]);

  if (configured && (loading || !user)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <TopHeader title={title} subtitle={subtitle} />
        <div className="flex-1 p-4 sm:p-6 md:p-10">{children}</div>
        <footer className="px-4 sm:px-6 md:px-10 py-6 border-t border-border text-center text-xs text-muted-foreground">
          © 2026 AeroSense | Air Quality Monitoring System
        </footer>
      </main>
    </div>
  );
}