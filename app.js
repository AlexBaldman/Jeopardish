// Initialize game state variables
let currentScore = 0;
let bestScore = 0;
let currentStreak = 0;
let bestStreak = 0;
let scoreboardInitialized = false; // New variable to track initialization
let peekTokens = 5; // Initialize peek tokens

// API url to fetch data for random question
const apiUrl = 'https://cluebase.lukelav.in/clues/random';

// Load questions from local JSON files
let questions = [];
let currentQuestionIndex = 0;
const CHUNK_SIZE = 500; // Number of questions to load at a time
let allQuestions = []; // New array to store all loaded questions
let showingMessage = false; // Flag to note whether message currently being shown or not

// Local questions loading
const questionFiles = [
    'questions/questions.json' 
    // 'questions/questions.csv'
];

// Create buttons for basic functionality & user interaction
const checkButton = document.getElementById('checkButton');
const answerButton = document.getElementById('answerButton');
const questionButton = document.getElementById('questionButton');

// Create userInput box for entering answer
const userInput = document.getElementById('inputBox');

// Use separate boxes to distribute data within word-bubble
const categoryBox = document.getElementById('categoryBox');
const questionBox = document.getElementById('questionBox');
const answerBox = document.getElementById('answerBox');
const valueBox = document.getElementById('valueBox');

// Introduce the game via console
console.log(`Welcome to Jeopardish!!!`);
console.log(`Click the "new question" button to get a random Jeopardy-style question & test your knowledge.`);
console.log(`Multiple correct answers in a row will start a streak...`);
console.log(`...but get one wrong & the streak will reset.`);
console.log("Let's see how many correct answers you can string together! ");
console.log(`Streak is currently at ` + currentStreak);
console.log("HAVE FUN YA MANIAC!");

// GRABBING TREBEK IMAGES 
document.addEventListener('DOMContentLoaded', () => {
    const titleImage = document.getElementById('titleImage');
    const trebekImage = document.getElementById('trebekImage');
    const trebekImages = [
        'images/trebek/trebek-good-04.png',
        'images/trebek/trebek-good-01.png',
        'images/trebek/trebek-good-02.png',
        'images/trebek/trebek-good-03.svg',
        'images/trebek/trebek-good-05.png',
        'images/trebek/trebek-other-retired.png',
        'images/trebek/trebek-other-strapped.png',
        'images/trebek/trebek-other-anime.png',
        'images/trebek/trebek-original.png',
        'images/trebek/trebek-original-w-sunglasses.svg',
        'images/trebek/trebek-original-b&w.svg'
    ];
    let currentIndex = 0;


    // add ability to toggle Trebek image with left/right side of title image
    titleImage.addEventListener('click', (event) => {
        const rect = titleImage.getBoundingClientRect();
        const clickX = event.clientX - rect.left; // x position within the element
        const width = rect.width;

        if (clickX < width / 2) {
            // Clicked on the left side
            currentIndex = (currentIndex - 1 + trebekImages.length) % trebekImages.length;
        } else {
            // Clicked on the right side
            currentIndex = (currentIndex + 1) % trebekImages.length;
        }

        trebekImage.src = trebekImages[currentIndex];
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const inputBox = document.getElementById('inputBox');
    const cursor = document.querySelector('.custom-cursor');

    function updateCursorPosition() {
        const text = inputBox.value.substring(0, inputBox.selectionStart);
        const span = document.createElement('span');
        span.style.font = window.getComputedStyle(inputBox).font;
        span.style.visibility = 'hidden';
        span.textContent = text || '';
        inputBox.parentNode.appendChild(span);
        
        const textWidth = span.getBoundingClientRect().width;
        inputBox.parentNode.removeChild(span);
        
        const inputPadding = parseInt(window.getComputedStyle(inputBox).paddingLeft);
        cursor.style.left = `${inputPadding + textWidth}px`;
    }

    // Event listeners
    inputBox.addEventListener('input', updateCursorPosition);
    inputBox.addEventListener('click', updateCursorPosition);
    inputBox.addEventListener('keydown', () => setTimeout(updateCursorPosition, 0));
    inputBox.addEventListener('focus', () => {
        cursor.style.display = 'block';
        updateCursorPosition();
    });
    inputBox.addEventListener('blur', () => {
        cursor.style.display = 'none';
    });

    // Initial position
    updateCursorPosition();
});

async function fetchFromAPI() {
    console.log('🌐 Attempting to fetch question from API...');
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('✅ API fetch successful:', data);
        return data;
    } catch (error) {
        console.error("❌ API Error:", error.message);
        console.log("🎭 Falling back to local questions...");
        return null;
    }
}

async function loadLocalQuestions() {
    console.log('📚 Starting local questions load...');
    if (allQuestions.length === 0) {
        for (const file of questionFiles) {
            try {
                console.log(`📂 Loading ${file}...`);
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const fileExtension = file.split('.').pop().toLowerCase();
                let data;
                
                console.log(`🔍 Processing ${fileExtension} file...`);
                if (fileExtension === 'json') {
                    data = await response.json();
                } else if (fileExtension === 'csv') {
                    const text = await response.text();
                    data = parseCSV(text);
                } else {
                    throw new Error(`Unsupported file type: ${fileExtension}`);
                }
                console.log(`✅ Loaded ${data.length} questions from ${file}`);
                allQuestions = allQuestions.concat(data);
            } catch (error) {
                console.error(`❌ Error loading ${file}:`, error.message);
                console.error('Full error:', error);
            }
        }
        if (allQuestions.length === 0) {
            console.log("📚 Our local question library seems to be on vacation. Time for some improv!");
            return false;
        }
        console.log(`📘 Loaded ${allQuestions.length} questions from local files.`);
    }

    console.log('🎲 Shuffling questions...');
    shuffleArray(allQuestions);
    questions = allQuestions.slice(0, CHUNK_SIZE);
    currentQuestionIndex = 0;
    console.log(`✅ Prepared ${questions.length} random questions for use`);
    return true;
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index].trim();
            return obj;
        }, {});
    });
}

