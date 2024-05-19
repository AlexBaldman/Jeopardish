// api url for random question::
const randomQuestion = 'https://cluebase.com/api/random'


// create buttons for basic functionality & user interaction
const checkButton = document.getElementById('checkButton')
const answerButton = document.getElementById('answerButton')
const questionButton = document.getElementById('questionButton')
    // create userInput box for entering answer
const userInput = document.getElementById('inputbox');
// use separate boxes to distribute data within word-bubble
const categoryBox = document.getElementById('categoryBox')
const questionBox = document.getElementById('questionBox')
const answerBox = document.getElementById('answerBox')
const dataBox = document.getElementById('dataBox')
    // create trebek
const trebek = document.getElementsByClassName('trebek')
    // initialize variables to store data to display (empty string for strings/zero for nums such as score, streak, etc.)
let streak = 0
let category, question, answer, value, date, data = "";
// let correctCount = 0, wrongCount = 0, bestStreak = 0;

// Error messages themed for the game:
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
console.log(`Welcome to Jeopardish!!!`)
console.log(`Click the "new question" button to grab a random Jeopardy question & test your knowledge.`)
console.log(`Multiple correct answers in a row will start a streak...`)
console.log(`...but get one wrong & the streak will reset.`)
console.log("Let's see how many correct answers you can string together! ")
console.log(`Streak is currently at ` + streak)
console.log("HAVE FUN YA MANIAC!")

// clear data from previous question by resetting innerHTML for each box to an empty string
// fetch data from api and assign values to our variables for use in app
// will set to $100 as default question value in case null is returned by API due to missing data

// function to grab question from api
const getQuestion = async() => {
    try {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = 'https://cluebase.com/api/clues/random';
        const response = await axios.get(proxyUrl + apiUrl, {
            headers: {
                'Origin': 'https://yourwebsite.com'
            }
        });

        // Clear previous content
        categoryBox.innerHTML = '';
        questionBox.innerHTML = '';
        answerBox.innerHTML = '';
        userInput.value = '';

        // Fetch a random clue
        // let response = await axios.get('https://cluebase.com/api/clues/random');
        console.log('-- New random Jeopardy clue --');
        console.log(response.data);

        if (response.data.status === "success" && response.data.data.length > 0) {
            let clue = response.data.data[0]; // Since limit is set to 1 by default, we use the first item in the array

            // Display in word bubble
            categoryBox.innerHTML = clue.category.toUpperCase() + '<br/> for $' + clue.value;
            questionBox.innerHTML = clue.clue;
            answerBox.innerHTML = clue.response;

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
}

// const getQuestion = async() => {
//     try {
//         categoryBox.innerHTML = '';
//         questionBox.innerHTML = '';
//         answerBox.innerHTML = '';
//         userInput.value = '';

//         let response = await axios.get(randomQuestion);
//         console.log('-- New random Jeopardy question --');
//         console.log(response.data);

//         let category = response.data.category;
//         let question = response.data.question;
//         let answer = response.data.answer || 'Unknown';
//         let value = response.data.value || '$100';
//         let airdate = response.data.airdate || 'Unknown';

//         categoryBox.innerHTML = category.toUpperCase() + '<br/> for $' + value + '<br/> (asked on ' + airdate + ')';
//         questionBox.innerHTML = question;
//         answerBox.style.display = 'none';
//     } catch (error) {
//         console.error('Failed to fetch question:', error);
//         // Randomly select a joke error from array defined above
//         let randomError = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
//         categoryBox.innerHTML = randomError.category + '<br/> for ' + randomError.value;
//         questionBox.innerHTML = randomError.question;
//         answerBox.innerHTML = randomError.answer;
//         answerBox.style.display = 'block';
//     }
// };

// reveal or hide answer - answerBox div starts as hidden, 
const showHideAnswer = () => {
    if (answerBox.style.display === "none") {
        answerBox.style.display = "flex"
    } else {
        answerBox.style.display = "none"
    }
}

// add event listeners for button functionality
answerButton.addEventListener('click', showHideAnswer)
questionButton.addEventListener('click', getQuestion)

// add event listener to use Enter to submit answer
userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
})

// checkAnswer function checks userInput vs correctAnswer
const checkAnswer = () => {
    let correctAnswer = answerBox.innerHTML.trim()
    console.log({ correctAnswer })
        // if userInput matches correct answer from api:
    if (
        userInput.value == correctAnswer ||
        userInput.value.toLowerCase() == correctAnswer.toLowerCase().replace('\\', '') ||
        userInput.value.toLowerCase() == correctAnswer.toLowerCase().replace('\\', '')
    ) {
        //increment streak
        streak++
        dataBox.innerHTML = streak
        console.log("Nice job! Answer correct & streak is now: ", { streak })

        // message when answer is correct
        categoryBox.innerHTML = ""
        questionBox.innerHTML = "I'm Canadianly delighted to report you're correct, sir or madame! I like how you think!!  You're beautiful & well-liked by all.."
        answerBox.innerHTML = "Correct answer streak is now " + streak
    } else {
        categoryBox.innerHTML = "";
        questionBox.innerHTML = "I'm sorry, that's either incorrect or the judges are...It could be them since they're drunk.";
        answerBox.style.display = "flex"
        answerBox.innerHTML = `The correct answer was..` + `<br/>` + `<br/>` +
            correctAnswer + `<br/>` + `<br/>` +
            `STREAK RESET!`;

        // reset streak
        streak = 0;
        console.log("streak reset to:", { streak })
    }

}


// CHAT GPT SUGGESTED GET QUESTION FUNCTION:
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

// SAMPLE API RESPONSE FROM JSERVICE.IO API:
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


// POSSIBLE TO DO ITEMS:
// remove 'the' from answer (also a, an, etc?)
// remove quotes
// just use RegEx?
// change window alert to modal
// implement streak counter into page
// check for partial correct answer - if given answer is 
// contained in the answer but not exactly correct word for word
// add function to track best streak of answers correct in each game
// add intro animation & title screen
// add reset/new game button to reset
// add signup/login functionality, for saving of high scores. online competition, possible multiplayer
// display streak in dataBox
// figure out what other info to display there as well



// RANDOM INDEX:
// const randomIndex = Math.floor(Math.random() * 1000);

// || userInput.value.toLowerCase().includes(answer).toLowerCase().replace('\\', '')