# Security Guide for Gemini API Integration

## Overview

This guide explains the security considerations for using the Gemini API in Jeopardish and provides best practices for keeping your API key secure.

## Current Security Measures

### 1. Proxy Server (Recommended)

The recommended approach uses a Node.js proxy server that keeps your API key on the backend:

```
Client (Browser) → Proxy Server (localhost:3002) → Google Gemini API
```

**Benefits:**
- API key never exposed to client-side code
- Rate limiting implemented server-side
- Request validation and sanitization
- CORS protection
- Easy to add authentication later

### 2. Environment Variables

The proxy server uses environment variables to store the API key:

```bash
# server/.env
GEMINI_API_KEY=your-api-key-here
```

This file is:
- ✅ Listed in `.gitignore` (never committed to version control)
- ✅ Only accessible on the server
- ✅ Not exposed to client-side JavaScript

## Setup Instructions

### Secure Setup (Proxy Server)

1. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp ../.env.example .env
   # Edit .env and add your API key
   ```

3. **Start the proxy server:**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

4. **The game will automatically use the proxy server** when it's running

### Fallback Setup (Direct API - NOT for production)

If you can't run the proxy server, the game can fall back to direct API calls, but this is **not secure** for production use:

1. Open the game settings
2. Add your API key
3. The key is stored in localStorage (visible in DevTools!)

⚠️ **Warning:** This exposes your API key to anyone who can access the browser!

## Security Best Practices

### 1. API Key Restrictions

Always restrict your API key in the [Google Cloud Console](https://console.cloud.google.com/):

- **Application restrictions:** Set to "HTTP referrers" for web apps
- **API restrictions:** Restrict to "Generative Language API" only
- **Referrer restrictions:** Add your domains (e.g., `localhost:3001`, `yourdomain.com`)

### 2. Rate Limiting

The proxy server implements rate limiting:
- 30 requests per minute per IP address
- Prevents abuse and unexpected charges

### 3. Input Validation

The proxy server validates:
- Prompt length (max 5000 characters)
- Required parameters
- Request format

### 4. CORS Protection

The proxy server only accepts requests from specified origins:
```javascript
cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
})
```

## Production Deployment

For production deployment:

1. **Use a proper backend service** (e.g., Vercel, Railway, Heroku)
2. **Set environment variables** in your hosting platform
3. **Add authentication** if needed (JWT, sessions, etc.)
4. **Enable HTTPS** for all connections
5. **Monitor usage** in Google Cloud Console
6. **Set up billing alerts** to prevent unexpected charges

### Example Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy the proxy server
cd server
vercel

# Set environment variable
vercel env add GEMINI_API_KEY
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Never commit API keys to version control
- [ ] Use proxy server for production
- [ ] Restrict API key in Google Cloud Console
- [ ] Monitor API usage regularly
- [ ] Set up billing alerts
- [ ] Use HTTPS in production
- [ ] Implement proper authentication if needed
- [ ] Keep dependencies updated
- [ ] Review security logs regularly

## Troubleshooting

### "API Key Invalid" Error
- Check for extra spaces in the API key
- Verify the key in Google Cloud Console
- Ensure the key has access to Generative Language API

### Proxy Server Not Working
- Check if port 3002 is available
- Verify `.env` file exists in `server/` directory
- Check server logs for errors
- Ensure npm dependencies are installed

### Rate Limit Errors
- The proxy limits to 30 requests/minute
- Implement caching on the client side
- Consider upgrading to paid tier if needed

## Resources

- [Google AI Studio](https://makersuite.google.com/app/apikey) - Get API keys
- [Google Cloud Console](https://console.cloud.google.com/) - Manage API keys
- [Gemini API Docs](https://ai.google.dev/api/rest/v1/models/generateContent) - API reference
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/) - General security guide

## Questions or Issues?

If you encounter security issues or have questions:
1. Check this guide first
2. Review server logs
3. Never share your API key in issues or forums
4. Consider using mock responses for development
