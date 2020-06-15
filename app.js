// pulling data from api

const url = "https://jservice.io/api/random"

// assigning variables by grabbing elements with the DOM

const button = document.getElementById('button')
const questionBox = document.getElementById('questionBox')
const answerBox = document.getElementById('answerBox')
const trebek = document.getElementsByClassName('trebek')

// clears out innerHTML from Q and A boxes before repoppulating
// asyncronously grabs api response & assigning specific data types to variables for
// category, question, answer 

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

  } catch (error) {
    console.log(`This is your error: ${error}`)
  }
}

// add EventListener to call the getQuestion function
// again clearing the previous one, and repopulating
// with a new question and answer

button.addEventListener('click', getQuestion)
