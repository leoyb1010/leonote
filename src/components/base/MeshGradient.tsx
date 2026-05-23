"use client";

import { motion } from "framer-motion";

export function MeshGradient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 bg-[var(--background)]">
      <div className="absolute inset-0 z-0 bg-white/30 dark:bg-black/30 backdrop-blur-[100px]" />
      
      {/* Primary Blob */}
      <motion.div
        animate={{
          x: [0, 100, 0, -100, 0],
          y: [0, -50, 50, -50, 0],
          scale: [1, 1.2, 1, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--primary)]/20 mix-blend-multiply blur-[80px]"
      />
      
      {/* Secondary Blob */}
      <motion.div
        animate={{
          x: [0, -100, 0, 100, 0],
          y: [0, 100, -50, 100, 0],
          scale: [1, 0.9, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[20%] right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/20 mix-blend-multiply blur-[80px]"
      />
      
      {/* Accent Blob */}
      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] rounded-full bg-purple-500/20 mix-blend-multiply blur-[80px]"
      />
    </div>
  );
}
