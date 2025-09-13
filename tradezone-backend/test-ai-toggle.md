# AI Feature Toggle - Safe Testing Guide

## 🔧 How to Toggle AI Feature for Users

### Method 1: API Endpoint (Recommended)
Use the safe API endpoint to toggle AI features:

```bash
# Disable AI for a specific user
curl -X PATCH http://localhost:3001/auth/toggle-ai/vivekkolhe@gmail.com \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"enabled": false}'

# Enable AI for a specific user  
curl -X PATCH http://localhost:3001/auth/toggle-ai/vivekkolhe@gmail.com \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"enabled": true}'
```

### Method 2: Direct Firebase Console
1. Go to Firebase Console > Firestore
2. Find the user document
3. Add/Update field: `isAiFeatureEnabled: false`

## 🎯 Current Behavior

### For Existing Users (Before this update):
- `isAiFeatureEnabled` is `undefined` → **AI ALLOWED** (backward compatibility)
- Users can use AI features normally

### For New Users (After this update):
- `isAiFeatureEnabled` defaults to `true` → **AI ALLOWED**

### For Restricted Users:
- `isAiFeatureEnabled` set to `false` → **AI BLOCKED**
- Shows warning when trying to toggle AI mode
- Toggle appears dimmed (50% opacity)

## 🚀 Safe Implementation

✅ **Backward Compatible**: Existing users not affected
✅ **Non-Breaking**: Current app continues working
✅ **Granular Control**: Per-user AI access control
✅ **Visual Feedback**: Clear UI indicators for restricted users

## 🧪 Testing Steps

1. **Test Current User**: AI should work normally (existing user)
2. **Set isAiFeatureEnabled to false**: User should see warning
3. **Set isAiFeatureEnabled to true**: User should access AI normally
4. **New Registration**: Should have AI access by default
