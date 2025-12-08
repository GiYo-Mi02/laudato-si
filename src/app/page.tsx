"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/common/Header";
import { PlantCanvas } from "@/components/plant/PlantCanvas";
import { ContributorTicker } from "@/components/plant/ContributorTicker";
import { GrowthProgressBar } from "@/components/plant/GrowthProgressBar";
import { EcoQuestionCard } from "@/components/eco/EcoQuestionCard";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { DailyLimitMessage } from "@/components/common/DailyLimitMessage";

// Mock data for demonstration
const mockQuestions = [
  {
    id: "1",
    type: "quiz" as const,
    question: "What is the most effective way to reduce your carbon footprint?",
    options: [
      "Using public transportation",
      "Eating less meat",
      "Reducing energy consumption at home",
      "All of the above",
    ],
  },
  {
    id: "2",
    type: "pledge" as const,
    question: "Make a pledge for the environment",
    placeholder: "I pledge to reduce my plastic usage by...",
  },
  {
    id: "3",
    type: "quiz" as const,
    question: "How much water can you save by turning off the tap while brushing teeth?",
    options: [
      "Up to 3 liters per day",
      "Up to 8 liters per day",
      "Up to 15 liters per day",
      "Up to 25 liters per day",
    ],
  },
];

const mockContributors = [
  { id: "1", name: "Maria S.", timestamp: new Date() },
  { id: "2", name: "Juan D.", timestamp: new Date() },
  { id: "3", name: "Ana R.", timestamp: new Date() },
  { id: "4", name: "Carlos M.", timestamp: new Date() },
  { id: "5", name: "Sofia L.", timestamp: new Date() },
  { id: "6", name: "Miguel A.", timestamp: new Date() },
  { id: "7", name: "Isabella G.", timestamp: new Date() },
  { id: "8", name: "Diego P.", timestamp: new Date() },
];

type PlantStage = "seed" | "sprout" | "plant" | "tree";

function getPlantStage(contributions: number): PlantStage {
  if (contributions < 10) return "seed";
  if (contributions < 50) return "sprout";
  if (contributions < 200) return "plant";
  return "tree";
}

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | undefined>();
  const [hasContributedToday, setHasContributedToday] = useState(false);
  const [contributions, setContributions] = useState(75);
  const [showMilestone, setShowMilestone] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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

  const handleSignIn = useCallback(() => {
    setIsLoading(true);
    // Simulate authentication
    setTimeout(() => {
      setIsAuthenticated(true);
      setUserName("Student");
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleSignOut = useCallback(() => {
    setIsAuthenticated(false);
    setUserName(undefined);
  }, []);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newContributions = contributions + 1;
    const milestones = [50, 100, 150, 200];
    const hitMilestone = milestones.some(
      (m) => contributions < m && newContributions >= m
    );

    if (hitMilestone) {
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 2500);
    }

    setContributions(newContributions);

    // Add new contributor
    const newContributor = {
      id: `contrib-${Date.now()}`,
      name: userName || "Anonymous",
      timestamp: new Date(),
    };
    setContributors((prev) => [newContributor, ...prev.slice(0, 19)]);

    // Move to next question
    setCurrentQuestionIndex((prev) => (prev + 1) % mockQuestions.length);

    // Mark as contributed today (for demo, we'll skip this)
    // setHasContributedToday(true);
  }, [contributions, userName]);

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const plantStage = getPlantStage(contributions);
  const maxContributions = 250;
  const milestones = [50, 100, 150, 200];

  // Calculate next available time (tomorrow at midnight)
  const nextAvailableTime = new Date();
  nextAvailableTime.setDate(nextAvailableTime.getDate() + 1);
  nextAvailableTime.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header userName={userName} onSignOut={isAuthenticated ? handleSignOut : undefined} />

      <main className="flex-1 flex flex-col">
        {/* Plant Canvas Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex-shrink-0"
        >
          <PlantCanvas
            growthLevel={contributions}
            leaves={leaves}
            stage={plantStage}
            showMilestone={showMilestone}
          />

          {/* Stage indicator */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#D4A574]/30 shadow-sm"
            >
              <span className="font-display text-sm text-[#4A6B5C] capitalize">
                Stage: {plantStage}
              </span>
            </motion.div>
          </div>
        </motion.section>

        {/* Progress Bar */}
        <section className="py-6 px-4">
          <GrowthProgressBar
            currentValue={contributions}
            maxValue={maxContributions}
            milestones={milestones}
          />
        </section>

        {/* Contributor Ticker */}
        <ContributorTicker contributors={contributors} />

        {/* Main Content Area */}
        <section className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-md mx-auto text-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <h2 className="font-display text-3xl md:text-4xl text-[#2C2C2C] mb-4">
                    Join the Growth
                  </h2>
                  <p className="font-body text-muted-foreground text-lg">
                    Answer eco-questions and help our campus plant thrive!
                  </p>
                </motion.div>

                <GoogleAuthButton onSignIn={handleSignIn} isLoading={isLoading} />
              </motion.div>
            ) : hasContributedToday ? (
              <motion.div
                key="limit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DailyLimitMessage nextAvailableTime={nextAvailableTime} />
              </motion.div>
            ) : (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <EcoQuestionCard
                  question={currentQuestion}
                  onSubmit={handleSubmitAnswer}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Footer */}
        <footer className="py-6 px-4 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            Laudato Si&apos; — A UMak Environmental Initiative
          </p>
        </footer>
      </main>

      {/* Milestone celebration overlay */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <div className="absolute inset-0 bg-gradient-radial from-[#C8E86C]/30 via-transparent to-transparent" />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-[#C8E86C] text-center">
                <h3 className="font-display text-3xl text-[#4A6B5C] mb-2">
                  🎉 Milestone Reached!
                </h3>
                <p className="font-body text-muted-foreground">
                  The plant has grown stronger!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
