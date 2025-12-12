'use client';

/**
 * ============================================================================
 * PLEDGE MESSAGE COMPONENT
 * ============================================================================
 * Input for users to write a short pledge message that appears on the display.
 * Used after questions (new users) or standalone (returning users).
 * ============================================================================
 */

import { memo, useState, useCallback } from 'react';
import { 
  Send,
  MessageSquare,
  Sparkles,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface PledgeMessageProps {
  onSubmit: (message: string) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
}

const exampleMessages = [
  "I pledge to reduce my plastic use today! 🌱",
  "Today I'll walk instead of taking a jeep 🚶",
  "I promise to plant a seed this week 🌻",
  "I'll bring my own tumbler to school! ♻️",
  "Saving energy by turning off unused lights 💡",
];

const PledgeMessage = memo(function PledgeMessage({ 
  onSubmit,
  onBack,
  isLoading = false,
  showBackButton = true,
  title = "Share Your Pledge",
  subtitle = "Write a short message that will appear on the Laudato Si' display"
}: PledgeMessageProps) {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 150;

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setMessage(value);
      setCharCount(value.length);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (message.trim().length < 10) return;
    await onSubmit(message.trim());
  }, [message, onSubmit]);

  const handleExampleClick = useCallback((example: string) => {
    setMessage(example);
    setCharCount(example.length);
  }, []);

  const isValid = message.trim().length >= 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {subtitle}
        </p>
      </div>

      {/* Message Input Card */}
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardContent className="p-6 space-y-4">
          {/* Textarea */}
          <div className="relative">
            <Textarea
              value={message}
              onChange={handleMessageChange}
              placeholder="Write your eco-pledge message here..."
              className="min-h-[120px] resize-none border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 rounded-xl p-4 text-base"
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className={`text-xs ${charCount > maxChars * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                {charCount}/{maxChars}
              </span>
            </div>
          </div>

          {/* Validation hint */}
          {message.length > 0 && message.length < 10 && (
            <p className="text-xs text-orange-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Please write at least 10 characters
            </p>
          )}

          {/* Example messages */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Need inspiration? Try these:
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleMessages.slice(0, 3).map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-xs px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                  disabled={isLoading}
                >
                  {example.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {message.trim() && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview on display:</p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                &ldquo;{message}&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        {showBackButton && onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            Back
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className={`flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 font-semibold ${!showBackButton ? 'w-full' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Submit Pledge
              <Send className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

export default PledgeMessage;
