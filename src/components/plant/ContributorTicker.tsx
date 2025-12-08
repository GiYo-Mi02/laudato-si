"use client";

import { motion } from "framer-motion";

interface Contributor {
  id: string;
  name: string;
  timestamp: Date;
}

interface ContributorTickerProps {
  contributors: Contributor[];
}

export function ContributorTicker({ contributors }: ContributorTickerProps) {
  // Duplicate the list for seamless infinite scroll
  const duplicatedContributors = [...contributors, ...contributors];

  if (contributors.length === 0) {
    return (
      <div className="w-full py-4 bg-gradient-to-r from-[#FAF7F0] via-[#4A6B5C]/5 to-[#FAF7F0] overflow-hidden">
        <p className="text-center text-muted-foreground font-mono text-sm">
          Be the first to contribute!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-4 bg-gradient-to-r from-[#FAF7F0] via-[#4A6B5C]/5 to-[#FAF7F0] overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#FAF7F0] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FAF7F0] to-transparent z-10" />
      
      <motion.div
        className="flex gap-6 whitespace-nowrap"
        animate={{
          x: [0, -50 * contributors.length],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: contributors.length * 3,
            ease: "linear",
          },
        }}
      >
        {duplicatedContributors.map((contributor, index) => (
          <div
            key={`${contributor.id}-${index}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full border border-[#D4A574]/30 shadow-sm"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-[#C8E86C]"
            >
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 3-.3 4.3-.9-2.5-1.5-4.3-4.2-4.3-7.1 0-4.4 3.6-8 8-8 .3 0 .6 0 .9.1C19.5 3.5 16 2 12 2z" />
            </svg>
            <span className="font-mono text-sm text-[#2C2C2C]">
              {contributor.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
