"use client";

/**
 * Admin GCash Verification Page
 * 
 * This page allows admins with 'verify_gcash' permission to:
 * - View pending GCash donations
 * - Verify/approve GCash donations with reference numbers
 * - Reject fraudulent or duplicate donations
 * - View verification history
 * 
 * Access: Super Admin, Finance Admin
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Search,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  Hash,
  MessageSquare,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// GCash donation interface
interface GCashDonation {
  id: string;
  campaign_id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  reference_number: string | null;
  message: string | null;
  status: "pending" | "verified" | "rejected";
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  campaign?: {
    title: string;
  };
}

export default function AdminGCashPage() {
  const { data: session } = useSession();
  
  // State for donations list
  const [donations, setDonations] = useState<GCashDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  
  // State for verification modal
  const [selectedDonation, setSelectedDonation] = useState<GCashDonation | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  /**
   * Fetch GCash donations from API
   */
  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }
      
      const response = await fetch(`/api/admin/gcash?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch donations");
      }
      
      setDonations(data.donations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  /**
   * Filter donations based on search
   */
  const filteredDonations = donations.filter((donation) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      donation.donor_name?.toLowerCase().includes(query) ||
      donation.donor_email?.toLowerCase().includes(query) ||
      donation.reference_number?.toLowerCase().includes(query) ||
      donation.campaign?.title?.toLowerCase().includes(query)
    );
  });

  /**
   * Verify a GCash donation
   */
  const handleVerify = async (donation: GCashDonation) => {
    try {
      setVerifying(true);
      
      const response = await fetch("/api/admin/gcash", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: donation.id,
          action: "verify",
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify donation");
      }
      
      // Refresh list
      await fetchDonations();
      setSelectedDonation(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to verify donation");
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Reject a GCash donation
   */
  const handleReject = async (donation: GCashDonation) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    
    try {
      setVerifying(true);
      
      const response = await fetch("/api/admin/gcash", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: donation.id,
          action: "reject",
          reason: rejectionReason,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reject donation");
      }
      
      // Refresh list
      await fetchDonations();
      setSelectedDonation(null);
      setRejectionReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject donation");
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Get status badge color
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  /**
   * Get pending count for badge
   */
  const pendingCount = donations.filter((d) => d.status === "pending").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="w-7 h-7 text-green-500" />
            GCash Verification
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-sm rounded-full">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verify and manage GCash donation submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | "pending" | "verified" | "rejected")}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      {/* Donations Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Donor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Campaign</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Reference</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3 text-sm">
                      {formatDate(donation.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{donation.donor_name || "Anonymous"}</div>
                      {donation.donor_email && (
                        <div className="text-sm text-gray-500">{donation.donor_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {donation.campaign?.title || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ₱{donation.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {donation.reference_number ? (
                        <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {donation.reference_number}
                        </code>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(donation.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDonation(donation)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {donation.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerify(donation)}
                              className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDonation(donation);
                                setRejectionReason("");
                              }}
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredDonations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      {filterStatus === "pending" 
                        ? "No pending donations to verify"
                        : "No donations found"
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail/Verification Modal */}
      <AnimatePresence>
        {selectedDonation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !verifying && setSelectedDonation(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Donation Details</h2>
                <button
                  onClick={() => !verifying && setSelectedDonation(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  disabled={verifying}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Donation Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedDonation.donor_name || "Anonymous"}</p>
                    <p className="text-sm text-gray-500">{selectedDonation.donor_email || "No email"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-400 text-lg">
                      ₱{selectedDonation.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Amount</p>
                  </div>
                </div>
                
                {selectedDonation.reference_number && (
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <div>
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {selectedDonation.reference_number}
                      </code>
                      <p className="text-sm text-gray-500 mt-1">Reference Number</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{formatDate(selectedDonation.created_at)}</p>
                    <p className="text-sm text-gray-500">Submitted</p>
                  </div>
                </div>
                
                {selectedDonation.message && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">{selectedDonation.message}</p>
                      <p className="text-sm text-gray-500 mt-1">Message</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedDonation.status)}
                </div>
                
                {selectedDonation.verified_at && (
                  <p className="text-sm text-gray-500">
                    {selectedDonation.status === "verified" ? "Verified" : "Rejected"} on{" "}
                    {formatDate(selectedDonation.verified_at)}
                  </p>
                )}
              </div>
              
              {/* Actions for pending donations */}
              {selectedDonation.status === "pending" && (
                <div className="mt-6 space-y-4">
                  {/* Rejection reason input */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Rejection Reason (if rejecting)
                    </label>
                    <Input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Duplicate transaction, invalid reference..."
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleVerify(selectedDonation)}
                      disabled={verifying}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedDonation)}
                      disabled={verifying || !rejectionReason.trim()}
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
