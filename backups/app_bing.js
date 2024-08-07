// This function gets a random question from the API and displays it on the screen
async function getQuestion() {
  // Get the category and difficulty from the user input
  const category = document.getElementById("category").value;
  const difficulty = document.getElementById("difficulty").value;

  // Construct the API URL with the parameters
  const url = `http://jservice.io/api/clues?category=${category}&value=${difficulty}`;

  // Fetch the data from the API and parse it as JSON
  const response = await fetch(url);
  const data = await response.json();

  // Check if there is a valid question in the data
  if (data.length > 0) {
    // Get a random question object from the data
    const question = data[Math.floor(Math.random() * data.length)];

    // Display the question and the category on the screen
    document.getElementById("question").innerHTML = question.question;
    document.getElementById("category-display").innerHTML =
      question.category.title;

    // Get the correct answer from the question object
    const correctAnswer = question.answer;

    // Store the correct answer in a hidden input element for later use
    document.getElementById("correct-answer").value = correctAnswer;

    // Enable the submit answer button and clear the text box
    document.getElementById("submit-answer").disabled = false;
    document.getElementById("user-answer").value = "";
  } else {
    // If there is no valid question, display an error message and disable the submit answer button
    document.getElementById("question").innerHTML =
      "Sorry, no question found. Please try a different category or difficulty.";
    document.getElementById("category-display").innerHTML = "";
    document.getElementById("submit-answer").disabled = true;
  }
}

// This function checks if the user's answer is correct and updates the score and feedback accordingly
function checkAnswer() {
  // Get the user's answer from the text box
  let userAnswer = document.getElementById("user-answer").value;

  // Get the correct answer from the hidden input element
  let correctAnswer = document.getElementById("correct-answer").value;

  // Get the user's score and feedback elements from the document
  const scoreElement = document.getElementById("score");
  const feedbackElement = document.getElementById("feedback");

  // Compare the user's answer with the correct answer and update the score and feedback accordingly

  /* Original code:
  
  userAnswer = userAnswer.toLowerCase();
  correctAnswer = correctAnswer.toLowerCase();

  if (userAnswer == correctAnswer) {
    scoreElement.innerHTML = parseInt(scoreElement.innerHTML) + 1;
    feedbackElement.innerHTML = "Correct!";
    feedbackElement.classList.add("correct");
    feedbackElement.classList.remove("incorrect");
  } else {
    feedbackElement.innerHTML = `Incorrect! The correct answer was: ${correctAnswer}`;
    feedbackElement.classList.add("incorrect");
    feedbackElement.classList.remove("correct");
  }

  */

  // New code:

  // Use a regular expression to remove any articles, HTML tags, quotation marks, and whitespace from both answers before comparing them
  userAnswer = removeArticles(userAnswer);
