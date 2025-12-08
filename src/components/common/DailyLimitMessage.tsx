"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Leaf } from "lucide-react";

interface DailyLimitMessageProps {
  nextAvailableTime: Date;
}

export function DailyLimitMessage({ nextAvailableTime }: DailyLimitMessageProps) {
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextAvailableTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Available now!");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextAvailableTime]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#D4A574]/20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-[#C8E86C]/20 flex items-center justify-center mx-auto mb-6"
        >
          <Leaf className="w-10 h-10 text-[#4A6B5C]" />
        </motion.div>

        <h2 className="font-display text-2xl text-[#2C2C2C] mb-3">
          Come back tomorrow!
        </h2>
        
        <p className="font-body text-muted-foreground mb-6">
          You&apos;ve already made your contribution today. The plant thanks you! 🌱
        </p>

        <div className="bg-[#4A6B5C]/5 rounded-xl p-4 inline-flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#4A6B5C]" />
          <span className="font-mono text-2xl text-[#4A6B5C]">{timeRemaining}</span>
        </div>

        <p className="font-body text-sm text-muted-foreground mt-4">
          Until your next contribution
        </p>
      </div>
    </motion.div>
  );
}
