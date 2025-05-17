// Initialize game state variables
let currentScore = 0;
let bestScore = 0;
let currentStreak = 0;
let bestStreak = 0;
let scoreboardInitialized = false; // New variable to track initialization
let peekTokens = 5; // Initialize peek tokens

// Import Firebase helpers
// Uncomment these lines when Firebase is properly set up
// import { getCurrentUser, saveScore as saveScoreToFirestore } from './firebase-helpers.js';

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
console.log(`🎮 Welcome to Jeopardish!!!`);
console.log(`❓ Click the "new question" button to get a random Jeopardy-style question & test your knowledge.`);
console.log(`🔥 Multiple correct answers in a row will start a streak...`);
console.log(`💔 ...but get one wrong & the streak will reset.`);
console.log("🏆 Let's see how many correct answers you can string together! ");
console.log(`📊 Streak is currently at ` + currentStreak);
console.log("✨ HAVE FUN YA MANIAC!");

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

// Array of silly insult words for peek-and-answer
const sillyInsults = [
    "scallywag",
    "scallawag",
    "ne'er-do-well",
    "rapscallion",
    "miscreant",
    "knave",
    "rascal",
    "trickster",
    "sneak",
    "rogue",
    "charlatan",
    "shenanigator",
    "cheeky monkey",
    "sly fox",
    "scofflaw",
    "mischief-maker",
    "rule-bender",
    "rascalicious one",
    "cunning linguist",
    "sneaky pete",
    "devious genius"
];

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
        console.error('❌ Missing required DOM elements for error message display');
        return;
    }
    
    categoryBox.innerHTML = "Error";
    questionBox.innerHTML = message;
    answerBox.innerHTML = "";
    answerBox.style.display = "block";
    console.error(`🚨 Error displayed: ${message}`);
}

