import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Toggle theme"
      className={`relative h-9 w-9 p-0 ${className}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Render nothing until mounted to avoid hydration mismatch */}
      {mounted && (
        <>
          <Sun className={`h-5 w-5 transition-opacity ${isDark ? "opacity-0" : "opacity-100"}`} />
          <Moon className={`h-5 w-5 absolute transition-opacity ${isDark ? "opacity-100" : "opacity-0"}`} />
        </>
      )}
    </Button>
  );
}
