import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  type: "heart" | "star";
  delay: number;
  duration: number;
  drift: number;
  size: number;
}

interface Props {
  active: boolean;
  superLike?: boolean;
  onComplete: () => void;
}

export default function FloatingLikeParticles({ active, superLike, onComplete }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    const count = superLike ? 20 : 14;
    const ps: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 88 + 6,
      type: superLike && i % 3 === 0 ? "star" : "heart",
      delay: Math.random() * 1.4,
      duration: 3.5 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 100,
      size: 18 + Math.random() * 14,
    }));
    setParticles(ps);
    const maxTime = (1.4 + 5.5 + 0.6) * 1000;
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete();
    }, maxTime);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute leading-none particle-float-down"
          style={{
            left: `${p.x}%`,
            top: -40,
            fontSize: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--x-drift": `${p.drift}px`,
          } as React.CSSProperties}
        >
          {p.type === "star" ? "⭐" : "❤️"}
        </span>
      ))}
    </div>
  );
}
