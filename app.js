// TO DO ITEMS
// - display streak in dataBox
// - figure out what other info to display there as well


// api url for random question::
const random = 'https://jservice.io/api/random'

//api url for final jeopardy questions:
const final = 'https://jservice.io/api/final'

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
const trebek = document.getElementsByClassName('trebek')
const dataBox = document.getElementsById('dataBox')

// set certain variables as empty strings, to be updated after API calls
let category, question, answer, value, date, data = "";

// initialize streak at zero
let streak = 0

// introduce the game to those following along in the console
console.log(`Welcome to Jeopardish!!!`)
console.log(`Click the "new question" button to grab a random Jeopardy question & test your knowledge.`)
console.log(`Multiple correct answers in a row will start a streak...`)
console.log(`...but get one wrong & the streak will reset.`)
console.log("Let's see how many correct answers you can string together! ")
console.log(`Streak is currently at ` + streak )
console.log("HAVE FUN YA MANIAC!")

// clear data from previous question by resetting innerHTML for each box to an empty string
// fetch data from api and assign values to our variables for use in app
// will set to $100 as default question value in case null is returned by API due to missing data

// function to grab question from api
const getQuestion = async() => {
  try {
    // reset word bubble to empty, removing any previous content
    categoryBox.innerHTML = ''
    questionBox.innerHTML = ''
    answerBox.innerHTML = ''
    userInput.value = ''

    // grab question from api
    let response = await axios.get(random)
    console.log(`--new random Jeopardy question--`)
    console.log(response.data[0])

    // set variables for the info to display in word-bubble
    let category = response.data[0].category.title
    let question = response.data[0].question
    let answer = response.data[0].answer 
    let value = response.data[0].value || '$100' 
    let date = new Date(response.data[0].airdate)
  
    // interpolating date data into a string
    let datestring = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear()

    // display in word-bubble
    categoryBox.innerHTML = category.toUpperCase() + `<br/> for $` + value + `<br/>` + '(asked on ' + datestring + ' )'
    questionBox.innerHTML = question
    answerBox.innerHTML = answer

    // set answer as invisible until revealed
    answerBox.style.display = "none"
  } 
  catch (error) {
      console.log(`question fetch failed: ${error}`)
  }
}

// reveal or hide answer - answerBox div starts as hidden, 
const showHideAnswer = () => {
  if (answerBox.style.display === "none") 
    {
    answerBox.style.display = "flex"
    } 
  else 
    {
    answerBox.style.display = "none"
    }
} 

// add event listeners to buttons to trigger functionality
answerButton.addEventListener('click', showHideAnswer)
questionButton.addEventListener('click', getQuestion)
userInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    checkAnswer();
  }
})

// checkAnswer function checks userInput vs correctAnswer
const checkAnswer = () => {
  let correctAnswer = answerBox.innerHTML.trim()
  console.log( {correctAnswer} )

  // SHOULD FIRST DO ALL TRANSFORMATIONS TO 
  
  // if userInput matches correct answer from api:
  if 
    (
    userInput.value == correctAnswer ||
    userInput.value.toLowerCase() == correctAnswer.toLowerCase().replace('\\', '') || 
    userInput.value.toLowerCase() == correctAnswer.toLowerCase().replace('\\', '') 
    ) 
      {
      //increment streak
      streak++
      dataBox.innerHTML = streak
      console.log( "Nice job! Answer correct & streak is now: ", {streak} )
      
      // message when answer is correct
      categoryBox.innerHTML = ""
      questionBox.innerHTML = "I'm Canadianly delighted to report you're correct, sir or madame! I like how you think!!  You're beautiful & well-liked by all.."
      answerBox.innerHTML = "Correct answer streak is now " + streak
      } 
    else 
      {  
        categoryBox.innerHTML = "";
        questionBox.innerHTML = "I'm sorry, that's either incorrect or the judges are...It could be them since they're drunk.";
        answerBox.style.display = "flex"
        answerBox.innerHTML = `The correct answer was..` + `<br/>` + `<br/>` +
                                correctAnswer + `<br/>` + `<br/>` +
                              `STREAK RESET!`;

        // reset streak
        streak = 0;
        console.log("streak reset to:", {streak}) 
      }

}

// API NOTES:

// CLUES URL:
// api/clues
// ---------------
// OPTIONS:
// value(int): the value of the clue in dollars
// category(int): the id of the category you want to return
// min_date(date): earliest date to show, based on original air date
// max_date(date): latest date to show, based on original air date
// offset(int): offsets the returned clues. Useful in pagination
// ---------------
// RANDOM URL:
// api/random
//
// Options:
// count(int): amount of clues to return, limited to 100 at a time
//
// Final Jeopardy:
// presents random final jeopardy question. Note: all final-jeopardy questions have null value

// Url: /api/final
// Options:
// count(int): amount of clues to return, limited to 100 at a time
// /Categories
// Url: /api/categories
// Options:
// count(int): amount of categories to return, limited to 100 at a time
// offset(int): offsets the starting id of categories returned. Useful in pagination.
// /Category
// Url: /api/category
// Options:
// id(int): Required the ID of the category to return.





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
//   document.getElementById("demo").innerHTML = sometext;
// });