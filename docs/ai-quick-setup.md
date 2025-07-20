# Quick Setup Guide: AI API Alternatives for Jeopardish

## 🚀 5-Minute Setup for Hugging Face (Recommended Alternative)

### Step 1: Get Free API Token
1. Sign up at [huggingface.co/join](https://huggingface.co/join)
2. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Click "New token" → Name it "Jeopardish" → Copy token

### Step 2: Configure Environment
```bash
# Add to server/.env file
HUGGINGFACE_TOKEN=hf_yourTokenHere
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

### Step 3: Start Hugging Face Proxy
```bash
cd server
node huggingface-proxy.js

# Or run both Gemini and HuggingFace:
npm run start:all
```

### Step 4: Test It
```bash
# Test the API
curl -X POST http://localhost:3003/api/test

# Or use the comprehensive test
node test-gemini-comprehensive.js
```

---

## 🔄 Multi-Provider Setup (Automatic Fallback)

### Option 1: Use Multi-Provider Manager
1. Include `multi-ai-provider.js` in your game
2. It automatically switches between providers based on availability
3. No configuration needed - it just works!

### Option 2: Manual Provider Switching
```javascript
// In your game code
window.multiAIProvider.setProvider('huggingface');

// Check provider status
const status = window.multiAIProvider.getStatus();
console.log(status);
```

---

## 📋 Provider Comparison Cheat Sheet

| Provider | Setup Time | Quality | Speed | Best For |
|----------|------------|---------|-------|----------|
| **Gemini** | 2 min | ⭐⭐⭐⭐⭐ | Fast | Default choice |
| **HuggingFace** | 3 min | ⭐⭐⭐⭐ | Medium | Free alternative |
| **Cohere** | 2 min | ⭐⭐⭐ | Fast | Simple responses |
| **Together** | 5 min | ⭐⭐⭐⭐⭐ | Fast | Premium models |

---

## 🛠️ Troubleshooting

### "Model is loading" error
- Wait 20-30 seconds and retry
- Switch to a different model in `.env`
- Use `microsoft/Phi-3-mini-4k-instruct` for faster loading

### Rate limit errors
- HuggingFace: 100 requests/hour
- Use caching to reduce API calls
- Switch providers temporarily

### Poor response quality
- Try different models:
  - `mistralai/Mixtral-8x7B-Instruct-v0.1` (better quality)
  - `meta-llama/Llama-2-7b-chat-hf` (more conversational)

---

## 🎯 Recommended Configuration

For best results with Jeopardish:

```javascript
// .env configuration
GEMINI_API_KEY=your_gemini_key
HUGGINGFACE_TOKEN=your_hf_token
COHERE_API_KEY=your_cohere_key

// Priority order
1. Gemini (primary)
2. HuggingFace (fallback)
3. Cohere (emergency)
```

---

## 📝 Sample Test Commands

```bash
# Test Gemini
curl -X POST http://localhost:3002/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello from Trebek!", "temperature": 0.8}'

# Test HuggingFace
curl -X POST http://localhost:3003/api/huggingface/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello from Trebek!", "temperature": 0.8}'

# Check provider health
curl http://localhost:3003/api/health
```

---

## 🔗 Useful Links

- [Gemini API Key](https://makersuite.google.com/app/apikey)
- [HuggingFace Token](https://huggingface.co/settings/tokens)
- [Cohere Dashboard](https://dashboard.cohere.com)
- [Model Comparison](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard)

---

*Need help? Check the comprehensive guide at `/docs/ai-api-alternatives-guide.md`*
