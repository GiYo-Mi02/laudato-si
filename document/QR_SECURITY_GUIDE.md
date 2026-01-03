# QR Code Security System Documentation

## Overview

The Laudato Si web app now uses **cryptographically signed QR codes** for reward redemptions. This prevents fraud, tampering, and ensures only legitimate redemptions are processed.

---

## 🔒 Security Features

### 1. **HMAC-SHA256 Signature**
- Every QR code contains a cryptographic signature
- Generated using a secret key (QR_SECRET environment variable)
- Impossible to forge without knowing the secret key
- Validates authenticity of the QR code

### 2. **Timestamp-Based Expiration**
- QR codes expire after **5 minutes** of generation
- Prevents screenshot sharing and reuse
- Users must refresh the QR in their wallet if expired
- Clock skew protection (detects future timestamps)

### 3. **Redemption Binding**
- QR code is bound to specific redemption ID
- Includes user ID and reward ID
- Cannot be reused for different redemptions
- Prevents code swapping attacks

### 4. **Tampering Detection**
- Any modification to QR data invalidates signature
- System detects altered values (points, user, reward)
- Immediate rejection with security alert

---

## 📱 User Flow

### For Students/Employees (User Side)

1. **Redeem Reward**
   - Browse rewards in `/rewards`
   - Click "Redeem" on desired reward
   - Points are deducted, redemption created

2. **View QR Code**
   - Go to "My Wallet" (`/wallet`)
   - Click on active redemption
   - System generates secure QR code (takes 1-2 seconds)
   - QR code displays with "Secure QR • Valid for 5 minutes" badge

3. **Present to Staff**
   - Show the QR code to canteen staff
   - Staff scans with camera or enters code manually
   - Get reward upon verification

4. **QR Expiration**
   - If QR expires (5 minutes), close and reopen dialog
   - New secure QR is generated automatically
   - No need to redeem again

### For Admins (Canteen Staff)

1. **Open Scanner**
   - Go to "Reward Verification" in admin panel
   - Click "Open Camera" button
   - Grant camera permissions

2. **Scan QR Code**
   - Point camera at student's QR code
   - System automatically detects and validates
   - See instant feedback:
     - ✅ **Green badge**: Valid secure QR
     - 🚨 **Red alert**: Fake/tampered/expired QR

3. **Manual Entry**
   - Can also type redemption code manually
   - Useful if camera not available
   - Same security validation applies

4. **Security Indicators**
   - "🔒 Secure QR" badge for validated codes
   - Details: "QR signature verified • Timestamp validated • Tampering check passed"
   - Regular codes work but show no security badge

---

## 🛡️ What Gets Validated

| Check | Description | Error Message |
|-------|-------------|---------------|
| **JSON Format** | QR must be valid JSON | "Invalid QR code format. Please regenerate..." |
| **Required Fields** | Must have redemptionId, code, userId, rewardId, timestamp, signature | "QR code is missing required data" |
| **Version** | Must be version 1.0 | "Unsupported QR code version" |
| **Timestamp Age** | Must be < 5 minutes old | "QR code has expired. Please refresh..." |
| **Future Time** | Timestamp cannot be in future | "QR code timestamp is in the future..." |
| **Signature Match** | HMAC signature must match | "QR code signature is invalid. This may be fake..." |

---

## 🔧 Technical Implementation

### QR Code Structure

```json
{
  "redemptionId": "uuid",
  "redemptionCode": "RDM-ABC123",
  "userId": "uuid",
  "rewardId": "uuid",
  "timestamp": 1735930800000,
  "signature": "a1b2c3d4...",
  "version": "1.0"
}
```

### Signature Generation

```
dataToSign = redemptionId|redemptionCode|userId|rewardId|timestamp|version
signature = HMAC-SHA256(dataToSign, QR_SECRET)
```

### Files Created/Modified

**New Files:**
- `src/lib/qrSecurity.ts` - Core security utilities
- `src/app/api/rewards/qr/route.ts` - QR generation endpoint
- `.env.example` - Environment variable template