// Function to display a random error joke
function displayErrorJoke() {
    try {
        const questionBox = document.getElementById('questionBox');
        const categoryBox = document.getElementById('categoryBox');
        const valueBox = document.getElementById('valueBox');
        
        if (!questionBox || !categoryBox || !valueBox) {
            console.error('❌ Missing required DOM elements for error joke display');
            return;
        }
        
        // Get a random error joke
        const errorJoke = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
        
        categoryBox.innerHTML = errorJoke.category;
        questionBox.innerHTML = errorJoke.question;
        valueBox.innerHTML = 'for $ERROR';
        console.log('🃏 Displaying error joke:', errorJoke.question);
    } catch (error) {
        console.error('❌ Failed to display error joke:', error);
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
    console.log('answerWasRevealed at check:', answerWasRevealed);
    
    const userInput = document.getElementById('inputBox'); 
    const answerBox = document.getElementById('answerBox');
    const categoryBox = document.getElementById('categoryBox');
    const valueBox = document.getElementById('valueBox');
    const questionBox = document.getElementById('questionBox');
    
    if (!userInput || !answerBox || !window.currentQuestion) {
        console.error('❌ Required elements or question not found');
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
        console.log('❌ No answer provided');
        return;
    }
    
    console.log('🔍 Checking answer:', { userAnswer, correctAnswer });
    
    // Use compareAnswers function to check the answers
    const isCorrect = compareAnswers(cleanedUserAnswer, cleanedCorrectAnswer);
    
    // Update game state
    userInput.value = '';
    
    // Handle revealed answers differently based on correctness
    if (answerWasRevealed) {
        if (isCorrect) {
            // Show a cheeky message for correct after peeking
            const cheekyComment = cheekyComments[Math.floor(Math.random() * cheekyComments.length)];
            const insult = sillyInsults[Math.floor(Math.random() * sillyInsults.length)];
            if (categoryBox) categoryBox.innerHTML = "";
            if (valueBox) valueBox.innerHTML = "";
            if (questionBox) {
                questionBox.innerHTML = `That's correct! But ${cheekyComment.toLowerCase()} Since you looked at the answer, you don't get any points and your streak has been reset.`;
                console.log('Set cheeky message:', questionBox.innerHTML);
            }
            if (answerBox) {
                answerBox.innerHTML = `The correct answer was <span style="color: #ffd700; font-weight: bold;">${window.currentQuestion.answer}</span>, but you knew that, you ${insult}!`;
                answerBox.style.display = "flex";
            }
            showingMessage = true;
            updateStreak(false);
            updateTickerOnEvent('incorrect');
            // Prevent auto-advance to new question
            return;
        } else {
            // Show a custom message for wrong answer after peeking
            if (categoryBox) categoryBox.innerHTML = "";
            if (valueBox) valueBox.innerHTML = "";
            if (questionBox) {
                questionBox.innerHTML = `You already saw the answer and still got it wrong! No points for you.`;
                console.log('Set cheeky message (wrong after peek):', questionBox.innerHTML);
            }
            if (answerBox) {
                answerBox.innerHTML = `The correct answer was: ${correctAnswer}`;
                answerBox.style.display = "flex";
            }
            showingMessage = true;
            updateStreak(false);
            updateTickerOnEvent('incorrect');
            // Prevent auto-advance to new question
            return;
        }
    }
    
    // Handle result for normal answers (not revealed)
    if (isCorrect) {
        // Add points to score
        const questionValue = parseInt(window.currentQuestion.value) || 200;
        currentScore += questionValue;
        
        // Save score to Firebase if user is signed in
        // When Firebase is properly set up, uncomment this:
        // const currentUser = getCurrentUser();
        // if (currentUser) {
        //     saveScoreToFirestore(currentScore);
        // }
        
        displayCorrectAnswerMessage();
        updateStreak(true);
        updateTickerOnEvent('correct', { streak: currentStreak });
    } else {
        updateStreak(false);
        displayIncorrectAnswerMessage(correctAnswer);
        updateTickerOnEvent('incorrect');
    }

    // Only get new question if we're not showing a message
    if (!showingMessage && !answerWasRevealed) {
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
}

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
}

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
        const oldScore = parseInt(currentScoreElement.textContent.replace('$', '')) || 0;
        const newScore = `$${currentScore}`;
        if (oldScore !== currentScore) {
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
        console.log('New Score:', currentScore);
        console.log('Displayed Score:', newScore);
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
        const oldStreak = parseInt(currentStreakElement.textContent) || 0;
        if (oldStreak !== currentStreak) {
            hasChanges = true;
            currentStreakElement.textContent = currentStreak.toString();
            
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
            console.log('🏆 New best streak:', bestStreak);
            
            // Save new best streak to Firestore
            saveStreak(bestStreak);
        }
    } else {
        // If streak is being reset and was significant, save it
        if (currentStreak >= 3) {
            saveStreak(currentStreak);
        }
        currentStreak = 0;
    }
    
    // Force update the streak display
    const bestStreakElement = document.querySelector('#bestStreak .score-value');
    if (bestStreakElement) {
        bestStreakElement.textContent = bestStreak.toString();
        console.log('📊 Updated best streak display:', bestStreakElement.textContent);
    } else {
        console.error('❌ Best streak element not found');
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
            "🎯 BOOM! Nailed it! 🎊 You're a trivia genius! 🧠",
            "🌟 Absolutely correct! 🏆 Trebek would be proud! 👏",
            "🎉 You're on FIRE! 🔥 Burning through these questions! 🚒",
            `🔥 Streak: ${data.streak || 0}! 📈 Keep climbing that leaderboard! 🏅`,
            "✨ CORRECT! ✨ Your brain is magnificent! 🧠💪",
            "🥳 Right answer! 🎯 Are you cheating or just smart? 🤓"
        ],
        incorrect: [
            "💔 Oops! Not quite! 🤦 Better luck on the next one! 🍀",
            "😅 Swing and a miss! 🏏 You'll get it next time! 🎯",
            "🎯 Close, but no cigar! 🚬 Keep those neurons firing! 🧠",
            "🤔 That's not it... 😬 But we still believe in you! 👍",
            "❌ WRONG! ❌ But hey, being wrong is the first step toward being right! 🚶",
            "🙈 Ouch! That answer was way off! 📉 Time to hit the books! 📚"
        ],
        idle: [
            "🎮 Ready for your next brain-busting question? 🧩",
            "🎲 Test your knowledge! 📚 Or just guess wildly! 🎰",
            "🎭 Welcome to Jeopardish! 🎪 Where your brain comes to party! 🎉",
            "💭 Did you know? 🤔 Most contestants forget the question by the time they answer! 😂",
            "⏰ TIME FOR TRIVIA! ⏰ Get those neurons ready! 🧠⚡",
            "🌈 Fun Fact: This game was made by someone who can't spell 'Jeopardy' correctly! 😜"
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
        console.error('❌ Event ticker element not found!');
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
    
    // Set random height position for this ticker
    const gameContainer = document.querySelector('.game-container');
    let containerHeight = 0;
    if (gameContainer) {
        containerHeight = gameContainer.offsetHeight;
    }
    // Pick a random top between 5% and 80% of the container height
    const minPercent = 5;
    const maxPercent = 80;
    const randomPercent = Math.floor(Math.random() * (maxPercent - minPercent) + minPercent);
    tickerUnit.style.top = `calc(${randomPercent}% - 20px)`; // -20px to keep it inside bounds
    console.log(`🛩️ Ticker plane flying at height: ${randomPercent}%`);

    // Create plane
    const plane = document.createElement('div');
    plane.className = 'ticker-plane';

    // Create propeller
    const propeller = document.createElement('div');
    propeller.className = 'propeller';

    // Create wings
    const wing = document.createElement('div');
    wing.className = 'wing';
    
    // Create tail
    const tail = document.createElement('div');
    tail.className = 'tail';
    
    // Create stabilizer
    const stabilizer = document.createElement('div');
    stabilizer.className = 'stabilizer';

    // Create pontoons
    const pontoon1 = document.createElement('div');
    pontoon1.className = 'pontoon';
    
    const pontoon2 = document.createElement('div');
    pontoon2.className = 'pontoon';

    // Add components to plane
    plane.appendChild(propeller);
    plane.appendChild(wing);
    plane.appendChild(tail);
    plane.appendChild(stabilizer);
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
    console.log('🚀 DOM fully loaded and parsed');
    
    // Get elements using existing IDs
    const answerButton = document.getElementById('answerButton');
    const questionButton = document.getElementById('questionButton');
    const checkButton = document.getElementById('checkButton');
    const userInput = document.getElementById('inputBox');
    const loginButton = document.getElementById('login-button');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const authModal = document.getElementById('auth-modal');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const googleSigninButton = document.getElementById('google-signin');
    const emailSigninButton = document.getElementById('email-signin');
    const emailForm = document.getElementById('email-form');
    const toggleSignupLink = document.getElementById('toggle-signup');
    const closeButtons = document.querySelectorAll('.close-modal');
    const modals = document.querySelectorAll('.modal');
    
    // Log which elements were found for debugging
    console.log('🔍 Found elements:', {
        answerButton: !!answerButton,
        questionButton: !!questionButton,
        checkButton: !!checkButton,
        userInput: !!userInput,
        loginButton: !!loginButton,
        leaderboardButton: !!leaderboardButton,
        authModal: !!authModal,
        leaderboardModal: !!leaderboardModal,
        googleSigninButton: !!googleSigninButton,
        emailSigninButton: !!emailSigninButton,
        emailForm: !!emailForm,
        toggleSignupLink: !!toggleSignupLink,
        closeButtons: closeButtons.length,
        modals: modals.length
    });
    
    // Attach event listeners only if elements exist
    if (answerButton) answerButton.addEventListener('click', showHideAnswer);
    if (questionButton) questionButton.addEventListener('click', getNewQuestion);
    if (checkButton) checkButton.addEventListener('click', checkAnswer);

    // Add event listeners for auth and leaderboard buttons
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('👤 Login button clicked');
            if (authModal) {
                console.log('🔓 Opening auth modal');
                authModal.style.display = 'flex';
                setTimeout(() => {
                    authModal.classList.add('active');
                    const modalContent = authModal.querySelector('.modal-content');
                    if (modalContent) modalContent.style.transform = 'scale(1)';
                }, 10);
            } else {
                console.error('❌ Auth modal element not found');
            }
        });
    } else {
        console.error('❌ Login button element not found');
    }

    if (leaderboardButton) {
        leaderboardButton.addEventListener('click', () => {
            console.log('🏆 Leaderboard button clicked');
            if (leaderboardModal) {
                console.log('📋 Opening leaderboard modal');
                leaderboardModal.style.display = 'flex';
                setTimeout(() => {
                    leaderboardModal.classList.add('active');
                    const modalContent = leaderboardModal.querySelector('.modal-content');
                    if (modalContent) modalContent.style.transform = 'scale(1)';
                }, 10);
            } else {
                console.error('❌ Leaderboard modal element not found');
            }
        });
    } else {
        console.error('❌ Leaderboard button element not found');
    }

    // Add event handlers for sign-in methods
    if (googleSigninButton) {
        googleSigninButton.addEventListener('click', () => {
            console.log('🔑 Google sign-in button clicked');
            signInWithGoogle();
        });
    } else {
        console.error('❌ Google sign-in button not found');
    }

    if (emailSigninButton) {
        emailSigninButton.addEventListener('click', () => {
            console.log('📧 Email sign-in button clicked');
            if (emailForm) {
                emailForm.style.display = 'block';
                console.log('📝 Showing email form');
            } else {
                console.error('❌ Email form not found');
            }
        });
    } else {
        console.error('❌ Email sign-in button not found');
    }

    // Toggle signup/signin form
    if (toggleSignupLink) {
        toggleSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Toggle between sign-in and sign-up form');
            const isSignUp = toggleSignupLink.textContent === 'Sign Up';
            toggleSignupLink.textContent = isSignUp ? 'Sign In' : 'Sign Up';
            const emailSubmit = document.getElementById('email-submit');
            if (emailSubmit) {
                emailSubmit.textContent = isSignUp ? 'Sign Up' : 'Sign In';
            }
        });
    } else {
        console.error('❌ Toggle signup link not found');
    }

    // Add event listeners for modal close buttons
    if (closeButtons.length > 0) {
        console.log('🔒 Found', closeButtons.length, 'close modal buttons');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('✖️ Close modal button clicked');
                const modal = button.closest('.modal');
                if (modal) {
                    console.log('🚪 Closing modal');
                    const modalContent = modal.querySelector('.modal-content');
                    if (modalContent) modalContent.style.transform = 'scale(0.95)';
                    modal.classList.remove('active');
                    
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            });
        });
    } else {
        console.error('❌ No close modal buttons found');
    }

    // Close modals when clicking outside
    if (modals.length > 0) {
        console.log('🖼️ Setting up click-outside-to-close for', modals.length, 'modals');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('🚪 Click outside modal detected, closing');
                    const modalContent = modal.querySelector('.modal-content');
                    if (modalContent) modalContent.style.transform = 'scale(0.95)';
                    modal.classList.remove('active');
                    
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            });
        });
    }

    // Handle email form submission
    const emailFormElement = document.getElementById('email-form');
    if (emailFormElement) {
        emailFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email-input')?.value;
            const password = document.getElementById('password-input')?.value;
            console.log(`📨 Email form submitted with email: ${email ? email.substring(0, 3) + '...' : 'not found'}`);
            
            if (!email || !password) {
                console.error('❌ Email or password missing');
                return;
            }
            
            const isSignUp = document.getElementById('toggle-signup')?.textContent === 'Sign In';
            
            if (isSignUp) {
                // Sign up
                signUpWithEmail(email, password);
            } else {
                // Sign in
                signInWithEmail(email, password);
            }
        });
    } else {
        console.warn('⚠️ Email form element not found for submit handler');
    }

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

    // Add null check before accessing style property
    const answerBoxElement = document.getElementById('answerBox');
    if (answerBoxElement) {
        answerBoxElement.style.display = 'none';
    }

    initializeTicker();
    initializeHostCycling();
    
    // Initialize mobile-specific interactions
    initializeMobileInteractions();
    
    // Start with a welcome message
    updateTickerOnEvent('idle');
    
    // Update ticker periodically with valid event types
    setInterval(() => {
        const types = ['correct', 'incorrect', 'idle'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        updateTickerOnEvent(randomType);
    }, 15000); // Less frequent updates (every 15 seconds)
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
    showTicker(message);
}

