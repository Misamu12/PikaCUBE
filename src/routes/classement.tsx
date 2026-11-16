import { createFileRoute } from "@tanstack/react-router";
import { Crown, Trophy } from "lucide-react";
import { useStoreValue } from "@/game/useStore";
import { getUsers, leaderboard } from "@/game/store";

export const Route = createFileRoute("/classement")({
  head: () => ({
    meta: [
      { title: "Classement — PikaCube" },
      { name: "description", content: "Les meilleurs joueurs PikaCube classés par XP et victoires." },
      { property: "og:title", content: "Classement — PikaCube" },
      { property: "og:description", content: "Qui maîtrise le mieux le cube ?" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Board,
});

function Board() {
  const [users, ready] = useStoreValue(getUsers, {});
  const rows = leaderboard(users);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-3 text-4xl sm:text-5xl"><Trophy className="h-10 w-10 text-primary animate-wobble" /> Classement</h1>
      <p className="mt-2 text-muted-foreground">Comptes enregistrés dans ce navigateur.</p>
      <div className="panel mt-6 overflow-hidden">
        <div className="grid grid-cols-[3rem_1fr_5rem_5rem] gap-2 border-b-[3px] border-ink bg-ink px-4 py-3 font-display text-xs text-secondary">
          <span>#</span><span>Joueur</span><span className="text-right">Victoires</span><span className="text-right">XP</span>
        </div>
        {!ready && [0, 1, 2, 3].map((i) => <div key={i} className="skeleton m-3 h-10" />)}
        {ready && rows.length === 0 && <p className="p-6 text-center text-muted-foreground">Aucun joueur. Créez un compte pour apparaître ici !</p>}
        {rows.map((r, i) => (
          <div key={r.name} className="grid grid-cols-[3rem_1fr_5rem_5rem] items-center gap-2 border-b-2 border-ink/20 px-4 py-3 transition hover:bg-muted animate-pop-in" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="font-display">{i === 0 ? <Crown className="h-5 w-5 text-cube-yellow" /> : i + 1}</span>
            <b className="truncate">{r.name}</b>
            <span className="text-right font-mono">{r.wins}</span>
            <span className="text-right font-mono font-bold">{r.xp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