**Modified Files:**
- `src/app/(dashboard)/wallet/page.tsx` - Secure QR display
- `src/app/api/admin/redemptions/route.ts` - QR validation
- `src/app/admin/redemptions/page.tsx` - Security feedback
- `src/app/api/rewards/redeem/route.ts` - Return redemption code

---

## 🚀 Setup Instructions

### 1. Set Environment Variable

Add to your `.env.local` file:

```bash
QR_SECRET=your_random_secret_key_here
```

**Generate a strong secret:**
```bash
# Using OpenSSL (recommended)
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Restart Development Server

```bash
npm run dev
```

### 3. Test the System

**User Side:**
1. Login as student/employee
2. Redeem a reward
3. Open wallet, click redemption
4. Verify "Secure QR • Valid for 5 minutes" appears
5. Wait 6 minutes and try again (should regenerate)

**Admin Side:**
1. Login as canteen admin
2. Open "Reward Verification"
3. Scan a valid QR (should show "🔒 Secure QR" badge)
4. Try scanning an old screenshot (should fail with expiration error)
5. Try manually editing QR JSON (should fail with signature error)

---

## 🐛 Troubleshooting

### "Failed to generate QR code"
- Check QR_SECRET is set in .env.local
- Verify redemption is in "pending" status
- Check redemption hasn't expired

### "QR code has expired"
- QR codes last 5 minutes
- Close and reopen the wallet dialog
- New QR will be generated automatically

### "QR code signature is invalid"
- QR_SECRET mismatch between generation and validation
- Ensure same QR_SECRET on all servers
- Don't change QR_SECRET in production (invalidates all existing QR codes)

### Camera not working
- Check browser permissions
- HTTPS required for camera access (or localhost)
- Try manual code entry as fallback

---

## 🔐 Security Best Practices

### For Production:

1. **Strong QR_SECRET**
   - Use 32+ character random string
   - Never commit to version control
   - Store in environment variables
   - Rotate periodically (invalidates old QR codes)

2. **HTTPS Only**
   - Camera access requires HTTPS
   - Protects QR_SECRET in transit
   - Prevents man-in-the-middle attacks

3. **Rate Limiting**
   - Consider adding rate limits to `/api/rewards/qr`
   - Prevents QR generation spam
   - Use Redis or similar for tracking

4. **Audit Logging**
   - All verification attempts are logged
   - Track failed security validations
   - Monitor for attack patterns

5. **Shorter Expiration for High-Value Rewards**
   - Adjust `QR_VALIDITY_MS` in qrSecurity.ts
   - Default: 5 minutes
   - Consider 2-3 minutes for sensitive items

---

## 📊 Security Metrics

Monitor these in production:

- **QR Generation Rate**: Normal users generate 1-2 QR per redemption
- **Signature Failures**: Should be near 0 (indicates attack attempts)
- **Expired QR Scans**: Should be < 5% of total scans
- **Multiple Scan Attempts**: Same QR scanned multiple times (potential fraud)

---

## 🎯 Attack Scenarios Prevented

| Attack | How It's Prevented |
|--------|-------------------|
| **Screenshot Sharing** | 5-minute expiration |
| **Code Reuse** | Redemption status check |
| **Fake QR Generation** | HMAC signature required |
| **Tampering (editing values)** | Signature validation fails |
| **Replay Attack** | One-time use, status changes to "verified" |
| **Clock Manipulation** | Server timestamp validation |
| **QR Code Swapping** | Bound to specific redemption ID |

---

## 🌟 Benefits

### For Users:
- ✅ Fast and secure redemption
- ✅ No need to memorize codes
- ✅ Clear expiration indicators
- ✅ Auto-refresh on reopen

### For Admins:
- ✅ Instant validation
- ✅ Clear security indicators
- ✅ Fraud detection
- ✅ Audit trail

### For Management:
- ✅ Prevents revenue loss from fake redemptions
- ✅ Builds trust in reward system
- ✅ Compliance with security standards
- ✅ Detailed logging for audits

---

## 📞 Support

For issues or questions about the QR security system:
1. Check troubleshooting section above
2. Review audit logs in admin panel
3. Check browser console for detailed errors
4. Verify environment variables are set correctly

**Last Updated**: January 3, 2026
**Version**: 1.0