// Remove duplicate ticker update function
// function simulateTickerUpdates() {
//     const messages = ["Welcome to Jeopardish!", "New question available!", "Check your score!"];
//     let index = 0;
//     setInterval(() => {
//         updateTicker(messages[index]);
//         index = (index + 1) % messages.length;
//     }, 5000); // Update every 5 seconds
// }

// Remove function call to prevent duplicate updates
// simulateTickerUpdates();

// SHOW OR HIDE ANSWER
function showHideAnswer() {
    const answerBox = document.getElementById('answerBox');
    if (!answerBox) {
        console.error('❌ Answer box not found');
        return;
    }

    if (answerBox.style.display === 'none' || !answerBox.style.display) {
        if (peekTokens > 0) {
            answerBox.style.display = 'block';
            answerWasRevealed = true;
            peekTokens--;
            console.log(`👁️ Peek tokens remaining: ${peekTokens}`);
        } else {
            console.log('⚠️ No peek tokens remaining!');
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

// Firebase authentication functions

// Sign in with Google
function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Add scopes for additional permissions if needed
        provider.addScope('profile');
        provider.addScope('email');
        
        // Set custom parameters for the auth provider
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        // Check if we're on mobile and use a different approach
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // For mobile, try redirect method which works better on mobile browsers
            auth.signInWithRedirect(provider)
                .catch(handleAuthError);
        } else {
            // For desktop, use popup method
            auth.signInWithPopup(provider)
                .then((result) => {
                    updateUserProfile(result.user);
                    closeAuthModal();
                })
                .catch(handleAuthError);
        }
    } catch (error) {
        handleAuthError(error);
    }
}

