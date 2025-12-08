"use client";

import { motion } from "framer-motion";

interface GrowthProgressBarProps {
  currentValue: number;
  maxValue: number;
  milestones: number[];
}

export function GrowthProgressBar({ currentValue, maxValue, milestones }: GrowthProgressBarProps) {
  const percentage = Math.min((currentValue / maxValue) * 100, 100);

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-display text-lg text-[#4A6B5C]">Growth Progress</span>
        <span className="font-mono text-sm text-[#2C2C2C]">
          {currentValue} / {maxValue}
        </span>
      </div>
      
      <div className="relative h-4 bg-[#D4A574]/20 rounded-full overflow-hidden">
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#4A6B5C] to-[#C8E86C] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        
        {/* Root-like texture overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 10px,
              rgba(74, 107, 92, 0.3) 10px,
              rgba(74, 107, 92, 0.3) 12px
            )`,
          }}
        />
        
        {/* Milestone markers */}
        {milestones.map((milestone) => {
          const milestonePercent = (milestone / maxValue) * 100;
          const isReached = currentValue >= milestone;
          return (
            <div
              key={milestone}
              className="absolute top-0 bottom-0 w-1"
              style={{ left: `${milestonePercent}%` }}
            >
              <div
                className={`w-full h-full ${
                  isReached ? "bg-[#C8E86C]" : "bg-[#D4A574]/50"
                }`}
              />
              <motion.div
                className={`absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${
                  isReached
                    ? "bg-[#C8E86C] border-[#4A6B5C]"
                    : "bg-white border-[#D4A574]"
                }`}
                animate={isReached ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            </div>
          );
        })}
      </div>
      
      {/* Milestone labels */}
      <div className="relative mt-4 h-6">
        {milestones.map((milestone) => {
          const milestonePercent = (milestone / maxValue) * 100;
          const isReached = currentValue >= milestone;
          return (
            <div
              key={milestone}
              className="absolute text-center"
              style={{ 
                left: `${milestonePercent}%`,
                transform: "translateX(-50%)",
              }}
            >
              <span
                className={`font-mono text-xs ${
                  isReached ? "text-[#4A6B5C] font-bold" : "text-muted-foreground"
                }`}
              >
                {milestone}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
