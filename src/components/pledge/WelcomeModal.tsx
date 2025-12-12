'use client';

/**
 * ============================================================================
 * WELCOME MODAL - For New Users
 * ============================================================================
 * Shows welcome message and instructions for first-time users.
 * Guides them to take their first pledge.
 * ============================================================================
 */

import { memo } from 'react';
import { 
  Leaf, 
  Sparkles, 
  ArrowRight,
  Star,
  Heart,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPledge: () => void;
  userName?: string;
}

const WelcomeModal = memo(function WelcomeModal({ 
  isOpen, 
  onClose, 
  onStartPledge,
  userName 
}: WelcomeModalProps) {
  const firstName = userName?.split(' ')[0] || 'Eco Warrior';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden bg-white dark:bg-gray-800 border-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-6 text-white text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Welcome, {firstName}! 🌱
            </DialogTitle>
            <DialogDescription className="text-green-100 mt-2">
              You&apos;re now part of the UMak Laudato Si&apos; community
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* What is Laudato Si */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              <strong className="text-green-600 dark:text-green-400">Laudato Si&apos;</strong> (Praise Be to You) 
              is a call to care for our common home. Join your fellow Herons in making 
              daily eco-pledges to protect our environment!
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-white text-center">
              How it works:
            </h4>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white text-sm">Take the Pledge</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Answer a few questions about your eco-commitment</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white text-sm">Share Your Message</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Write a short pledge message for the display</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
              <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white text-sm">Earn & Grow</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Earn points, build streaks, redeem rewards!</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="flex justify-center gap-6 py-2">
            <div className="text-center">
              <Star className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Earn Points</p>
            </div>
            <div className="text-center">
              <Heart className="w-6 h-6 mx-auto text-red-500 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Help Earth</p>
            </div>
            <div className="text-center">
              <Globe className="w-6 h-6 mx-auto text-blue-500 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Join Community</p>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={onStartPledge}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg font-semibold shadow-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Take Your First Pledge
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-xs text-center text-gray-400">
            This only takes about 2 minutes
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default WelcomeModal;
