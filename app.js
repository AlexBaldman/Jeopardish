const apiUrl = 'https://cors-anywhere.herokuapp.com/https://cluebase.lukelav.in/clues/random';

// create buttons for basic functionality & user interaction
const checkButton = document.getElementById('checkButton');
const answerButton = document.getElementById('answerButton');
const questionButton = document.getElementById('questionButton');

// create userInput box for entering answer
const userInput = document.getElementById('inputbox');

// use separate boxes to distribute data within word-bubble
const categoryBox = document.getElementById('categoryBox');
const questionBox = document.getElementById('questionBox');
const answerBox = document.getElementById('answerBox');
const dataBox = document.getElementById('dataBox');

// create trebek
const trebek = document.getElementsByClassName('trebek');

// initialize variables to store data to display (empty string for strings/zero for nums such as score, streak, etc.)
let currentStreak = 0;
let bestStreak = 0;
let score = 0;

// Error messages:
const jeopardyErrors = [{
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

// introduce the game via console
console.log(`Welcome to Jeopardish!!!`);
console.log(`Click the "new question" button to get a random Jeopardy-style question & test your knowledge.`);
console.log(`Multiple correct answers in a row will start a streak...`);
console.log(`...but get one wrong & the streak will reset.`);
console.log("Let's see how many correct answers you can string together! ");
console.log(`Streak is currently at ` + currentStreak);
console.log("HAVE FUN YA MANIAC!");

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

const displayErrorJoke = () => {
    let randomError = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
    categoryBox.innerHTML = randomError.category + '<br/> for ' + randomError.value;
    questionBox.innerHTML = randomError.question;
    answerBox.innerHTML = randomError.answer;
    answerBox.style.display = 'block';
}

// reveal or hide answer - answerBox div starts as hidden
const showHideAnswer = () => {
    if (answerBox.style.display === "none") {
        answerBox.style.display = "flex";
    } else {
        answerBox.style.display = "none";
    }
}

// add event listeners to buttons for functionality:
// answerButton.addEventListener('click', showHideAnswer);
// questionButton.addEventListener('click', getQuestion);
// checkButton.addEventListener('click', checkAnswer);

// add event listener to allow hitting Enter to submit answer:
// userInput.addEventListener("keydown", function(event) {
//     if (event.key === "Enter") {
//         checkAnswer();
//     }
// });

// checkAnswer function checks userInput vs correctAnswer
const checkAnswer = () => {
    console.log('checkAnswer function called');

    if (!answerBox.innerHTML.trim()) {
        console.log('No answer available. Has a question been loaded?');
        return;
    }

    let correctAnswer = cleanAnswer(answerBox.innerHTML.trim());
    let userAnswerCleaned = cleanAnswer(userInput.value);
    console.log('Correct answer:', correctAnswer);
    console.log('User input:', userAnswerCleaned);

    if (!userAnswerCleaned) {
        console.log('User input is empty');
        return;
    }

    // if userInput matches correct answer from api:
    if (compareAnswers(userAnswerCleaned, correctAnswer)) {
        console.log('Answer is correct');
        // increment streak
        currentStreak++;
        score += 100; // or any score increment logic
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }

        console.log("Nice job! Answer correct & streak is now: ", currentStreak);

        // message when answer is correct
        categoryBox.innerHTML = "";
        questionBox.innerHTML = "I'm Canadianly delighted to report you're correct, sir or madame! I like how you think!!  You're beautiful & well-liked by all..";
        answerBox.style.display = "flex";
        answerBox.innerHTML = "Correct answer streak is now " + currentStreak;

    } else {
        console.log('Answer is incorrect');
        categoryBox.innerHTML = "";
        questionBox.innerHTML = "I'm sorry, that's either incorrect or the judges are...It could be them since they're drunk.";
        answerBox.style.display = "flex";
        answerBox.innerHTML = `The correct answer was..` + `<br/>` + `<br/>` + answerBox.innerHTML + `<br/>` + `<br/>` + `STREAK RESET!`;

        // reset streak
        currentStreak = 0;
        score = 0;
        console.log("streak reset to:", currentStreak);
    }

    // update scoreboard
    updateScoreBoard();
    // Clear the input box
    userInput.value = '';
}

// Function to clean up and standardize answers for comparison
const cleanAnswer = (answer) => {
    // Remove "what is", "who is", etc., and any non-alphanumeric characters
    return answer.toLowerCase()
        .replace(/^(what|who|where|when) (is|are|was|were) /i, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

// Function to compare user's answer with the correct answer using Levenshtein distance
const compareAnswers = (userAnswer, correctAnswer) => {
    console.log('Comparing answers:');
    console.log('User answer:', userAnswer);
    console.log('Correct answer:', correctAnswer);
    
    // Check if the user's answer is contained within the correct answer or vice versa
    if (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer)) {
        return true;
    }
    
    const levenshteinDistance = getLevenshteinDistance(userAnswer, correctAnswer);
    console.log('Levenshtein distance:', levenshteinDistance);
    
    // Allow for more lenient matching
    return levenshteinDistance <= Math.min(3, Math.floor(correctAnswer.length / 2));
}

// Levenshtein distance algorithm to allow slight misspellings
const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    let i, j;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    // Increment along the first column of each row
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    // Increment each column in the first row
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
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
}

// update scoreBoard
function updateScoreBoard() {
    dataBox.innerHTML = `
        <p id="currentStreak">Current Streak: ${currentStreak}</p>
        <p id="bestStreak">Best Streak: ${bestStreak}</p>
        <p id="score">Score: $${score}</p>
    `;
}

// Wrap event listeners and initial question load in DOMContentLoaded event
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    
    // Attach event listeners
    document.getElementById('answerButton').addEventListener('click', showHideAnswer);
    document.getElementById('questionButton').addEventListener('click', getNewQuestion);
    document.getElementById('checkButton').addEventListener('click', checkAnswer);
    
    // Add event listener to allow hitting Enter to submit answer:
    document.getElementById('inputbox').addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            checkAnswer();
        }
    });
    
    // Initial question load
    getNewQuestion();
});