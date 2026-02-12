"use client";

/**
 * Admin Rewards Management Page
 * 
 * This page allows admins with 'manage_rewards' permission to:
 * - View all rewards in the system
 * - Create new rewards with images (upload or URL)
 * - Edit existing rewards (name, description, cost, stock, category)
 * - Activate/deactivate rewards
 * - Delete rewards
 * 
 * Access: Super Admin, SA Admin, Canteen Admin
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Package,
  DollarSign,
  Tag,
  ImageIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reward, RewardCategory } from "@/types";
import ImageUpload from "@/components/admin/ImageUpload";

// Available reward categories
const CATEGORIES: { value: RewardCategory; label: string }[] = [
  { value: "food", label: "Food & Beverage" },
  { value: "merchandise", label: "Merchandise" },
  { value: "voucher", label: "Vouchers" },
  { value: "experience", label: "Experiences" },
  { value: "other", label: "Other" },
];

export default function AdminRewardsPage() {
  const { data: session } = useSession();
  
  // State for rewards list
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<RewardCategory | "all">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  
  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    point_cost: 100,
    stock_quantity: 10,
    category: "other" as RewardCategory,
    image_url: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  /**
   * Fetch rewards from API
   */
  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/admin/rewards");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch rewards");
      }
      
      setRewards(data.rewards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  /**
   * Filter rewards based on search and filters
   */
  const filteredRewards = rewards.filter((reward) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !reward.name.toLowerCase().includes(query) &&
        !reward.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    // Category filter
    if (filterCategory !== "all" && reward.category !== filterCategory) {
      return false;
    }
    
    // Active filter
    if (filterActive === "active" && !reward.is_active) {
      return false;
    }
    if (filterActive === "inactive" && reward.is_active) {
      return false;
    }
    
    return true;
  });

  /**
   * Open modal for creating new reward
   */
  const handleCreate = () => {
    setEditingReward(null);
    setFormData({
      name: "",
      description: "",
      point_cost: 100,
      stock_quantity: 10,
      category: "other",
      image_url: "",
      is_active: true,
    });
    setShowModal(true);
  };

  /**
   * Open modal for editing existing reward
   */
  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || "",
      point_cost: reward.point_cost,
      stock_quantity: reward.stock_quantity || 0,
      category: reward.category,
      image_url: reward.image_url || "",
      is_active: reward.is_active,
    });
    setShowModal(true);
  };

  /**
   * Save reward (create or update)
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const url = "/api/admin/rewards";
      const method = editingReward ? "PUT" : "POST";
      const body = editingReward
        ? { id: editingReward.id, ...formData }
        : formData;
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save reward");
      }
      
      // Small delay to let database commit before refreshing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh rewards list
      await fetchRewards();
      setShowModal(false);
    } catch (err) {
      console.error('❌ Save error:', err);
      alert(err instanceof Error ? err.message : "Failed to save reward");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete reward
   */
  const handleDelete = async (reward: Reward) => {
    if (!confirm(`Are you sure you want to delete "${reward.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/rewards?id=${reward.id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete reward");
      }
      
      // Refresh rewards list
      await fetchRewards();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete reward");
    }
  };

  /**
   * Toggle reward active status
   */
  const handleToggleActive = async (reward: Reward) => {
    try {
      const response = await fetch("/api/admin/rewards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reward.id,
          is_active: !reward.is_active,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update reward");
      }
      
      // Refresh rewards list
      await fetchRewards();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update reward");
    }
  };

  /**
   * Get category color for badges
   */
  const getCategoryColor = (category: RewardCategory) => {
    const colors: Record<RewardCategory, string> = {
      food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      merchandise: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      voucher: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      experience: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      event: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      digital: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[category];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Gift className="w-7 h-7 text-purple-500" />
            Rewards Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage rewards for the marketplace
          </p>
        </div>
        
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Reward
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search rewards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as RewardCategory | "all")}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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

      {/* Rewards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRewards.map((reward) => (
            <motion.div
              key={reward.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`
                bg-white dark:bg-gray-800 rounded-xl border p-4
                ${reward.is_active 
                  ? "border-gray-200 dark:border-gray-700" 
                  : "border-gray-200 dark:border-gray-700 opacity-60"
                }
              `}
            >
              {/* Image */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                {reward.image_url ? (
                  <img
                    src={reward.image_url}
                    alt={reward.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{reward.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(reward.category)}`}>
                    {reward.category}
                  </span>
                </div>
                
                {reward.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {reward.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">{reward.point_cost} pts</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Package className="w-4 h-4" />
                    <span>{reward.stock_quantity ?? "∞"} in stock</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(reward)}
                    className={reward.is_active ? "text-yellow-600" : "text-green-600"}
                  >
                    {reward.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(reward)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(reward)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredRewards.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No rewards found
            </div>
          )}
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingReward ? "Edit Reward" : "Create Reward"}
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
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Reward name"
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Reward description"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    rows={3}
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as RewardCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Point Cost */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Point Cost *</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.point_cost}
                    onChange={(e) => setFormData({ ...formData, point_cost: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                {/* Stock Quantity */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Stock Quantity</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set to 0 for unlimited</p>
                </div>
                
                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Reward Image</label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    onUpload={async (file) => {
                      // Upload to Supabase Storage or convert to base64
                      const formDataUpload = new FormData();
                      formDataUpload.append('file', file);
                      
                      try {
                        const response = await fetch('/api/admin/upload', {
                          method: 'POST',
                          body: formDataUpload,
                        });
                        
                        const text = await response.text();
                        
                        if (!response.ok || !text) {
                          console.error('Upload failed, using base64 fallback');
                          // Fallback to base64 if upload fails
                          return new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(file);
                          });
                        }
                        
                        const data = JSON.parse(text);
                        
                        // Show warning if using base64 fallback
                        if (data.warning) {
                          console.warn('⚠️ Storage Warning:', data.warning);
                          console.info('📖 Setup Guide:', data.setupGuide);
                          // Still use the base64 URL returned
                        }
                        
                        return data.url;
                      } catch (error) {
                        console.error('Upload error:', error);
                        // Fallback to base64 on any error
                        return new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Tip: If images don't save, check document/STORAGE_SETUP_GUIDE.md
                  </p>
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
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Active (visible in marketplace)
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
                  disabled={saving || !formData.name}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {editingReward ? "Save Changes" : "Create Reward"}
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
