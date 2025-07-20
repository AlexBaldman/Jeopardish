import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'], // Your frontend URLs
    credentials: true
}));
app.use(express.json());

// Initialize Gemini AI with server-side API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = requestCounts.get(ip) || [];
    
    // Remove old requests
    const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);
    
    if (recentRequests.length >= RATE_LIMIT) {
        return false;
    }
    
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    return true;
}

// API endpoint for Gemini requests
app.post('/api/gemini/generate', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded. Please try again in a minute.' 
        });
    }
    
    try {
        const { prompt, temperature = 0.8, maxTokens = 200 } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        // Validate prompt length
        if (prompt.length > 5000) {
            return res.status(400).json({ error: 'Prompt is too long' });
        }
        
        // Generate content
        const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
                topK: 40,
                topP: 0.95,
            },
        });
        
        const response = await result.response;
        const text = response.text();
        
        res.json({ text });
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ 
            error: 'Failed to generate content',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        apiKeyConfigured: !!process.env.GEMINI_API_KEY
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Gemini proxy server running on port ${PORT}`);
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  Warning: GEMINI_API_KEY not found in environment variables');
        console.warn('   Create a .env file with: GEMINI_API_KEY=your-api-key-here');
    }
});
