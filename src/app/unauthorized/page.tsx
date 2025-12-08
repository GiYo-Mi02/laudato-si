"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF7F0] to-[#E8F5E9] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </motion.div>

        <h1 className="font-display text-2xl md:text-3xl text-[#2C2C2C] mb-4">
          Access Restricted
        </h1>
        
        <p className="font-body text-muted-foreground mb-6">
          Only <span className="font-mono text-[#4A6B5C] font-bold">@umak.edu.ph</span> email accounts are allowed to access this platform.
        </p>

        <p className="font-body text-sm text-muted-foreground mb-8">
          Please sign in with your UMak institutional email address.
        </p>

        <Button
          onClick={handleSignOut}
          size="lg"
          className="w-full bg-[#4A6B5C] hover:bg-[#3A5B4C] text-white"
        >
          Sign Out & Try Again
        </Button>
      </motion.div>
    </div>
  );
}
