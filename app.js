// IMPLEMENT RIGHT / WRONG COUNTER


const url = 'https://jservice.io/api/random'
const button = document.getElementById('checkButton')
const answerButton = document.getElementById('answerButton')
const questionButton = document.getElementById('questionButton')
const categoryBox = document.getElementById('categoryBox')
const questionBox = document.getElementById('questionBox')
const answerBox = document.getElementById('answerBox')
const trebek = document.getElementsByClassName('trebek')
const userInput = document.getElementById('inputbox');

let counter = 0

const getQuestion = async() => {
  try {
    categoryBox.innerHTML = '';
    questionBox.innerHTML = '';
    answerBox.innerHTML = '';
    userInput.value = '';

    let response = await axios.get(url)
    let category = response.data[0].category.title
    let question = response.data[0].question
    let answer = response.data[0].answer
    let value = response.data[0].value

    categoryBox.innerHTML += category.toUpperCase() + `<br/> $` + value;
    questionBox.innerHTML += question
    answerBox.innerHTML += answer;
    answerBox.style.display = "none";
  } catch(error) {
    console.log(`Question fetch failed: ${error}`)
  }
}

function showHideAnswer() {
  if (answerBox.style.display === "none") {
    answerBox.style.display = "flex";
    } else {
    answerBox.style.display = "none";
  } // answer will be hidden until showHideAnswer() is called, revealing answer by changing display to flex,
} // if answer already revealed, will re-hide

answerButton.addEventListener('click', showHideAnswer)
questionButton.addEventListener('click', getQuestion)

function checkAnswer() {
  let answer = answerBox.innerHTML
  if (userInput.value == answer.replace('\\', '') || userInput.value.toLowerCase() == answer.toLowerCase().replace('\\', '')) {
      //user has inputted the correct string
      window.alert("I am Canadianly delighted to report you are correct, sir or madame! I like how you think!!");
      //streak counter increments
      counter++;
  } else {
      //user has inputted an incorrect string
      window.alert("I'm sorry, that's either incorrect or the judges are...  It could be them, they're a little drunk...");
      //reset streak counter
      counter = 0;
  }
}

// const randomIndex = Math.floor(Math.random() * // INSERT ARRAY OF GIFS HERE TO GRAB A RANDOM GIF O)

// NEED TO ADD ABILITY TO CHECK TO SEE IF PARTIAL ANSWER GIVEN 
// ALSO REMOVE 'a ' or 'the ' so that they don't need to be in
// || userInput.value.toLowerCase().includes(answer).toLowerCase().replace('\\', '')




//-----------------------------------------------------------
// MAY USE AS WELL FOR QUESTION INFORMATION BOX/CONTAINER:
      // let value = response.data[0].value
      // let airdate = response.data[0].airdate
      // --------------------------------------

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
      // -------------------------------------------
