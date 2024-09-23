const apiUrl = 'https://cluebase.lukelav.in/clues/random';

let questions = [];
const questionFiles = ['questions/questions.csv', 'questions/questions.json'];

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
    for (const file of questionFiles) {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
            questions = questions.concat(data);
        } catch (error) {
            console.error(`Error loading ${file}:`, error.message);
        }
    }
    if (questions.length === 0) {
        console.log("📚 Our local question library seems to be on vacation. Time for some improv!");
        return false;
    }
    console.log(`📘 Loaded ${questions.length} questions from local files.`);
    return true;
}

function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(value => value.trim());
        if (values.length !== headers.length) {
            console.warn(`Skipping malformed line: ${line}`);
            return null;
        }
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    }).filter(row => row !== null);
}

function displayQuestion(question) {
    categoryBox.textContent = question.category;
    questionBox.textContent = question.question;
    valueBox.textContent = `$${question.value}`;
    dateBox.textContent = `Aired on: ${new Date(question.airdate).toLocaleDateString()}`;
    
    // New information
    if (question.difficulty) {
        difficultyBox.textContent = `Difficulty: ${question.difficulty}`;
    }
    if (question.times_used) {
        timesUsedBox.textContent = `Used ${question.times_used} times`;
    }
    if (question.contestant) {
        contestantBox.textContent = `Answered by: ${question.contestant}`;
    }
    if (question.season && question.episode) {
        episodeBox.textContent = `Season ${question.season}, Episode ${question.episode}`;
    }
    
    // Hide the answer initially
    answerBox.textContent = '';
    answerBox.style.display = 'none';
}

async function getNewQuestion() {
    try {
        // Try API first
        const apiQuestion = await fetchFromAPI();
        if (apiQuestion) {
            displayQuestion(normalizeQuestionData(apiQuestion));
            return;
        }

        // If API fails, use local questions
        if (questions.length === 0) {
            const localQuestionsLoaded = await loadLocalQuestions();
            if (!localQuestionsLoaded) {
                displayErrorJoke();
                return;
            }
        }

        if (questions.length === 0) {
            throw new Error("No questions available");
        }

        const randomIndex = Math.floor(Math.random() * questions.length);
        const selectedQuestion = questions[randomIndex];
        questions.splice(randomIndex, 1);
        displayQuestion(normalizeQuestionData(selectedQuestion));
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
const scoreboard = document.getElementById('scoreboard');

// Initialize variables to store data to display
let currentStreak = 0;
let bestStreak = 0;
let score = 0;

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

    let correctAnswer = cleanAnswer(answerBox.innerHTML.trim());
    let userAnswerCleaned = cleanAnswer(userInput.value);

    if (!userAnswerCleaned) {
        displayErrorMessage('User input is empty');
        return;
    }

    if (compareAnswers(userAnswerCleaned, correctAnswer)) {
        currentStreak++;
        score += 100;
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }
        displayCorrectAnswerMessage();
    } else {
        currentStreak = 0;
        score = 0;
        displayIncorrectAnswerMessage(correctAnswer);
    }

    updateScoreBoard();
    userInput.value = '';
};

// Function to display correct answer message
const displayCorrectAnswerMessage = () => {
    categoryBox.innerHTML = "";
    questionBox.innerHTML = "Correct! Your streak is now: " + currentStreak;
    answerBox.style.display = "flex";
    answerBox.innerHTML = "Correct answer streak is now " + currentStreak;
};

// Function to display incorrect answer message
const displayIncorrectAnswerMessage = (correctAnswer) => {
    categoryBox.innerHTML = "";
    questionBox.innerHTML = "Incorrect! The correct answer was: " + correctAnswer;
    answerBox.style.display = "flex";
    answerBox.innerHTML = `STREAK RESET!`;
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
    scoreboard.innerHTML = `
        <p id="score">Score: $${score}</p>
        <p id="currentStreak">Current Streak: ${currentStreak}</p>
        <p id="bestStreak">Best Streak: ${bestStreak}</p>
       `;
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
    
    // Initial question load
    await getNewQuestion();
});

function normalizeQuestionData(question) {
    return {
        category: question.category?.title || question.category,
        question: question.question || question.clue,
        answer: question.answer,
        value: question.value || 200,
        airdate: question.airdate || new Date().toISOString(),
        difficulty: question.difficulty || 'Unknown',
        times_used: question.times_used || 1,
        contestant: question.contestant || 'Unknown',
        season: question.season || 'Unknown',
        episode: question.episode || 'Unknown'
    };
}