// Handle authentication errors with fallback
function handleAuthError(error) {
    console.error('❌ Auth error:', error.code, error.message);
    
    // Handle various auth errors
    if (error.code === 'auth/unauthorized-domain' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/network-request-failed') {
        
        console.log('🔧 Using test mode due to auth error:', error.code);
        
        // Create a mock user for testing
        const mockUser = createMockUser();
        
        // Show a notification to the user
        const errorMessage = error.code === 'auth/unauthorized-domain' ?
            'This domain is not authorized for Firebase authentication. Using test mode instead.' :
            'Authentication failed. Using test mode instead.';
            
        alert(errorMessage);
        
        // Update UI with mock user
        updateUserProfile(mockUser);
        closeAuthModal();
    } else {
        // For other errors, show a message to the user
        alert(`Authentication error: ${error.message}`);
    }
}

// Sign up with email/password
function signUpWithEmail(email, password) {
auth.createUserWithEmailAndPassword(email, password)
.then((userCredential) => {
console.log(' Email sign-up successful');
const user = userCredential.user;
updateUserProfile(user);
closeAuthModal();
})
.catch((error) => {
console.error(' Email sign-up error:', error.message);
alert(`Sign-up error: ${error.message}`);
});
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('✅ Email sign-up successful');
            const user = userCredential.user;
            updateUserProfile(user);
            closeAuthModal();
        })
        .catch((error) => {
            console.error('❌ Email sign-up error:', error.message);
            alert(`Sign-up error: ${error.message}`);
        });
}

// Sign in with email/password
function signInWithEmail(email, password) {
    console.log('🔑 Attempting email sign-in');
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('✅ Email sign-in successful');
            const user = userCredential.user;
            updateUserProfile(user);
            closeAuthModal();
        })
        .catch((error) => {
            console.error('❌ Email sign-in error:', error.message);
            alert(`Sign-in error: ${error.message}`);
        });
}

// Update user profile in UI
function updateUserProfile(user) {
    console.log('👤 Updating user profile in UI');
    
    const userProfile = document.getElementById('user-profile');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const loginButton = document.getElementById('login-button');
    
    if (userProfile && userName && userAvatar) {
        // Show user profile
        userProfile.style.display = 'flex';
        
        // Fetch user's custom profile data from Firestore
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                let displayName = user.displayName || user.email.split('@')[0];
                let photoURL = user.photoURL;
                
                // If we have custom data in Firestore, use that
                if (doc.exists) {
                    const userData = doc.data();
                    if (userData.customDisplayName) {
                        displayName = userData.customDisplayName;
                    }
                    if (userData.customPhotoURL) {
                        photoURL = userData.customPhotoURL;
                    }
                }
                
                // Update user name
                userName.textContent = displayName;
                
                // Update avatar
                if (photoURL) {
                    userAvatar.src = photoURL;
                } else {
                    // Use initial as avatar if no photo
                    userAvatar.src = `https://ui-avatars.com/api/?name=${displayName}&background=4b21f4&color=fff`;
                }
            })
            .catch((error) => {
                console.error('Error getting user profile:', error);
                
                // Fallback to basic user info
                userName.textContent = user.displayName || user.email.split('@')[0];
                
                if (user.photoURL) {
                    userAvatar.src = user.photoURL;
                } else {
                    userAvatar.src = `https://ui-avatars.com/api/?name=${user.displayName || user.email.split('@')[0]}&background=4b21f4&color=fff`;
                }
            });
        
        // Hide login button when signed in
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-user"></i> Profile';
            loginButton.onclick = showUserProfile;
        }
        
        // Save user data to Firestore if new user
        saveUserToFirestore(user);
    } else {
        console.error('❌ User profile elements not found');
    }
}

