"use client";

/**
 * ============================================================================
 * MAIN HOMEPAGE - Public Landing & Guest Flow
 * ============================================================================
 * This page serves two purposes:
 * 1. Public landing page (unauthenticated users) - Shows plant, sign in CTA
 * 2. Guest flow (non-UMak users) - Can take 1-time pledge via modal
 * 
 * UMak users (@umak.edu.ph) are redirected to /home dashboard after sign in.
 * ============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { ThreePlant } from "@/components/plant/ThreePlant";
import { ContributorTicker } from "@/components/plant/ContributorTicker";
import { GrowthProgressBar } from "@/components/plant/GrowthProgressBar";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { DailyLimitMessage } from "@/components/common/DailyLimitMessage";
import GuestPledgeModal from "@/components/pledge/GuestPledgeModal";
import { useRealtimeContributions, useRealtimePlantStats } from "@/hooks/useRealtime";
import { Flame, Trophy, Gift, Heart, Sparkles, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PlantStage = "seed" | "sprout" | "plant" | "tree";
type Season = "Spring" | "Summer" | "Autumn" | "Winter";

function getRealSeason(): Season {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}

/**
 * Check if email is a UMak student/staff
 */
function isUMakUser(email: string | null | undefined): boolean {
  return email?.toLowerCase().endsWith('@umak.edu.ph') || false;
}

/**
 * Admin roles that should be redirected to admin dashboard
 */
const ADMIN_ROLES = ['admin', 'canteen_admin', 'finance_admin', 'sa_admin', 'super_admin'];

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { contributions: realtimeContributions, loading: contributionsLoading } = useRealtimeContributions();
  const { plantStats, loading: statsLoading } = useRealtimePlantStats();
  
  // Guest pledge state (no longer used - all users go to dashboard)
  const [showGuestPledge, setShowGuestPledge] = useState(false);
  const [guestHasPledged, setGuestHasPledged] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);

  // Time & Season State
  const [timeOfDay, setTimeOfDay] = useState(12);
  const [season, setSeason] = useState<Season>("Spring");

  // Check if guest has already pledged (stored in localStorage)
  useEffect(() => {
    const pledged = localStorage.getItem('guest_has_pledged');
    if (pledged === 'true') {
      setGuestHasPledged(true);
    }
  }, []);

  // Redirect authenticated users based on role
  // Admins → /admin dashboard
  // Regular users → /home dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      
      // Check if user is admin
      if (userRole && ADMIN_ROLES.includes(userRole)) {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    }
  }, [status, session, router]);

  // Initialize Time & Season
  useEffect(() => {
    setSeason(getRealSeason());
    const updateTime = () => {
      const now = new Date();
      setTimeOfDay(now.getHours() + now.getMinutes() / 60);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  /**
   * Handle guest pledge completion
   */
  const handleGuestPledgeComplete = useCallback(() => {
    localStorage.setItem('guest_has_pledged', 'true');
    setGuestHasPledged(true);
    setShowGuestPledge(false);
    setShowMilestone(true);
    setTimeout(() => setShowMilestone(false), 2500);
  }, []);

  const contributions = plantStats?.total_contributions || 0;
  const plantStage = plantStats?.current_stage || "seed";
  const maxContributions = 1000;
  const milestones = [10, 50, 100, 200, 500];

  // Format contributors for display
  const formattedContributors = realtimeContributions.map((contrib: any) => ({
    id: contrib.id,
    name: contrib.users?.name || "Anonymous",
    timestamp: new Date(contrib.created_at),
  }));

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading" || statsLoading || contributionsLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        userName={session?.user?.name || undefined} 
        onSignOut={isAuthenticated ? handleSignOut : undefined} 
      />

      <main className="flex-1 flex flex-col">
        {/* Plant Canvas Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex-shrink-0 h-[500px] w-full"
        >
          <ThreePlant
            contributions={contributions}
            contributors={formattedContributors}
            stage={plantStage as PlantStage}
            timeOfDay={timeOfDay}
            season={season}
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
        <ContributorTicker contributors={formattedContributors} />

        {/* Main Content Area */}
        <section className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-12 h-12 border-4 border-[#81C784] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </motion.div>
            ) : !isAuthenticated ? (
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

                <GoogleAuthButton />
              </motion.div>
            ) : (
              /* Authenticated user - redirecting to dashboard */
              <motion.div
                key="redirecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="w-12 h-12 border-4 border-[#81C784] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
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

      {/* Guest Pledge Modal - kept for backwards compatibility */}
      <GuestPledgeModal
        isOpen={showGuestPledge}
        onClose={() => setShowGuestPledge(false)}
        onComplete={handleGuestPledgeComplete}
        guestEmail={session?.user?.email || undefined}
      />

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
                  🎉 Thank You!
                </h3>
                <p className="font-body text-muted-foreground">
                  Your pledge helps our plant grow!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
