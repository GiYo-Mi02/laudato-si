"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Leaf {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  hue: number;
}

interface PlantCanvasProps {
  growthLevel: number; // 0-100
  leaves: Leaf[];
  stage: "seed" | "sprout" | "plant" | "tree";
  showMilestone?: boolean;
}

export function PlantCanvas({ growthLevel, leaves, stage, showMilestone }: PlantCanvasProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (showMilestone) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [showMilestone]);

  const stemHeight = Math.min(growthLevel * 2.5, 250);
  const potY = 320;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
      {/* Milestone celebration particles */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-radial from-[#C8E86C]/20 to-transparent animate-pulse" />
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: -20, x: `${p.x}%`, opacity: 1, rotate: 0 }}
                animate={{ y: "100vh", rotate: 720, opacity: 0 }}
                transition={{ duration: 2, ease: "easeIn" }}
                className="absolute w-4 h-4"
              >
                <svg viewBox="0 0 24 24" className="w-full h-full fill-[#C8E86C]">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 3-.3 4.3-.9-2.5-1.5-4.3-4.2-4.3-7.1 0-4.4 3.6-8 8-8 .3 0 .6 0 .9.1C19.5 3.5 16 2 12 2z" />
                </svg>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        viewBox="0 0 300 400"
        className="w-full max-w-[300px] h-auto"
        style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.08))" }}
      >
        {/* Pot */}
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <path
            d="M100 340 L110 380 L190 380 L200 340 Z"
            fill="#D4A574"
            stroke="#B8956A"
            strokeWidth="2"
          />
          <ellipse cx="150" cy="340" rx="50" ry="10" fill="#D4A574" stroke="#B8956A" strokeWidth="2" />
          <ellipse cx="150" cy="340" rx="45" ry="8" fill="#8B6914" opacity="0.3" />
        </motion.g>

        {/* Soil */}
        <ellipse cx="150" cy="340" rx="40" ry="6" fill="#5D4E37" />

        {/* Stem */}
        <motion.path
          d={`M150 ${potY} Q${145 + Math.sin(growthLevel * 0.1) * 5} ${potY - stemHeight / 2} 150 ${potY - stemHeight}`}
          stroke="#4A6B5C"
          strokeWidth={stage === "tree" ? 8 : stage === "plant" ? 5 : 3}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Stage-specific elements */}
        {stage === "seed" && (
          <motion.ellipse
            cx="150"
            cy="335"
            rx="8"
            ry="5"
            fill="#8B6914"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {stage === "sprout" && (
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <path
              d={`M150 ${potY - stemHeight} Q140 ${potY - stemHeight - 15} 135 ${potY - stemHeight - 25}`}
              stroke="#4A6B5C"
              strokeWidth="2"
              fill="none"
            />
            <ellipse
              cx="132"
              cy={potY - stemHeight - 28}
              rx="10"
              ry="6"
              fill="#C8E86C"
              transform={`rotate(-30 132 ${potY - stemHeight - 28})`}
            />
          </motion.g>
        )}

        {(stage === "plant" || stage === "tree") && (
          <>
            {/* Main leaves */}
            {leaves.slice(0, stage === "tree" ? 12 : 6).map((leaf, i) => {
              const leafY = potY - stemHeight + (i * stemHeight) / (leaves.length || 1);
              const side = i % 2 === 0 ? -1 : 1;
              return (
                <motion.g
                  key={leaf.id}
                  initial={{ scale: 0, rotate: -45 * side }}
                  animate={{ scale: leaf.scale, rotate: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1, type: "spring", bounce: 0.4 }}
                >
                  <ellipse
                    cx={150 + side * 25}
                    cy={leafY}
                    rx="18"
                    ry="10"
                    fill={`hsl(${leaf.hue}, 50%, 50%)`}
                    transform={`rotate(${side * 30} ${150 + side * 25} ${leafY})`}
                    style={{
                      filter: "drop-shadow(inset 0 0 12px rgba(200,232,108,0.4))",
                    }}
                  />
                  {/* Leaf vein */}
                  <line
                    x1={150 + side * 10}
                    y1={leafY}
                    x2={150 + side * 38}
                    y2={leafY}
                    stroke={`hsl(${leaf.hue}, 40%, 35%)`}
                    strokeWidth="1"
                    opacity="0.5"
                    transform={`rotate(${side * 30} ${150 + side * 25} ${leafY})`}
                  />
                  {/* Name label */}
                  {leaf.name && (
                    <text
                      x={150 + side * 50}
                      y={leafY + 4}
                      fontSize="8"
                      fill="#4A6B5C"
                      fontFamily="Space Mono, monospace"
                      textAnchor={side === 1 ? "start" : "end"}
                    >
                      {leaf.name}
                    </text>
                  )}
                </motion.g>
              );
            })}

            {/* Tree crown for tree stage */}
            {stage === "tree" && (
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
              >
                <ellipse cx="150" cy={potY - stemHeight - 30} rx="50" ry="40" fill="#4A6B5C" opacity="0.9" />
                <ellipse cx="130" cy={potY - stemHeight - 50} rx="35" ry="30" fill="#5A7B6C" opacity="0.9" />
                <ellipse cx="170" cy={potY - stemHeight - 45} rx="30" ry="25" fill="#6A8B7C" opacity="0.9" />
                <ellipse cx="150" cy={potY - stemHeight - 60} rx="25" ry="20" fill="#C8E86C" opacity="0.8" />
              </motion.g>
            )}
          </>
        )}

        {/* Growth glow effect */}
        <motion.circle
          cx="150"
          cy={potY - stemHeight}
          r="15"
          fill="none"
          stroke="#C8E86C"
          strokeWidth="2"
          opacity="0.5"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}
