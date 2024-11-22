// Initialize game state variables
let currentScore = 0;
let bestScore = 0;
let currentStreak = 0;
let bestStreak = 0;
let scoreboardInitialized = false; // New variable to track initialization

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
    userInput.value = '';
    
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
        answerBox.style.display = 'none';
        
        // Auto-focus the input box
        userInput.focus();
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
    categoryBox.innerHTML = "Error";
    questionBox.innerHTML = message;
    answerBox.innerHTML = "";
    answerBox.style.display = "block";
}

// Function to display a random error joke
const displayErrorJoke = () => {
    let randomError = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
    categoryBox.innerHTML = randomError.category + '<br/> for ' + randomError.value;
    questionBox.innerHTML = randomError.question;
    answerBox.innerHTML = randomError.answer;
    answerBox.style.display = 'block';
};


// SHOW OR HIDE ANSWER
const showHideAnswer = () => {
    if (answerBox.style.display === "none") {
        answerBox.style.display = "flex";
        answerWasRevealed = true;  // Set flag when answer is revealed
        // showingMessage = true; // Set flag to indicate a message is being shown
    } else {
        answerBox.style.display = "none";
        // showingMessage = false; // Reset flag when answer is hidden
    }
};

const checkAnswer = () => {
    console.log('🎯 checkAnswer called');
    
    // Guard clauses with proper state handling
    if (!currentQuestion) {
        console.log('❌ No active question');
        displayErrorMessage('No question loaded. Click "New Question" to start!');
        return;
    }

    if (answerWasRevealed || showingMessage) {
        console.log('⏭️ Moving to next question');
        getNewQuestion();
        return;
    }

    const userAnswerCleaned = cleanAnswer(userInput.value);
    if (!userAnswerCleaned) {
        console.log('❌ Empty user input');
        displayErrorMessage('Please enter an answer!');
        return;
    }

    // Get the correct answer
    const originalAnswer = answerBox.innerHTML.trim();
    const correctAnswer = cleanAnswer(originalAnswer);
    const isCorrect = compareAnswers(userAnswerCleaned, correctAnswer);
    
    if (isCorrect) {
        // Update streak
        updateStreak(true);
        
        // Get question value
        let questionValue = 200; // Default value
        if (currentQuestion && currentQuestion.value) {
            // Try to parse the value, removing any non-numeric characters
            const parsedValue = parseInt(currentQuestion.value.toString().replace(/[^0-9]/g, ''));
            if (!isNaN(parsedValue)) {
                questionValue = parsedValue;
            }
        }
        console.log('Question value:', questionValue);
        
        // Update scores
        currentScore += questionValue;
        bestScore = Math.max(bestScore, currentScore);
        console.log('Scores updated:', { currentScore, bestScore });
        
        displayCorrectAnswerMessage();
        updateTickerOnEvent('correct', { streak: currentStreak });
    } else {
        updateStreak(false);
        currentScore = 0;
        displayIncorrectAnswerMessage(originalAnswer);
        updateTickerOnEvent('incorrect');
    }

    // Update UI
    updateScoreBoard();
    userInput.value = '';
    showingMessage = true;
};

// correct answer message
const displayCorrectAnswerMessage = () => {
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = `Correctamundo and cowabunga, my friend! Your streak is now ${currentStreak}. Keep it going, sir or lady or other person!!`;
    answerBox.style.display = "flex";
    answerBox.innerHTML = "";
    showingMessage = true; // Set flag to indicate a message is being shown
};

// incorrect answer message
const displayIncorrectAnswerMessage = (correctAnswer) => {
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = `Incorrect, you fool! Your streak is now reset! Try again, sir or lady or other person!!`;
    answerBox.innerHTML = `The correct answer was: ${correctAnswer}`;
    answerBox.style.display = "flex";
    showingMessage = true; // Set flag to indicate a message is being shown
};

// display snarky message
function displaySnarkyMessage() {
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = "Nice try! But you can't just copy the answer and expect to get points. Better luck next time!";
    answerBox.style.display = "flex";
    answerBox.innerHTML = "";
    showingMessage = true;
}

// clean up and standardize answers for comparison
const cleanAnswer = (answer) => {
    return answer.toLowerCase()
        .replace(/^(what|who|where|when) (is|are|was|were) /i, '')
        .replace(/[^a-z0-9]/g, '')
        .replace(/\\/g, '')
        .trim();
};

