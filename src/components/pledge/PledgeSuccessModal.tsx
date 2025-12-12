'use client';

/**
 * ============================================================================
 * PLEDGE SUCCESS MODAL
 * ============================================================================
 * Shows success message after pledge submission with animation.
 * ============================================================================
 */

import { memo, useEffect } from 'react';
import { CheckCircle2, Star, Flame, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface PledgeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsEarned: number;
  currentStreak: number;
  isFirstPledge?: boolean;
}

const PledgeSuccessModal = memo(function PledgeSuccessModal({
  isOpen,
  onClose,
  pointsEarned,
  currentStreak,
  isFirstPledge = false,
}: PledgeSuccessModalProps) {

  // Auto-close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden bg-white dark:bg-gray-800 border-0">
        {/* Confetti effect background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="absolute top-0 left-3/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>

        <div className="p-8 text-center space-y-6 relative">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            {/* Sparkle effects */}
            <div className="absolute -top-2 -right-2 text-yellow-400 animate-ping">
              <Star className="w-6 h-6 fill-current" />
            </div>
          </div>

          {/* Message */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {isFirstPledge ? 'Welcome to the Journey!' : 'Pledge Recorded!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isFirstPledge 
                ? 'Your first eco-pledge has been submitted!' 
                : 'Your message will appear on the display!'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-2">
                <Star className="w-7 h-7 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                +{pointsEarned}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2">
                <Flame className="w-7 h-7 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {currentStreak}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Day Streak</p>
            </div>
          </div>

          {/* Encouragement */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <p className="text-sm text-green-700 dark:text-green-400">
              {currentStreak >= 7 
                ? '🔥 Amazing! You\'re on fire! Keep the streak going!'
                : currentStreak >= 3
                ? '🌱 Great progress! Your plant is growing stronger!'
                : isFirstPledge
                ? '🌱 You planted a seed! Come back tomorrow to grow it!'
                : '✨ Every pledge counts! See you tomorrow!'}
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default PledgeSuccessModal;
