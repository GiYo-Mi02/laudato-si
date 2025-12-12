'use client';

/**
 * ============================================================================
 * GUEST PLEDGE MODAL
 * ============================================================================
 * Modal flow for guest users (non @umak.edu.ph accounts).
 * - Shows instructions
 * - Answer quick pledge questions
 * - Submit short message
 * - One-time pledge only
 * ============================================================================
 */

import { memo, useState, useCallback } from 'react';
import { 
  Leaf, 
  X,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PledgeQuestions from './PledgeQuestions';
import PledgeMessage from './PledgeMessage';

type GuestStep = 'intro' | 'questions' | 'message' | 'success';

interface GuestPledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  guestEmail?: string;
}

const GuestPledgeModal = memo(function GuestPledgeModal({ 
  isOpen, 
  onClose,
  onComplete,
  guestEmail
}: GuestPledgeModalProps) {
  const [step, setStep] = useState<GuestStep>('intro');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionPoints, setQuestionPoints] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartQuestions = useCallback(() => {
    setStep('questions');
  }, []);

  const handleQuestionsComplete = useCallback((ans: Record<string, string>, points: number) => {
    setAnswers(ans);
    setQuestionPoints(points);
    setStep('message');
  }, []);

  const handleMessageSubmit = useCallback(async (message: string) => {
    setIsSubmitting(true);
    try {
      // Submit pledge for guest
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pledge_message: message,
          answers,
          is_guest: true,
          guest_email: guestEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit pledge');
      }

      setStep('success');
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (error) {
      console.error('Error submitting guest pledge:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, guestEmail, onComplete]);

  const handleBackToQuestions = useCallback(() => {
    setStep('questions');
  }, []);

  const renderContent = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="space-y-6 p-6">
            {/* Welcome */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Welcome, Guest! 🌱
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Thank you for joining the Laudato Si&apos; movement at UMak!
              </p>
            </div>

            {/* Guest Info */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Guest Account Notice
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 mt-1">
                    As a guest, you can take <strong>one pledge</strong> and your message will appear on the display. 
                    To unlock all features like streaks, rewards, and leaderboards, sign in with your @umak.edu.ph account.
                  </p>
                </div>
              </div>
            </div>

            {/* What you can do */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                What you can do:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Take a one-time eco-pledge
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Share a message on the display
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Earn points (redeemable if you sign up later)
                </li>
              </ul>
            </div>

            <Button
              onClick={handleStartQuestions}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg font-semibold"
            >
              Take the Pledge
            </Button>
          </div>
        );

      case 'questions':
        return (
          <div className="p-6">
            <PledgeQuestions
              onComplete={handleQuestionsComplete}
              onBack={() => setStep('intro')}
            />
          </div>
        );

      case 'message':
        return (
          <div className="p-6">
            <PledgeMessage
              onSubmit={handleMessageSubmit}
              onBack={handleBackToQuestions}
              isLoading={isSubmitting}
              title="Your Pledge Message"
              subtitle="This message will appear on the Laudato Si' display"
            />
          </div>
        );

      case 'success':
        return (
          <div className="p-6 text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Thank You! 🌍
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your pledge has been recorded and will appear on the display!
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-sm text-green-700 dark:text-green-400">
                You earned <strong>{questionPoints} points</strong> from this pledge!
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Sign in with @umak.edu.ph to unlock rewards
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden bg-white dark:bg-gray-800 border-0 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
});

export default GuestPledgeModal;
