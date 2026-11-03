import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Cpu, House, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSignOut } from "@/hooks/use-auth";
import { useMeQuery } from "@/hooks/use-home";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard } as const,
  { to: "/devices", label: "Devices", icon: Cpu } as const,
  { to: "/rooms", label: "Rooms", icon: House } as const,
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const signOut = useSignOut();
  const me = useMeQuery(true);

  useEffect(() => {
    if (me.isError) void navigate({ to: "/login" });
  }, [me.isError, navigate]);

  if (me.isPending || !me.data) {
    return (
      <div className="grid min-h-screen place-items-center gap-3 text-muted-foreground">
        <Skeleton className="h-10 w-48" />
        <p className="text-sm">Opening the house...</p>
      </div>
    );
  }

  const user = me.data;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-8 px-4 py-6 md:px-8">
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-56 shrink-0 flex-col rounded-[28px] border border-border bg-card/80 p-5 md:flex">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to="/" className="font-display text-3xl tracking-tight">
              Auzy
            </Link>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">Home hub</p>
          </div>
          <ThemeToggle />
        </div>
        <nav className="mt-10 flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.to || (link.to !== "/" && pathname.startsWith(link.to));
            const Icon = link.icon;
            return (
              <Button
                key={link.to}
                variant={active ? "secondary" : "ghost"}
                className={`h-9 justify-start rounded-2xl ${active ? "text-primary" : "text-mist-300"}`}
                asChild
              >
                <Link to={link.to}>
                  <Icon />
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <Button className="h-9 w-full rounded-2xl" asChild>
            <Link to="/devices/new">
              <Plus />
              Register device
            </Link>
          </Button>
          <Separator />
          <div className="rounded-2xl bg-ink-900/80 px-3 py-3">
            <p className="text-sm">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <Button variant="link" className="mt-1 h-auto px-0 text-xs text-muted-foreground" onClick={signOut}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-16">
        <header className="mb-6 md:hidden">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="font-display text-2xl">
              Auzy
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="link" className="text-primary" asChild>
                <Link to="/devices/new">Register</Link>
              </Button>
            </div>
          </div>
          <nav className="mt-4 flex gap-2">
            {links.map((link) => {
              const active = pathname === link.to || (link.to !== "/" && pathname.startsWith(link.to));
              return (
                <Button
                  key={link.to}
                  variant={active ? "secondary" : "outline"}
                  size="sm"
                  className={`rounded-full ${active ? "text-primary" : ""}`}
                  asChild
                >
                  <Link to={link.to}>{link.label}</Link>
                </Button>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
