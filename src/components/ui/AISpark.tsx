"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AISparkProps = {
  className?: string;
  density?: number;
  subdued?: boolean;
};

type Particle = {
  id: string;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
};

export function AISpark({ className, density = 12, subdued = false }: AISparkProps) {
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: density }, (_, index) => ({
      id: `spark-${index}`,
      left: (index * 37) % 100,
      top: (index * 19) % 100,
      size: 2 + (index % 4),
      duration: 5 + (index % 5) * 0.8,
      delay: index * 0.18,
      opacity: subdued ? 0.10 + (index % 3) * 0.03 : 0.14 + (index % 4) * 0.04,
    })),
  [density, subdued]);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-[var(--primary)]"
          style={{
            left: `${particle.left}%`, top: `${particle.top}%`,
            width: particle.size, height: particle.size,
            opacity: particle.opacity,
            boxShadow: "0 0 14px rgba(124,140,255,0.35)",
          }}
          animate={{
            y: [-6, 6, -4], x: [0, 4, -3, 0],
            opacity: [particle.opacity * 0.8, particle.opacity, particle.opacity * 0.7],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: particle.duration, delay: particle.delay,
            repeat: Number.POSITIVE_INFINITY, repeatType: "mirror", ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
