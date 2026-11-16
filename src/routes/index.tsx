import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, Trophy, Zap, Sparkles, Boxes, Timer } from "lucide-react";
import { CssCube } from "@/components/CssCube";
import { useStoreValue } from "@/game/useStore";
import { getActivity, getUsers, leaderboard } from "@/game/store";
import { burst } from "@/game/fx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PikaCube — Le Rubik’s Cube 3D arcade" },
      { name: "description", content: "Faites tourner un Rubik’s Cube 3D, débloquez 6 niveaux et battez les records du classement." },
      { property: "og:title", content: "PikaCube — Le Rubik’s Cube 3D arcade" },
      { property: "og:description", content: "6 niveaux, cubes 2×2 à 4×4, faces en couleurs ou en images." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: Boxes, t: "2×2 à 4×4", d: "Six niveaux du cube de poche au cube de maître.", c: "bg-cube-blue text-accent-foreground" },
  { icon: Sparkles, t: "Faces en images", d: "Reconstituez six tableaux sur un même cube.", c: "bg-cube-yellow text-ink" },
  { icon: Timer, t: "Chrono & records", d: "Chaque coup compte : temps, coups, XP.", c: "bg-cube-green text-accent-foreground" },
  { icon: Zap, t: "Combos", d: "Enchaînez les tours rapides pour des bonus.", c: "bg-cube-orange text-ink" },
];

function Home() {
  const [act] = useStoreValue(getActivity, []);
  const [users, ready] = useStoreValue(getUsers, {});
  const top = leaderboard(users).slice(0, 3);
  const words = ["TOURNE", "MÉLANGE", "RÉSOUS", "COMBO", "RECORD", "CONFETTIS"];

  return (
    <div className="overflow-hidden">
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-20">
        <div className="relative z-10">
          <span className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-cube-green px-3 py-1 font-display text-xs text-accent-foreground shadow-pop-sm">Nouveau · Saison 1</span>
          <h1 className="mt-5 text-5xl leading-[0.95] text-foreground sm:text-7xl lg:text-8xl">
            Pika<span className="text-primary text-stroke">Cube</span>
          </h1>
          <p className="mt-5 max-w-md text-lg font-medium text-muted-foreground">
            Le Rubik’s Cube en 3D, version arcade. Glissez, tournez, enchaînez les combos — et faites pleuvoir les confettis.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/jeu" onMouseEnter={() => burst(0.25, 0.55)} className="btn-pop bg-primary px-6 py-4 text-lg text-primary-foreground shadow-pop">
              <Gamepad2 className="h-5 w-5" /> Jouer maintenant
            </Link>
            <Link to="/classement" className="btn-pop bg-card text-foreground"><Trophy className="h-4 w-4" /> Classement</Link>
          </div>
        </div>
        <div className="relative h-72 sm:h-96">
          <div className="absolute inset-6 rounded-[2rem] border-[3px] border-ink bg-accent stripes shadow-pop-lg rotate-3" />
          <CssCube size={150} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <CssCube size={60} delay={-2} className="absolute left-2 top-2" />
          <CssCube size={48} delay={-4} className="absolute bottom-0 right-4" />
        </div>
      </section>

      <div className="border-y-[3px] border-ink bg-ink py-3">
        <div className="flex w-max animate-marquee gap-8 font-display text-2xl text-secondary">
          {[...words, ...words, ...words, ...words].map((w, i) => <span key={i} className={i % 2 ? "text-primary" : ""}>{w} ✦</span>)}
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <article key={f.t} className="panel p-5 transition hover:-translate-y-1 hover:rotate-1 animate-pop-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-lg border-[3px] border-ink ${f.c}`}><f.icon className="h-6 w-6" /></div>
            <h3 className="text-lg">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:px-6 md:grid-cols-2">
        <div className="panel p-6">
          <h2 className="flex items-center gap-2 text-2xl"><Trophy className="h-6 w-6 text-primary" /> Podium</h2>
          <ol className="mt-4 space-y-3">
            {!ready && [0, 1, 2].map((i) => <li key={i} className="skeleton h-12" />)}
            {ready && top.length === 0 && <li className="text-muted-foreground">Personne au podium… soyez le premier !</li>}
            {top.map((u, i) => (
              <li key={u.name} className="flex items-center gap-3 rounded-lg border-[3px] border-ink bg-muted p-3">
                <span className={`grid h-9 w-9 place-items-center rounded-md border-[3px] border-ink font-display ${["bg-cube-yellow text-ink", "bg-cube-white text-ink", "bg-cube-orange text-ink"][i]}`}>{i + 1}</span>
                <b className="mr-auto">{u.name}</b><span className="font-mono text-sm">{u.xp} XP</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="panel p-6">
          <h2 className="flex items-center gap-2 text-2xl"><Zap className="h-6 w-6 text-cube-orange" /> En direct</h2>
          <ul className="mt-4 max-h-64 space-y-2 overflow-auto">
            {!ready && [0, 1, 2, 3].map((i) => <li key={i} className="skeleton h-8" />)}
            {ready && act.length === 0 && <li className="text-muted-foreground">Aucune activité pour l’instant.</li>}
            {act.slice(0, 10).map((a) => (
              <li key={a.at} className="flex gap-2 text-sm animate-pop-in"><b className="text-accent">{a.who}</b><span className="text-muted-foreground">{a.text}</span></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
