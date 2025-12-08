"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, Loader2 } from "lucide-react";

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "redirecting">("loading");

  useEffect(() => {
    // Get QR code ID from URL params (e.g., /scan?qr=location-123)
    const qrId = searchParams.get("qr");
    
    // Simulate processing the QR code
    const timer = setTimeout(() => {
      setStatus("redirecting");
      // Redirect to main page after brief animation
      setTimeout(() => {
        router.push("/");
      }, 1000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      {/* Animated leaf icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-24 h-24 rounded-full bg-[#4A6B5C] flex items-center justify-center mx-auto mb-8"
      >
        <Leaf className="w-12 h-12 text-[#C8E86C]" />
      </motion.div>

      <h1 className="font-display text-3xl md:text-4xl text-[#2C2C2C] mb-4">
        Laudato Si&apos;
      </h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-3 text-muted-foreground"
      >
        <Loader2 className="w-5 h-5 animate-spin text-[#4A6B5C]" />
        <span className="font-body">
          {status === "loading" ? "Processing QR code..." : "Redirecting..."}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="font-mono text-sm text-muted-foreground mt-8"
      >
        UMak Campus Growth Initiative
      </motion.p>
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center">
      <div className="w-24 h-24 rounded-full bg-[#4A6B5C] flex items-center justify-center mx-auto mb-8">
        <Leaf className="w-12 h-12 text-[#C8E86C]" />
      </div>
      <h1 className="font-display text-3xl md:text-4xl text-[#2C2C2C] mb-4">
        Laudato Si&apos;
      </h1>
      <div className="flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-[#4A6B5C]" />
        <span className="font-body">Loading...</span>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F0] px-4">
      <Suspense fallback={<LoadingFallback />}>
        <ScanContent />
      </Suspense>

      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: i * 0.2 }}
            className="absolute"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-32 h-32 fill-[#4A6B5C]"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <path d="M50 10 C30 30, 20 50, 50 90 C80 50, 70 30, 50 10" />
            </svg>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
