// API URL for random question
const randomQuestionUrl = 'https://cluebase.com/api/random';

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
const dataBox = document.getElementById('dataBox');
// Create Trebek
const trebek = document.getElementsByClassName('trebek');
// Initialize variables to store data to display
let streak = 0;
let category, question, answer, value, date, data = "";

// Error messages themed for the game
const jeopardyErrors = [{
        category: "TECHNICAL DIFFICULTIES",
        question: "This term describes what happens when your app tries to fetch data, but the internet says 'Nope.'",
        answer: "What is 'a connection error'?",
        value: "$0"
    },
    // Additional error messages...
];

// Introduce the game via console
console.log(`Welcome to Jeopardish!!!`);
console.log(`Click the "new question" button to grab a random Jeopardy question & test your knowledge.`);
console.log(`Multiple correct answers in a row will start a streak...`);
console.log(`...but get one wrong & the streak will reset.`);
console.log("Let's see how many correct answers you can string together! ");
console.log(`Streak is currently at ` + streak);
console.log("HAVE FUN YA MANIAC!");

// Function to grab question from Cluebase API
const getQuestion = async() => {
    try {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = 'https://cluebase.com/api/random';
        const response = await fetch(proxyUrl + apiUrl, {
            headers: {
                'Origin': 'https://alexbaldman.github.io/Jeopardish/'
            }
        });

        // Clear previous content
        categoryBox.innerHTML = '';
        questionBox.innerHTML = '';
        answerBox.innerHTML = '';
        userInput.value = '';

        const data = await response.json();
        console.log('-- New random Jeopardy clue --');
        console.log(data);

        if (data.category && data.question && data.answer) {
            category = data.category;
            question = data.question;
            answer = data.answer;
            value = data.value || '$100';
            date = data.airdate || 'Unknown';

            // Display in word bubble
            categoryBox.innerHTML = category.toUpperCase() + '<br/> for $' + value;
            questionBox.innerHTML = question;
            answerBox.innerHTML = answer;

            // Set answer as invisible until revealed
            answerBox.style.display = 'none';
        } else {
            throw new Error("No clues received or API returned failure");
        }
    } catch (error) {
        console.error('Failed to fetch clue:', error);

        // Display error using a pre-defined Jeopardy-themed joke
        displayErrorJoke();
    }
};

const displayErrorJoke = () => {
    let randomError = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
    categoryBox.innerHTML = randomError.category + '<br/> for ' + randomError.value;
    questionBox.innerHTML = randomError.question;
    answerBox.innerHTML = randomError.answer;
    answerBox.style.display = 'block';
};

// Reveal or hide answer - answerBox div starts as hidden
const showHideAnswer = () => {
    if (answerBox.style.display === "none") {
        answerBox.style.display = "flex";
    } else {
        answerBox.style.display = "none";
    }
};

// Add event listeners for button functionality
answerButton.addEventListener('click', showHideAnswer);
questionButton.addEventListener('click', getQuestion);

// Add event listener to use Enter to submit answer
userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// CheckAnswer function checks userInput vs correctAnswer
const checkAnswer = () => {
    let correctAnswer = answerBox.innerHTML.trim();
    console.log({ correctAnswer });
    // If userInput matches correct answer from API:
    if (
        userInput.value == correctAnswer ||
        userInput.value.toLowerCase() == correctAnswer.toLowerCase().replace('\\', '') ||
        userInput.value.toLowerCase() == correctAnswer.toLowerCase().replace('\\', '')
    ) {
        // Increment streak
        streak++;
        dataBox.innerHTML = streak;
        console.log("Nice job! Answer correct & streak is now: ", { streak });

        // Message when answer is correct
        categoryBox.innerHTML = "";
        questionBox.innerHTML = "I'm Canadianly delighted to report you're correct, sir or madame! I like how you think!!  You're beautiful & well-liked by all..";
        answerBox.innerHTML = "Correct answer streak is now " + streak;
    } else {
        categoryBox.innerHTML = "";
        questionBox.innerHTML = "I'm sorry, that's either incorrect or the judges are...It could be them since they're drunk.";
        answerBox.style.display = "flex";
        answerBox.innerHTML = `The correct answer was..` + `<br/>` + `<br/>` +
            correctAnswer + `<br/>` + `<br/>` +
            `STREAK RESET!`;

        // Reset streak
        streak = 0;
        console.log("streak reset to:", { streak });
    }
};