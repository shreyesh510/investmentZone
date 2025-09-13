# CORS Configuration for TradeZone Backend

## Current Setup

The backend is configured with dynamic CORS handling that:
1. Automatically allows any `*.onrender.com` domain
2. Allows specific whitelisted origins
3. Can be configured via environment variables

## Quick Fix for CORS Issues

### Option 1: Use Permissive CORS (Temporary)
If you need to quickly fix CORS issues while debugging:

1. Replace the content of `src/main.ts` with `src/main-cors-permissive.ts`
2. Deploy to Render
3. This allows ALL origins (not recommended for production)

### Option 2: Configure via Environment Variables (Recommended)
In your Render dashboard, add this environment variable:

```
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com,https://another-allowed-url.com
```

### Option 3: Update the Code
The CORS configuration in `src/main.ts` already includes:
- `https://tradezone-2kfy.onrender.com`
- Any domain ending with `.onrender.com`

## How It Works

The CORS configuration uses a dynamic origin validator:

```typescript
origin: (origin, callback) => {
  // Allows Render domains automatically
  if (origin.endsWith('.onrender.com')) {
    return callback(null, true);
  }
  // ... other checks
}
```

## WebSocket CORS

The WebSocket gateway (`src/chat/chat.gateway.ts`) has the same CORS configuration to ensure Socket.io connections work properly.

## Troubleshooting

1. **Check your frontend URL**: Make sure you know the exact URL of your deployed frontend
2. **Check browser console**: The error will show which origin is being rejected
3. **Check backend logs**: The backend logs rejected origins with `⚠️ CORS: Rejected origin: [URL]`
4. **Environment variables**: Ensure `NODE_ENV` is set to `production` in Render

## Testing CORS

You can test if CORS is working:

```bash
curl -X OPTIONS https://your-backend.onrender.com/auth/login \
  -H "Origin: https://your-frontend.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Look for `Access-Control-Allow-Origin` in the response headers.