// Save user to Firestore
function saveUserToFirestore(user) {
    console.log('💾 Saving user data to Firestore');
    
    db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email.split('@')[0]}&background=4b21f4&color=fff`,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
        .then(() => {
            console.log('✅ User data saved successfully');
        })
        .catch((error) => {
            console.error('❌ Error saving user data:', error);
        });
}

// Show user profile modal
function showUserProfile() {
    console.log('👤 Showing user profile');
    
    const userProfile = document.getElementById('user-profile');
    if (userProfile) {
        if (userProfile.style.display === 'none') {
            userProfile.style.display = 'flex';
        } else {
            userProfile.style.display = 'none';
        }
    }
}

// Sign out user
function signOut() {
    console.log('🚪 Signing out user');
    
    auth.signOut()
        .then(() => {
            console.log('✅ Sign-out successful');
            resetUIAfterSignOut();
        })
        .catch((error) => {
            console.error('❌ Sign-out error:', error);
        });
}

// Reset UI after sign-out
function resetUIAfterSignOut() {
    console.log('🔄 Resetting UI after sign-out');
    
    const userProfile = document.getElementById('user-profile');
    const loginButton = document.getElementById('login-button');
    
    if (userProfile) {
        userProfile.style.display = 'none';
    }
    
    if (loginButton) {
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> sign in';
        loginButton.onclick = function() {
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.style.display = 'block';
            }
        };
    }
}

// Close auth modal
function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    
    if (authModal) {
        // Start the fade-out animation
        authModal.classList.remove('active');
        
        // Actually hide the modal after animation completes
        setTimeout(() => {
            authModal.style.display = 'none';
        }, 300);
    }
    
    // Reset email form if visible
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
        emailForm.style.display = 'none';
        emailForm.reset();
    }
}

// Check if user is already signed in
function checkAuthState() {
    try {
        console.log('🔍 Checking auth state');
        
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 User is signed in');
                updateUserProfile(user);
            } else {
                console.log('👤 User is signed out');
                resetUIAfterSignOut();
            }
        });
    } catch (error) {
        console.error('❌ Error checking auth state:', error);
        // If Firebase auth fails, create a mock user for testing
        console.log('🔧 Creating mock user for testing');
        createMockUser();
    }
}

// Initialize leaderboard
function initializeLeaderboard() {
    console.log('🏆 Initializing leaderboard');
    
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length && tabContents.length) {
        // Add tab switching functionality
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show selected tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                    }
                });
                
                // Load data for selected tab
                if (tabId === 'top-scores') {
                    loadTopScores();
                } else if (tabId === 'top-streaks') {
                    loadTopStreaks();
                }
            });
        });
        
        // Load initial data
        loadTopScores();
    } else {
        console.error('❌ Leaderboard tabs not found');
    }
}

// Load top scores
function loadTopScores() {
    console.log('📊 Loading top scores');
    
    const scoresBody = document.getElementById('scores-body');
    if (!scoresBody) {
        console.error('❌ Scores table body not found');
        return;
    }
    
    // Clear existing data
    scoresBody.innerHTML = '';
    
    // Check if user is signed in
    const user = auth.currentUser;
    if (!user) {
        console.log('⚠️ User not signed in, showing placeholder data');
        displayPlaceholderData(scoresBody, 'score');
        return;
    }
    
    // Load data from Firestore
    db.collection('scores')
        .orderBy('score', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.log('📊 No scores found');
                displayPlaceholderData(scoresBody, 'score');
                return;
            }
            
            let rank = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const row = document.createElement('tr');
                
                // Highlight current user's score
                if (data.userId === user.uid) {
                    row.classList.add('current-user');
                }
                
                row.innerHTML = `
                    <td>${rank}</td>
                    <td>${data.displayName || 'Anonymous'}</td>
                    <td>$${data.score}</td>
                    <td>${formatDate(data.timestamp)}</td>
                `;
                
                scoresBody.appendChild(row);
                rank++;
            });
        })
        .catch((error) => {
            console.error('❌ Error getting scores:', error);
            displayPlaceholderData(scoresBody, 'score');
        });
}

// Load top streaks
function loadTopStreaks() {
    console.log('📊 Loading top streaks');
    
    const streaksBody = document.getElementById('streaks-body');
    if (!streaksBody) {
        console.error('❌ Streaks table body not found');
        return;
    }
    
    // Clear existing data
    streaksBody.innerHTML = '';
    
    // Check if user is signed in
    const user = auth.currentUser;
    if (!user) {
        console.log('⚠️ User not signed in, showing placeholder data');
        displayPlaceholderData(streaksBody, 'streak');
        return;
    }
    
    // Load data from Firestore
    db.collection('streaks')
        .orderBy('streak', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.log('📊 No streaks found');
                displayPlaceholderData(streaksBody, 'streak');
                return;
            }
            
            let rank = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const row = document.createElement('tr');
                
                // Highlight current user's streak
                if (data.userId === user.uid) {
                    row.classList.add('current-user');
                }
                
                row.innerHTML = `
                    <td>${rank}</td>
                    <td>${data.displayName || 'Anonymous'}</td>
                    <td>${data.streak}</td>
                    <td>${formatDate(data.timestamp)}</td>
                `;
                
                streaksBody.appendChild(row);
                rank++;
            });
        })
        .catch((error) => {
            console.error('❌ Error getting streaks:', error);
            displayPlaceholderData(streaksBody, 'streak');
        });
}

// Display placeholder data in leaderboard
function displayPlaceholderData(tableBody, type) {
    console.log(`📊 Displaying placeholder ${type} data`);
    
    const placeholders = [
        { name: 'AlexTrebek', value: type === 'score' ? 10000 : 20 },
        { name: 'KenJennings', value: type === 'score' ? 8500 : 18 },
        { name: 'JamesBond', value: type === 'score' ? 7000 : 15 },
        { name: 'QuizWizard', value: type === 'score' ? 6500 : 13 },
        { name: 'BrainiacGamer', value: type === 'score' ? 5000 : 10 }
    ];
    
    let rank = 1;
    placeholders.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rank}</td>
            <td>${item.name}</td>
            <td>${type === 'score' ? '$' + item.value : item.value}</td>
            <td>Sign in to compete!</td>
        `;
        
        tableBody.appendChild(row);
        rank++;
    });
}

