import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/hooks/use-auth";

export function LoginPage() {
  const login = useLoginMutation();
  const [email, setEmail] = useState("demo@smarthome.local");
  const [password, setPassword] = useState("demo1234");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <main className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Auzy home hub</p>
        <h1 className="mt-4 max-w-xl font-display text-6xl leading-[0.95] tracking-tight">
          Bring every board in the house onto one map.
        </h1>
        <p className="mt-6 max-w-lg text-lg text-mist-300">
          Register ESP32, NodeMCU, Arduino, and similar boards, then POST sensor JSON to a single ingest URL.
        </p>
      </section>
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                className="h-11 rounded-2xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                className="h-11 rounded-2xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {login.isError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{login.error.message}</AlertDescription>
              </Alert>
            )}
            <Button disabled={login.isPending} className="h-11 w-full rounded-2xl">
              {login.isPending ? "Signing in..." : "Enter the hub"}
            </Button>
            <p className="text-sm text-muted-foreground">
              New house?{" "}
              <Link to="/register" className="text-primary">
                Create an account
              </Link>
            </p>
            <p className="font-mono text-[11px] leading-5 text-muted-foreground">
              Demo login is prefilled after `pnpm db:seed`.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
