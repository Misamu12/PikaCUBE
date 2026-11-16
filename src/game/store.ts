// Local, browser-only persistence for PikaCube (no server). Mirrors the original mockup.
export interface Level { n: number; img: 0 | 1; mix: number; name: string }
export interface Best { t: number; m: number }
export interface Progress { unlocked: number; best: Record<number, Best>; wins: number; xp: number }
export interface User { n: string; s: string; h: string; p: Progress; created: number; banned?: boolean }
export interface Activity { who: string; text: string; at: number }

export const DEFAULT_LEVELS: Level[] = [
  { n: 2, img: 0, mix: 8, name: "Découverte" }, { n: 2, img: 1, mix: 8, name: "Mini galerie" },
  { n: 3, img: 0, mix: 16, name: "Classique" }, { n: 3, img: 1, mix: 16, name: "Galerie" },
  { n: 4, img: 0, mix: 20, name: "Maître" }, { n: 4, img: 1, mix: 20, name: "Grande galerie" },
];
export const ADMIN_CODE = "pikaadmin"; // demo-only gate, local browser

const K = { users: "rc_users", session: "rc_session", levels: "pc_levels", act: "pc_activity", admin: "pc_admin" };
const EVT = "pika:update";

function ld<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
function sv(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } window.dispatchEvent(new Event(EVT)); }

export const emptyProgress = (): Progress => ({ unlocked: 1, best: {}, wins: 0, xp: 0 });
export const fmt = (ms: number) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); };

export const getUsers = () => ld<Record<string, User>>(K.users, {});
export const saveUsers = (u: Record<string, User>) => sv(K.users, u);
export const getSession = () => ld<string | null>(K.session, null);
export const setSession = (k: string | null) => sv(K.session, k);
export const getLevels = () => ld<Level[]>(K.levels, DEFAULT_LEVELS);
export const saveLevels = (l: Level[]) => sv(K.levels, l);
export const getActivity = () => ld<Activity[]>(K.act, []);
export const pushActivity = (who: string, text: string) => sv(K.act, [{ who, text, at: Date.now() }, ...getActivity()].slice(0, 40));
export const clearActivity = () => sv(K.act, []);
export const isAdmin = () => ld<boolean>(K.admin, false);
export const setAdmin = (v: boolean) => sv(K.admin, v);
export const onStoreChange = (fn: () => void) => { window.addEventListener(EVT, fn); window.addEventListener("storage", fn); return () => { window.removeEventListener(EVT, fn); window.removeEventListener("storage", fn); }; };

export async function sha(pw: string, salt: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pw));
  return Array.from(new Uint8Array(d)).map((x) => ("0" + x.toString(16)).slice(-2)).join("");
}

/** Validation rules (shared by UI + tests). */
export function validateCredentials(name: string, pw: string): string | null {
  if (name.trim().length < 3) return "Le pseudo doit faire 3 caractères au minimum.";
  if (name.trim().length > 16) return "Le pseudo doit faire 16 caractères au maximum.";
  if (!/^[\p{L}\p{N}_-]+$/u.test(name.trim())) return "Lettres, chiffres, - et _ uniquement.";
  if (pw.length < 6) return "Le mot de passe doit faire 6 caractères au minimum.";
  return null;
}

/** XP: base by cube size, bonus for few moves. */
export function xpFor(level: Level, moves: number) {
  return level.n * 50 + Math.max(0, level.mix * 3 - moves) * 5;
}

export function leaderboard(users: Record<string, User>) {
  return Object.values(users).filter((u) => !u.banned)
    .map((u) => ({ name: u.n, xp: u.p.xp || 0, wins: u.p.wins || 0, unlocked: u.p.unlocked }))
    .sort((a, b) => b.xp - a.xp);
}