let currentQuestion = null; // variable to hold current question
let answerWasRevealed = false;

async function getNewQuestion() {
    console.log('🎯 getNewQuestion called');
    
    // Reset all state flags
    showingMessage = false;
    answerWasRevealed = false;
    
    // Get and clear input box
    const inputBox = document.getElementById('inputBox');
    if (inputBox) {
        inputBox.value = '';
    }
    
    // Get answer box for visibility
    const answerBox = document.getElementById('answerBox');
    if (answerBox) {
        answerBox.style.display = 'none';
    }
    
    try {
        // Local question handling
        if (questions.length === 0 || currentQuestionIndex >= questions.length) {
            console.log('📥 Need to load more local questions...');
            const localQuestionsLoaded = await loadLocalQuestions();
            if (!localQuestionsLoaded) {
                console.error('❌ Failed to load local questions');
                displayErrorJoke();
                return;
            }
        }

        currentQuestion = questions[currentQuestionIndex];
        currentQuestionIndex++;
        
        const normalizedQuestion = normalizeQuestionData(currentQuestion);
        displayQuestion(normalizedQuestion);
        
        // Ensure answer is hidden when loading new question
        if (answerBox) {
            answerBox.style.display = 'none';
        }
        
        // Auto-focus the input box
        if (inputBox) {
            inputBox.focus();
        }
    } catch (error) {
        console.error("❌ Failed to get new question:", error);
        displayErrorJoke();
    }
}
// Error messages
const jeopardyErrors = [
    {
        category: "TECHNICAL DIFFICULTIES",
        question: "This term describes what happens when your app can't load the local question database.",
        answer: "What is 'a file reading error'?",
        value: "$0"
    },
    {
        category: "OOOPS!",
        question: "This famous line was uttered by every programmer ever when their code didn't work as expected.",
        answer: "What is 'It works on my machine'?",
        value: "$0"
    },
    {
        category: "MYSTERY OF CODING",
        question: "It's the spooky thing that happens when your API call goes into the void and never returns.",
        answer: "What is 'the ghost in the machine'?",
        value: "$0"
    },
    {
        category: "SOFTWARE SNAFUS",
        question: "This phrase is often said when an application stops working right as you show it to someone.",
        answer: "What is 'demo demon'?",
        value: "$0"
    }
];

// Function to display error messages in the UI
function displayErrorMessage(message) {
    const categoryBox = document.getElementById('categoryBox');
    const questionBox = document.getElementById('questionBox');
    const answerBox = document.getElementById('answerBox');
    
    if (!categoryBox || !questionBox || !answerBox) {
        console.error('Missing required DOM elements for error message display');
        return;
    }
    
    categoryBox.innerHTML = "Error";
    questionBox.innerHTML = message;
    answerBox.innerHTML = "";
    answerBox.style.display = "block";
}

// Function to display a random error joke
function displayErrorJoke() {
    try {
        const questionBox = document.getElementById('questionBox');
        const categoryBox = document.getElementById('categoryBox');
        const valueBox = document.getElementById('valueBox');
        
        if (!questionBox || !categoryBox || !valueBox) {
            console.error('Missing required DOM elements for error joke display');
            return;
        }
        
        // Get a random error joke
        const errorJoke = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
        
        categoryBox.innerHTML = errorJoke.category;
        questionBox.innerHTML = errorJoke.question;
        valueBox.innerHTML = 'for $ERROR';
    } catch (error) {
        console.error('Failed to display error joke:', error);
    }
}

// Array of cheeky comments for when users try to answer after revealing the answer
const cheekyComments = [
    "Nah uh buddy, not so fast! Trying to cheat?!!",
    "Nice try! Peeking at answers doesn't count!",
    "Oh come on, you already saw the answer!",
    "Hmm, suddenly you know the answer? How suspicious...",
    "Sorry, no points when you've already peeked!",
    "I see what you did there! No credit after peeking!",
    "Cheaters never prosper... but you can still try the next question!"
];

