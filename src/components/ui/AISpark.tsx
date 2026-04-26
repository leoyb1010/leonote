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
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: density }, (_, index) => ({
      id: `spark-${index}`,
      left: (index * 37) % 100,
      top: (index * 19) % 100,
      size: 2 + (index % 4),
      duration: 5 + (index % 5) * 0.8,
      delay: index * 0.18,
      opacity: subdued ? 0.12 + (index % 3) * 0.03 : 0.16 + (index % 4) * 0.04,
    }));
  }, [density, subdued]);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.20),transparent_28%),radial-gradient(circle_at_80%_22%,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_56%_80%,rgba(124,58,237,0.16),transparent_20%)]" />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            boxShadow: "0 0 16px rgba(99,102,241,0.45)",
          }}
          animate={{
            y: [-6, 6, -4],
            x: [0, 4, -3, 0],
            opacity: [particle.opacity * 0.8, particle.opacity, particle.opacity * 0.7],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
