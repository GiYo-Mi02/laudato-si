# Quick Start Guide - Secure QR System

## ⚡ Setup in 3 Steps

### Step 1: Set Environment Variable

Create or edit `.env.local` in your project root:

```bash
# Generate a strong secret first
# Run this command:
openssl rand -hex 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Then add to .env.local:
QR_SECRET=paste_your_generated_secret_here
```

### Step 2: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Test the System

**Test as User:**
1. Go to http://localhost:3000
2. Login as student/employee
3. Go to "Rewards" → Redeem any reward
4. Go to "My Wallet" → Click on the redemption
5. You should see: 
   - A QR code generating (loading spinner)
   - "Secure QR • Valid for 5 minutes" badge
   - Green checkmark icon

**Test as Admin:**
1. Login as admin
2. Go to "Reward Verification"
3. Click "Open Camera"
4. Scan the QR code from user's wallet
5. You should see:
   - "✅ Verified & Secure!" toast notification
   - Green success box with "🔒 Secure QR" badge
   - Details: "QR signature verified • Timestamp validated • Tampering check passed"

---

## 🧪 Security Tests

### Test 1: Valid QR
✅ Should work perfectly

### Test 2: Expired QR (Wait 6 minutes)
❌ Should fail with: "QR code has expired. Please refresh your wallet..."

### Test 3: Screenshot from Another Device
❌ Should eventually expire (5 minutes)

### Test 4: Manually Edited QR
1. Generate QR, copy JSON string
2. Edit any value (e.g., change userId)
3. Create new QR with edited JSON
4. Try to scan
❌ Should fail with: "QR code signature is invalid. This may be fake..."

---

## 🐛 Troubleshooting

### "Failed to generate QR code"
**Fix**: Check `.env.local` has `QR_SECRET` set

### QR never generates (stuck loading)
**Fix**: Check browser console for errors, verify API is running

### Camera not working
**Fix**: 
- Allow camera permissions in browser
- Use HTTPS or localhost
- Try manual code entry as backup

### All QR codes fail validation
**Fix**: 
- Ensure QR_SECRET is same in .env.local
- Restart dev server after changing QR_SECRET
- Clear browser cache

---

## 📱 User Instructions

**For Students/Employees:**

1. **Redeem Reward**
   - Browse rewards
   - Click "Redeem"
   - Points deducted instantly

2. **Get QR Code**
   - Open "My Wallet"
   - Tap your redemption
   - Wait 1-2 seconds for QR to generate
   - Show to canteen staff

3. **If Expired**
   - Close the dialog
   - Reopen it
   - New QR generated automatically

**For Admin Staff:**

1. **Open Scanner**
   - Go to "Reward Verification"
   - Click "Open Camera"
   - Allow camera access

2. **Scan QR**
   - Point at student's QR code
   - Automatic detection
   - See green success or red error

3. **Manual Entry (Optional)**
   - Type code in search box
   - Press Enter or click "Verify"
   - Same security checks apply

---

## ✅ What's Working

- ✅ Secure QR generation with HMAC-SHA256
- ✅ 5-minute expiration
- ✅ Tamper detection
- ✅ Fake QR detection
- ✅ Visual security indicators
- ✅ Auto-refresh on wallet reopen
- ✅ Camera scanning
- ✅ Manual code entry
- ✅ Security audit logging

---

## 📚 Full Documentation

See `document/QR_SECURITY_GUIDE.md` for complete documentation.

---

## 🎯 Success Criteria

You'll know it's working when:
1. QR codes show "Secure QR • Valid for 5 minutes" badge
2. Admin sees "🔒 Secure QR" badge after successful scan
3. Old/fake QR codes are rejected with clear error messages
4. System prevents all fraud attempts

---

**Ready to use!** 🚀