function checkAnswer() {
    console.log('🎯 checkAnswer called');
    
    const userInput = document.getElementById('inputBox'); 
    const answerBox = document.getElementById('answerBox');
    
    if (!userInput || !answerBox || !window.currentQuestion) {
        console.error('Required elements or question not found');
        return;
    }
    
    const userAnswer = userInput.value.trim().toLowerCase();
    const correctAnswer = (window.currentQuestion.translatedAnswer || window.currentQuestion.answer || '').toLowerCase();
    
    // Clean answers by removing parentheses and their contents
    const cleanedUserAnswer = userAnswer.replace(/\s*\([^\)]+\)\s*/g, '').trim();
    const cleanedCorrectAnswer = correctAnswer.replace(/\s*\([^\)]+\)\s*/g, '').replace(/\\/g, '').trim();
    
    // Store the user input (but don't update the display yet)
    const userEnteredText = `YOU ENTERED: ${userAnswer}`;
    
    if (!userAnswer) {
        console.log('No answer provided');
        return;
    }
    
    console.log('Checking answer:', { userAnswer, correctAnswer });
    
    // Use compareAnswers function to check the answers
    const isCorrect = compareAnswers(cleanedUserAnswer, cleanedCorrectAnswer);
    
    // Update game state
    userInput.value = '';
    
    // Handle revealed answers differently based on correctness
    if (answerWasRevealed) {
        // If they peeked at the answer and got it correct
        if (isCorrect) {
            const cheekyComment = cheekyComments[Math.floor(Math.random() * cheekyComments.length)];
            
            categoryBox.innerHTML = "";
            valueBox.innerHTML = "";
            questionBox.innerHTML = `That's correct! But ${cheekyComment.toLowerCase()} Since you looked at the answer, you don't get any points and your streak has been reset.`;
            answerBox.innerHTML = `The correct answer was: ${correctAnswer}`;
            answerBox.style.display = "flex";
            showingMessage = true;
            
            // Reset streak
            updateStreak(false);
            updateTickerOnEvent('incorrect');
        } else {
            // If they peeked but still got it wrong, just proceed normally
            updateStreak(false);
            displayIncorrectAnswerMessage(correctAnswer);
            updateTickerOnEvent('incorrect');
        }
        return;
    }
    
    // Handle result for normal answers (not revealed)
    if (isCorrect) {
        currentScore += window.currentQuestion.value;
        displayCorrectAnswerMessage();
        updateStreak(true);
        updateTickerOnEvent('correct', { streak: currentStreak });
    } else {
        updateStreak(false);
        displayIncorrectAnswerMessage(correctAnswer);
        updateTickerOnEvent('incorrect');
    }

    // Only get new question if we're not showing a message
    if (!showingMessage) {
        setTimeout(() => {
            getNewQuestion();
        }, 2000);
    }
}

// correct answer message
function displayCorrectAnswerMessage() {
    const categoryBox = document.getElementById('categoryBox');
    const valueBox = document.getElementById('valueBox');
    const questionBox = document.getElementById('questionBox');
    const answerBox = document.getElementById('answerBox');
    
    if (!categoryBox || !valueBox || !questionBox || !answerBox) {
        console.error('Missing required DOM elements for correct answer message display');
        return;
    }
    
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = `Correctamundo and cowabunga, my friend! Your streak is now ${currentStreak}. Keep it going, sir or lady or other person!!`;
    answerBox.innerHTML = "";
    answerBox.style.display = "flex";
    showingMessage = true; // Set flag to indicate a message is being shown
};

// incorrect answer message
function displayIncorrectAnswerMessage(correctAnswer) {
    const categoryBox = document.getElementById('categoryBox');
    const valueBox = document.getElementById('valueBox');
    const questionBox = document.getElementById('questionBox');
    const answerBox = document.getElementById('answerBox');
    
    if (!categoryBox || !valueBox || !questionBox || !answerBox) {
        console.error('Missing required DOM elements for incorrect answer message display');
        return;
    }
    
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = `Incorrect, you fool! Your streak is now reset! Try again, sir or lady or other person!!`;
    answerBox.innerHTML = `The correct answer was: ${correctAnswer}`;
    answerBox.style.display = "flex";
    showingMessage = true; // Set flag to indicate a message is being shown
};

// display cheeky message
function displayCheekyMessage(cheekyComment) {
    const categoryBox = document.getElementById('categoryBox');
    const valueBox = document.getElementById('valueBox');
    const questionBox = document.getElementById('questionBox');
    const answerBox = document.getElementById('answerBox');
    
    if (!categoryBox || !valueBox || !questionBox || !answerBox) {
        console.error('Missing required DOM elements for cheeky message display');
        return;
    }
    
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = cheekyComment;
    answerBox.innerHTML = "";
    answerBox.style.display = "flex";
    showingMessage = true;
}