// Format date for display
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
}

// Save score to Firestore
function saveScore(score) {
    console.log(`💾 Saving score: ${score}`);
    
    // Check if user is signed in
    const user = auth.currentUser;
    if (!user) {
        console.log('⚠️ Cannot save score: User not signed in');
        return;
    }
    
    // Save to Firestore
    db.collection('scores').add({
        userId: user.uid,
        displayName: user.displayName || user.email.split('@')[0],
        score: score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('✅ Score saved successfully');
    })
    .catch((error) => {
        console.error('❌ Error saving score:', error);
    });
}

// Save streak to Firestore
function saveStreak(streak) {
    console.log(`💾 Saving streak: ${streak}`);
    
    // Check if user is signed in
    const user = auth.currentUser;
    if (!user) {
        console.log('⚠️ Cannot save streak: User not signed in');
        return;
    }
    
    // Save to Firestore
    db.collection('streaks').add({
        userId: user.uid,
        displayName: user.displayName || user.email.split('@')[0],
        streak: streak,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('✅ Streak saved successfully');
    })
    .catch((error) => {
        console.error('❌ Error saving streak:', error);
    });
}

// Add event listener for logout button
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase auth state
    checkAuthState();
    
    // Setup logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', signOut);
    } else {
        console.error('❌ Logout button not found');
    }
    
    // Initialize leaderboard
    initializeLeaderboard();
});

// Firebase Auth initialization (after firebase-config.js is loaded)
let auth;
try {
    // Use the existing auth instance
    auth = firebase.auth();
    
    // Enable offline persistence for Firestore if possible (db is already initialized in firebase-config.js)
    if (db && typeof db.enablePersistence === 'function') {
        db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                console.warn('⚠️ Firestore persistence error:', err.code);
            });
    }
} catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    createFallbackFirebase();
}

// Create a mock user for testing
function createMockUser() {
    const mockUser = {
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://ui-avatars.com/api/?name=Test+User&background=random',
        uid: 'test-user-' + Math.floor(Math.random() * 1000000)
    };
    
    // Update the auth.currentUser
    if (auth) auth.currentUser = mockUser;
    
    // Call the auth state changed callback if it exists
    if (auth && auth._authCallback) auth._authCallback(mockUser);
    
    return mockUser;
}

// Create fallback Firebase objects for local testing
function createFallbackFirebase() {
    console.log('🔧 Creating fallback Firebase objects for local testing');
    
    // Create a mock auth object
    auth = {
        currentUser: null,
        onAuthStateChanged: (callback) => {
            // Store the callback to call it later with mock user
            auth._authCallback = callback;
            return () => {}; // Return unsubscribe function
        },
        signInWithPopup: () => {
            return Promise.resolve({
                user: createMockUser()
            });
        },
        signInWithRedirect: () => {
            return Promise.resolve();
        },
        signOut: () => {
            auth.currentUser = null;
            if (auth._authCallback) auth._authCallback(null);
            return Promise.resolve();
        }
    };
    
    // Create a mock firestore object - use window.db to avoid redeclaring the variable
    window.db = {
        collection: (name) => ({
            doc: (id) => ({
                get: () => Promise.resolve({
                    exists: false,
                    data: () => null
                }),
                set: (data) => {
                    console.log(`💾 Mock saving to ${name}/${id}:`, data);
                    return Promise.resolve();
                },
                update: (data) => {
                    console.log(`💾 Mock updating ${name}/${id}:`, data);
                    return Promise.resolve();
                }
            }),
            where: () => ({
                orderBy: () => ({
                    limit: () => ({
                        get: () => Promise.resolve({
                            docs: [],
                            empty: true
                        })
                    })
                })
            }),
            add: (data) => {
                console.log(`💾 Mock adding to ${name}:`, data);
                return Promise.resolve({ id: 'mock-id-' + Math.random().toString(36).substr(2, 9) });
            }
        }),
        enablePersistence: () => Promise.resolve()
    };
}

// Profile Modal functionality
let currentAvatarUrl = '';

