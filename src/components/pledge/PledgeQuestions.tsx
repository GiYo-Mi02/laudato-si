'use client';

/**
 * ============================================================================
 * PLEDGE QUESTIONS COMPONENT
 * ============================================================================
 * Multi-step questions for new users taking their first pledge.
 * Optimized with memo and proper state management.
 * ============================================================================
 */

import { memo, useState, useCallback } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Leaf,
  Droplet,
  Zap,
  Recycle,
  TreeDeciduous,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question: string;
  icon: React.ReactNode;
  options: {
    id: string;
    label: string;
    points: number;
  }[];
}

const questions: Question[] = [
  {
    id: 'water',
    question: 'How will you help conserve water today?',
    icon: <Droplet className="w-8 h-8 text-blue-500" />,
    options: [
      { id: 'shower', label: 'Take shorter showers', points: 1 },
      { id: 'tap', label: 'Turn off tap while brushing', points: 1 },
      { id: 'reuse', label: 'Reuse water for plants', points: 2 },
      { id: 'collect', label: 'Collect rainwater', points: 2 },
    ],
  },
  {
    id: 'energy',
    question: 'How will you save energy today?',
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    options: [
      { id: 'lights', label: 'Turn off unused lights', points: 1 },
      { id: 'unplug', label: 'Unplug devices when not in use', points: 1 },
      { id: 'natural', label: 'Use natural light', points: 2 },
      { id: 'ac', label: 'Limit air conditioning use', points: 2 },
    ],
  },
  {
    id: 'waste',
    question: 'How will you reduce waste today?',
    icon: <Recycle className="w-8 h-8 text-green-500" />,
    options: [
      { id: 'reusable', label: 'Use reusable containers', points: 1 },
      { id: 'plastic', label: 'Avoid single-use plastics', points: 2 },
      { id: 'segregate', label: 'Properly segregate waste', points: 1 },
      { id: 'compost', label: 'Compost food scraps', points: 2 },
    ],
  },
  {
    id: 'nature',
    question: 'How will you connect with nature today?',
    icon: <TreeDeciduous className="w-8 h-8 text-emerald-500" />,
    options: [
      { id: 'walk', label: 'Walk instead of using vehicles', points: 1 },
      { id: 'plant', label: 'Plant or water a plant', points: 2 },
      { id: 'appreciate', label: 'Spend time outdoors', points: 1 },
      { id: 'share', label: 'Share eco-tips with others', points: 2 },
    ],
  },
];

interface PledgeQuestionsProps {
  onComplete: (answers: Record<string, string>, totalPoints: number) => void;
  onBack?: () => void;
}

const PledgeQuestions = memo(function PledgeQuestions({ 
  onComplete,
  onBack 
}: PledgeQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelectOption = useCallback((optionId: string) => {
    setSelectedOption(optionId);
  }, []);

  const handleNext = useCallback(() => {
    if (!selectedOption) return;

    const newAnswers = { ...answers, [currentQuestion.id]: selectedOption };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      // Calculate total points
      let totalPoints = 0;
      Object.entries(newAnswers).forEach(([questionId, optionId]) => {
        const question = questions.find(q => q.id === questionId);
        const option = question?.options.find(o => o.id === optionId);
        if (option) totalPoints += option.points;
      });
      onComplete(newAnswers, totalPoints);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(answers[questions[currentIndex + 1]?.id] || null);
    }
  }, [selectedOption, answers, currentQuestion.id, isLastQuestion, currentIndex, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedOption(answers[questions[currentIndex - 1]?.id] || null);
    } else if (onBack) {
      onBack();
    }
  }, [currentIndex, answers, onBack]);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardContent className="p-6 space-y-6">
          {/* Question Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {currentQuestion.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                  "hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
                  selectedOption === option.id
                    ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                    : "border-gray-200 dark:border-gray-600"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "font-medium",
                    selectedOption === option.id 
                      ? "text-green-700 dark:text-green-400" 
                      : "text-gray-700 dark:text-gray-300"
                  )}>
                    {option.label}
                  </span>
                  {selectedOption === option.id && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!selectedOption}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          {isLastQuestion ? (
            <>
              Continue
              <Leaf className="w-4 h-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

export default PledgeQuestions;
