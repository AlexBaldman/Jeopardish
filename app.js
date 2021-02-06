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

    categoryBox.innerHTML += category.toUpperCase();
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
  }
} 

answerButton.addEventListener('click', showHideAnswer)

questionButton.addEventListener('click', getQuestion)



// ----------------------
//
// MAY USE AS WELL:
      // let value = response.data[0].value
      // let airdate = response.data[0].airdate
//
// ----------------------
//
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
//   
// --------------------------------------------