// Show the profile modal and populate with user data
function showProfileModal() {
    console.log('👤 Opening profile modal');
    
    const profileModal = document.getElementById('profile-modal');
    const displayNameInput = document.getElementById('display-name');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    
    if (!profileModal) {
        console.error('❌ Profile modal element not found');
        return;
    }
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
        console.error('❌ No user signed in');
        return;
    }
    
    // Fetch user's custom profile data from Firestore
    db.collection('users').doc(user.uid).get()
        .then((doc) => {
            let displayName = user.displayName || user.email.split('@')[0];
            let photoURL = user.photoURL;
            
            // If we have custom data in Firestore, use that
            if (doc.exists) {
                const userData = doc.data();
                if (userData.customDisplayName) {
                    displayName = userData.customDisplayName;
                }
                if (userData.customPhotoURL) {
                    photoURL = userData.customPhotoURL;
                }
            }
            
            // Populate form with user data
            if (displayNameInput) {
                displayNameInput.value = displayName;
            }
            
            // Set avatar preview
            if (profileAvatarPreview) {
                if (photoURL) {
                    profileAvatarPreview.src = photoURL;
                    currentAvatarUrl = photoURL;
                } else {
                    // Use initial as avatar if no photo
                    const avatarUrl = `https://ui-avatars.com/api/?name=${displayName}&background=4b21f4&color=fff`;
                    profileAvatarPreview.src = avatarUrl;
                    currentAvatarUrl = avatarUrl;
                }
            }
            
            // Display the modal
            profileModal.style.display = 'flex';
            setTimeout(() => {
                profileModal.classList.add('active');
                const modalContent = profileModal.querySelector('.modal-content');
                if (modalContent) modalContent.style.transform = 'scale(1)';
            }, 10);
        })
        .catch((error) => {
            console.error('❌ Error getting user profile:', error);
            alert('Error loading profile data. Please try again.');
        });
}

// Generate random avatar
function generateRandomAvatar() {
    console.log('🎭 Generating random avatar');
    
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    if (!profileAvatarPreview) {
        console.error('❌ Avatar preview element not found');
        return;
    }
    
    // Generate random values for avatar
    const backgrounds = ['4b21f4', 'ff1fc3', 'ffd700', '00bcd4', '4caf50', 'f44336'];
    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    const randomSeed = Math.floor(Math.random() * 1000);
    
    // Create URL for random avatar
    const avatarUrl = `https://ui-avatars.com/api/?background=${randomBackground}&color=fff&size=128&seed=${randomSeed}`;
    
    // Update preview
    profileAvatarPreview.src = avatarUrl;
    currentAvatarUrl = avatarUrl;
}

// Save profile changes to Firestore
function saveProfileChanges(event) {
    event.preventDefault();
    console.log('💾 Saving profile changes');
    
    const displayNameInput = document.getElementById('display-name');
    const profileErrorElement = document.getElementById('profile-error');
    
    if (!displayNameInput) {
        console.error('❌ Display name input not found');
        return;
    }
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
        console.error('❌ No user signed in');
        if (profileErrorElement) {
            profileErrorElement.textContent = 'You must be signed in to update your profile.';
        }
        return;
    }
    
    const newDisplayName = displayNameInput.value.trim();
    
    // Validate display name
    if (!newDisplayName) {
        if (profileErrorElement) {
            profileErrorElement.textContent = 'Display name cannot be empty.';
        }
        return;
    }
    
    // Save custom profile data to Firestore
    db.collection('users').doc(user.uid).update({
        customDisplayName: newDisplayName,
        customPhotoURL: currentAvatarUrl
    })
    .then(() => {
        console.log('✅ Profile updated successfully');
        
        // Update local UI
        const userNameElement = document.getElementById('user-name');
        const userAvatarElement = document.getElementById('user-avatar');
        
        if (userNameElement) {
            userNameElement.textContent = newDisplayName;
        }
        
        if (userAvatarElement) {
            userAvatarElement.src = currentAvatarUrl;
        }
        
        // Close the modal
        closeProfileModal();
        
        // Show success message
        alert('Profile updated successfully!');
    })
    .catch((error) => {
        console.error('❌ Error updating profile:', error);
        if (profileErrorElement) {
            profileErrorElement.textContent = `Error: ${error.message}`;
        }
    });
}

// Close profile modal
function closeProfileModal() {
    console.log('🚪 Closing profile modal');
    
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        // Apply closing animation
        const modalContent = profileModal.querySelector('.modal-content');
        if (modalContent) modalContent.style.transform = 'scale(0.95)';
        profileModal.classList.remove('active');
        
        // Actually hide the modal after animation completes
        setTimeout(() => {
            profileModal.style.display = 'none';
        }, 300);
    }
}

// Magic Link Sign In
function signInWithMagicLink(email) {
    const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true
    };

    auth.sendSignInLinkToEmail(email, actionCodeSettings)
        .then(() => {
            // Save the email for later use
            window.localStorage.setItem('emailForSignIn', email);
            // Show success message
            const authError = document.getElementById('auth-error');
            if (authError) {
                authError.textContent = 'Magic link sent! Check your email.';
                authError.style.color = '#4CAF50';
            }
        })
        .catch((error) => {
            console.error('Magic link error:', error);
            const authError = document.getElementById('auth-error');
            if (authError) {
                authError.textContent = error.message;
                authError.style.color = '#ff4444';
            }
        });
}

// Handle magic link sign-in
function handleMagicLinkSignIn() {
    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }
        
        auth.signInWithEmailLink(email, window.location.href)
            .then((result) => {
                window.localStorage.removeItem('emailForSignIn');
                updateUserProfile(result.user);
                closeAuthModal();
            })
            .catch((error) => {
                console.error('Magic link sign-in error:', error);
                const authError = document.getElementById('auth-error');
                if (authError) {
                    authError.textContent = error.message;
                    authError.style.color = '#ff4444';
                }
            });
    }
}