function compareAnswers(userAnswer, correctAnswer) {
    console.group('🎯 Answer Comparison');
    console.log('User Answer:', userAnswer);
    console.log('Correct Answer:', correctAnswer);
    
    const cleanedUser = cleanAnswer(userAnswer);
    const cleanedCorrect = cleanAnswer(correctAnswer);
    console.log('Cleaned User Answer:', cleanedUser);
    console.log('Cleaned Correct Answer:', cleanedCorrect);
    
    // Split correct answers into an array
    const correctAnswersArray = cleanedCorrect.split(',').map(answer => answer.trim());
    
    // Check if user's answer matches any of the correct answers
    const isCorrect = correctAnswersArray.some(correct => cleanedUser.includes(correct));
    
    console.log('Match Result:', isCorrect ? '✅ Accepted' : '❌ Rejected');
    console.groupEnd();
    
    return isCorrect;
}

function cleanAnswer(answer) {
    if (!answer) return '';
    
    // Convert to lowercase and trim
    let cleaned = answer.toLowerCase().trim();
    
    // Remove leading articles (a, an, the)
    cleaned = cleaned.replace(/^(a|an|the)\s+/i, '');
    
    // Remove punctuation and extra spaces
    cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    console.log(`🧹 Cleaned answer: "${answer}" → "${cleaned}"`);
    return cleaned;
}

// Scoreboard state management
let isScoreboardVisible = false;
let scoreboardHovered = false;

function initializeScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    if (!scoreboard || scoreboardInitialized) {
        return;
    }

    scoreboardInitialized = true;

    // Force initial visibility
    scoreboard.style.display = 'block';
    scoreboard.style.visibility = 'visible';
    scoreboard.style.opacity = '1';
    
    // Initialize all scores to 0
    document.querySelector('#currentScore .score-value').textContent = '$0';
    document.querySelector('#bestScore .score-value').textContent = '$0';
    document.querySelector('#currentStreak .score-value').textContent = '0';
    document.querySelector('#bestStreak .score-value').textContent = '0';

    // Add hover behavior
    scoreboard.addEventListener('mouseenter', () => {
        scoreboardHovered = true;
        showScoreboard();
    });

    scoreboard.addEventListener('mouseleave', () => {
        scoreboardHovered = false;
        hideScoreboard();
    });
}

function showScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    if (scoreboard) {
        isScoreboardVisible = true;
        scoreboard.classList.add('show');
        // Ensure visibility
        scoreboard.style.display = 'block';
        scoreboard.style.visibility = 'visible';
        scoreboard.style.opacity = '1';
    }
}

function hideScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    if (scoreboard && !scoreboardHovered) {
        isScoreboardVisible = false;
        scoreboard.classList.remove('show');
        // Never fully hide, just slide out
        scoreboard.style.display = 'block';
        scoreboard.style.visibility = 'visible';
        scoreboard.style.opacity = '1';
    }
}

function updateScoreBoard() {
    const currentScoreElement = document.querySelector('#currentScore .score-value');
    const bestScoreElement = document.querySelector('#bestScore .score-value');
    const currentStreakElement = document.querySelector('#currentStreak .score-value');
    const bestStreakElement = document.querySelector('#bestStreak .score-value');

    let hasChanges = false;

    // Update current score
    if (currentScoreElement) {
        const oldScore = currentScoreElement.textContent;
        const newScore = `$${currentScore}`;
        if (oldScore !== newScore) {
            hasChanges = true;
            currentScoreElement.textContent = newScore;
            
            // Add changing class to both the element and its parent
            currentScoreElement.classList.add('changing');
            document.getElementById('currentScore').classList.add('changing');
            
            // Remove classes after animation completes
            setTimeout(() => {
                currentScoreElement.classList.remove('changing');
                document.getElementById('currentScore').classList.remove('changing');
            }, 1000);
        }
        console.log('Old Score:', oldScore);
        console.log('New Score:', newScore);
        console.log('Current Score:', currentScore);
    }
    
    // Update top score
    if (bestScoreElement) {
        const oldBestScore = parseInt(bestScoreElement.textContent.replace('$', '')) || 0;
        if (currentScore > oldBestScore) {
            hasChanges = true;
            bestScore = currentScore;
            bestScoreElement.textContent = `$${bestScore}`;
            
            // Add changing class to both the element and its parent
            bestScoreElement.classList.add('changing');
            document.getElementById('bestScore').classList.add('changing');
            
            // Remove classes after animation completes
            setTimeout(() => {
                bestScoreElement.classList.remove('changing');
                document.getElementById('bestScore').classList.remove('changing');
            }, 1000);
        }
    }
    
    // Update current streak
    if (currentStreakElement) {
        const oldStreak = currentStreakElement.textContent;
        const newStreak = currentStreak.toString();
        if (oldStreak !== newStreak) {
            hasChanges = true;
            currentStreakElement.textContent = newStreak;
            
            // Add changing class to both the element and its parent
            currentStreakElement.classList.add('changing');
            document.getElementById('currentStreak').classList.add('changing');
            
            // Remove classes after animation completes
            setTimeout(() => {
                currentStreakElement.classList.remove('changing');
                document.getElementById('currentStreak').classList.remove('changing');
            }, 1000);
        }
    }
    
    // Update best streak
    if (bestStreakElement) {
        const oldBestStreak = parseInt(bestStreakElement.textContent) || 0;
        if (currentStreak > oldBestStreak) {
            hasChanges = true;
            bestStreak = currentStreak;
            bestStreakElement.textContent = bestStreak.toString();
            
            // Add changing class to both the element and its parent
            bestStreakElement.classList.add('changing');
            document.getElementById('bestStreak').classList.add('changing');
            
            // Remove classes after animation completes
            setTimeout(() => {
                bestStreakElement.classList.remove('changing');
                document.getElementById('bestStreak').classList.remove('changing');
            }, 1000);
        }
    }

    // Show scoreboard on changes
    if (hasChanges) {
        showScoreboard();
        setTimeout(() => {
            if (!scoreboardHovered) {
                hideScoreboard();
            }
        }, 3000);
    }
}

