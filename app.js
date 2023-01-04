// api url for random question::
const url = 'https://jservice.io/api/random'

// create buttons for basic functionality & user interaction
const button = document.getElementById('checkButton')
const answerButton = document.getElementById('answerButton')
const questionButton = document.getElementById('questionButton')

// create userInput box for entering answe
const userInput = document.getElementById('inputbox');

// use separate boxes to distribute data within word-bubble
const categoryBox = document.getElementById('categoryBox')
const questionBox = document.getElementById('questionBox')
const answerBox = document.getElementById('answerBox')
const trebek = document.getElementsByClassName('trebek')

// initialize correct Answer Streak at zero
let streak = 0

// clear data from previous question by resetting innerHTML for each box to an empty string
// fetch data from api and assign values to our variables for use in app
// will set to $100 as default question value in case null is returned by API due to missing data
// place question/answer and other data into app:
const getQuestion = async() => {
  try 
    {
    categoryBox.innerHTML = ''
    questionBox.innerHTML = ''
    answerBox.innerHTML = ''
    userInput.value = ''

    let response = await axios.get(url)
    let category = response.data[0].category.title
    let question = response.data[0].question
    let answer = response.data[0].answer 
    let value = response.data[0].value || '$100' 
    let date = new Date(response.data[0].airdate) 
    let datestring = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear()
    
    categoryBox.innerHTML += category.toUpperCase() + `<br/> for $` + value + `<br/>` + '(asked on ' + datestring + ' )'
    questionBox.innerHTML += question
    answerBox.innerHTML += answer
    answerBox.style.display = "none"
    } 
  catch(error) 
    {
      console.log(`Question fetch failed: ${error}`)
    }
}

// the showHideAnswer button TOGGLES to show you what the answer isArray
// for now this is helping a lot with figuring out what needs to be modified
// to increase accuracy of checkAnswer() function & eliminate undesired non-matches
const showHideAnswer = () => {
  if (answerBox.style.display === "none") 
    {
    answerBox.style.display = "flex"; 
    } 
  else 
    {
    answerBox.style.display = "none";
    }
} 

// add event listeners to buttons to trigger functionality
answerButton.addEventListener('click', showHideAnswer)
questionButton.addEventListener('click', getQuestion)

// FUNCTION TO CHECK IF USER ANSWER MATCHES CORRECT ANSWER FROM API:
  // if correct, alert success & streak counter increments +1
  // window.alert("I am Canadianly delighted to report you are correct, sir or madame! I like how you think!!!");
  // if incorrect, user has inputted an incorrect string
  // streak resets when incorrect
const checkAnswer = () => {
  let answer = answerBox.innerHTML
  let answerTrimmed = answer.trim
  // CONSOLE LOGGING TO TEST
  console.log(answer)
  console.log(answerTrimmed)

  if 
    (
    userInput.value.toLowerCase() == answer.toLowerCase().replace('\\', '') || 
    userInput.value.toLowerCase() == answer.toLowerCase().replace('\\', '')
    ) 
      {
        //increment streak
        streak++
        console.log(streak)

        questionBox.innerHTML = "I am Canadianly delighted to report you are correct, sir or madame! I like how you think!!!  You are beautiful and well-liked by all..";
        categoryBox.innerHTML = "CORRECT!!!";
        answerBox.innerHTML = "Correct Answer Streak: " + streak;
      } 
    else 
      {  
        categoryBox.innerHTML = "NOPE!!!";
        questionBox.innerHTML = "I'm sorry, that's either incorrect or the judges are...  It could be them, they're a bit drunk...";
        answerBox.style.display = "flex"
        answerBox.innerHTML = `Correct answer:` + `<br/>` + `<br/>` +
                                answer + `<br/>` + `<br/>` +
                              `STREAK RESET!!!`;
        // reset streak
        streak = 0; 
      }






}

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