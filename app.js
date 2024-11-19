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

// Initialize variables to store data to display
let currentStreak = 0;
let bestStreak = 0;
let currentScore = 0;
let bestScore = 0;

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

// USE ENTER KEY TO SUBMIT ANSWER

// userInput.addEventListener("keydown", (event) => {
//     if (event.key === "Enter") {
//         if (showingMessage) {
//             // If a message is being shown, move to the next question
//             delete checkButton.dataset.correctAnswer; // Clear any correct answer flag
//             // getNewQuestion(); // Load a new question
//         } else {
//             checkAnswer(); // Check the answer if no message is being shown
//             userInput.value = ''; // Clear the input field after checking the answer
//             userInput.blur(); // Optionally remove focus from the input field
//         }
//     }
// });

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
        // Local questions handling
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


// Reveal or hide answer
// const showHideAnswer = () => {
//     if (answerBox.style.display === "none") {
//         currentStreak = 0;
//         currentScore = 0;
//         updateScoreBoard();
//         answerBox.style.display = "flex";
//         answerWasRevealed = true;  // Set flag when answer is revealed
//         showingMessage = true;
//     } else {
//         answerBox.style.display = "none";
//         showingMessage = false;
//     }
// };

// check answer function
// const checkAnswer = () => {
//     // Prevent checking answer while showing a message
//     // if (showingMessage) return;
    
//     if (answerWasRevealed) {
//         // getNewQuestion();
//         return;
//     }

//     if (!answerBox.innerHTML.trim()) {
//         // Allow moving to the next question without error if the user just got it wrong
//         if (currentStreak === 0) {
//             // getNewQuestion(); // Automatically get a new question if the streak is reset
//             return;
//         }
//         displayErrorMessage('No answer available. Has a question been loaded?');
//         return;
//     }

//     let originalAnswer = answerBox.innerHTML.trim();
//     let correctAnswer = cleanAnswer(originalAnswer);
//     let userAnswerCleaned = cleanAnswer(userInput.value);

//     if (!userAnswerCleaned) {
//         // Allow moving to the next question without error if the user just got it wrong
//         if (currentStreak === 0) {
//             getNewQuestion(); // Automatically get a new question if the streak is reset
//             return;
//         }
//         displayErrorMessage('User input is empty');
//         return;
//     }

//     // Check if the user's answer matches the correct answer
//     if (compareAnswers(userAnswerCleaned, correctAnswer)) {
//         // Correct answer logic
//         currentStreak++;
//         currentScore += parseInt(currentQuestion.value.replace('$', ''), 10);
//         if (currentStreak > bestStreak) {
//             bestStreak = currentStreak;
//         }
//         if (currentScore > bestScore) {
//             bestScore = currentScore;
//         }
//         displayCorrectAnswerMessage();
//     } else {
//         // Incorrect answer logic
//         currentStreak = 0;
//         currentScore = 0;
//         displayIncorrectAnswerMessage(originalAnswer);
//     }

//     updateScoreBoard();
//     userInput.value = '';
//     userInput.blur();
// };

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

    // Rest of answer checking logic...
    const originalAnswer = answerBox.innerHTML.trim();
    const correctAnswer = cleanAnswer(originalAnswer);
    const isCorrect = compareAnswers(userAnswerCleaned, correctAnswer);
    
    if (isCorrect) {
        currentStreak++;
        const questionValue = parseInt(currentQuestion.value.toString().replace(/\D/g, ''), 10) || 200;
        currentScore += questionValue;
        bestStreak = Math.max(bestStreak, currentStreak);
        bestScore = Math.max(bestScore, currentScore);
        displayCorrectAnswerMessage();
    } else {
        currentStreak = 0;
        currentScore = 0;
        displayIncorrectAnswerMessage(originalAnswer);
    }

    updateScoreBoard();
    userInput.value = '';
    userInput.blur();
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
// Update scoreboard
function updateScoreBoard() {
    const currentScoreElement = document.getElementById('currentScore');
    const bestScoreElement = document.getElementById('bestScore');
    const currentStreakElement = document.getElementById('currentStreak');
    const bestStreakElement = document.getElementById('bestStreak');

    if (currentStreakElement) currentStreakElement.textContent = `streak: ${currentStreak}`;
    if (bestStreakElement) bestStreakElement.textContent = `best streak: ${bestStreak}`;
    if (currentScoreElement) currentScoreElement.textContent = `score: $${currentScore}`;
    if (bestScoreElement) bestScoreElement.textContent = `top score: $${bestScore}`;

    console.log(`Scoreboard updated - Current Score: $${currentScore}, Best Score: $${bestScore}, Current Streak: ${currentStreak}, Best Streak: ${bestStreak}`);
}

// Wrap event listeners and initial question load in DOMContentLoaded event
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');
    
    // Attach event listeners
    answerButton.addEventListener('click', showHideAnswer);
    questionButton.addEventListener('click', getNewQuestion);
    checkButton.addEventListener('click', checkAnswer);

    // Fix the Enter key behavior
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
    updateScoreBoard();
    answerBox.style.display = 'none';
});

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

        // Replace links with text AND embedded images
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
        
        questionText = questionText.replace(linkRegex, (match, url, text) => {
            return `${text} <br><img src="${url}" alt="Question Image" class="embedded-image" onerror="this.onerror=null; this.alt='Image failed to load'; this.style.display='none';">`;
        });

        questionBox.innerHTML = questionText;

        // Add click event listeners to embedded images for enlargement
        const embeddedImages = questionBox.querySelectorAll('.embedded-image');
        embeddedImages.forEach(img => {
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
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <img src="${url}" alt="Enlarged Image" class="enlarged-image">
            <button class="close-button">&times;</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-button').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

const inputBox = document.getElementById('inputBox');
const cursor = document.querySelector('.cursor');

inputBox.addEventListener('focus', () => {
    cursor.style.display = 'inline-block'; // Show cursor when focused
    cursor.style.left = `20px`; // Position cursor at the start, considering padding
});

inputBox.addEventListener('blur', () => {
    cursor.style.display = 'none'; // Hide cursor when not focused
});

// Update cursor position based on input length
inputBox.addEventListener('input', () => {
    const inputLength = inputBox.value.length;
    cursor.style.left = `${20 + inputLength * 10}px`; // Adjust based on character width and padding
});

// Ensure cursor is positioned correctly on keydown
inputBox.addEventListener('keydown', () => {
    const inputLength = inputBox.value.length;
    cursor.style.left = `${20 + inputLength * 10}px`; // Adjust based on character width and padding
});


window.visualViewport.onresize = function() {
    document.body.style.height = `${window.visualViewport.height}px`;
};

function toggleSlide() {
    const character = document.getElementById('trebek');
    character.classList.toggle('slide-in-left');
}

