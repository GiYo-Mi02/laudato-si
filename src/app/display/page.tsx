"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThreePlant } from "@/components/plant/ThreePlant";
import { ContributorTicker } from "@/components/plant/ContributorTicker";
import { GrowthProgressBar } from "@/components/plant/GrowthProgressBar";
import { Leaf, Sprout, Flower, Trees, PartyPopper, CircleDot, Check, Sun, Moon, Cloud, Snowflake, CloudSun } from "lucide-react";
import QRCode from "react-qr-code";
import { useRealtimeContributions, useRealtimePlantStats } from "@/hooks/useRealtime";

type PlantStage = "seed" | "sprout" | "plant" | "tree";
type Season = "Spring" | "Summer" | "Autumn" | "Winter";

function getPlantStage(contributions: number): PlantStage {
  if (contributions < 10) return "seed";
  if (contributions < 50) return "sprout";
  if (contributions < 200) return "plant";
  return "tree";
}

function getRealSeason(): Season {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}

function getSkyGradient(time: number, season: Season) {
  const hour = time;
  
  // Night (20:00 - 05:00)
  if (hour >= 20 || hour < 5) {
    return "linear-gradient(to bottom, #0f172a, #312e81)"; // Slate-900 to Indigo-900
  }
  
  // Dawn (05:00 - 07:00)
  if (hour >= 5 && hour < 7) {
    return "linear-gradient(to bottom, #1e1b4b, #db2777, #fb923c)"; // Indigo-950 -> Pink-600 -> Orange-400
  }
  
  // Dusk (17:00 - 20:00)
  if (hour >= 17 && hour < 20) {
    return "linear-gradient(to bottom, #1e1b4b, #4c1d95, #fb923c)"; // Indigo-950 -> Violet-800 -> Orange-400
  }
  
  // Day (07:00 - 17:00) - Season dependent
  switch (season) {
    case "Winter":
      return "linear-gradient(to bottom, #e2e8f0, #f8fafc)"; // Slate-200 -> Slate-50
    case "Autumn":
      return "linear-gradient(to bottom, #ffedd5, #fff7ed)"; // Orange-100 -> Orange-50
    case "Summer":
      return "linear-gradient(to bottom, #bae6fd, #e0f2fe)"; // Sky-200 -> Sky-100
    case "Spring":
    default:
      return "linear-gradient(to bottom, #dcfce7, #f0fdf4)"; // Green-100 -> Green-50
  }
}

