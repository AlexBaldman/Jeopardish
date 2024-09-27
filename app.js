// API URL to fetch data
const apiUrl = 'https://cluebase.lukelav.in/clues/random';

// Load questions from local JSON files
let questions = [];
let currentQuestionIndex = 0;
const CHUNK_SIZE = 500; // Number of questions to load at a time
let allQuestions = []; // New array to store all loaded questions

const questionFiles = [
    'questions/questions.json', 
    'questions/questions.csv'
    // 'http://localhost:8080/questions/questions.json', // Update to your local server URL
    // 'http://localhost:8080/questions/questions.csv'    // Update to your local server URL
];

async function fetchFromAPI() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error:", error.message);
        console.log("🎭 Looks like our API is taking an unscheduled intermission. Don't worry, we've got some local talent waiting in the wings!");
        return null;
    }
}

async function loadLocalQuestions() {
    if (allQuestions.length === 0) {
        for (const file of questionFiles) {
            try {
                console.log(`Attempting to load ${file}...`);
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const fileExtension = file.split('.').pop().toLowerCase();
                let data;
                if (fileExtension === 'json') {
                    data = await response.json();
                } else if (fileExtension === 'csv') {
                    const text = await response.text();
                    data = parseCSV(text);
                } else {
                    throw new Error(`Unsupported file type: ${fileExtension}`);
                }
                console.log(`Successfully loaded ${data.length} questions from ${file}`);
                allQuestions = allQuestions.concat(data);
            } catch (error) {
                console.error(`Error loading ${file}:`, error.message);
                console.error('Full error:', error);
            }
        }
        if (allQuestions.length === 0) {
            console.log("📚 Our local question library seems to be on vacation. Time for some improv!");
            return false;
        }
        console.log(`📘 Loaded ${allQuestions.length} questions from local files.`);
    }

    // Shuffle all questions and select a new chunk
    shuffleArray(allQuestions);
    questions = allQuestions.slice(0, CHUNK_SIZE);
    currentQuestionIndex = 0;
    console.log(`📘 Prepared ${questions.length} random questions for use.`);
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

let currentQuestion = null; // Declare a variable to hold the current question

async function getNewQuestion() {
    console.log('getNewQuestion called');
    try {
        // Try API first
        const apiQuestion = await fetchFromAPI();
        if (apiQuestion) {
            console.log('API question received:', apiQuestion);
            currentQuestion = normalizeQuestionData(apiQuestion); // Store the current question
            displayQuestion(currentQuestion);
            return;
        }

        // If API fails, use local questions
        if (questions.length === 0 || currentQuestionIndex >= questions.length) {
            console.log('Loading local questions');
            const localQuestionsLoaded = await loadLocalQuestions();
            if (!localQuestionsLoaded) {
                console.log('Failed to load local questions');
                displayErrorJoke();
                return;
            }
        }

        if (questions.length === 0) {
            throw new Error("No questions available");
        }

        currentQuestion = questions[currentQuestionIndex];
        currentQuestionIndex++;
        console.log('Local question selected:', currentQuestion);
        displayQuestion(normalizeQuestionData(currentQuestion));
    } catch (error) {
        console.error("Failed to get new question:", error);
        displayErrorJoke();
    }
}

// Create buttons for basic functionality & user interaction
const checkButton = document.getElementById('checkButton');
const answerButton = document.getElementById('answerButton');
const questionButton = document.getElementById('questionButton');

// Create userInput box for entering answer
const userInput = document.getElementById('inputbox');

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

// Reveal or hide answer
const showHideAnswer = () => {
    answerBox.style.display = answerBox.style.display === "none" ? "flex" : "none";
};

// Check answer function
const checkAnswer = () => {
    if (!answerBox.innerHTML.trim()) {
        displayErrorMessage('No answer available. Has a question been loaded?');
        return;
    }

    let originalAnswer = answerBox.innerHTML.trim();
    let correctAnswer = cleanAnswer(originalAnswer);
    let userAnswerCleaned = cleanAnswer(userInput.value);

    if (!userAnswerCleaned) {
        displayErrorMessage('User input is empty');
        return;
    }

    if (compareAnswers(userAnswerCleaned, correctAnswer)) {
        currentStreak++;
        currentScore += parseInt(currentQuestion.value.replace('$', ''), 10);
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }
        if (currentScore > bestScore) {
            bestScore = currentScore;
        }
        displayCorrectAnswerMessage();
    } else {
        currentStreak = 0;
        currentScore = 0;
        displayIncorrectAnswerMessage(originalAnswer); // Use original answer here
    }

    updateScoreBoard();
    userInput.value = '';
};

// Function to display correct answer message
const displayCorrectAnswerMessage = () => {
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = `Correctamundo and cowabunga, my friend! Your streak is now ${currentStreak}. Keep it going, sir or lady or other person!!`;
    answerBox.style.display = "flex";
    answerBox.innerHTML = "";
};

// Function to display incorrect answer message
const displayIncorrectAnswerMessage = (correctAnswer) => {
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = `Incorrect, you fool! The correct answer was ${correctAnswer}. Your streak is now reset! Try again, sir or lady or other person!!`;
    answerBox.style.display = "flex";
    answerBox.innerHTML = `STREAK RESET!!!`;
};

// Function to clean up and standardize answers for comparison
const cleanAnswer = (answer) => {
    return answer.toLowerCase()
        .replace(/^(what|who|where|when) (is|are|was|were) /i, '')
        .replace(/[^a-z0-9]/g, '')
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
    
    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            checkAnswer();
        }
    });
    
    // In order to populate with a question on page load, uncomment out below:
    // await getNewQuestion(); 

    updateScoreBoard(); // Initialize the scoreboard
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
    console.log('displayQuestion called with:', question);
    
    const categoryBox = document.getElementById('categoryBox');
    const questionBox = document.getElementById('questionBox');
    const answerBox = document.getElementById('answerBox');
    const valueBox = document.getElementById('valueBox');

    try {
        if (!categoryBox || !questionBox || !answerBox || !valueBox) {
            throw new Error('One or more required elements are missing');
        }

        categoryBox.innerHTML = question.category;
        valueBox.innerHTML = `for ${question.value}`;
        answerBox.innerHTML = question.answer;
        answerBox.style.display = 'none';

        // Process the question text
        let questionText = question.question;
        
        // Remove leading and trailing quotes
        questionText = questionText.replace(/^['"]|['"]$/g, '');

        // Replace links with embedded images
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
        questionText = questionText.replace(linkRegex, (match, url, text) => {
            return `<img src="${url}" alt="Question Image" class="embedded-image" onerror="this.onerror=null; this.alt='Image failed to load'; this.style.display='none';">`;
        });

        questionBox.innerHTML = questionText;

        // Add click event listeners to embedded images for enlargement
        const embeddedImages = questionBox.querySelectorAll('.embedded-image');
        embeddedImages.forEach(img => {
            img.addEventListener('click', () => {
                showEnlargedImage(img.src);
            });
        });

    } catch (error) {
        console.error('Error in displayQuestion:', error.message);
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

const inputbox = document.getElementById('inputbox');
const cursor = document.querySelector('.cursor');

inputbox.addEventListener('focus', () => {
    cursor.style.display = 'inline-block'; // Show cursor when focused
});

inputbox.addEventListener('blur', () => {
    cursor.style.display = 'none'; // Hide cursor when not focused
});

// Update cursor position based on input length
inputbox.addEventListener('input', () => {
    const inputLength = inputbox.value.length;
    cursor.style.left = `${inputLength * 10}px`; // Adjust based on character width
});