import confetti from "canvas-confetti";

const CUBE = ["#c41e3a", "#ff7a1a", "#ffd500", "#009b48", "#0046ad", "#f4f4f0"];
let ctx: AudioContext | null = null;
let muted = false;
export const setMuted = (m: boolean) => { muted = m; };

export function blip(freq = 440, dur = 0.08, type: OscillatorType = "square", vol = 0.05) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* audio unavailable */ }
}
export const turnSound = () => blip(320 + Math.random() * 160, 0.06, "triangle", 0.06);
export const winJingle = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.18, "square", 0.05), i * 110));

export function burst(x = 0.5, y = 0.5) {
  confetti({ particleCount: 40, spread: 70, startVelocity: 30, origin: { x, y }, colors: CUBE, shapes: ["square"], scalar: 0.9 });
}
export function celebrate() {
  const end = Date.now() + 1400;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: CUBE, shapes: ["square"] });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: CUBE, shapes: ["square"] });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 160, spread: 110, origin: { y: 0.55 }, colors: CUBE, shapes: ["square", "circle"] });
}
