import { Link } from "@tanstack/react-router";
import { Moon, Sun, Volume2, VolumeX, Gamepad2, Trophy, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { setMuted } from "@/game/fx";

const NAV = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/jeu", label: "Jouer", icon: Gamepad2 },
  { to: "/classement", label: "Classement", icon: Trophy },
] as const;

export function SiteHeader() {
  const [dark, setDark] = useState(false);
  const [mute, setMute] = useState(false);
  useEffect(() => {
    const d = localStorage.getItem("pc_theme");
    const isDark = d ? d === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark); document.documentElement.classList.toggle("dark", isDark);
    const m = localStorage.getItem("pc_mute") === "1"; setMute(m); setMuted(m);
  }, []);
  const toggleTheme = () => { const v = !dark; setDark(v); document.documentElement.classList.toggle("dark", v); localStorage.setItem("pc_theme", v ? "dark" : "light"); };
  const toggleMute = () => { const v = !mute; setMute(v); setMuted(v); localStorage.setItem("pc_mute", v ? "1" : "0"); };

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-secondary">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:px-5">
        <Link to="/" className="mr-auto flex items-center gap-2">
          <span className="grid h-9 w-9 grid-cols-2 gap-[2px] rounded-md border-[3px] border-ink bg-ink p-[2px] animate-wobble">
            <i className="rounded-[2px] bg-cube-red" /><i className="rounded-[2px] bg-cube-blue" /><i className="rounded-[2px] bg-cube-green" /><i className="rounded-[2px] bg-cube-yellow" />
          </span>
          <span className="font-display text-xl text-foreground dark:text-ink">PikaCube</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-1.5 rounded-lg border-[3px] border-transparent px-2 py-1.5 font-display text-xs uppercase text-ink transition hover:border-ink hover:bg-card hover:text-foreground sm:px-3"
              activeProps={{ className: "!border-ink bg-card !text-foreground shadow-pop-sm" }}>
              <Icon className="h-4 w-4" /><span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={toggleMute} aria-label={mute ? "Activer le son" : "Couper le son"} className="btn-pop bg-card p-2 text-foreground">
          {mute ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button onClick={toggleTheme} aria-label="Changer de thème" className="btn-pop bg-ink p-2 text-secondary">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
