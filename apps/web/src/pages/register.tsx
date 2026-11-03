import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterMutation } from "@/hooks/use-auth";

export function RegisterPage() {
  const register = useRegisterMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    register.mutate({ name, email, password });
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <Card className="w-full">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Auzy</p>
          <CardTitle className="font-display text-4xl">Create a home</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">
                Name
              </Label>
              <Input
                id="name"
                className="h-11 rounded-2xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                minLength={8}
                required
              />
            </div>
            {register.isError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{register.error.message}</AlertDescription>
              </Alert>
            )}
            <Button disabled={register.isPending} className="h-11 w-full rounded-2xl">
              {register.isPending ? "Creating..." : "Create account"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="text-primary">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