function updateStreak(correct) {
    if (correct) {
        currentStreak++;
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
            console.log('New best streak:', bestStreak);
        }
    } else {
        currentStreak = 0;
    }
    
    // Force update the streak display
    const bestStreakElement = document.querySelector('#bestStreak .score-value');
    if (bestStreakElement) {
        bestStreakElement.textContent = bestStreak.toString();
        console.log('Updated best streak display:', bestStreakElement.textContent);
    } else {
        console.error('Best streak element not found');
    }
    
    updateScoreBoard();
}

function normalizeQuestionData(question) {
    return {
        category: question.category?.title || question.category,
        question: question.question || question.clue,
        answer: question.answer,
        value: question.value || 200, // Ensure there's always a value
        airdate: question.airdate || new Date().toISOString(),
        difficulty: question.difficulty || 'Unknown',
        times_used: question.times_used || 1,
        contestant: question.contestant || 'Unknown',
        season: question.season || 'Unknown',
        episode: question.episode || 'Unknown'
    };
}

function displayQuestion(questionData) {
    if (!questionData) {
        console.error('No question data provided');
        return;
    }

    console.log('🎨 Displaying question:', questionData);
    
    // Store current question without modifications
    window.currentQuestion = questionData;
    
    // Get DOM elements
    const elements = {
        categoryBox: document.getElementById('categoryBox'),
        questionBox: document.getElementById('questionBox'),
        answerBox: document.getElementById('answerBox'),
        valueBox: document.getElementById('valueBox'),
        userInput: document.getElementById('inputBox')
    };

    // Display category and value
    if (elements.categoryBox) elements.categoryBox.textContent = questionData.category;
    if (elements.valueBox) elements.valueBox.textContent = `for ${questionData.value}`;

    // Handle question display
    if (elements.questionBox) {
        const mediaInfo = parseMediaContent(questionData.question);
        elements.questionBox.innerHTML = createQuestionHTML(mediaInfo);
    }

    // Reset answer box
    if (elements.answerBox) {
        elements.answerBox.textContent = questionData.answer;
        elements.answerBox.style.display = 'none';
    }

    // Reset input
    if (elements.userInput) {
        elements.userInput.value = '';
        elements.userInput.focus();
    }

    // Reset state
    answerWasRevealed = false;
    showingMessage = false;
}

