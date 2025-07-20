import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.HF_PORT || 3003;

// Middleware
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Hugging Face configuration
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
const MODEL_ID = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 100; // Hugging Face allows ~100 requests/hour
const RATE_WINDOW = 3600000; // 1 hour

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

// Trebek personality prompt
const TREBEK_PERSONALITY = `You are Alex Trebek, the beloved host of Jeopardy! from 1984 to 2020. You have been digitally resurrected to host "Jeopardish," a comedic tribute to the original game show. Your personality combines the real Alex Trebek's professionalism with a slightly more playful, self-aware twist.

Key traits:
- Professional but with dry wit and subtle sarcasm
- Occasionally makes dad jokes and puns
- Self-aware about being an AI version
- References to mustache and Canadian heritage
- Educational but entertaining

Keep responses concise (1-3 sentences) and family-friendly.`;

// Format prompt based on model
function formatPrompt(prompt, model) {
    if (model.includes('mistral')) {
        return `<s>[INST] ${TREBEK_PERSONALITY}\n\n${prompt} [/INST]`;
    } else if (model.includes('llama')) {
        return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
${TREBEK_PERSONALITY}<|eot_id|><|start_header_id|>user<|end_header_id|>
${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
    } else {
        // Generic format
        return `${TREBEK_PERSONALITY}\n\nUser: ${prompt}\nAssistant:`;
    }
}

// API endpoint for Hugging Face requests
app.post('/api/huggingface/generate', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Check if API token is configured
    if (!HF_TOKEN) {
        return res.status(500).json({ 
            error: 'Hugging Face API token not configured',
            message: 'Please set HUGGINGFACE_TOKEN in your .env file'
        });
    }
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded. Please try again later.' 
        });
    }
    
    try {
        const { prompt, temperature = 0.8, maxTokens = 200 } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        // Format prompt for the model
        const formattedPrompt = formatPrompt(prompt, MODEL_ID);
        
        // Make request to Hugging Face
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${MODEL_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({
                    inputs: formattedPrompt,
                    parameters: {
                        temperature,
                        max_new_tokens: maxTokens,
                        return_full_text: false,
                        do_sample: true,
                        top_p: 0.95,
                    },
                }),
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Hugging Face API Error:', errorData);
            
            // Handle model loading
            if (response.status === 503 && errorData.error?.includes('loading')) {
                return res.status(503).json({ 
                    error: 'Model is loading. Please try again in a few seconds.',
                    estimatedTime: errorData.estimated_time || 20
                });
            }
            
            throw new Error(errorData.error || `API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract generated text
        let generatedText = '';
        if (Array.isArray(data)) {
            generatedText = data[0]?.generated_text || '';
        } else if (data.generated_text) {
            generatedText = data.generated_text;
        } else {
            console.error('Unexpected response format:', data);
            throw new Error('Unexpected response format from Hugging Face');
        }
        
        // Clean up the response
        generatedText = generatedText.trim();
        
        res.json({ text: generatedText });
    } catch (error) {
        console.error('Hugging Face API error:', error);
        res.status(500).json({ 
            error: 'Failed to generate content',
            message: error.message 
        });
    }
});

// List available models endpoint
app.get('/api/huggingface/models', (req, res) => {
    res.json({
        current: MODEL_ID,
        recommended: [
            {
                id: 'mistralai/Mistral-7B-Instruct-v0.2',
                name: 'Mistral 7B Instruct',
                description: 'Fast and capable, good for conversation'
            },
            {
                id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
                name: 'Mixtral 8x7B',
                description: 'Higher quality, slower response'
            },
            {
                id: 'microsoft/Phi-3-mini-4k-instruct',
                name: 'Phi-3 Mini',
                description: 'Very fast, good quality'
            },
            {
                id: 'meta-llama/Llama-2-7b-chat-hf',
                name: 'Llama 2 7B Chat',
                description: 'Good conversational model'
            }
        ]
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        provider: 'huggingface',
        model: MODEL_ID,
        apiKeyConfigured: !!HF_TOKEN,
        rateLimit: `${RATE_LIMIT} requests per hour`
    });
});

// Test endpoint
app.post('/api/test', async (req, res) => {
    if (!HF_TOKEN) {
        return res.status(500).json({ 
            error: 'API token not configured',
            instructions: 'Set HUGGINGFACE_TOKEN in .env file'
        });
    }
    
    try {
        const testPrompt = formatPrompt(
            "Say hello and introduce yourself as AI Alex Trebek in one sentence.",
            MODEL_ID
        );
        
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${MODEL_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({
                    inputs: testPrompt,
                    parameters: {
                        temperature: 0.7,
                        max_new_tokens: 50,
                        return_full_text: false,
                    },
                }),
            }
        );
        
        const data = await response.json();
        res.json({ 
            success: response.ok,
            model: MODEL_ID,
            response: data
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            model: MODEL_ID
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Hugging Face proxy server running on port ${PORT}`);
    console.log(`📦 Using model: ${MODEL_ID}`);
    
    if (!HF_TOKEN) {
        console.warn('⚠️  Warning: HUGGINGFACE_TOKEN not found in environment variables');
        console.warn('   1. Sign up at https://huggingface.co/join');
        console.warn('   2. Get token from https://huggingface.co/settings/tokens');
        console.warn('   3. Add to .env: HUGGINGFACE_TOKEN=your-token-here');
    } else {
        console.log('✅ API token configured');
        console.log('🚀 Ready to generate AI responses!');
    }
});
