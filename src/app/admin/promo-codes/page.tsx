"use client";

/**
 * Admin Promo Codes Management Page
 * 
 * This page allows admins with 'manage_promo_codes' permission to:
 * - View all promo codes in the system
 * - Create new promo codes with point values and limits
 * - Edit existing promo codes
 * - Activate/deactivate promo codes
 * - Delete promo codes
 * - View usage statistics
 * 
 * Access: Super Admin, SA Admin
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Calendar,
  Users,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PromoCode } from "@/types";

export default function AdminPromoCodesPage() {
  const { data: session } = useSession();
  
  // State for promo codes list
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive" | "expired">("all");
  
  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    point_value: 10,
    max_uses: 0,
    valid_from: "",
    valid_until: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  /**
   * Fetch promo codes from API
   */
/**
   * Fetch promo codes from API (Debug Version)
   */
  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching promo codes..."); // DEBUG LOG
      
      const response = await fetch("/api/admin/promo-codes");
      const data = await response.json();
      
      console.log("API Response:", data); // DEBUG LOG: Check if promo_codes exists here
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch promo codes");
      }
      
      // Handle both camelCase (promoCodes) and snake_case (promo_codes) just in case
      const rawCodes = data.promo_codes || data.promoCodes || [];
      
      console.log("Raw Codes Found:", rawCodes.length, rawCodes); // DEBUG LOG
      
      const mappedCodes = rawCodes.map((code: any) => ({
        ...code,
        // Ensure point_value exists. If code.value is missing, default to code.point_value, or 0
        point_value: code.value !== undefined ? code.value : (code.point_value || 0),
        
        // Ensure times_used exists. If code.current_uses is missing, default to 0
        times_used: code.current_uses !== undefined ? code.current_uses : (code.times_used || 0),
      }));

      console.log("Final Mapped Codes:", mappedCodes); // DEBUG LOG

      setPromoCodes(mappedCodes);
    } catch (err) {
      console.error("Fetch Error:", err); // DEBUG LOG
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  /**
   * Generate a random promo code
   */
  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  /**
   * Filter promo codes based on search and filters
   */
  const filteredPromoCodes = promoCodes.filter((promo) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !promo.code.toLowerCase().includes(query) &&
        !promo.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    // Status filter
    const now = new Date();
    const isExpired = promo.valid_until && new Date(promo.valid_until) < now;
    const isFullyUsed = promo.max_uses && promo.times_used >= promo.max_uses;
    
    if (filterActive === "active" && (!promo.is_active || isExpired || isFullyUsed)) {
      return false;
    }
    if (filterActive === "inactive" && promo.is_active) {
      return false;
    }
    if (filterActive === "expired" && !isExpired) {
      return false;
    }
    
    return true;
  });

  /**
   * Open modal for creating new promo code
   */
  const handleCreate = () => {
    setEditingCode(null);
    setFormData({
      code: "",
      description: "",
      point_value: 10,
      max_uses: 0,
      valid_from: "",
      valid_until: "",
      is_active: true,
    });
    setShowModal(true);
  };

  /**
   * Open modal for editing existing promo code
   */
  const handleEdit = (promo: PromoCode) => {
    setEditingCode(promo);
    setFormData({
      code: promo.code,
      description: promo.description || "",
      point_value: promo.point_value,
      max_uses: promo.max_uses || 0,
      valid_from: promo.valid_from ? promo.valid_from.split("T")[0] : "",
      valid_until: promo.valid_until ? promo.valid_until.split("T")[0] : "",
      is_active: promo.is_active,
    });
    setShowModal(true);
  };

  /**
   * Save promo code (create or update)
   */
  /**
   * Save promo code (create or update)
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const url = "/api/admin/promo-codes";
      // FIX 1: Change "PUT" to "PATCH" to match your API route
      const method = editingCode ? "PATCH" : "POST";
      
      // Prepare payload
      const payload = {
        ...(editingCode && { id: editingCode.id }),
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        
        // FIX 2: Change "point_value" to "value" to match API expectation
        value: formData.point_value, 
        
        // Note: Check if your backend expects 'code_type'. 
        // Based on your backend code, it defaults to 'points', so this is likely fine to omit.
        
        max_uses: formData.max_uses || null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Only throw if success is false, using the message from backend
        throw new Error(data.message || "Failed to save promo code");
      }
      
      // Refresh list
      await fetchPromoCodes();
      setShowModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save promo code");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete promo code
   */
  const handleDelete = async (promo: PromoCode) => {
    if (!confirm(`Are you sure you want to delete promo code "${promo.code}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/promo-codes?id=${promo.id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete promo code");
      }
      
      // Refresh list
      await fetchPromoCodes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete promo code");
    }
  };

  /**
   * Toggle promo code active status
   */
  const handleToggleActive = async (promo: PromoCode) => {
    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: promo.id,
          is_active: !promo.is_active,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update promo code");
      }
      
      // Refresh list
      await fetchPromoCodes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update promo code");
    }
  };

  /**
   * Copy code to clipboard
   */
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  /**
   * Get status badge for promo code
   */
  const getStatusBadge = (promo: PromoCode) => {
    const now = new Date();
    const isExpired = promo.valid_until && new Date(promo.valid_until) < now;
    const isFullyUsed = promo.max_uses && promo.times_used >= promo.max_uses;
    const notStarted = promo.valid_from && new Date(promo.valid_from) > now;
    
    if (!promo.is_active) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Inactive</span>;
    }
    if (isExpired) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Expired</span>;
    }
    if (isFullyUsed) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">Fully Used</span>;
    }
    if (notStarted) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Scheduled</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">Active</span>;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-7 h-7 text-orange-500" />
            Promo Codes Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage promotional codes
          </p>
        </div>
        
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Promo Code
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search promo codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive" | "expired")}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
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

      {/* Promo Codes Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Points</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Usage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Valid Period</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPromoCodes.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm">
                          {promo.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(promo.code)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Copy code"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      {promo.description && (
                        <p className="text-xs text-gray-500 mt-1">{promo.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        +{promo.point_value} pts
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{promo.times_used}</span>
                        {promo.max_uses && (
                          <span className="text-gray-400">/ {promo.max_uses}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {formatDate(promo.valid_from)} - {formatDate(promo.valid_until)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(promo)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(promo)}
                          className={promo.is_active ? "text-yellow-600" : "text-green-600"}
                        >
                          {promo.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(promo)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(promo)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredPromoCodes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No promo codes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !saving && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingCode ? "Edit Promo Code" : "Create Promo Code"}
                </h2>
                <button
                  onClick={() => !saving && setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  disabled={saving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium mb-1">Code *</label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="PROMO2024"
                      className="font-mono uppercase"
                      disabled={!!editingCode}
                    />
                    {!editingCode && (
                      <Button variant="outline" onClick={generateRandomCode}>
                        <Hash className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Special welcome bonus"
                  />
                </div>
                
                {/* Point Value */}
                <div>
                  <label className="block text-sm font-medium mb-1">Point Value *</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.point_value}
                    onChange={(e) => setFormData({ ...formData, point_value: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                {/* Max Uses */}
                <div>
                  <label className="block text-sm font-medium mb-1">Max Uses</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for unlimited</p>
                </div>
                
                {/* Valid From */}
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From</label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                
                {/* Valid Until */}
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until</label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
                
                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Active (can be redeemed)
                  </label>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.code || !formData.point_value}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {editingCode ? "Save Changes" : "Create Code"}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