// Helper function to create question HTML
function createQuestionHTML(mediaInfo) {
    // Remove any surrounding quotes and clean up the text
    let cleanText = mediaInfo.text.replace(/^["']|["']$/g, '').trim();
    
    let html = cleanText
        .split('\n')
        .map(line => line.trim())
        .join('<br>');

    if (mediaInfo.type && mediaInfo.url) {
        html += '<div class="media-container">';
        switch (mediaInfo.type) {
            case 'image':
                html += `<img src="${mediaInfo.url}" alt="Question Image" class="media-thumbnail" 
                    onclick="openMediaModal('${mediaInfo.url}', 'image')">
                    <span class="media-indicator">🖼️ Click to enlarge</span>`;
                break;
            case 'audio':
                html += `<button onclick="openMediaModal('${mediaInfo.url}', 'audio')" class="media-button">
                    🔊 Play Audio
                </button>`;
                break;
            case 'video':
                html += `<button onclick="openMediaModal('${mediaInfo.url}', 'video')" class="media-button">
                    🎥 Play Video
                </button>`;
                break;
        }
        html += '</div>';
    }

    return html;
}

// Helper function to parse media content from question
function parseMediaContent(question) {
    const result = {
        text: question,
        type: null,
        url: null
    };

    // Check for media links
    const linkMatch = question.match(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/);
    if (!linkMatch) return result;

    const [fullMatch, url, text] = linkMatch;
    result.text = text;
    result.url = url;

    // Determine media type from URL
    if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        result.type = 'image';
    } else if (url.match(/\.(mp3|wav|ogg)$/i)) {
        result.type = 'audio';
    } else if (url.match(/\.(mp4|webm|mov)$/i)) {
        result.type = 'video';
    }

    return result;
}

function openMediaModal(url, type) {
    // Remove any existing modals
    const existingModal = document.querySelector('.media-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'media-modal';
    
    // Create modal content
    const content = document.createElement('div');
    content.className = 'media-modal-content';
    
    // Create close button with better visibility
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '×'; // Using × instead of &times; for better rendering
    closeBtn.setAttribute('aria-label', 'Close modal');
    
    // Create media element based on type
    let mediaElement;
    switch (type) {
        case 'image':
            mediaElement = document.createElement('img');
            mediaElement.src = url;
            mediaElement.alt = 'Question Image';
            break;
        case 'video':
            mediaElement = document.createElement('video');
            mediaElement.src = url;
            mediaElement.controls = true;
            mediaElement.autoplay = false;
            break;
        case 'audio':
            mediaElement = document.createElement('audio');
            mediaElement.src = url;
            mediaElement.controls = true;
            mediaElement.autoplay = false;
            break;
    }
    
    // Assemble modal
    content.appendChild(mediaElement);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Start with opacity 0 for animation
    modal.style.opacity = '0';
    content.style.transform = 'scale(0.7)';
    
    // Force reflow to ensure animation works
    void modal.offsetWidth;
    
    // Animate opening
    modal.style.transition = 'opacity 0.3s ease';
    content.style.transition = 'transform 0.3s ease';
    modal.style.opacity = '1';
    content.style.transform = 'scale(1)';
    
    // Prevent scrolling of background
    document.body.style.overflow = 'hidden';

    // Close modal function - WITH ANIMATION
    const closeModal = () => {
        // Animate closing
        modal.style.opacity = '0';
        content.style.transform = 'scale(0.7)';
        
        // Wait for animation to complete before removing from DOM
        setTimeout(() => {
            if (mediaElement) {
                mediaElement.pause();
                mediaElement.src = '';
            }
            // Remove event listeners to prevent memory leaks
            document.removeEventListener('keydown', closeOnEscape);
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.body.style.overflow = '';
        }, 300); // Match this with the transition duration
    };

    // Close modal on button click
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling to modal
        closeModal();
    });

    // Close modal on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal on escape key
    const closeOnEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };
    document.addEventListener('keydown', closeOnEscape);

    // Prevent modal close when clicking media
    if (mediaElement) {
        mediaElement.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// Update ticker on events
function updateTickerOnEvent(event, data = {}) {
    console.log(`🎯 Updating ticker with event: ${event}`, data);
    
    const tickerMessages = {
        correct: [
            "🎯 BOOM! Nailed it!",
            "🌟 Absolutely correct!",
            "🎉 You're on fire!",
            `🔥 Streak: ${data.streak || 0}!`
        ],
        incorrect: [
            "💔 Oops! Not quite!",
            "😅 Better luck next time!",
            "🎯 Close, but no cigar!",
            "🤔 Keep trying!"
        ]
    };

    const messages = tickerMessages[event] || [];
    if (messages.length === 0) {
        console.warn('⚠️ No messages found for event:', event);
        return;
    }

    const message = messages[Math.floor(Math.random() * messages.length)];
    console.log('📜 Selected message:', message);
    showTicker(message);
}

function showTicker(message) {
    const eventTicker = document.querySelector('.event-ticker');
    if (!eventTicker) {
        console.error('Event ticker element not found!');
        return;
    }

    // Remove any existing ticker units
    const existingUnits = eventTicker.querySelectorAll('.ticker-unit');
    existingUnits.forEach(unit => {
        eventTicker.removeChild(unit);
    });

    // Create new ticker unit
    const tickerUnit = document.createElement('div');
    tickerUnit.className = 'ticker-unit';

    // Create plane
    const plane = document.createElement('div');
    plane.className = 'ticker-plane';

    // Create propeller
    const propeller = document.createElement('div');
    propeller.className = 'propeller';

    // Create propeller hub
    const propellerHub = document.createElement('div');
    propellerHub.className = 'propeller-hub';

    // Create pontoons
    const pontoon1 = document.createElement('div');
    pontoon1.className = 'pontoon';
    
    const pontoon2 = document.createElement('div');
    pontoon2.className = 'pontoon';

    // Add components to plane
    plane.appendChild(propeller);
    plane.appendChild(propellerHub);
    plane.appendChild(pontoon1);
    plane.appendChild(pontoon2);

    // Create content banner
    const content = document.createElement('div');
    content.className = 'ticker-content';
    content.textContent = message;

    // Assemble the ticker
    tickerUnit.appendChild(plane);
    tickerUnit.appendChild(content);

    // Add to the DOM
    eventTicker.appendChild(tickerUnit);

    // Remove after animation completes
    tickerUnit.addEventListener('animationend', () => {
        if (tickerUnit.parentNode === eventTicker) {
            eventTicker.removeChild(tickerUnit);
        }
    });
}

function initializeTicker() {
    console.group('🎮 Initializing Ticker System');
    const ticker = document.querySelector('.event-ticker');
    if (!ticker) {
        console.error('❌ Ticker container not found');
        console.groupEnd();
        return;
    }
    
    // Clean up any existing tickers
    const existingUnits = ticker.querySelectorAll('.ticker-unit');
    if (existingUnits.length > 0) {
        console.warn(`🧹 Cleaning up ${existingUnits.length} existing ticker(s)`);
        existingUnits.forEach(unit => unit.remove());
    }
    
    console.log('✅ Ticker system initialized successfully');
    console.groupEnd();
}

// Host image cycling
let currentHostIndex = 0;
const hostImages = [];

function initializeHostCycling() {
    const hostImage = document.querySelector('.host-image');
    if (hostImage) {
        hostImage.addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clickedRight = x > rect.width / 2;
            cycleHost(clickedRight);
        });
    }
}

