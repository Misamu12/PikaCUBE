const FACES = [
  ["bg-cube-red", "translateZ(var(--h))"], ["bg-cube-orange", "rotateY(180deg) translateZ(var(--h))"],
  ["bg-cube-blue", "rotateY(90deg) translateZ(var(--h))"], ["bg-cube-green", "rotateY(-90deg) translateZ(var(--h))"],
  ["bg-cube-yellow", "rotateX(90deg) translateZ(var(--h))"], ["bg-cube-white", "rotateX(-90deg) translateZ(var(--h))"],
] as const;

/** Pure-CSS floating 3×3 cube used as decoration outside the game. */
export function CssCube({ size = 120, delay = 0, className = "" }: { size?: number; delay?: number; className?: string }) {
  return (
    <div className={className} style={{ perspective: 800, width: size, height: size }} aria-hidden>
      <div className="animate-float3d relative h-full w-full" style={{ animationDelay: `${delay}s`, ["--h" as string]: `${size / 2}px` }}>
        {FACES.map(([c, t]) => (
          <div key={t} className="absolute inset-0 grid grid-cols-3 gap-[3px] rounded-md bg-ink p-[4px]" style={{ transform: t, backfaceVisibility: "hidden" }}>
            {Array.from({ length: 9 }).map((_, i) => <span key={i} className={`${c} rounded-[3px]`} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
