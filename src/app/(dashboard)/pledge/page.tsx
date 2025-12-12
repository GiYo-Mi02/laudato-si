'use client';

/**
 * ============================================================================
 * PLEDGE PAGE - Full Pledge Flow for New Users
 * ============================================================================
 * Multi-step pledge page:
 * 1. Pledge Questions (new users only)
 * 2. Short Message Input
 * 3. Success -> Return to Dashboard
 * 
 * For returning users: Only message input (accessed via dashboard button)
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Leaf } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PledgeQuestions from '@/components/pledge/PledgeQuestions';
import PledgeMessage from '@/components/pledge/PledgeMessage';
import PledgeSuccessModal from '@/components/pledge/PledgeSuccessModal';
import { supabase } from '@/lib/supabase';

type PledgeStep = 'loading' | 'questions' | 'message' | 'success';

export default function PledgePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Check if this is a new user or returning user wanting to pledge
  const isNewUser = searchParams.get('new') === 'true';
  const isQuickPledge = searchParams.get('quick') === 'true';

  const [step, setStep] = useState<PledgeStep>('loading');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionPoints, setQuestionPoints] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    pointsEarned: number;
    currentStreak: number;
  } | null>(null);

  /**
   * Initialize page based on user type
   */
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Quick pledge (returning user) goes straight to message
    if (isQuickPledge) {
      setStep('message');
    } 
    // New user or first-time pledge goes through questions
    else if (isNewUser) {
      setStep('questions');
    } 
    // Default: check if user has pledged today
    else {
      checkUserStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isNewUser, isQuickPledge, router]);

  /**
   * Check if user can pledge today
   */
  const checkUserStatus = async () => {
    if (!session?.user?.email) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, last_contribution, has_completed_onboarding')
        .eq('email', session.user.email)
        .single();

      if (!userData) {
        // New user - show questions
        setStep('questions');
        return;
      }

      // Check if already pledged today
      const today = new Date().toDateString();
      const lastContrib = userData.last_contribution 
        ? new Date(userData.last_contribution).toDateString()
        : null;

      if (lastContrib === today) {
        toast({
          title: "Already pledged today!",
          description: "Come back tomorrow to make another pledge.",
        });
        router.push('/home');
        return;
      }

      // Check if completed onboarding
      if (!userData.has_completed_onboarding) {
        setStep('questions');
      } else {
        setStep('message');
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setStep('message'); // Default to message on error
    }
  };

  /**
   * Handle questions completion
   */
  const handleQuestionsComplete = useCallback((ans: Record<string, string>, points: number) => {
    setAnswers(ans);
    setQuestionPoints(points);
    setStep('message');
  }, []);

  /**
   * Handle back from message to questions
   */
  const handleBackToQuestions = useCallback(() => {
    if (isQuickPledge) {
      router.push('/home');
    } else {
      setStep('questions');
    }
  }, [isQuickPledge, router]);

  /**
   * Handle pledge submission
   */
  const handleSubmitPledge = useCallback(async (message: string) => {
    if (!session?.user?.email) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pledge_message: message,
          answers: Object.keys(answers).length > 0 ? answers : undefined,
          question_points: questionPoints,
          is_first_pledge: isNewUser,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit pledge');
      }

      // Mark onboarding as complete for new users
      if (isNewUser) {
        await supabase
          .from('users')
          .update({ has_completed_onboarding: true })
          .eq('email', session.user.email);
      }

      setSuccessData({
        pointsEarned: data.points_awarded || 0,
        currentStreak: data.current_streak || 0,
      });
      setStep('success');

    } catch (error) {
      console.error('Pledge submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit pledge",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [session?.user?.email, answers, questionPoints, isNewUser, toast]);

  /**
   * Handle success modal close
   */
  const handleSuccessClose = useCallback(() => {
    router.push('/home');
  }, [router]);

  // Loading state
  if (step === 'loading' || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-pulse">
            <Leaf className="w-8 h-8 text-green-600" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            {isQuickPledge ? 'Daily Pledge' : 'Take the Pledge'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {isQuickPledge 
              ? 'Share your eco-commitment for today' 
              : 'Join the Laudato Si\' movement'}
          </p>
        </div>

        {/* Step Content */}
        {step === 'questions' && (
          <PledgeQuestions
            onComplete={handleQuestionsComplete}
            onBack={() => router.push('/home')}
          />
        )}

        {step === 'message' && (
          <PledgeMessage
            onSubmit={handleSubmitPledge}
            onBack={handleBackToQuestions}
            isLoading={isSubmitting}
            showBackButton={!isQuickPledge || Object.keys(answers).length > 0}
            title={isQuickPledge ? "Today's Pledge" : "Share Your Commitment"}
            subtitle="Your message will appear on the Laudato Si' display"
          />
        )}

        {/* Success Modal */}
        {successData && (
          <PledgeSuccessModal
            isOpen={step === 'success'}
            onClose={handleSuccessClose}
            pointsEarned={successData.pointsEarned}
            currentStreak={successData.currentStreak}
            isFirstPledge={isNewUser}
          />
        )}
      </div>
    </div>
  );
}
