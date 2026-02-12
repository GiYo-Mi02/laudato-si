"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Status = "loading" | "success" | "error" | "expired" | "tampered";

type RedemptionDetails = {
  rewardName?: string;
  userName?: string;
  verifiedAt?: string;
};

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [redemptionDetails, setRedemptionDetails] = useState<RedemptionDetails | null>(null);

  const fromBase64Url = (input: string) => {
    const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const binary = atob(padded);
    const percent = Array.from(binary)
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("");
    return decodeURIComponent(percent);
  };

  useEffect(() => {
    const verifyQR = async () => {
      // Get QR code data from URL params (e.g., /scan?qr=<encrypted-data>)
      const qrData = searchParams.get("qr");
      
      if (!qrData) {
        setStatus("error");
        setMessage("No QR code data found");
        return;
      }

      try {
        // Support both raw QR JSON and compact base64url encoding.
        let qrPayload = qrData;
        try {
          if (/^[A-Za-z0-9_-]+$/.test(qrData) && !qrData.startsWith("{") && !qrData.startsWith("RDM-")) {
            const decoded = fromBase64Url(qrData);
            if (decoded) qrPayload = decoded;
          }
        } catch {
          // If decoding fails, treat as raw payload.
        }

        // Call admin verification API
        const response = await fetch('/api/admin/redemptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_code: qrPayload }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus("success");
          const successMessage = result.message || "Redemption verified successfully!";
          setMessage(successMessage);
          // Admin endpoint returns { reward, user, category, verified_at }
          setRedemptionDetails({
            rewardName: result.redemption?.reward,
            userName: result.redemption?.user,
            verifiedAt: result.redemption?.verified_at,
          });
          
          toast({
            title: "Success!",
            description: successMessage,
          });

          // Redirect after 3 seconds
          setTimeout(() => {
            router.push("/admin/redemptions");
          }, 3000);
        } else {
          // Handle different error types
          const msg = result.message || result.error || "Failed to verify QR code";

          if (/expired/i.test(msg)) {
            setStatus("expired");
            setMessage("QR code has expired");
          } else if (/tamper|signature|fake/i.test(msg)) {
            setStatus("tampered");
            setMessage("QR code appears to be tampered with");
          } else {
            setStatus("error");
            setMessage(msg);
          }

          toast({
            title: "Verification Failed",
            description: msg,
            variant: "destructive",
          });

          // Redirect back after 3 seconds
          setTimeout(() => {
            router.push("/admin/redemptions");
          }, 3000);
        }
      } catch (error) {
        console.error('QR verification error:', error);
        setStatus("error");
        setMessage("Failed to verify QR code");
        
        toast({
          title: "Error",
          description: "Failed to process QR code",
          variant: "destructive",
        });

        setTimeout(() => {
          router.push("/admin/redemptions");
        }, 3000);
      }
    };

    verifyQR();
  }, [router, searchParams, toast]);

  const getIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-12 h-12 text-green-600" />;
      case "expired":
        return <AlertTriangle className="w-12 h-12 text-orange-500" />;
      case "tampered":
      case "error":
        return <XCircle className="w-12 h-12 text-red-600" />;
      default:
        return <Leaf className="w-12 h-12 text-[#C8E86C]" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case "success":
        return "bg-green-100";
      case "expired":
        return "bg-orange-100";
      case "tampered":
      case "error":
        return "bg-red-100";
      default:
        return "bg-[#4A6B5C]";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center max-w-md mx-auto"
    >
      {/* Status icon */}
      <motion.div
        animate={status === "loading" ? {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        } : {}}
        transition={{
          duration: 2,
          repeat: status === "loading" ? Infinity : 0,
          ease: "easeInOut",
        }}
        className={`w-24 h-24 rounded-full ${getBackgroundColor()} flex items-center justify-center mx-auto mb-8`}
      >
        {getIcon()}
      </motion.div>

      <h1 className="font-display text-3xl md:text-4xl text-[#2C2C2C] mb-4">
        {status === "success" ? "Success!" : status === "loading" ? "Verifying QR Code" : "Verification Failed"}
      </h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-6"
      >
        {status === "loading" ? (
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#4A6B5C]" />
            <span className="font-body">Processing QR code...</span>
          </div>
        ) : (
          <p className="font-body text-lg">{message}</p>
        )}
      </motion.div>

      {/* Redemption details */}
      {redemptionDetails && status === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-left"
        >
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Reward</p>
              <p className="font-semibold text-[#2C2C2C] dark:text-gray-100">{redemptionDetails.rewardName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User</p>
              <p className="font-semibold text-[#2C2C2C] dark:text-gray-100">{redemptionDetails.userName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verified At</p>
              <p className="font-semibold text-[#4A6B5C] dark:text-green-400">{redemptionDetails.verifiedAt}</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="font-mono text-sm text-muted-foreground mt-8"
      >
        {status === "success" ? "Redirecting to redemptions..." : status === "loading" ? "UMak Campus Growth Initiative" : "Redirecting back..."}
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
