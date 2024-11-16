function checkAnswer() {
    if (answerWasRevealed) {
        // If the answer was revealed, reset the streak and score, and display a snarky message
        currentStreak = 0;
        currentScore = 0;
        displaySnarkyMessage();
        updateScoreBoard();
        getNewQuestion(); // Automatically move to the next question
        return;
    }

    if (!answerBox.innerHTML.trim()) {
        // Allow moving to the next question without error if the user just got it wrong
        if (currentStreak === 0) {
            getNewQuestion(); // Automatically get a new question if the streak is reset
            return;
        }
        displayErrorMessage('No answer available. Has a question been loaded?');
        return;
    }

    let originalAnswer = answerBox.innerHTML.trim();
    let correctAnswer = cleanAnswer(originalAnswer);
    let userAnswerCleaned = cleanAnswer(userInput.value);

    if (!userAnswerCleaned) {
        // Allow moving to the next question without error if the user just got it wrong
        if (currentStreak === 0) {
            getNewQuestion(); // Automatically get a new question if the streak is reset
            return;
        }
        displayErrorMessage('User input is empty');
        return;
    }

    if (compareAnswers(userAnswerCleaned, correctAnswer)) {
        currentStreak++;
        currentScore += parseInt(currentQuestion.value.replace('$', ''), 10);
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }
        if (currentScore > bestScore) {
            bestScore = currentScore;
        }
        displayCorrectAnswerMessage();
        checkButton.dataset.correctAnswer = 'true';
    } else {
        currentStreak = 0;
        currentScore = 0;
        displayIncorrectAnswerMessage(originalAnswer);
        delete checkButton.dataset.correctAnswer;
    }

    updateScoreBoard();
    userInput.value = '';
    userInput.blur(); // Defocus the input box after submission
}

function displaySnarkyMessage() {
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = "Nice try! But you can't just copy the answer and expect to get points. Better luck next time!";
    answerBox.style.display = "flex";
    answerBox.innerHTML = "";
    showingMessage = true;
}