// Function to compare user's answer with the correct answer
const compareAnswers = (userAnswer, correctAnswer) => {
    // Check if the user's answer is contained within the correct answer or vice versa
    if (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer)) {
        return true;
    }
    const levenshteinDistance = getLevenshteinDistance(userAnswer, correctAnswer);
    return levenshteinDistance <= Math.min(3, Math.floor(correctAnswer.length / 2));
};

// Levenshtein distance algorithm (for determining if the answer given is close enough to count as the correct answer)
const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    let i, j;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
};

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
            currentScoreElement.classList.add('changing');
            setTimeout(() => currentScoreElement.classList.remove('changing'), 500);
        }
    }
    
    // Update best score
    if (bestScoreElement) {
        const oldBestScore = parseInt(bestScoreElement.textContent.replace('$', '')) || 0;
        if (currentScore > oldBestScore) {
            hasChanges = true;
            bestScore = currentScore;
            bestScoreElement.textContent = `$${bestScore}`;
            bestScoreElement.classList.add('changing');
            setTimeout(() => bestScoreElement.classList.remove('changing'), 500);
        }
    }
    
    // Update current streak
    if (currentStreakElement) {
        const oldStreak = currentStreakElement.textContent;
        const newStreak = currentStreak.toString();
        if (oldStreak !== newStreak) {
            hasChanges = true;
            currentStreakElement.textContent = newStreak;
            currentStreakElement.classList.add('changing');
            setTimeout(() => currentStreakElement.classList.remove('changing'), 500);
        }
    }
    
    // Update best streak
    if (bestStreakElement) {
        const oldBestStreak = parseInt(bestStreakElement.textContent) || 0;
        if (currentStreak > oldBestStreak) {
            hasChanges = true;
            bestStreak = currentStreak;
            bestStreakElement.textContent = bestStreak.toString();
            bestStreakElement.classList.add('changing');
            setTimeout(() => bestStreakElement.classList.remove('changing'), 500);
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

function displayQuestion(question) {
    console.log('🎨 Displaying question:', question);
    
    try {
        // Verify DOM elements
        const elements = {categoryBox, questionBox, answerBox, valueBox};
        const missingElements = Object.entries(elements)
            .filter(([name, element]) => !element)
            .map(([name]) => name);
            
        if (missingElements.length > 0) {
            throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
        }

        // Display logic
        categoryBox.innerHTML = question.category;
        valueBox.innerHTML = `for ${question.value}`;
        answerBox.innerHTML = question.answer;
        answerBox.style.display = 'none';

        // Process question text
        let questionText = question.question;
        console.log('📝 Processing question text:', questionText);
        
        // Remove leading and trailing quotes
        questionText = questionText.replace(/^['"]|['"]$/g, '');

        // Handle both direct image URLs and links containing images
        const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/gi;
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
        
        // First, handle direct image tags
        questionText = questionText.replace(imgRegex, (match, src) => {
            return `<img src="${src}" alt="Question Image" class="embedded-image" onerror="this.style.display='none';">`;
        });

        // Then handle links that should be converted to images
        questionText = questionText.replace(linkRegex, (match, url, text) => {
            // Check if URL ends with an image extension
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
            if (isImage) {
                return `${text} <br><img src="${url}" alt="Question Image" class="embedded-image" onerror="this.style.display='none';">`;
            }
            return `<a href="${url}" target="_blank">${text}</a>`;
        });

        questionBox.innerHTML = questionText;

        // Add click event listeners to embedded images
        const embeddedImages = questionBox.querySelectorAll('.embedded-image');
        embeddedImages.forEach(img => {
            img.addEventListener('load', () => {
                img.style.display = 'block'; // Show image once loaded
                console.log('✅ Image loaded successfully:', img.src);
            });
            
            img.addEventListener('click', () => {
                showEnlargedImage(img.src);
            });
        });

        console.log('✅ Question displayed successfully');
    } catch (error) {
        console.error('❌ Error in displayQuestion:', error);
        console.error('Question data:', question);
        throw error;
    }
}

function showEnlargedImage(url) {
    // Remove any existing modals
    const existingModal = document.querySelector('.image-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    const modal = document.createElement('div');
    modal.className = 'image-modal';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Enlarged Image';
    img.className = 'enlarged-image';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '&times;';
    
    content.appendChild(img);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Prevent scrolling of background
    document.body.style.overflow = 'hidden';

    const closeModal = () => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    };

    // Close modal on button click
    closeBtn.addEventListener('click', closeModal);

    // Close modal on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });

    // Prevent modal close when clicking image
    img.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}


function toggleSlide() {
    const character = document.getElementById('trebek');
    character.classList.toggle('slide-in-left');
}

// Update ticker on events
function updateTickerOnEvent(event) {
    const tickerMessages = {
        correct: [
            "✨ ABSOLUTELY BRILLIANT! ✨",
            "🎯 BULLSEYE, CHAMP! 🎯",
            "🌟 TREBEK APPROVES! 🌟",
            "🎪 WHAT A SPECTACLE! 🎪",
            "🎨 PURE ARTISTRY! 🎨"
        ],
        incorrect: [
            "💫 BETTER LUCK NEXT TIME! 💫",
            "🎭 PLOT TWIST: THAT'S NOT IT! 🎭",
            "🌈 CLOSE BUT NO CIGAR! 🌈",
            "🎪 NOT QUITE THE SHOW WE EXPECTED! 🎪",
            "🎨 BACK TO THE DRAWING BOARD! 🎨"
        ],
        random: [
            "🎲 ROLL THE DICE! 🎲",
            "🎪 STEP RIGHT UP! 🎪",
            "🎭 THE SHOW MUST GO ON! 🎭",
            "🌟 TREBEK'S WATCHING! 🌟",
            "✨ MAGIC IN THE AIR! ✨"
        ]
    };

    const messages = tickerMessages[event] || tickerMessages.random;
    const message = messages[Math.floor(Math.random() * messages.length)];
    showTicker(message);
}

function showTicker(message, duration = 8000) {
    const ticker = document.querySelector('.event-ticker');
    const unit = ticker.querySelector('.ticker-unit');
    const gameContainer = document.querySelector('.game-container');
    
    if (!unit || !gameContainer) {
        console.error('Ticker unit or game container not found');
        return;
    }
    
    const content = unit.querySelector('.ticker-content');
    
    // Random vertical position within game container
    const containerHeight = gameContainer.offsetHeight;
    const randomTop = 100 + Math.random() * (containerHeight - 200); // Keep away from edges
    unit.style.top = `${randomTop}px`;
    
    // Reset animation
    unit.style.transform = 'translateX(100%)';
    
    // Set content
    if (content) {
        content.textContent = message;
        content.style.display = 'inline-block';
    }
    
    // Start animation
    requestAnimationFrame(() => {
        unit.style.transition = `transform ${duration}ms linear`;
        unit.style.transform = 'translateX(-100%)';
        
        // Reset after animation
        setTimeout(() => {
            unit.style.transition = 'none';
            unit.style.transform = 'translateX(100%)';
        }, duration);
    });
}

function initializeTicker() {
    const ticker = document.querySelector('.event-ticker');
    if (!ticker) {
        console.error('Ticker element not found');
        return;
    }
    
    // Remove any existing ticker unit
    const existingUnit = ticker.querySelector('.ticker-unit');
    if (existingUnit) {
        existingUnit.remove();
    }
    
    // Create new ticker unit
    const unit = document.createElement('div');
    unit.className = 'ticker-unit';
    
    // Create plane
    const plane = document.createElement('div');
    plane.className = 'ticker-plane';
    
    // Add wing
    const wing = document.createElement('div');
    wing.className = 'wing';
    plane.appendChild(wing);
    
    // Add propeller
    const propeller = document.createElement('div');
    propeller.className = 'propeller';
    plane.appendChild(propeller);
    
    // Create content
    const content = document.createElement('div');
    content.className = 'ticker-content';
    
    // Add everything to the unit
    unit.appendChild(plane);
    unit.appendChild(content);
    ticker.appendChild(unit);
    
    console.log('Ticker initialized successfully');
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
    
    // Attach event listeners
    answerButton.addEventListener('click', showHideAnswer);
    questionButton.addEventListener('click', getNewQuestion);
    checkButton.addEventListener('click', checkAnswer);

    // Enter key behavior
    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            
            if (!currentQuestion) {
                getNewQuestion();
                return;
            }
            
            if (showingMessage || answerWasRevealed) {
                getNewQuestion();
                return;
            }
            
            if (userInput.value.trim()) {
                checkAnswer();
            }
        }
    });

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

document.addEventListener('DOMContentLoaded', () => {
    initializeScoreboard();
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
  
  // Call these functions appropriately
  window.onload = loadLayout;
  document.getElementById('save-button').addEventListener('click', saveLayout);
  
// need to add a 'save-button' element to trigger above event listener (or change event listener)