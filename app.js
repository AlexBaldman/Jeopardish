
const proxyUrl = 'https://cors-proxy-nxljzehxv-alexs-projects-056c5ae2.vercel.app/proxy'; // cors proxy

const apiUrl = 'https://cluebase.lukelav.in/clues/random'; // api endpoint for random question

// api GET request using axios, using proxy for CORS
axios.get(`${proxyUrl}?url=${apiUrl}`)
    .then(response => {
        console.log('Clue fetched successfully:', response.data);
    })
    .catch(error => {
        console.error('Failed to fetch clue:', error);
    });

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
// Flag to indicate if a message has been displayed
let messageDisplayed = false;


// Error messages:
const jeopardyErrors = [{
        category: "TECHNICAL DIFFICULTIES",
        question: "This term describes what happens when your app tries to fetch data, but the internet says 'Nope.'",
        answer: "What is 'a connection error'?",
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
console.log(`Click the "new question" button to grab a random Jeopardy question & test your knowledge.`);
console.log(`Multiple correct answers in a row will start a streak...`);
console.log(`...but get one wrong & the streak will reset.`);
console.log("Let's see how many correct answers you can string together! ");
console.log(`Streak is currently at ` + currentStreak);
console.log("HAVE FUN YA MANIAC!");

// function to grab question from api
const getQuestion = async() => {
    try {
        const response = await axios.get(apiUrl);

        // Clear previous content / set chat bubble as empty:
        categoryBox.innerHTML = '';
        questionBox.innerHTML = '';
        answerBox.innerHTML = '';
        userInput.value = '';

        // Reset the message flag for the new question
        messageDisplayed = false;

        console.log('-- Grabbed new random Jeopardy clue ya triviaface! --');
        console.log(response.status);
        console.log(response.data);

        if (response.data && response.data.length > 0) {
            let clue = response.data[0]; // Cluebase API returns an array of clues

            // Display in word bubble
            categoryBox.innerHTML = clue.category.toUpperCase() + '<br/> for $' + clue.value;
            questionBox.innerHTML = clue.clue;
            answerBox.innerHTML = clue.response;

            // Set answer as invisible until revealed
            answerBox.style.display = 'none';
        } else {
            throw new Error("No clues received from API");
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
answerButton.addEventListener('click', showHideAnswer);
questionButton.addEventListener('click', getQuestion);

// add event listener to allow hitting Enter to submit answer:
userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// checkAnswer function checks userInput vs correctAnswer
const checkAnswer = () => {
    if (messageDisplayed) {
        return; // If a message has already been displayed, do nothing
    }

    let correctAnswer = cleanAnswer(answerBox.innerHTML.trim());
    console.log({ correctAnswer });

    // if userInput matches correct answer from api:
    if (
        compareAnswers(userInput.value, correctAnswer)
    ) {
        // increment streak
        currentStreak++;
        score += 100; // or any score increment logic
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }

        console.log("Nice job! Answer correct & streak is now: ", { currentStreak });

        // message when answer is correct
        categoryBox.innerHTML = "";
        questionBox.innerHTML = "I'm Canadianly delighted to report you're correct, sir or madame! I like how you think!!  You're beautiful & well-liked by all..";
        answerBox.innerHTML = "Correct answer streak is now " + currentStreak;

    } else {
        categoryBox.innerHTML = "";
        questionBox.innerHTML = "I'm sorry, that's either incorrect or the judges are...It could be them since they're drunk.";
        answerBox.style.display = "flex";
        answerBox.innerHTML = `The correct answer was..` + `<br/>` + `<br/>` + correctAnswer + `<br/>` + `<br/>` + `STREAK RESET!`;

        // reset streak
        currentStreak = 0;
        score = 0;
        console.log("streak reset to:", { currentStreak });
    }

    // update scoreboard
    updateScoreBoard();
    // Set the flag to indicate that a message has been displayed
    messageDisplayed = true;
}

// Function to clean up and standardize answers for comparison
const cleanAnswer = (answer) => {
    return answer.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

// Function to compare user's answer with the correct answer using Levenshtein distance
const compareAnswers = (userAnswer, correctAnswer) => {
    userAnswer = cleanAnswer(userAnswer);
    return userAnswer === correctAnswer || getLevenshteinDistance(userAnswer, correctAnswer) <= 2;
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


// NOTE

// Currently using my own vercel proxy deployment for CORS but if experiencing issues, can try using alternate proxy below & updating the apiUrl like this:
// const corsProxy = 'https://cors-anywhere.herokuapp.com/';
// const apiUrl = `${corsProxy}https://cluebase.lukelav.in/clues/random`;

// TO DO ITEMS
// - display streak in dataBox
// - figure out what other info to display there as well


// api url for random question::
// const random = 'https://jservice.io/api/random'

// //api url for final jeopardy questions:
// const final = 'https://jservice.io/api/final'

// // create buttons for basic functionality & user interaction
// const checkButton = document.getElementById('checkButton')
// const answerButton = document.getElementById('answerButton')
// const questionButton = document.getElementById('questionButton')

// // create userInput box for entering answer
// const userInput = document.getElementById('inputbox');

// // use separate boxes to distribute data within word-bubble
// const categoryBox = document.getElementById('categoryBox')
// const questionBox = document.getElementById('questionBox')
// const answerBox = document.getElementById('answerBox')
// const trebek = document.getElementsByClassName('trebek')
// const dataBox = document.getElementById('dataBox')

// // set certain variables as empty strings, to be updated after API calls


// // initialize variables to store data to display (empty string for strings/zero for nums such as score, streak, etc.)
// let streak = 0
// let category, question, answer, value, date, data = "";
// // let correctCount = 0, wrongCount = 0, bestStreak = 0;

// // TODO: add function to track best streak of answers correct in each game
// // TODO: add intro animation & title screen
// // TODO: add reset/new game button to reset
// // TODO: add signup/login functionality, for saving of high scores. online competition, possible multiplayer functionality eventually, etc.

// // introduce the game to those following along in the console
// console.log(`Welcome to Jeopardish!!!`)
// console.log(`Click the "new question" button to grab a random Jeopardy question & test your knowledge.`)
// console.log(`Multiple correct answers in a row will start a streak...`)
// console.log(`...but get one wrong & the streak will reset.`)
// console.log("Let's see how many correct answers you can string together! ")
// console.log(`Streak is currently at ` + streak)
// console.log("HAVE FUN YA MANIAC!")

// // clear data from previous question by resetting innerHTML for each box to an empty string
// // fetch data from api and assign values to our variables for use in app
// // will set to $100 as default question value in case null is returned by API due to missing data

// // function to grab question from api
// const getQuestion = async() => {
//     try {
//         // Reset word bubble to empty, removing any previous content
//         categoryBox.innerHTML = '';
//         questionBox.innerHTML = '';
//         answerBox.innerHTML = '';
//         userInput.value = '';

//         // Grab question from Cluebase API
//         let response = await axios.get('https://cluebase.com/api/random');
//         console.log('-- New random Jeopardy question --');
//         console.log(response.data);

//         // Extract relevant data from the response
//         let category = response.data.category;
//         let question = response.data.question;
//         let answer = response.data.answer || 'Unknown';
//         let value = response.data.value || '$100';
//         let airdate = response.data.airdate || 'Unknown';

//         // Display in word bubble
//         categoryBox.innerHTML = category.toUpperCase() + '<br/> for $' + value + '<br/> (asked on ' + airdate + ')';
//         questionBox.innerHTML = question;
//         answerBox.innerHTML = answer;

//         // Set answer as invisible until revealed
//         answerBox.style.display = 'none';
//     } catch (error) {
//         console.log('Question fetch failed:', error);
//     }
// };

// // reveal or hide answer - answerBox div starts as hidden, 
// const showHideAnswer = () => {
//     if (answerBox.style.display === "none") {
//         answerBox.style.display = "flex"
//     } else {
//         answerBox.style.display = "none"
//     }
// }

// // add event listeners to buttons to trigger functionality
// answerButton.addEventListener('click', showHideAnswer)
// questionButton.addEventListener('click', getQuestion)
// userInput.addEventListener("keydown", function(event) {
//     if (event.key === "Enter") {
//         checkAnswer();
//     }
// })

// // checkAnswer function checks userInput vs correctAnswer
// const checkAnswer = () => {
//     let correctAnswer = answerBox.innerHTML.trim()
//     console.log({ correctAnswer })

//     // SHOULD FIRST DO ALL TRANSFORMATIONS TO 

//     // if userInput matches correct answer from api:
//     if (
//         userInput.value == correctAnswer ||
//         userInput.value.toLowerCase() == correctAnswer.toLowerCase().replace('\\', '') ||
//         userInput.value.toLowerCase() == correctAnswer.toLowerCase().replace('\\', '')
//     ) {
//         //increment streak
//         streak++
//         dataBox.innerHTML = streak
//         console.log("Nice job! Answer correct & streak is now: ", { streak })

//         // message when answer is correct
//         categoryBox.innerHTML = ""
//         questionBox.innerHTML = "I'm Canadianly delighted to report you're correct, sir or madame! I like how you think!!  You're beautiful & well-liked by all.."
//         answerBox.innerHTML = "Correct answer streak is now " + streak
//     } else {
//         categoryBox.innerHTML = "";
//         questionBox.innerHTML = "I'm sorry, that's either incorrect or the judges are...It could be them since they're drunk.";
//         answerBox.style.display = "flex"
//         answerBox.innerHTML = `The correct answer was..` + `<br/>` + `<br/>` +
//             correctAnswer + `<br/>` + `<br/>` +
//             `STREAK RESET!`;

//         // reset streak
//         streak = 0;
//         console.log("streak reset to:", { streak })
//     }

// }

// OLD VERSION USING JSERVICE.IO as API BELOW:

// const getQuestion = async() => {
//   try {
//     // reset word bubble to empty, removing any previous content
//     categoryBox.innerHTML = ''
//     questionBox.innerHTML = ''
//     answerBox.innerHTML = ''
//     userInput.value = ''

//     // grab question from api
//     let response = await axios.get(random)
//     console.log(`--new random Jeopardy question--`)
//     console.log(response.data[0])

//     // set variables for the info to display in word-bubble
//     let category = response.data[0].category.title
//     let question = response.data[0].question
//     let answer = response.data[0].answer 
//     let value = response.data[0].value || '$100' 
//     let date = new Date(response.data[0].airdate)

//     // interpolating date data into a string
//     let datestring = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear()

//     // display in word-bubble
//     categoryBox.innerHTML = category.toUpperCase() + `<br/> for $` + value + `<br/>` + '(asked on ' + datestring + ' )'
//     questionBox.innerHTML = question
//     answerBox.innerHTML = answer

//     // set answer as invisible until revealed
//     answerBox.style.display = "none"
//   } 
//   catch (error) {
//       console.log(`question fetch failed: ${error}`)
//   }
// }


// MISC NOTES...
//create a SANITIZE function to clean up the correct answer from API and USER INPUT for final comparison.
// THINGS THIS SHOULD DO ARE:
// if first word is 'the', 'an', 'a' or other articles like that, remove the first word
// trim any extra spaces from beginning or end, using TRIM (especially important because space will often be auto-added on mobile keyboards)
// remove any quotes or escape characters
// remove capitalization (already doing this)
// use some sort of regex to accomplish a bunch of these / removing special characters, etc.


// Create variables for:
// dialog = document.createElement("div");
// wordBubble = document.createElement("div")
// correct = document.createElement("div")


// window.alert("I'm sorry, that's either incorrect or the judges are...  It definitely could be them, they're a little drunk..."); //reset streak counter


// empty content from previous question
// get new question from api
// api GET request grabs an array of questions
// currently just taking first one in the array at index 0, 
// could also randomize or minimize api calls by incrementing to other questions in array
// display category, question value, and question
// answerBox set to display = "none" until user chooses to reveal answer with showHideAnswer() function:


// _____NEED TO:_____
// remove 'the' from answer (also a, an, etc?)
// remove quotes
// just use RegEx?
// change window alert to modal
// implement streak counter into page
// check for partial correct answer - if given answer is 
// contained in the answer but not exactly correct word for word


// RANDOM INDEX:
// const randomIndex = Math.floor(Math.random() * 1000)

// || userInput.value.toLowerCase().includes(answer).toLowerCase().replace('\\', '')
//----------------------------------------
//---------------------------------------------
// SAMPLE API RESPONSE:
// "id": 6995,
// "answer": "liberty",
// "question": "One-word term for an authorized leave from duty; to a sailor it means freedom for 48 hours or less",
// "value": 200,
// "airdate": "1990-01-23T12:00:00.000Z",
// "created_at": "2014-02-11T22:50:54.251Z",
// "updated_at": "2014-02-11T22:50:54.251Z",
// "category_id": 914,
// "game_id": null,
// "invalid_count": null,
// "category": {
//   "id": 914,
//   "title": "the navy",
//   "created_at": "2014-02-11T22:50:54.061Z",
//   "updated_at": "2014-02-11T22:50:54.061Z",
//   "clues_count": 5
// }
// -------------------------------------------
//----------------------------------------

// ADD AN EVENT LISTENER THAT FIRES WHEN A USER RESIZES THE WINDOW AND THE WINDOW
//---------
// window.addEventListener("resize", function(){
//   document.getElementById("demo").innerHTML = som
