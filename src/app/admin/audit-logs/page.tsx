"use client";

/**
 * Admin Audit Logs Page
 * 
 * This page allows super admins to:
 * - View all admin actions in the system
 * - Filter by admin, action type, and date range
 * - Search through audit logs
 * - Export audit logs
 * 
 * Access: Super Admin only
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Search,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Audit log interface
interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  admin?: {
    name: string;
    email: string;
    image: string;
  };
}

// Action type labels for better display
const ACTION_LABELS: Record<string, string> = {
  create_user: "Created User",
  update_user: "Updated User",
  delete_user: "Deleted User",
  update_role: "Changed Role",
  create_reward: "Created Reward",
  update_reward: "Updated Reward",
  delete_reward: "Deleted Reward",
  create_promo_code: "Created Promo Code",
  update_promo_code: "Updated Promo Code",
  delete_promo_code: "Deleted Promo Code",
  verify_redemption: "Verified Redemption",
  reject_redemption: "Rejected Redemption",
  verify_gcash: "Verified GCash",
  reject_gcash: "Rejected GCash",
  create_campaign: "Created Campaign",
  update_campaign: "Updated Campaign",
  delete_campaign: "Deleted Campaign",
};

export default function AdminAuditLogsPage() {
  const { data: session } = useSession();
  
  // State for audit logs
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;
  
  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /**
   * Fetch audit logs from API
   */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", pageSize.toString());
      
      if (filterAction !== "all") {
        params.set("action", filterAction);
      }
      if (filterEntity !== "all") {
        params.set("entityType", filterEntity);
      }
      if (dateFrom) {
        params.set("from", dateFrom);
      }
      if (dateTo) {
        params.set("to", dateTo);
      }
      
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch audit logs");
      }
      
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEntity, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /**
   * Filter logs based on search query (client-side)
   */
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.admin_email?.toLowerCase().includes(query) ||
      log.entity_type?.toLowerCase().includes(query) ||
      log.admin?.name?.toLowerCase().includes(query) ||
      JSON.stringify(log.details).toLowerCase().includes(query)
    );
  });

  /**
   * Get unique action types from logs for filter
   */
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));
  const uniqueEntities = Array.from(new Set(logs.filter((l) => l.entity_type).map((l) => l.entity_type)));

  /**
   * Format action for display
   */
  const formatAction = (action: string) => {
    return ACTION_LABELS[action] || action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  /**
   * Get action badge color
   */
  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("reject")) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (action.includes("create")) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (action.includes("update") || action.includes("verify")) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  };

  /**
   * Export logs to CSV
   */
  const exportToCSV = () => {
    const headers = ["Date", "Admin", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = filteredLogs.map((log) => [
      formatDate(log.created_at),
      log.admin?.email || log.admin_email || "Unknown",
      formatAction(log.action),
      log.entity_type || "",
      log.entity_id || "",
      JSON.stringify(log.details || {}),
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <ScrollText className="w-7 h-7 text-gray-500" />
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track all administrative actions in the system
          </p>
        </div>
        
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {formatAction(action)}
            </option>
          ))}
        </select>
        
        <select
          value={filterEntity}
          onChange={(e) => {
            setFilterEntity(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Entities</option>
          {uniqueEntities.map((entity) => (
            <option key={entity} value={entity!}>
              {entity}
            </option>
          ))}
        </select>
        
        <Input
          type="date"
          placeholder="From"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        
        <Input
          type="date"
          placeholder="To"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{totalCount.toLocaleString()} total logs</span>
        <span>•</span>
        <span>Page {page} of {totalPages}</span>
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

      {/* Logs Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Date/Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Admin</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Entity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.admin?.image ? (
                          <img
                            src={log.admin.image}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{log.admin?.name || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{log.admin?.email || log.admin_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.entity_type && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{log.entity_type}</span>
                          {log.entity_id && (
                            <p className="text-xs text-gray-400 font-mono">{log.entity_id.slice(0, 8)}...</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="cursor-pointer">
                          <summary className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto max-w-md">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </motion.tr>
                ))}
                
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded ${
                        pageNum === page
                          ? "bg-green-500 text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
