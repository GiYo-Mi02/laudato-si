'use client';

/**
 * ============================================================================
 * PROMO CODE INPUT COMPONENT
 * ============================================================================
 * Allows users to enter and redeem promo codes for bonus points.
 * Shows real-time feedback on redemption status.
 * ============================================================================
 */

import { useState } from 'react';
import { Ticket, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PromoCodeInputProps {
  /** Callback when points are successfully redeemed */
  onSuccess?: (points: number) => void;
  /** Compact mode for smaller layouts */
  compact?: boolean;
}

export default function PromoCodeInput({ onSuccess, compact = false }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    points?: number;
  } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/promo-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      setResult({
        success: data.success,
        message: data.message,
        points: data.pointsGranted,
      });

      if (data.success) {
        setCode('');
        onSuccess?.(data.pointsGranted);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to redeem code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleRedeem();
    }
  };

  // Compact version for inline use
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            className="font-mono"
            maxLength={20}
          />
          <Button onClick={handleRedeem} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
          </Button>
        </div>
        {result && (
          <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
            {result.message}
          </p>
        )}
      </div>
    );
  }

  // Full card version
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-purple-600" />
          Promo Code
        </CardTitle>
        <CardDescription>
          Have a promo code? Enter it here to earn bonus points!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your code (e.g., WELCOME50)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              className="font-mono text-lg tracking-wider"
              maxLength={20}
            />
            <Button 
              onClick={handleRedeem} 
              disabled={loading || !code.trim()}
              className="px-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Redeem'
              )}
            </Button>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{result.message}</span>
            </div>
          )}

          {/* Help Text */}
          <p className="text-xs text-gray-500">
            Promo codes can be found in campus events, social media, or from Student Affairs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
