import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TONES, useTheme, type Theme } from "@/lib/theme";

const modeOptions: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, tone, setTheme, setTone } = useTheme();
  const ActiveIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`relative size-9 rounded-2xl ${className ?? ""}`}
          aria-label="Change appearance"
        >
          <ActiveIcon className="size-4 transition-transform duration-300" />
          <span
            aria-hidden
            className="absolute right-1.5 bottom-1.5 size-2 rounded-full ring-2 ring-card"
            style={{ backgroundColor: TONES.find((item) => item.value === tone)?.swatch }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 rounded-2xl p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Mode
        </DropdownMenuLabel>
        {modeOptions.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              className={`rounded-xl ${active ? "bg-accent text-accent-foreground" : ""}`}
              onClick={() => setTheme(option.value)}
            >
              <Icon className="size-4" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuLabel className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          <Palette className="size-3" />
          Tone
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-1.5 px-1.5 pb-1.5 pt-1">
          {TONES.map((option) => {
            const active = tone === option.value;
            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={option.label}
                aria-pressed={active}
                className={`size-7 rounded-full transition ring-offset-2 ring-offset-popover hover:scale-105 ${
                  active ? "ring-2 ring-foreground" : "ring-1 ring-border"
                }`}
                style={{ backgroundColor: option.swatch }}
                onClick={() => setTone(option.value)}
              />
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
