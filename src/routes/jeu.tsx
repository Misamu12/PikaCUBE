import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Lock, LogOut, Play, RotateCcw, Undo2, Menu as MenuIcon, ChevronRight, Star, Flame, User as UserIcon } from "lucide-react";
import {
  emptyProgress, fmt, getLevels, getSession, getUsers, pushActivity, saveUsers, setSession, sha,
  validateCredentials, xpFor, type Level, type Progress,
} from "@/game/store";
import { createCubeEngine, type CubeEngine, type CubeState } from "@/game/cube-engine";
import { burst, celebrate, turnSound, winJingle } from "@/game/fx";

export const Route = createFileRoute("/jeu")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Jouer — PikaCube" },
      { name: "description", content: "Connectez-vous et résolvez le Rubik’s Cube 3D niveau par niveau." },
      { property: "og:title", content: "Jouer — PikaCube" },
      { property: "og:description", content: "Six niveaux de Rubik’s Cube 3D à résoudre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

type Screen = "auth" | "menu" | "game";

function Game() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [user, setUser] = useState<string | null>(null);
  const [prog, setProg] = useState<Progress>(emptyProgress());
  const [levels] = useState<Level[]>(getLevels);
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const s = getSession(), u = getUsers();
    if (s && u[s] && !u[s].banned) { setUser(s); setProg({ ...emptyProgress(), ...u[s].p }); setScreen("menu"); }
  }, []);

  const login = (key: string | null, p: Progress | null) => {
    setUser(key); setProg({ ...emptyProgress(), ...(p ?? {}) }); if (key) setSession(key); setScreen("menu");
  };
  const save = (p: Progress) => {
    setProg(p); if (!user) return; const u = getUsers(); if (u[user]) { u[user].p = p; saveUsers(u); }
  };
  const name = user ? getUsers()[user]?.n ?? user : "Invité";

  if (screen === "auth") return <Auth onLogin={login} />;
  if (screen === "menu")
    return <LevelMenu name={name} guest={!user} prog={prog} levels={levels}
      onPlay={(i) => { setCur(i); setScreen("game"); }}
      onLogout={() => { setUser(null); setSession(null); setScreen("auth"); }} />;
  const level = levels[cur];
  if (!level) return null;
  return <GamePlay key={cur} idx={cur} level={level} total={levels.length} prog={prog} who={name}
    onWin={save} onMenu={() => setScreen("menu")} onNext={() => setCur(cur + 1)} />;
}

