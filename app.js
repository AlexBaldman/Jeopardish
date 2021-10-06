const url = 'https://jservice.io/api/random'
const button = document.getElementById('checkButton')
const answerButton = document.getElementById('answerButton')
const questionButton = document.getElementById('questionButton')
const categoryBox = document.getElementById('categoryBox')
const questionBox = document.getElementById('questionBox')
const answerBox = document.getElementById('answerBox')
const trebek = document.getElementsByClassName('trebek')
const userInput = document.getElementById('inputbox');
let streak = 0


const getQuestion = async() => {
  try {
    categoryBox.innerHTML = ''; // clear previous question/answer
    questionBox.innerHTML = '';
    answerBox.innerHTML = '';
    userInput.value = '';
    let response = await axios.get(url)
    let category = response.data[0].category.title
    let question = response.data[0].question
    let answer = response.data[0].answer
    let value = response.data[0].value || '$100'
    let date = new Date(response.data[0].airdate)
    let datestring = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear()
    categoryBox.innerHTML += category.toUpperCase() + `<br/> for $` + value + `<br/>` + '( asked on ' + datestring + ' )';
    questionBox.innerHTML += question;
    answerBox.innerHTML += answer;
    answerBox.style.display = "none";
  } 
  catch(error) {
    console.log(`Question fetch failed: ${error}`)
  }
}

const showHideAnswer = () => {
  if (answerBox.style.display === "none") {
    answerBox.style.display = "flex"; 
  } else {
    answerBox.style.display = "none";
  } 
} 

answerButton.addEventListener('click', showHideAnswer)
questionButton.addEventListener('click', getQuestion)

const checkAnswer = () => {
  let answer = answerBox.innerHTML
  if (userInput.value.toLowerCase() == answer.toLowerCase().replace('\\', '') || 
      userInput.value.toLowerCase() == answer.toLowerCase().replace('\\', '') ) {
        window.alert("I am Canadianly delighted to report you are correct, sir or madame! I like how you think!!!");
        streak++; // if correct, alert success & streak counter increments
      } else {  // if incorrect, user has inputted an incorrect string
        window.alert("I'm sorry, that's either incorrect or the judges are...  It definitely could be them, they're a little drunk..."); //reset streak counter
        streak = 0; // streak resets when incorrect
  }
}

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
