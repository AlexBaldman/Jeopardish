// Import axios for fetching data from API
const axios = require('axios');

// API URL for random question
const randomQuestionUrl = 'cluebase.lukelav.in/clues/random';

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
let category, question, answer, value, date, data = "";

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

// Load questions from local JSON file
let questions = [];

fetch('./questions/questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    console.log('Questions loaded:', questions.length);
  })
  .catch(error => console.error('Error loading questions:', error));

// Function to get a random question
function getRandomQuestion() {
  return questions[Math.floor(Math.random() * questions.length)];
}

// Update getNewQuestion function
const getNewQuestion = () => {
  try {
    const clue = getRandomQuestion();

    // Clear previous content / set chat bubble as empty:
    categoryBox.innerHTML = '';
    questionBox.innerHTML = '';
    answerBox.innerHTML = '';
    userInput.value = '';

    // Reset the message flag for the new question
    messageDisplayed = false;

    console.log('-- Grabbed new random Jeopardy clue ya triviaface! --');
    console.log(clue);

    if (clue) {
      // Display in word bubble
      categoryBox.innerHTML = clue.category.toUpperCase() + '<br/> for $' + clue.value;
      questionBox.innerHTML = clue.question;
      answerBox.innerHTML = clue.answer;

      // Set answer as invisible until revealed
      answerBox.style.display = 'none';
    } else {
      throw new Error("No clues available");
    }
  } catch (error) {
    console.error('Failed to fetch clue:', error);

    // Display error using a pre-defined Jeopardy-themed joke
    displayErrorJoke();
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
    const apiAnswer = correctAnswer.toLowerCase();

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
            correctAnswer + `<br/>` + `<br/>` +
            `STREAK: ${streak}`;
    } else {
        // Incorrect answer
        answerBox.style.display = "flex";
        answerBox.innerHTML = `The correct answer was..` + `<br/>` + `<br/>` +
            correctAnswer + `<br/>` + `<br/>` +
            `STREAK RESET!`;

        // Reset streak
        streak = 0;
        console.log("streak reset to:", { streak });
    }

    // Clear the user input field
    userInput.value = '';
}

// Call getNewQuestion to load initial question on page load
getNewQuestion();





// SAMPLE RESPONSE TO RANDOM CLUE GET REQUEST ON CLUEBASE API:

// {
//     "status": "success",
//     "data": [
//         {
//             "id": 267504,
//             "game_id": 4580,
//             "value": 600,
//             "daily_double": false,
//             "round": "J!",
//             "category": "MINIMUM AGES",
//             "clue": "To vote in Canadian national elections",
//             "response": "18"
//         }
//     ]
// }


// OLD & SAVED SNIPPETS:

// const getNewQuestion = async() => {
//     try {
//         const response = await fetch(randomQuestionUrl);
//         const data = await response.json();

//         // Extract relevant data from the API response
//         category = data.category;
//         question = data.question;
//         answer = data.answer;
//         value = data.value;
//         date = data.date;

//         // Display the question data
//         categoryBox.innerHTML = category;
//         questionBox.innerHTML = question;
//         answerBox.style.display = "none";
//         dataBox.innerHTML = value;

//         console.log(`New question loaded from category: ${category}`);
//     } catch (error) {
//         console.error('Error fetching question:', error);
//         displayErrorMessage();
//     }
// };



// function getNewQuestion() {
//     const url = 'https://cluebase.com/api/random';
//     fetch(url, {
//             method: 'GET',
//             mode: 'cors',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Access-Control-Allow-Origin': 'https://your-website-domain.com' // Update with your actual domain
//             }
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to fetch');
//             }
//             return response.json();
//         })
//         .then(data => {
//             // Handle the fetched data here
//         })
//         .catch(error => {
//             console.error('Error fetching question:', error);
//         });
// }


/*
CLUEBASE API RESPONSE EXAMPLE:
- The Cluebase API returns a JSON object with the following structure:

{
  "category": "HISTORY",
  "question": "This 'Father of Our Country' didn't really chop down a cherry tree.",
  "answer": "George Washington",
  "value": 200,
  "airdate": "1984-12-11T12:00:00.000Z"
}

We extract the relevant fields and assign them to variables:
- category: The category of the question
- question: The question text
- answer: The correct answer to the question
- value: The point value of the question
- airdate: The original airdate of the question (optional)

The extracted data is then displayed in the respective HTML elements:
- categoryBox: Displays the category and point value
- questionBox: Displays the question text
- answerBox: Initially hidden, displays the correct answer when revealed
- dataBox: Displays the current streak count

The user's input is compared against the correct answer in the checkAnswer function.
If the answer is correct, the streak is incremented. If incorrect, the streak is reset to 0.
*/