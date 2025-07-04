document.addEventListener('DOMContentLoaded', () => {
    console.log('Jeopardish! All systems go. Initializing application...');

    // =================================================================================
    // 1. GLOBAL STATE & CONFIGURATION
    // =================================================================================
    let currentScore = 0, bestScore = 0, currentStreak = 0, bestStreak = 0, peekTokens = 5;
    let questions = [], currentQuestionIndex = 0, allQuestions = [], showingMessage = false;
    let currentQuestion = null, answerWasRevealed = false;
    const questionFiles = ['questions/questions.json'];
    const sillyInsults = ["scallywag", "ne'er-do-well", "rapscallion", "miscreant", "knave", "rascal", "trickster", "sneak", "rogue", "charlatan", "shenanigator", "cheeky monkey", "sly fox", "scofflaw", "mischief-maker", "rule-bender", "rascalicious one", "cunning linguist", "sneaky pete", "devious genius"];
    const cheekyComments = ["Nah uh buddy, not so fast! Trying to cheat?!!", "Nice try! Peeking at answers doesn't count!", "Oh come on, you already saw the answer!", "Hmm, suddenly you know the answer? How suspicious...", "Sorry, no points when you've already peeked!", "I see what you did there! No credit after peeking!", "Cheaters never prosper... but you can still try the next question!"];
    const jeopardyErrors = [{category: "TECHNICAL DIFFICULTIES", question: "This term describes what happens when your app can't load the local question database.", answer: "What is 'a file reading error'?", value: "$0"}, {category: "OOOPS!", question: "This famous line was uttered by every programmer ever when their code didn't work as expected.", answer: "What is 'It works on my machine'?", value: "$0"}, {category: "MYSTERY OF CODING", question: "It's the spooky thing that happens when your API call goes into the void and never returns.", answer: "What is 'the ghost in the machine'?", value: "$0"}, {category: "SOFTWARE SNAFUS", question: "This phrase is often said when an application stops working right as you show it to someone.", answer: "What is 'demo demon'?", value: "$0"}];

    // =================================================================================
    // 2. ELEMENT CACHE
    // =================================================================================
    const elements = {
        hamburgerButton: document.getElementById('hamburger-menu'),
        sideMenu: document.getElementById('side-menu'),
        themeSwitch: document.getElementById('theme-switch'),
        langButton: document.getElementById('lang-btn'),
        titleImage: document.getElementById('titleImage'),
        trebekImage: document.getElementById('trebekImage'),
        inputBox: document.getElementById('inputBox'),
        cursor: document.querySelector('.custom-cursor'),
        scoreboard: document.getElementById('scoreboard'),
        questionButton: document.getElementById('questionButton'),
        answerButton: document.getElementById('answerButton'),
        checkButton: document.getElementById('checkButton'),
        categoryBox: document.getElementById('categoryBox'),
        questionBox: document.getElementById('questionBox'),
        answerBox: document.getElementById('answerBox'),
        valueBox: document.getElementById('valueBox'),
        eventTicker: document.querySelector('.event-ticker')
    };

    // =================================================================================
    // 3. CORE LOGIC & API FUNCTIONS
    // =================================================================================
    async function loadLocalQuestions() {
        if (allQuestions.length > 0) return true;
        try {
            const response = await fetch(questionFiles[0]);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allQuestions = await response.json();
            shuffleArray(allQuestions);
            questions = allQuestions.slice(0, 500);
            currentQuestionIndex = 0;
            return true;
        } catch (error) {
            console.error(`❌ Error loading local questions:`, error.message);
            return false;
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    async function getNewQuestion() {
        showingMessage = false;
        answerWasRevealed = false;
        if (elements.inputBox) elements.inputBox.value = '';
        if (elements.answerBox) elements.answerBox.style.display = 'none';

        if (questions.length === 0 || currentQuestionIndex >= questions.length) {
            const loaded = await loadLocalQuestions();
            if (!loaded) {
                displayErrorJoke();
                return;
            }
        }
        currentQuestion = questions[currentQuestionIndex++];
        displayQuestion(normalizeQuestionData(currentQuestion));
        if (elements.inputBox) elements.inputBox.focus();
    }
    
    function normalizeQuestionData(question) {
        return {
            category: question.category?.title || question.category,
            question: question.question || question.clue,
            answer: question.answer,
            value: question.value || 200,
        };
    }

    function checkAnswer() {
        if (!elements.inputBox || !window.currentQuestion) return;
        const userAnswer = elements.inputBox.value.trim();
        if (!userAnswer) return;

        const correctAnswer = (window.currentQuestion.translatedAnswer || window.currentQuestion.answer || '');
        const isCorrect = compareAnswers(userAnswer, correctAnswer);

        if (answerWasRevealed) {
            displayCheekyMessage(isCorrect);
        } else if (isCorrect) {
            const questionValue = parseInt(String(window.currentQuestion.value).replace(/[^0-9]/g, '')) || 200;
            currentScore += questionValue;
            displayCorrectAnswerMessage();
            updateStreak(true);
        } else {
            updateStreak(false);
            displayIncorrectAnswerMessage(correctAnswer);
        }
        elements.inputBox.value = '';
    }

    function compareAnswers(userAnswer, correctAnswer) {
        const cleanedUser = cleanAnswer(userAnswer);
        const cleanedCorrect = cleanAnswer(correctAnswer);
        const correctAnswersArray = cleanedCorrect.split(',').map(answer => answer.trim());
        return correctAnswersArray.some(correct => cleanedUser.includes(correct) && correct !== "");
    }

    function cleanAnswer(answer) {
        if (!answer) return '';
        return answer.toLowerCase().trim().replace(/^(what is |who is |what are |who are )/i, '').replace(/^(a |an |the )/i, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').replace(/\s+/g, ' ').trim();
    }

    // =================================================================================
    // 4. UI & DISPLAY FUNCTIONS
    // =================================================================================
    function displayQuestion(questionData) {
        window.currentQuestion = questionData;
        if (elements.categoryBox) elements.categoryBox.textContent = questionData.category;
        if (elements.valueBox) elements.valueBox.textContent = `for $${questionData.value}`;
        if (elements.questionBox) elements.questionBox.innerHTML = questionData.question;
        if (elements.answerBox) {
            elements.answerBox.textContent = questionData.answer;
            elements.answerBox.style.display = 'none';
        }
    }

    function displayCorrectAnswerMessage() {
        if(elements.questionBox) elements.questionBox.innerHTML = `Correct! Your streak is now ${currentStreak + 1}.`;
        if(elements.answerBox) elements.answerBox.style.display = 'none';
        showingMessage = true;
        setTimeout(getNewQuestion, 2000);
    }

    function displayIncorrectAnswerMessage(correctAnswer) {
        if(elements.questionBox) elements.questionBox.innerHTML = `Oof, that's incorrect. Your streak is reset!`;
        if(elements.answerBox) {
            elements.answerBox.innerHTML = `The correct answer was: <b>${correctAnswer}</b>`;
            elements.answerBox.style.display = 'flex';
        }
        showingMessage = true;
    }
    
    function displayCheekyMessage(wasCorrect) {
        const comment = wasCorrect ? "That's correct, but you peeked! No points for you." : "You peeked and still got it wrong... yikes.";
        if(elements.questionBox) elements.questionBox.innerHTML = comment;
        updateStreak(false);
    }

    function displayErrorJoke() {
        const errorJoke = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
        if(elements.categoryBox) elements.categoryBox.innerHTML = errorJoke.category;
        if(elements.questionBox) elements.questionBox.innerHTML = errorJoke.question;
        if(elements.valueBox) elements.valueBox.innerHTML = 'for $ERROR';
    }

    function updateStreak(correct) {
        if (correct) {
            currentStreak++;
            if (currentStreak > bestStreak) bestStreak = currentStreak;
        } else {
            currentStreak = 0;
        }
        updateScoreboard();
    }

    function updateScoreboard() {
        console.log(`Score: ${currentScore}, Current Streak: ${currentStreak}, Best Streak: ${bestStreak}`);
    }

    // =================================================================================
    // 5. EVENT LISTENERS & INITIALIZATION
    // =================================================================================
    function setupEventListeners() {
        if (elements.questionButton) elements.questionButton.addEventListener('click', getNewQuestion);
        if (elements.checkButton) elements.checkButton.addEventListener('click', checkAnswer);
        if (elements.answerButton) elements.answerButton.addEventListener('click', () => {
            if (elements.answerBox) elements.answerBox.style.display = 'flex';
            answerWasRevealed = true;
        });
        if (elements.inputBox) {
            elements.inputBox.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    checkAnswer();
                }
            });
        }

        if (elements.hamburgerButton && elements.sideMenu) {
            elements.hamburgerButton.addEventListener('click', (e) => {
                e.stopPropagation();
                elements.hamburgerButton.classList.toggle('active');
                elements.sideMenu.classList.toggle('active');
            });
        }

        if (elements.themeSwitch) {
            const themeCheckbox = elements.themeSwitch.querySelector('input[type="checkbox"]');
            if (themeCheckbox) {
                themeCheckbox.addEventListener('change', () => {
                    document.body.classList.toggle('dark-mode', themeCheckbox.checked);
                });
            }
        }

        document.addEventListener('click', (event) => {
            if (elements.sideMenu && elements.hamburgerButton && elements.hamburgerButton.classList.contains('active')) {
                if (!elements.sideMenu.contains(event.target) && !elements.hamburgerButton.contains(event.target)) {
                    elements.hamburgerButton.classList.remove('active');
                    elements.sideMenu.classList.remove('active');
                }
            }
        });

        if (elements.titleImage && elements.trebekImage) {
            const trebekImages = [
                'images/trebek/trebek-good-04.png',
                'images/trebek/trebek-good-01.png',
                'images/trebek/trebek-good-02.png',
            ];
            let currentIndex = 0;
            elements.titleImage.addEventListener('click', (event) => {
                const rect = elements.titleImage.getBoundingClientRect();
                const clickX = event.clientX - rect.left;
                currentIndex = (clickX < rect.width / 2)
                    ? (currentIndex - 1 + trebekImages.length) % trebekImages.length
                    : (currentIndex + 1) % trebekImages.length;
                elements.trebekImage.src = trebekImages[currentIndex];
            });
        }
    }

    // Initial Load
    loadLocalQuestions().then(() => {
        getNewQuestion();
        setupEventListeners();
        console.log('Application initialized successfully.');
    });
});
