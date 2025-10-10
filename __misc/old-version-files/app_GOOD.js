function updateScore(newScore) {
    const scoreElement = document.querySelector('.score');
    const currentScore = parseInt(scoreElement.textContent, 10);

    if (newScore > currentScore) {
        scoreElement.classList.add('increase');
    } else {
        scoreElement.classList.add('decrease');
    }

    scoreElement.textContent = newScore;

    setTimeout(() => {
        scoreElement.classList.remove('increase', 'decrease');
    }, 500);
}

function flipDigit(digitElement, newDigit) {
    digitElement.classList.add('flip-up');
    setTimeout(() => {
        digitElement.textContent = newDigit;
        digitElement.classList.remove('flip-up');
    }, 300);
}

function animateTrebek(action) {
    const trebekElement = document.querySelector('.trebek');
    trebekElement.classList.remove('sidle', 'hide', 'pop-up');

    if (action === 'sidle') {
        trebekElement.classList.add('sidle');
    } else if (action === 'hide') {
        trebekElement.classList.add('hide');
    } else if (action === 'pop-up') {
        trebekElement.classList.add('pop-up');
    }
}

async function getAIResponse(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('Invalid prompt provided');
    }
    
    const apiEndpoint = process.env.AI_API_ENDPOINT || '/api/ai';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
            signal: controller.signal,
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || typeof data.response !== 'string') {
            throw new Error('Invalid API response format');
        }
        
        return data.response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('API request timed out');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}