export default function DisplayPage() {
  const { contributions: realtimeContributions, loading: contributionsLoading } = useRealtimeContributions();
  const { plantStats, loading: statsLoading } = useRealtimePlantStats();
  
  const [showMilestone, setShowMilestone] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<"off" | "slow" | "fast">("off");
  
  // Time & Season State
  const [timeOfDay, setTimeOfDay] = useState(12); // 0-24 hours
  const [season, setSeason] = useState<Season>("Spring");
  const [isRealTime, setIsRealTime] = useState(true);
  const [timeSpeed, setTimeSpeed] = useState(1); // Multiplier for dev testing

  // Derived State
  const contributions = plantStats?.total_contributions || 0;
  
  const contributors = realtimeContributions.map((contrib: any) => ({
    id: contrib.id,
    name: contrib.users?.name || "Anonymous",
    timestamp: new Date(contrib.created_at),
    message: contrib.answer // Assuming answer is the message, or we can leave it undefined
  }));

  // Initialize Real Season
  useEffect(() => {
    setSeason(getRealSeason());
    const now = new Date();
    setTimeOfDay(now.getHours() + now.getMinutes() / 60);
  }, []);

  // Time Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRealTime) {
        const now = new Date();
        setTimeOfDay(now.getHours() + now.getMinutes() / 60);
      } else {
        // Advance time based on speed
        const timeStep = (1/60) * timeSpeed; 
        setTimeOfDay(prev => (prev + timeStep) % 24);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isRealTime, timeSpeed]);

  // Milestone Check
  useEffect(() => {
    // Simple check: if contributions changed and hit a milestone
    // This might trigger on initial load, so we might want to ref it
    // For now, let's just leave it or implement a proper previous value check
  }, [contributions]);

  const plantStage = getPlantStage(contributions);
  const isNight = timeOfDay >= 19 || timeOfDay < 6;
  const textColor = isNight ? "text-white" : "text-[#2C2C2C]";
  const mutedTextColor = isNight ? "text-gray-300" : "text-muted-foreground";

  return (
    <motion.div 
      className="min-h-screen flex flex-col overflow-hidden transition-colors duration-1000"
      animate={{
        background: getSkyGradient(timeOfDay, season)
      }}
    >
      {/* Header */}
      <header className="py-6 px-8 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#4A6B5C] flex items-center justify-center shadow-lg">
              <Leaf className="w-7 h-7 text-[#C8E86C]" />
            </div>
            <div>
              <h1 className={`font-display text-4xl ${textColor} drop-shadow-sm`}>Laudato Si&apos;</h1>
              <p className={`font-mono text-sm ${mutedTextColor}`}>UMak Campus Growth Initiative</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
             {/* Time/Season Display */}
             <div className={`text-right hidden md:block ${textColor}`}>
                <div className="flex items-center justify-end gap-2">
                   {isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                   <span className="font-mono text-lg">
                     {Math.floor(timeOfDay).toString().padStart(2, '0')}:
                     {Math.floor((timeOfDay % 1) * 60).toString().padStart(2, '0')}
                   </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-sm opacity-80">
                   {season === "Spring" && <CloudSun className="w-3 h-3" />}
                   {season === "Summer" && <Sun className="w-3 h-3" />}
                   {season === "Autumn" && <Cloud className="w-3 h-3" />}
                   {season === "Winter" && <Snowflake className="w-3 h-3" />}
                   <span>{season}</span>
                </div>
             </div>

             <div className="text-right">
                <p className={`font-mono text-sm ${mutedTextColor}`}>Total Contributions</p>
                <motion.p
                  key={contributions}
                  initial={{ scale: 1.2, color: "#C8E86C" }}
                  animate={{ scale: 1, color: "#4A6B5C" }}
                  className="font-display text-5xl text-[#4A6B5C] drop-shadow-md"
                >
                  {contributions}
                </motion.p>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-4 relative">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-center h-full">
          
          {/* Left Panel: Info & QR */}
          <div className="space-y-6 z-10">
             <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-white/20 ${isNight ? 'bg-slate-900/40' : 'bg-white/60'}`}
            >
              <h2 className={`font-display text-2xl mb-4 ${textColor}`}>How to Contribute</h2>
              <ol className={`space-y-3 font-body ${textColor}`}>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#4A6B5C] text-white flex items-center justify-center flex-shrink-0 font-display text-sm">1</span>
                  <span>Scan the QR code</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#4A6B5C] text-white flex items-center justify-center flex-shrink-0 font-display text-sm">2</span>
                  <span>Sign in & Answer</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#C8E86C] text-[#2C2C2C] flex items-center justify-center flex-shrink-0 font-display text-sm">
                    <Check className="w-4 h-4" />
                  </span>
                  <span>Watch it grow!</span>
                </li>
              </ol>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 flex flex-col items-center text-center ${isNight ? 'bg-slate-900/40' : 'bg-white/60'}`}
            >
               <h3 className="font-display text-xl text-[#4A6B5C] mb-4">Join the Movement</h3>
               <div className="bg-white p-4 rounded-xl shadow-inner">
                 <QRCode value="https://laudato-si.vercel.app/scan" size={180} />
               </div>
               <p className={`mt-3 text-sm font-mono ${mutedTextColor}`}>Scan to participate</p>
            </motion.div>
          </div>

          {/* Center: 3D Plant */}
          <div className="lg:col-span-2 h-[80vh] min-h-[600px] relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full"
            >
              <ThreePlant
                stage={plantStage}
                contributors={contributors}
                contributions={contributions}
                timeOfDay={timeOfDay}
                season={season}
              />
            </motion.div>

            {/* Stage badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 shadow-lg pointer-events-none flex items-center gap-2 ${isNight ? 'bg-slate-900/60 text-white' : 'bg-white/80 text-[#4A6B5C]'}`}
            >
              <span className="font-display text-xl capitalize flex items-center gap-2">
                {plantStage === "seed" && <><CircleDot className="w-6 h-6" /> Seed Stage</>}
                {plantStage === "sprout" && <><Sprout className="w-6 h-6" /> Sprout Stage</>}
                {plantStage === "plant" && <><Flower className="w-6 h-6" /> Plant Stage</>}
                {plantStage === "tree" && <><Trees className="w-6 h-6" /> Tree Stage</>}
              </span>
            </motion.div>
          </div>

        </div>
      </main>

      {/* Contributor Ticker - kept as requested for "names of the user" */}
      <div className="mt-auto z-10">
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
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border-2 border-[#C8E86C] text-center flex flex-col items-center">
                <PartyPopper className="w-16 h-16 text-[#4A6B5C] mb-4" />
                <h3 className="font-display text-5xl text-[#4A6B5C] mb-4">
                  Milestone Reached!
                </h3>
                <p className="font-body text-xl text-muted-foreground">
                  The campus plant has grown stronger!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dev Controls */}
      <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur p-4 rounded-xl shadow-xl border border-gray-200 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
        <p className="text-xs font-bold text-gray-500 uppercase">Dev Controls</p>
        
        {/* Growth Controls */}
        <div className="flex flex-wrap gap-2">
          <p className="text-xs text-gray-500 w-full">Note: Growth is now controlled by real DB data.</p>
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* Time Controls */}
        <div className="flex flex-col gap-2">
           <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Time Mode:</span>
              <button 
                onClick={() => setIsRealTime(!isRealTime)} 
                className={`px-2 py-0.5 rounded text-xs ${isRealTime ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
              >
                {isRealTime ? "Real-time" : "Manual/Sim"}
              </button>
           </div>
           
           {!isRealTime && (
             <>
               <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-500 w-8">Hour:</span>
                 <input 
                   type="range" 
                   min="0" 
                   max="24" 
                   step="0.1"
                   value={timeOfDay} 
                   onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                   className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />
                 <span className="text-xs w-8 text-right">{Math.floor(timeOfDay)}h</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-500 w-8">Speed:</span>
                 <button onClick={() => setTimeSpeed(0)} className={`px-2 py-0.5 rounded text-xs ${timeSpeed === 0 ? "bg-gray-300" : "bg-gray-100"}`}>Pause</button>
                 <button onClick={() => setTimeSpeed(1)} className={`px-2 py-0.5 rounded text-xs ${timeSpeed === 1 ? "bg-blue-200" : "bg-gray-100"}`}>1x</button>
                 <button onClick={() => setTimeSpeed(5)} className={`px-2 py-0.5 rounded text-xs ${timeSpeed === 5 ? "bg-blue-200" : "bg-gray-100"}`}>5x</button>
               </div>
             </>
           )}
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* Season Controls */}
        <div className="flex flex-col gap-2">
           <span className="text-xs text-gray-500">Season:</span>
           <div className="grid grid-cols-2 gap-1">
              {(["Spring", "Summer", "Autumn", "Winter"] as Season[]).map((s) => (
                <button 
                  key={s}
                  onClick={() => { setIsRealTime(false); setSeason(s); }}
                  className={`px-2 py-1 rounded text-xs ${season === s ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-50"}`}
                >
                  {s}
                </button>
              ))}
           </div>
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* Sim Speed Removed */}
      </div>
    </motion.div>
  );
}
