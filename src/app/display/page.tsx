"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlantCanvas } from "@/components/plant/PlantCanvas";
import { ContributorTicker } from "@/components/plant/ContributorTicker";
import { GrowthProgressBar } from "@/components/plant/GrowthProgressBar";
import { Leaf } from "lucide-react";

// Mock data - in production this would come from Supabase realtime
const mockContributors = [
  { id: "1", name: "Maria S.", timestamp: new Date() },
  { id: "2", name: "Juan D.", timestamp: new Date() },
  { id: "3", name: "Ana R.", timestamp: new Date() },
  { id: "4", name: "Carlos M.", timestamp: new Date() },
  { id: "5", name: "Sofia L.", timestamp: new Date() },
  { id: "6", name: "Miguel A.", timestamp: new Date() },
  { id: "7", name: "Isabella G.", timestamp: new Date() },
  { id: "8", name: "Diego P.", timestamp: new Date() },
  { id: "9", name: "Valentina C.", timestamp: new Date() },
  { id: "10", name: "Sebastian T.", timestamp: new Date() },
];

type PlantStage = "seed" | "sprout" | "plant" | "tree";

function getPlantStage(contributions: number): PlantStage {
  if (contributions < 10) return "seed";
  if (contributions < 50) return "sprout";
  if (contributions < 200) return "plant";
  return "tree";
}

export default function DisplayPage() {
  const [contributions, setContributions] = useState(125);
  const [showMilestone, setShowMilestone] = useState(false);
  const [contributors, setContributors] = useState(mockContributors);
  const [leaves, setLeaves] = useState<
    Array<{
      id: string;
      name: string;
      x: number;
      y: number;
      rotation: number;
      scale: number;
      hue: number;
    }>
  >([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add a new contribution
      if (Math.random() > 0.7) {
        const names = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Quinn", "Avery"];
        const randomName = names[Math.floor(Math.random() * names.length)];
        
        setContributions((prev) => {
          const newValue = prev + 1;
          const milestones = [50, 100, 150, 200];
          if (milestones.some((m) => prev < m && newValue >= m)) {
            setShowMilestone(true);
            setTimeout(() => setShowMilestone(false), 3000);
          }
          return newValue;
        });

        setContributors((prev) => [
          { id: `contrib-${Date.now()}`, name: `${randomName} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`, timestamp: new Date() },
          ...prev.slice(0, 19),
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Generate leaves based on contributions
  useEffect(() => {
    const leafCount = Math.min(Math.floor(contributions / 10), 12);
    const newLeaves = Array.from({ length: leafCount }, (_, i) => ({
      id: `leaf-${i}`,
      name: contributors[i % contributors.length]?.name || "",
      x: 0,
      y: 0,
      rotation: (Math.random() - 0.5) * 30,
      scale: 0.8 + Math.random() * 0.4,
      hue: 100 + Math.random() * 40,
    }));
    setLeaves(newLeaves);
  }, [contributions, contributors]);

  const plantStage = getPlantStage(contributions);
  const maxContributions = 250;
  const milestones = [50, 100, 150, 200];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] overflow-hidden">
      {/* Header */}
      <header className="py-6 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#4A6B5C] flex items-center justify-center">
              <Leaf className="w-7 h-7 text-[#C8E86C]" />
            </div>
            <div>
              <h1 className="font-display text-4xl text-[#2C2C2C]">Laudato Si&apos;</h1>
              <p className="font-mono text-sm text-muted-foreground">UMak Campus Growth Initiative</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono text-sm text-muted-foreground">Total Contributions</p>
            <motion.p
              key={contributions}
              initial={{ scale: 1.2, color: "#C8E86C" }}
              animate={{ scale: 1, color: "#4A6B5C" }}
              className="font-display text-5xl text-[#4A6B5C]"
            >
              {contributions}
            </motion.p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-4">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Plant Canvas - Larger for display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="transform scale-125 origin-center">
              <PlantCanvas
                growthLevel={contributions}
                leaves={leaves}
                stage={plantStage}
                showMilestone={showMilestone}
              />
            </div>

            {/* Stage badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#D4A574]/30 shadow-lg"
            >
              <span className="font-display text-xl text-[#4A6B5C] capitalize">
                {plantStage === "seed" && "🌱 Seed Stage"}
                {plantStage === "sprout" && "🌿 Sprout Stage"}
                {plantStage === "plant" && "🪴 Plant Stage"}
                {plantStage === "tree" && "🌳 Tree Stage"}
              </span>
            </motion.div>
          </motion.div>

          {/* Info Panel */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#D4A574]/20"
            >
              <h2 className="font-display text-2xl text-[#2C2C2C] mb-4">How to Contribute</h2>
              <ol className="space-y-4 font-body text-[#2C2C2C]">
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#4A6B5C] text-white flex items-center justify-center flex-shrink-0 font-display">1</span>
                  <span>Scan any QR code around campus</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#4A6B5C] text-white flex items-center justify-center flex-shrink-0 font-display">2</span>
                  <span>Sign in with your @umak.edu.ph account</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#4A6B5C] text-white flex items-center justify-center flex-shrink-0 font-display">3</span>
                  <span>Answer an eco-question or make a pledge</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#C8E86C] text-[#2C2C2C] flex items-center justify-center flex-shrink-0 font-display">✓</span>
                  <span>Watch the plant grow!</span>
                </li>
              </ol>
            </motion.div>

            {/* Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GrowthProgressBar
                currentValue={contributions}
                maxValue={maxContributions}
                milestones={milestones}
              />
            </motion.div>

            {/* Next milestone */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#C8E86C]/20 rounded-xl p-6 text-center"
            >
              <p className="font-body text-sm text-muted-foreground mb-1">Next Milestone</p>
              <p className="font-display text-3xl text-[#4A6B5C]">
                {milestones.find((m) => m > contributions) || "Complete!"} contributions
              </p>
              <p className="font-mono text-sm text-[#4A6B5C] mt-2">
                {Math.max(0, (milestones.find((m) => m > contributions) || contributions) - contributions)} more to go!
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Contributor Ticker */}
      <div className="mt-auto">
        <ContributorTicker contributors={contributors} />
      </div>

      {/* Milestone celebration overlay */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <div className="absolute inset-0 bg-gradient-radial from-[#C8E86C]/40 via-transparent to-transparent" />
            
            {/* Confetti leaves */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -50, 
                  x: `${Math.random() * 100}vw`, 
                  rotate: 0,
                  opacity: 1 
                }}
                animate={{ 
                  y: "110vh", 
                  rotate: 720,
                  opacity: 0 
                }}
                transition={{ 
                  duration: 2 + Math.random(), 
                  delay: Math.random() * 0.5,
                  ease: "easeIn" 
                }}
                className="absolute w-6 h-6"
              >
                <svg viewBox="0 0 24 24" className="w-full h-full" style={{ fill: `hsl(${80 + Math.random() * 40}, 70%, 60%)` }}>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 3-.3 4.3-.9-2.5-1.5-4.3-4.2-4.3-7.1 0-4.4 3.6-8 8-8 .3 0 .6 0 .9.1C19.5 3.5 16 2 12 2z" />
                </svg>
              </motion.div>
            ))}

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border-2 border-[#C8E86C] text-center">
                <h3 className="font-display text-5xl text-[#4A6B5C] mb-4">
                  🎉 Milestone Reached!
                </h3>
                <p className="font-body text-xl text-muted-foreground">
                  The campus plant has grown stronger!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
