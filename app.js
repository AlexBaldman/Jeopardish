const url = 'https://jservice.io/api/random'

const button = document.getElementById('button')
const answerButton = document.getElementById('answerButton')
const questionButton = document.getElementById('questionButton')
const categoryBox = document.getElementById('categoryBox')
const questionBox = document.getElementById('questionBox')
const answerBox = document.getElementById('answerBox')
const trebek = document.getElementsByClassName('trebek')

const getQuestion = async () => {
  try {
    categoryBox.innerHTML = '';
    questionBox.innerHTML = '';
    answerBox.innerHTML = '';
   
    let response = await axios.get(url)
    let category = response.data[0].category.title
    let question = response.data[0].question
    let answer = response.data[0].answer
    // let image = respons.data[0].image
   
    categoryBox.innerHTML += category.toUpperCase();
    questionBox.innerHTML += question
    answerBox.innerHTML += answer;
    answerBox.style.display="none";
  } 
  catch(error) {
    console.log(`Random question request failed: ${error}`)
  }
}

function showHideAnswer() {
  if (answerBox.style.display === "none") {
    answerBox.style.display = "flex";
    } else {
    answerBox.style.display = "none";
  }
} 

answerButton.addEventListener('click', showHideAnswer)
questionButton.addEventListener('click', getQuestion)

// set API url,
// assign variables to page items
// select via DOM by id or class

// clear out innerHTML from questionBox & answerBox 
// before re-populating w. new question/answer

// asynchronously grab API response &
// create variables for:
// category, question, answer 

// trebek.addEventListener('click', clearBox)
// const clearBox = 

// add EventListener to button to
// to call getQuestion() function on the action 'click',
// again, clearing the previous question and repopulating
// with a new question / answer pair.
