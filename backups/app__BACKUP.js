// API URL for random question with CORS proxy
const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const randomQuestionUrl = 'cluebase.lukelav.in/clues/random';
const proxiedUrl = corsProxy + randomQuestionUrl;

// DOM elements
const checkButton = document.getElementById('checkButton');
const answerButton = document.getElementById('answerButton');
const questionButton = document.getElementById('questionButton');
const userInput = document.getElementById('inputbox');
const categoryBox = document.getElementById('categoryBox');
const questionBox = document.getElementById('questionBox');
const answerBox = document.getElementById('answerBox');
const dataBox = document.getElementById('dataBox');
const trebek = document.getElementsByClassName('trebek');

// Game state
let streak = 0;
let category, question, answer, value, date = "",
    data = "";

// Error messages for when API not working:
const jeopardyErrors = [{
        category: "TECHNICAL DIFFICULTIES",
        question: "This term describes what happens when your app tries to fetch data, but the internet says 'Nope.'",
        answer: "What is 'a connection error'?",
        value: "$0"
    },
    // Add additional error messages if desired...
];

// Introduce the game via console
console.log(`Welcome to Jeopardish!!!`);
console.log(`Click the "new question" button to grab a random Jeopardy question & test your knowledge.`);
console.log(`Multiple correct answers in a row will start a streak...`);
console.log(`...but get one wrong & the streak will reset.`);
console.log("Let's see how many correct answers you can string together! ");
console.log(`Streak is currently at ` + streak);

// Fetch a new random question from the API
const getNewQuestion = async() => {
    try {
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();

            // Extract relevant data from the API response
            category = data.category;
            question = data.question;
            answer = data.answer;
            value = data.value;
            date = data.date;

            // Display the question data
            categoryBox.innerHTML = category;
            questionBox.innerHTML = question;
            answerBox.style.display = "none";
            dataBox.innerHTML = value;

            console.log(`New question loaded from category: ${category}`);
        } else {
            throw new Error("Response is not JSON");
        }
    } catch (error) {
        console.error('Error fetching question:', error);
        displayErrorMessage();
    }
};

// Display a random error message
const displayErrorMessage = () => {
    const randomError = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
    categoryBox.innerHTML = randomError.category;
    questionBox.innerHTML = randomError.question;
    answerBox.innerHTML = randomError.answer;
    dataBox.innerHTML = randomError.value;
};

// Event listeners
questionButton.addEventListener('click', getNewQuestion);
answerButton.addEventListener('click', () => {
    answerBox.style.display = "flex";
    answerBox.innerHTML = answer;
});

// Use Enter to submit answer
userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Check user's answer against the correct answer
function checkAnswer() {
    const userAnswer = userInput.value.trim().toLowerCase();
    const apiAnswer = answer.toLowerCase(); // Fixed: correctAnswer was undefined

    // Remove common words from both answers
    const commonWords = ['the', 'a', 'an'];
    const userAnswerWords = userAnswer.split(' ').filter(word => !commonWords.includes(word));
    const apiAnswerWords = apiAnswer.split(' ').filter(word => !commonWords.includes(word));

    const sanitizedUserAnswer = userAnswerWords.join(' ');
    const sanitizedApiAnswer = apiAnswerWords.join(' ');

    if (sanitizedUserAnswer === sanitizedApiAnswer) {
        // Correct answer
        streak++;
        console.log("streak incremented to:", { streak });
        answerBox.style.display = "flex";
        answerBox.innerHTML = `Correct! The answer was..` + `<br/>` + `<br/>` +
            answer + `<br/>` + `<br/>` + // Fixed: correctAnswer was undefined
            `STREAK: ${streak}`;
    } else {
        // Incorrect answer
        answerBox.style.display = "flex";
        answerBox.innerHTML = `The correct answer was..` + `<br/>` + `<br/>` +
            answer + `<br/>` + `<br/>` + // Fixed: correctAnswer was undefined
            `STREAK RESET!`;

        // Reset streak
        streak = 0;
        console.log("streak reset to:", { streak });
    }

    // Clear the user input field
    userInput.value = '';
}

// Call getNewQuestion to load initial question on page load
// Commenting out since I don't want a random question until the user requests one via the button
// getNewQuestion();