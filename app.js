console.log("App.js loaded. Or is it? You know, it's like that old saying: 'If a JavaScript file loads in a browser and no one's there to see it, does it make a console.log?'");

const apiUrl = 'https://cluebase.lukelav.in/clues/random';
let questions = [];
const questionFiles = ['questions/questions.csv', 'questions/questions.json'];

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

// Error messages
const jeopardyErrors = [
    {
        category: "TECHNICAL DIFFICULTIES",
        question: "This term describes what happens when your app can't load the local question database.",
        answer: "What is 'a file reading error'? You know, it's like trying to read War and Peace in the dark. Sure, the words are there, but good luck making sense of 'em.",
        value: "$0"
    },
    {
        category: "OOOPS!",
        question: "This famous line was uttered by every programmer ever when their code didn't work as expected.",
        answer: "What is 'It works on my machine'? It's like saying, 'The murder weapon? Oh, it only kills people in my house.'",
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
        answer: "What is 'demo demon'? It's like when you're trying to impress a date with your cooking skills, and suddenly your signature dish tastes like feet. Not that I know what feet taste like, mind you.",
        value: "$0"
    }
];

async function fetchFromAPI() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error:", error.message);
        console.log("🎭 Looks like our API is MIA. BRB. ");
        return null;
    }
}

async function loadLocalQuestions() {
    for (const file of questionFiles) {
        try {
            console.log(`Attempting to load ${file}...`);
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
            console.log(`Successfully loaded ${data.length} questions from ${file}`);
            questions = questions.concat(data);
        } catch (error) {
            console.error(`Error loading ${file}:`, error.message);
            console.log(`Failed to load ${file}. It's like trying to read my handwriting after a night of heavy drinking. Theoretically possible, but why put yourself through that?`);
        }
    }
    if (questions.length === 0) {
        console.log("📚 Our local question library seems to be on vacation. Time for some improv! You know, it's like that time I tried to do stand-up without any material. Turns out, silence isn't always golden.");
        return false;
    }
    console.log(`📘 Loaded ${questions.length} questions from local files. That's more questions than I've had about my career choices.`);
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
    console.log('displayQuestion called with:', question);
    const elements = ['categoryBox', 'questionBox', 'answerBox', 'valueBox'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'Found' : 'Missing'}`);
    });
    try {
        const elements = {
            categoryBox: document.getElementById('categoryBox'),
            questionBox: document.getElementById('questionBox'),
            answerBox: document.getElementById('answerBox'),
            valueBox: document.getElementById('valueBox')
        };

        // Check if any required elements are missing
        const missingElements = Object.entries(elements)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
        }

        // If we get here, all required elements exist
        elements.categoryBox.textContent = question.category;
        elements.questionBox.textContent = question.question;
        elements.valueBox.textContent = `$${question.value}`;
        
        elements.answerBox.textContent = '';
        elements.answerBox.style.display = 'none';

    } catch (error) {
        console.error('Error in displayQuestion:', error.message);
    }
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
    console.log("Error joke displayed. You know, in comedy, they say timing is everything. In programming, timing is also everything, except when it isn't, which is most of the time.");
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

// display correct answer message
const displayCorrectAnswerMessage = () => {
    categoryBox.innerHTML = "";
    questionBox.innerHTML = "Correct! Your streak is now: " + currentStreak;
    answerBox.style.display = "flex";
    answerBox.innerHTML = "Correct answer streak is now " + currentStreak;
};

// display incorrect answer message
const displayIncorrectAnswerMessage = (correctAnswer) => {
    categoryBox.innerHTML = "";
    questionBox.innerHTML = "Incorrect! The correct answer was: " + correctAnswer;
    answerBox.style.display = "flex";
    answerBox.innerHTML = `STREAK RESET!`;
};

// clean up and standardize answers for comparison
const cleanAnswer = (answer) => {
    return answer.toLowerCase()
        .replace(/^(what|who|where|when) (is|are|was|were) /i, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
};

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

// compare user's answer with the correct answer
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

// update scoreboard
function updateScoreBoard() {
    scoreboard.innerHTML = `
        <p id="score">Score: $${score}</p>
        <p id="currentStreak">Current Streak: ${currentStreak}</p>
        <p id="bestStreak">Best Streak: ${bestStreak}</p>
    `;
}

// Wrap event listeners and initial question load in DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    try {
        const checkButton = document.getElementById('checkButton');
        const answerButton = document.getElementById('answerButton');
        const questionButton = document.getElementById('questionButton');
        const userInput = document.getElementById('inputbox');
        const categoryBox = document.getElementById('categoryBox');
        const questionBox = document.getElementById('questionBox');
        const answerBox = document.getElementById('answerBox');
        const scoreboard = document.getElementById('scoreboard');

        if (!checkButton || !answerButton || !questionButton || !userInput || 
            !categoryBox || !questionBox || !answerBox || !scoreboard) {
            throw new Error('One or more required DOM elements are missing');
        }

        // Attach event listeners
        answerButton.addEventListener('click', showHideAnswer);
        questionButton.addEventListener('click', getNewQuestion);
        checkButton.addEventListener('click', checkAnswer);
        
        userInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                checkAnswer();
            }
        });
        
        // Display welcome messages
        console.log(`Welcome to Jeopardish!!! It's like Jeopardy, but with more 'ish' and less Alex Trebek. May he rest in peace.`);
        console.log(`Click the "new question" button to get a random Jeopardy-style question & test your knowledge. Or don't. I'm a console.log, not a cop.`);
        console.log(`Multiple correct answers in a row will start a streak... kind of like my career, except the opposite.`);
        console.log(`...but get one wrong & the streak will reset. Just like my attempts at a healthy lifestyle.`);
        console.log("Let's see how many correct answers you can string together! It's like playing 'connect the dots', but the dots are your last remaining brain cells.");
        console.log(`Streak is currently at ${currentStreak}. Which, coincidentally, is also the number of times I've been mistaken for Conan O'Brien.`);
        console.log("HAVE FUN YA MANIAC! And remember, in the game of life, it's not about winning or losing, it's about how many Norm Macdonald jokes you can make while you're trying to figure out why your code isn't working.");

        // Initial question load
        getNewQuestion();
    } catch (error) {
        console.error('Error in DOMContentLoaded event:', error);
    }
});