/* ---------- Auth ---------- */
function Auth({ onLogin }: { onLogin: (k: string | null, p: Progress | null) => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [n, setN] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const v = validateCredentials(n, pw); if (v) return setErr(v);
    const key = n.trim().toLowerCase(), users = getUsers(); setBusy(true);
    try {
      if (mode === "up") {
        if (users[key]) return setErr("Ce pseudo existe déjà.");
        const s = Math.random().toString(36).slice(2), h = await sha(pw, s);
        users[key] = { n: n.trim(), s, h, p: emptyProgress(), created: Date.now() }; saveUsers(users);
        pushActivity(n.trim(), "a rejoint PikaCube 🎉"); burst(); onLogin(key, users[key].p);
      } else {
        const u = users[key]; if (!u) return setErr("Compte introuvable.");
        if (u.banned) return setErr("Ce compte a été suspendu par un administrateur.");
        if ((await sha(pw, u.s)) !== u.h) return setErr("Mot de passe incorrect.");
        onLogin(key, u.p);
      }
    } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="panel p-6 animate-pop-in">
        <h1 className="text-3xl">Prêt à tourner ?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connectez-vous pour sauvegarder progression et records.</p>
        <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border-[3px] border-ink" role="group">
          {(["in", "up"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setErr(""); }}
              className={`py-2 font-display text-xs uppercase ${mode === m ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              {m === "in" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className={`mt-4 flex flex-col gap-3 ${err ? "animate-shake" : ""}`} key={err}>
          <label className="text-sm font-bold">Pseudo
            <input value={n} onChange={(e) => setN(e.target.value)} maxLength={16} autoComplete="username"
              className="mt-1 w-full rounded-lg border-[3px] border-ink bg-background px-3 py-2.5 font-medium" />
          </label>
          <label className="text-sm font-bold">Mot de passe
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-lg border-[3px] border-ink bg-background px-3 py-2.5" />
          </label>
          <p role="alert" className="min-h-[1.4em] text-sm font-bold text-destructive">{err}</p>
          <button disabled={busy} className="btn-pop bg-primary text-primary-foreground">{mode === "in" ? "Se connecter" : "Créer mon compte"}</button>
        </form>
        <button onClick={() => onLogin(null, null)} className="btn-pop mt-3 w-full bg-card text-foreground"><UserIcon className="h-4 w-4" /> Jouer en invité</button>
        <p className="mt-4 text-xs text-muted-foreground">Les comptes sont enregistrés uniquement dans ce navigateur.</p>
      </div>
    </div>
  );
}

/* ---------- Menu ---------- */
const LV_COLORS = ["bg-cube-green", "bg-cube-blue", "bg-cube-yellow", "bg-cube-orange", "bg-cube-red", "bg-accent"];
function LevelMenu({ name, guest, prog, levels, onPlay, onLogout }: { name: string; guest: boolean; prog: Progress; levels: Level[]; onPlay: (i: number) => void; onLogout: () => void }) {
  const lvl = Math.floor((prog.xp || 0) / 300) + 1, pct = ((prog.xp || 0) % 300) / 3;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <div className="grid h-14 w-14 place-items-center rounded-xl border-[3px] border-ink bg-secondary font-display text-2xl text-ink">{name[0]?.toUpperCase()}</div>
        <div className="mr-auto min-w-40">
          <h1 className="text-2xl">{name}</h1>
          <p className="text-sm text-muted-foreground">{guest ? "Invité · progression non sauvegardée" : `Niveau joueur ${lvl} · ${prog.xp || 0} XP · ${prog.wins || 0} victoires`}</p>
          <div className="mt-2 h-3 w-full max-w-xs overflow-hidden rounded-full border-2 border-ink bg-muted"><div className="h-full bg-cube-green transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
        <button onClick={onLogout} className="btn-pop bg-card text-foreground"><LogOut className="h-4 w-4" /> Déconnexion</button>
      </div>
      <h2 className="mt-8 text-3xl">Choisir un niveau</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((L, i) => {
          const lock = i + 1 > prog.unlocked, bs = prog.best[i];
          return (
            <button key={i} disabled={lock} onClick={() => onPlay(i)} onMouseEnter={(e) => { if (!lock) { const r = e.currentTarget.getBoundingClientRect(); burst((r.left + r.width / 2) / innerWidth, r.top / innerHeight); } }}
              className="panel group relative overflow-hidden p-5 text-left transition hover:-translate-y-1 hover:-rotate-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:rotate-0 animate-pop-in"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`absolute -right-6 -top-6 h-24 w-24 rotate-12 rounded-2xl border-[3px] border-ink ${LV_COLORS[i % 6]} stripes transition group-hover:rotate-45`} />
              <span className="font-display text-xs text-muted-foreground">Niveau {i + 1}</span>
              <h3 className="mt-1 text-xl">{L.name}</h3>
              <p className="text-sm text-muted-foreground">{L.n}×{L.n} · {L.img ? "Images" : "Couleurs"}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-bold">
                {lock ? <><Lock className="h-4 w-4" /> Verrouillé</> : bs ? <><Star className="h-4 w-4 fill-cube-yellow text-ink" /> {fmt(bs.t)} · {bs.m} coups</> : <><Play className="h-4 w-4" /> À jouer</>}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Play ---------- */
const STATE_TXT: Record<CubeState, string> = { scrambling: "Mélange…", ready: "À vous !", playing: "En cours", solved: "Résolu" };
const MOVES = ["U", "D", "L", "R", "F", "B", "U'", "D'", "L'", "R'", "F'", "B'"];
const VIEWS = [["front", "Face"], ["three", "3/4"], ["side", "Côté"], ["top", "Dessus"], ["bottom", "Dessous"]] as const;

function GamePlay({ idx, level, total, prog, who, onWin, onMenu, onNext }: {
  idx: number; level: Level; total: number; prog: Progress; who: string; onWin: (p: Progress) => void; onMenu: () => void; onNext: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null), eng = useRef<CubeEngine | null>(null);
  const [moves, setMoves] = useState(0), [state, setState] = useState<CubeState>("scrambling"), [time, setTime] = useState(0);
  const [view, setView] = useState("three"), [speed, setSpeed] = useState(280);
  const [combo, setCombo] = useState(0), [pops, setPops] = useState<{ id: number; t: string }[]>([]);
  const [win, setWin] = useState<{ ms: number; m: number; rec: boolean; xp: number } | null>(null);
  const lastTurn = useRef(0), comboRef = useRef(0), progRef = useRef(prog); progRef.current = prog;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const e = createCubeEngine(el, {
      onMoves: setMoves, onState: setState,
      onTurn: () => {
        turnSound(); const now = performance.now();
        comboRef.current = now - lastTurn.current < 900 ? comboRef.current + 1 : 1; lastTurn.current = now; setCombo(comboRef.current);
        if (comboRef.current >= 3) { const id = now; setPops((p) => [...p, { id, t: `COMBO ×${comboRef.current}` }]); setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1000); }
      },
      onWin: (ms, m) => {
        const p = progRef.current, b = p.best[idx], rec = !b || ms < b.t, xp = xpFor(level, m);
        const np: Progress = { ...p, best: rec ? { ...p.best, [idx]: { t: ms, m } } : p.best, unlocked: Math.max(p.unlocked, Math.min(idx + 2, total)), wins: (p.wins || 0) + 1, xp: (p.xp || 0) + xp };
        onWin(np); setState("solved"); setTime(ms); setWin({ ms, m, rec, xp });
        e.celebrate(); celebrate(); winJingle();
        pushActivity(who, `a résolu « ${level.name} » en ${fmt(ms)}${rec ? " — record !" : ""}`);
        if (rec) toast.success("Nouveau record personnel !");
        if (m <= level.mix) toast("🏅 Succès : Efficace — résolu en peu de coups");
      },
    });
    eng.current = e; e.start(level.n, level.img, level.mix);
    el.dataset["sceneReady"] = "1";
    const t = setInterval(() => { const v = e.elapsed(); if (v) setTime(v); }, 200);
    return () => { clearInterval(t); e.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => { setWin(null); setTime(0); setCombo(0); eng.current?.start(level.n, level.img, level.mix); };
  const best = prog.best[idx];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-3 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-display text-xs text-muted-foreground">Niveau {idx + 1}</span>
          <h1 className="text-2xl sm:text-3xl">{level.name}</h1>
          <p className="text-sm text-muted-foreground">{level.n}×{level.n} · {level.img ? "Reconstituez les 6 images" : "Une couleur par face"}</p>
        </div>
        <button onClick={onMenu} className="btn-pop bg-card text-foreground"><MenuIcon className="h-4 w-4" /> Menu</button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Coups", moves, "bg-cube-blue text-accent-foreground"], ["Temps", fmt(time), "bg-cube-yellow text-ink"], ["Record", best ? fmt(best.t) : "–", "bg-cube-green text-accent-foreground"], ["État", STATE_TXT[state], "bg-cube-orange text-ink"]].map(([k, v, c]) => (
          <div key={k as string} className={`rounded-xl border-[3px] border-ink px-3 py-2 shadow-pop-sm ${c}`}>
            <dt className="font-display text-[10px] uppercase opacity-80">{k}</dt>
            <dd className="font-mono text-xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap overflow-hidden rounded-lg border-[3px] border-ink" role="group" aria-label="Point de vue">
          {VIEWS.map(([v, l]) => (
            <button key={v} aria-pressed={view === v} onClick={() => { setView(v); eng.current?.setView(v); }}
              className={`border-r-2 border-ink px-3 py-1.5 text-sm font-bold last:border-0 ${view === v ? "bg-primary text-primary-foreground" : "bg-card"}`}>{l}</button>
          ))}
        </div>
        <button onClick={restart} className="btn-pop bg-card px-3 py-1.5 text-xs text-foreground"><RotateCcw className="h-4 w-4" /> Recommencer</button>
        <button onClick={() => eng.current?.undo()} className="btn-pop bg-card px-3 py-1.5 text-xs text-foreground"><Undo2 className="h-4 w-4" /> Annuler</button>
        <label className="flex items-center gap-2 text-sm font-bold">Vitesse
          <input type="range" min={100} max={600} step={20} value={speed} onChange={(e) => { setSpeed(+e.target.value); eng.current?.setSpeed(+e.target.value); }} className="w-28 accent-primary" />
        </label>
        {combo >= 2 && <span className="flex items-center gap-1 rounded-md border-[3px] border-ink bg-primary px-2 py-1 font-display text-xs text-primary-foreground animate-pop-in" key={combo}><Flame className="h-4 w-4" /> ×{combo}</span>}
      </div>

      <div ref={stageRef} role="img" aria-label="Cube en 3D"
        className="stage-bg relative h-[clamp(360px,60vh,680px)] w-full cursor-grab touch-none overflow-hidden rounded-2xl border-[3px] border-ink shadow-pop [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full">
        {pops.map((p) => <div key={p.id} className="pointer-events-none absolute left-1/2 top-1/3 z-10 font-display text-3xl text-primary text-stroke animate-rise">{p.t}</div>)}
        {state === "scrambling" && <div className="pointer-events-none absolute inset-x-0 top-4 text-center font-display text-sm text-muted-foreground animate-pulse">Mélange en cours…</div>}
        <div className="pointer-events-none absolute bottom-2 left-3 right-3 text-xs text-muted-foreground">Glisser sur le cube : tourner une couche · dans le vide : changer de vue · molette/pincement : zoom · clavier U D L R F B (+Maj)</div>
      </div>

      <div className="grid grid-cols-6 gap-2" role="group" aria-label="Mouvements">
        {MOVES.map((m) => (
          <button key={m} onClick={() => eng.current?.move(m)} className="btn-pop touch-manipulation bg-card px-0 py-2.5 font-mono text-base text-foreground">{m.replace("'", "’")}</button>
        ))}
      </div>

      {win && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-sm p-6 text-center shadow-pop-lg animate-pop-in">
            <div className="mx-auto mb-3 flex justify-center gap-1">{[0, 1, 2].map((s) => <Star key={s} className={`h-10 w-10 animate-pop-in ${s < (win.m <= level.mix ? 3 : win.m <= level.mix * 2 ? 2 : 1) ? "fill-cube-yellow" : "fill-muted"} text-ink`} style={{ animationDelay: `${200 + s * 150}ms` }} />)}</div>
            <h2 className="text-3xl">Niveau réussi !</h2>
            <p className="mt-2 text-muted-foreground">Temps {fmt(win.ms)} · {win.m} coups{win.rec ? " · nouveau record" : ""}</p>
            <p className="mt-2 font-display text-xl text-success">+{win.xp} XP</p>
            <div className="mt-5 flex flex-col gap-2">
              {idx + 1 < total && <button onClick={onNext} className="btn-pop bg-primary text-primary-foreground">Niveau suivant <ChevronRight className="h-4 w-4" /></button>}
              <button onClick={restart} className="btn-pop bg-card text-foreground">Rejouer</button>
              <button onClick={onMenu} className="btn-pop bg-card text-foreground">Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
