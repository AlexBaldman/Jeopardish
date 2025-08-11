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
    const response = await fetch('YOUR_AI_API_ENDPOINT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    return data.response;
}