function cycleHost(forward = true) {
    if (hostImages.length < 2) return;
    
    currentHostIndex = forward ? 
        (currentHostIndex + 1) % hostImages.length :
        (currentHostIndex - 1 + hostImages.length) % hostImages.length;
    
    const hostImage = document.querySelector('.host-image');
    if (hostImage) {
        hostImage.src = hostImages[currentHostIndex];
    }
}

// Initialize features
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    // Get elements using existing IDs
    const answerButton = document.getElementById('answerButton');
    const questionButton = document.getElementById('questionButton');
    const checkButton = document.getElementById('checkButton');
    const userInput = document.getElementById('inputBox');
    
    // Log which elements were found for debugging
    console.log('Found elements:', {
        answerButton: !!answerButton,
        questionButton: !!questionButton,
        checkButton: !!checkButton,
        userInput: !!userInput
    });
    
    // Attach event listeners only if elements exist
    if (answerButton) answerButton.addEventListener('click', showHideAnswer);
    if (questionButton) questionButton.addEventListener('click', getNewQuestion);
    if (checkButton) checkButton.addEventListener('click', checkAnswer);

    // Enter key behavior
    if (userInput) {
        userInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                
                if (!currentQuestion) {
                    getNewQuestion();
                    return;
                }
                
                if (showingMessage) {
                    getNewQuestion();
                    return;
                }
                
                if (userInput.value.trim()) {
                    checkAnswer();
                }
            }
        });
    }

    // Initialize the game
    initializeScoreboard();
    updateScoreBoard();
    answerBox.style.display = 'none';
    
    initializeTicker();
    initializeHostCycling();
    
    // Start with a random message
    updateTickerOnEvent('correct');
    
    // Update ticker periodically
    setInterval(() => {
        const types = ['correct', 'incorrect', 'random'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        updateTickerOnEvent(randomType);
    }, 10000);
})

// Move layout loading to DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    loadLayout();
});

// SPECIAL FEATURES 

// Make elements draggable & resizeable
function makeDraggableAndResizable(element) {
    // Add event listeners for dragging
    let isDragging = false;
    let startX, startY, startLeft, startTop;
  
    element.addEventListener('mousedown', (e) => {
      if (e.target === element) { // Only drag when clicking the main element
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(window.getComputedStyle(element).left) || 0;
        startTop = parseInt(window.getComputedStyle(element).top) || 0;
        element.style.zIndex = 1000; // Bring the dragged item to the top
      }
    });
  
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        element.style.left = `${startLeft + dx}px`;
        element.style.top = `${startTop + dy}px`;
      }
    });
  
    document.addEventListener('mouseup', () => {
      isDragging = false;
      element.style.zIndex = ''; // Reset z-index
    });
  
    // Add CSS resize support
    element.style.resize = 'both';
    element.style.overflow = 'hidden';
  }
  
  // Initialize on elements with class "draggable-resizable"
  document.querySelectorAll('.draggable-resizable').forEach((el) => {
    makeDraggableAndResizable(el);
  });
  
// save layout
function saveLayout() {
    const elements = document.querySelectorAll('.draggable-resizable');
    const layout = Array.from(elements).map(el => ({
      id: el.id, // Make sure each element has a unique ID
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height,
    }));
    localStorage.setItem('layout', JSON.stringify(layout));
  }
  
  // load layout
  function loadLayout() {
    const layout = JSON.parse(localStorage.getItem('layout'));
    if (layout) {
      layout.forEach(({ id, left, top, width, height }) => {
        const el = document.getElementById(id);
        if (el) {
          el.style.left = left;
          el.style.top = top;
          el.style.width = width;
          el.style.height = height;
        }
      });
    }
  }
  
