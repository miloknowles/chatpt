"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = Pick<
  React.ComponentProps<typeof Button>,
  "className" | "size" | "variant"
>;

export function ThemeToggle({
  className,
  size = "icon-sm",
  variant = "outline",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn(
          variant === "outline" && "border-border bg-background/80",
          className,
        )}
        disabled
        aria-hidden="true"
      >
        <Sun className="size-4 opacity-0" />
      </Button>
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        variant === "outline" &&
          "border-border bg-background/80 backdrop-blur hover:bg-muted",
        className,
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
