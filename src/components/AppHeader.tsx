import { Link, useRouter } from "@tanstack/react-router";
import { HardHat, LogOut, ShieldCheck } from "lucide-react";
import { useSession } from "@/lib/session";
import { CURRENT_ENGINEER } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export function AppHeader({ variant }: { variant: "engineer" | "admin" }) {
  const { signOut } = useSession();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 brand-gradient text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/12 ring-1 ring-white/20">
            {variant === "admin" ? (
              <ShieldCheck className="h-5 w-5 text-emerald" />
            ) : (
              <HardHat className="h-5 w-5 text-emerald" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-extrabold tracking-tight">
              WeActive9
            </span>
            <span className="block truncate text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
              {variant === "admin" ? "CEO / Admin console" : CURRENT_ENGINEER.name}
            </span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 gap-2 text-white/85 hover:bg-white/12 hover:text-white"
          onClick={() => {
            signOut();
            router.navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
