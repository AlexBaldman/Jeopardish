const url = 'https://jservice.io/api/random'

const button = document.getElementById('button')
const questionBox = document.getElementById('questionBox')
const answerBox = document.getElementById('answerBox')
const trebek = document.getElementsByClassName('trebek')

const getQuestion = async () => {
  try {
    questionBox.innerHTML = ''
    answerBox.innerHTML = ''
    
    
    let response = await axios.get(url)
    let category = response.data[0].category.title
    let question = response.data[0].question
    let answer = response.data[0].answer
    
    console.log(category)
    console.log(question)
    console.log(answer)
   
    questionBox.innerHTML += question;
    answerBox.innerHTML += answer;
  } 
  catch(error) {
    console.log(`This is your error: ${error}`)
  }
}



button.addEventListener('click', getQuestion)


// set API url,
// assign variables to certain items, 
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
