# Jeopardish Gemini Proxy Server

This proxy server handles secure API calls to Google's Gemini AI, keeping your API key safe on the server side.

## Setup

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy your API key

2. **Configure the Server**
   ```bash
   # Create .env file from the example
   cp .env.example .env
   
   # Edit .env and add your API key
   # GEMINI_API_KEY=your-actual-api-key-here
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start the Server**
   ```bash
   npm start
   # Or for development with auto-restart:
   npm run dev
   ```

The server will run on http://localhost:3002

## API Endpoints

### Health Check
```
GET /api/health
```

### Generate Content
```
POST /api/gemini/generate
Content-Type: application/json

{
  "prompt": "Your prompt here",
  "temperature": 0.8,
  "maxTokens": 200
}
```

## Security Features

- API key stored securely on server
- CORS protection
- Rate limiting (30 requests per minute per IP)
- Input validation
- No API key exposure to client

## Troubleshooting

- **"GEMINI_API_KEY not found"**: Create a .env file with your API key
- **Connection refused**: Make sure the server is running on port 3002
- **Rate limit exceeded**: Wait a minute and try again
- **CORS errors**: Check that your frontend is running on localhost:3000 or 3001
