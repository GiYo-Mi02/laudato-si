/**
 * ============================================================================
 * QR CODE SECURITY UTILITIES
 * ============================================================================
 * Generates and validates secure QR codes for reward redemptions.
 * 
 * Security Features:
 * - HMAC signature validation
 * - Timestamp-based expiration
 * - Redemption ID binding
 * - Tampering detection
 * ============================================================================
 */

import crypto from 'crypto';

// Secret key for HMAC (in production, use environment variable)
const QR_SECRET = process.env.QR_SECRET || 'laudato-si-qr-secret-2026';

// QR code validity duration (5 minutes for display)
const QR_VALIDITY_MS = 5 * 60 * 1000;

export interface SecureQRData {
  redemptionId: string;
  redemptionCode: string;
  userId: string;
  rewardId: string;
  timestamp: number;
  signature: string;
  version: string;
}

/**
 * Generate a secure QR code data string
 */
export function generateSecureQR(
  redemptionId: string,
  redemptionCode: string,
  userId: string,
  rewardId: string
): string {
  const timestamp = Date.now();
  const version = '1.0';

  // Create data to sign
  const dataToSign = `${redemptionId}|${redemptionCode}|${userId}|${rewardId}|${timestamp}|${version}`;
  
  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(dataToSign)
    .digest('hex');

  // Create QR data object
  const qrData: SecureQRData = {
    redemptionId,
    redemptionCode,
    userId,
    rewardId,
    timestamp,
    signature,
    version,
  };

  // Return as JSON string
  return JSON.stringify(qrData);
}

/**
 * Validate and parse a scanned QR code
 */
export function validateSecureQR(qrString: string): {
  isValid: boolean;
  error?: string;
  data?: SecureQRData;
} {
  try {
    // Try to parse as JSON
    let qrData: SecureQRData;
    
    try {
      qrData = JSON.parse(qrString);
    } catch {
      // If not JSON, might be old format (just redemption code)
      // Return as invalid to force users to regenerate QR
      return {
        isValid: false,
        error: 'Invalid QR code format. Please regenerate your QR code from the wallet.',
      };
    }

    // Check required fields
    if (!qrData.redemptionId || !qrData.redemptionCode || !qrData.userId || 
        !qrData.rewardId || !qrData.timestamp || !qrData.signature) {
      return {
        isValid: false,
        error: 'QR code is missing required data',
      };
    }

    // Verify version
    if (qrData.version !== '1.0') {
      return {
        isValid: false,
        error: 'Unsupported QR code version',
      };
    }

    // Check timestamp - QR should be generated recently (within 5 minutes)
    const age = Date.now() - qrData.timestamp;
    if (age > QR_VALIDITY_MS) {
      return {
        isValid: false,
        error: 'QR code has expired. Please refresh your wallet to generate a new code.',
      };
    }

    if (age < 0) {
      return {
        isValid: false,
        error: 'QR code timestamp is in the future. System clock may be incorrect.',
      };
    }

    // Recreate the signature to verify authenticity
    const dataToVerify = `${qrData.redemptionId}|${qrData.redemptionCode}|${qrData.userId}|${qrData.rewardId}|${qrData.timestamp}|${qrData.version}`;
    const expectedSignature = crypto
      .createHmac('sha256', QR_SECRET)
      .update(dataToVerify)
      .digest('hex');

    // Compare signatures
    if (qrData.signature !== expectedSignature) {
      return {
        isValid: false,
        error: 'QR code signature is invalid. This may be a fake or tampered code.',
      };
    }

    // All checks passed
    return {
      isValid: true,
      data: qrData,
    };

  } catch (error) {
    console.error('QR validation error:', error);
    return {
      isValid: false,
      error: 'Failed to validate QR code',
    };
  }
}

/**
 * Client-side QR generation (no crypto library available)
 * Used for display only - signature will be validated server-side
 */
export function generateSecureQRClient(
  redemptionId: string,
  redemptionCode: string,
  userId: string,
  rewardId: string
): string {
  const timestamp = Date.now();
  const version = '1.0';

  // For client-side, we'll use a placeholder signature
  // The real signature will be generated when validating server-side
  const qrData = {
    redemptionId,
    redemptionCode,
    userId,
    rewardId,
    timestamp,
    signature: 'CLIENT_GENERATED',
    version,
  };

  return JSON.stringify(qrData);
}

/**
 * Check if a QR code needs refresh (older than 4 minutes)
 */
export function needsQRRefresh(qrString: string): boolean {
  try {
    const qrData = JSON.parse(qrString);
    const age = Date.now() - qrData.timestamp;
    return age > (4 * 60 * 1000); // Refresh after 4 minutes
  } catch {
    return true; // Invalid format, needs refresh
  }
}