// Mobile interaction functions
function initializeMobileInteractions() {
    // Handle user profile peek/show on mobile
    const userProfile = document.querySelector('.user-profile');
    
    // First, let's create and add the handle element if it doesn't exist
    if (userProfile && !document.querySelector('.user-profile-handle')) {
        const handle = document.createElement('div');
        handle.className = 'user-profile-handle';
        handle.innerHTML = '👤';
        userProfile.parentNode.insertBefore(handle, userProfile);
        
        // Add click handler for the profile handle
        handle.addEventListener('click', function() {
            userProfile.classList.toggle('show');
        });
        
        handle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            userProfile.classList.toggle('show');
        });
    }
    
    // Add touch handler for the profile itself (to hide it when touched again)
    if (userProfile) {
        userProfile.addEventListener('touchstart', function(e) {
            // Only toggle if we're touching the profile itself, not its children
            if (e.target === userProfile) {
                userProfile.classList.toggle('show');
            }
        });
    }
    
    // Handle auth buttons peek/show on mobile
    const authButtonsDiv = document.querySelector('.auth-buttons-div');
    const peekHandle = document.querySelector('.peek-handle');
    
    if (peekHandle && authButtonsDiv) {
        peekHandle.addEventListener('touchstart', function() {
            authButtonsDiv.classList.toggle('active');
        });
    }
    
    // Make Google auth work better on mobile
    const googleSignInButton = document.getElementById('google-signin');
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', function(e) {
            // Check if we're on a mobile device
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                e.preventDefault();
                // Create a container for the Google sign-in iframe
                const googleAuthContainer = document.createElement('div');
                googleAuthContainer.id = 'google-auth-container';
                googleAuthContainer.style.position = 'fixed';
                googleAuthContainer.style.top = '50%';
                googleAuthContainer.style.left = '50%';
                googleAuthContainer.style.transform = 'translate(-50%, -50%)';
                googleAuthContainer.style.zIndex = '10000';
                googleAuthContainer.style.width = '90%';
                googleAuthContainer.style.maxWidth = '400px';
                googleAuthContainer.style.height = '500px';
                googleAuthContainer.style.background = 'white';
                googleAuthContainer.style.borderRadius = '15px';
                googleAuthContainer.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
                
                // Add a close button
                const closeButton = document.createElement('button');
                closeButton.textContent = '×';
                closeButton.style.position = 'absolute';
                closeButton.style.top = '-20px';
                closeButton.style.right = '-20px';
                closeButton.style.width = '40px';
                closeButton.style.height = '40px';
                closeButton.style.borderRadius = '50%';
                closeButton.style.background = '#ff1fc3';
                closeButton.style.color = 'white';
                closeButton.style.border = 'none';
                closeButton.style.fontSize = '24px';
                closeButton.style.cursor = 'pointer';
                closeButton.style.zIndex = '10001';
                closeButton.style.display = 'flex';
                closeButton.style.alignItems = 'center';
                closeButton.style.justifyContent = 'center';
                
                closeButton.addEventListener('click', function() {
                    document.body.removeChild(googleAuthContainer);
                });
                
                googleAuthContainer.appendChild(closeButton);
                document.body.appendChild(googleAuthContainer);
                
                // Sign in with Google in the container
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider)
                    .then((result) => {
                        updateUserProfile(result.user);
                        closeAuthModal();
                        document.body.removeChild(googleAuthContainer);
                    })
                    .catch((error) => {
                        console.error('Google sign-in error:', error);
                        document.body.removeChild(googleAuthContainer);
                    });
            } else {
                // Desktop behavior - use normal popup
                signInWithGoogle();
            }
        });
    }
}

// Initialize auth event listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... existing DOMContentLoaded code ...

    // Magic link button click handler
    const magicLinkButton = document.getElementById('magic-link-signin');
    if (magicLinkButton) {
        magicLinkButton.addEventListener('click', () => {
            const emailForm = document.getElementById('email-form');
            const magicLinkForm = document.getElementById('magic-link-form');
            if (emailForm && magicLinkForm) {
                emailForm.style.display = 'none';
                magicLinkForm.style.display = 'flex';
            }
        });
    }
    
    // Profile button click handler
    const profileButton = document.getElementById('profile-button');
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            console.log('👤 Profile button clicked');
            showProfileModal();
        });
    } else {
        console.warn('⚠️ Profile button not found');
    }
    
    // Profile form submission handler
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfileChanges);
    } else {
        console.warn('⚠️ Profile form not found');
    }
    
    // Generate random avatar button handler
    const generateAvatarButton = document.getElementById('generate-avatar');
    if (generateAvatarButton) {
        generateAvatarButton.addEventListener('click', generateRandomAvatar);
    } else {
        console.warn('⚠️ Generate avatar button not found');
    }
    
    // Profile modal close button handler
    const profileModalCloseButton = document.querySelector('#profile-modal .close-modal');
    if (profileModalCloseButton) {
        profileModalCloseButton.addEventListener('click', closeProfileModal);
    } else {
        console.warn('⚠️ Profile modal close button not found');
    }
    
    // Close profile modal when clicking outside
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                closeProfileModal();
            }
        });
    } else {
        console.warn('⚠️ Profile modal not found');
    }

    // Magic link form submission
    const magicLinkForm = document.getElementById('magic-link-form');
    if (magicLinkForm) {
        magicLinkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('magic-link-email').value;
            if (email) {
                signInWithMagicLink(email);
            }
        });
    }

    // Check for magic link sign-in on page load
    handleMagicLinkSignIn();
});