// need to add a 'save-button' element to trigger above event listener (or change event listener)

function cleanTextContent(text) {
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&[^;]*;/g, '') // Remove HTML entities
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove non-alphanumeric characters
        .trim();
}


// clean up and standardize answers for comparison
// const cleanAnswer = (answer) => {
//     return answer.toLowerCase()
//         .replace(/^(what|who|where|when) (is|are|was|were) /i, '')
//         .replace(/[^a-z0-9]/g, '')
//         .replace(/\\/g, '')
//         .trim();
// };

// Function to compare user's answer with the correct answer
// const compareAnswers = (userAnswer, correctAnswer) => {
//     // Check if the user's answer is contained within the correct answer or vice versa
//     if (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer)) {
//         return true;
//     }
//     const levenshteinDistance = getLevenshteinDistance(userAnswer, correctAnswer);
//     return levenshteinDistance <= Math.min(3, Math.floor(correctAnswer.length / 2));
// };

// function compareAnswers(userAnswer, correctAnswer) {
//     console.group('🎯 Answer Comparison');
//     console.log('User Answer:', userAnswer);
//     console.log('Correct Answer:', correctAnswer);
    
//     const cleanedUser = cleanAnswer(userAnswer);
//     const cleanedCorrect = cleanAnswer(correctAnswer);
//     console.log('Cleaned User Answer:', cleanedUser);
//     console.log('Cleaned Correct Answer:', cleanedCorrect);
    
//     const distance = getLevenshteinDistance(cleanedUser, cleanedCorrect);
//     const threshold = Math.max(cleanedCorrect.length * 0.3, 3); // 30% of answer length or minimum 3
    
//     console.log('Levenshtein Distance:', distance);
//     console.log('Acceptance Threshold:', threshold);
//     console.log('Match Result:', distance <= threshold ? '✅ Accepted' : '❌ Rejected');
//     console.groupEnd();
    
//     return distance <= threshold;
// }


// eventTicker.appendChild(tickerUnit);
//     console.log(`✅ Ticker fully initialized [ID: ${debugId}]`);
//     console.groupEnd();
// }

// Ensure the ticker content is updated with messages
function updateTicker(message) {
    const tickerContent = document.querySelector('.ticker-content');
    if (tickerContent) {
        tickerContent.textContent = message;
        // Add any necessary logic to ensure the message is displayed
        // e.g., animations, visibility toggles, etc.
    }
}

// Example function to simulate updating the ticker
function simulateTickerUpdates() {
    const messages = ["Welcome to Jeopardish!", "New question available!", "Check your score!"];
    let index = 0;
    setInterval(() => {
        updateTicker(messages[index]);
        index = (index + 1) % messages.length;
    }, 5000); // Update every 5 seconds
}

// Call the function to start updating the ticker
simulateTickerUpdates();

// SHOW OR HIDE ANSWER
function showHideAnswer() {
    const answerBox = document.getElementById('answerBox');
    if (!answerBox) {
        console.error('Answer box not found');
        return;
    }

    if (answerBox.style.display === 'none' || !answerBox.style.display) {
        if (peekTokens > 0) {
            answerBox.style.display = 'block';
            answerWasRevealed = true;
            peekTokens--;
            console.log(`Peek tokens remaining: ${peekTokens}`);
        } else {
            console.log('No peek tokens remaining!');
        }
    } else {
        answerBox.style.display = 'none';
        answerWasRevealed = false;
    }
};

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-btn');
    const gameContainer = document.querySelector('.game-container');
    const speechBubble = document.querySelector('.speechBubble');
    const inputWrapper = document.querySelector('.input-wrapper');
    const questionBox = document.getElementById('questionBox');
    const answerBox = document.getElementById('answerBox');

    function setTheme(theme) {
        if (theme === 'dark') {
            gameContainer.style.background = 'linear-gradient(to top, #1a1a1a, #2a2a2a)';
            document.body.style.backgroundColor = '#000';
            speechBubble.style.backgroundColor = '#000080';
            inputWrapper.style.background = '#000080';
            questionBox.style.backgroundColor = '#000080';
            answerBox.style.backgroundColor = '#000080';
            // Update text colors for better contrast
            questionBox.style.color = '#ffffff';
            answerBox.style.color = '#ffffff';
        } else {
            gameContainer.style.background = 'linear-gradient(to top, #64B9FF, #5cff9bbc)';
            document.body.style.backgroundColor = '#ff1fc3c5';
            speechBubble.style.backgroundColor = '#000080';
            inputWrapper.style.background = '#000080';
            questionBox.style.backgroundColor = '#000080';
            answerBox.style.backgroundColor = '#000080';
            // Reset text colors
            questionBox.style.color = '#ffffff';
            answerBox.style.color = '#ffffff';
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = themeBtn.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            themeBtn.setAttribute('data-theme', newTheme);
            setTheme(newTheme);
        });
    }
});