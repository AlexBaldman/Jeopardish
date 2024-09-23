const apiUrl = 'https://cluebase.lukelav.in/clues/random';

let questions = [];
const questionFiles = ['questions/questions.csv', 'questions/questions.json'];

async function fetchFromAPI() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error:", error.message);
        console.log("🎭 Looks like our API is taking an unscheduled intermission. Don't worry, we've got some local talent waiting in the wings!");
        return null;
    }
}

async function loadLocalQuestions() {
    for (const file of questionFiles) {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const fileExtension = file.split('.').pop().toLowerCase();
            let data;
            if (fileExtension === 'json') {
                data = await response.json();
            } else if (fileExtension === 'csv') {
                const text = await response.text();
                data = parseCSV(text);
            } else {
                throw new Error(`Unsupported file type: ${fileExtension}`);
            }
            questions = questions.concat(data);
        } catch (error) {
            console.error(`Error loading ${file}:`, error.message);
        }
    }
    if (questions.length === 0) {
        console.log("📚 Our local question library seems to be on vacation. Time for some improv!");
        return false;
    }
    console.log(`📘 Loaded ${questions.length} questions from local files.`);
    return true;
}

function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(value => value.trim());
        if (values.length !== headers.length) {
            console.warn(`Skipping malformed line: ${line}`);
            return null;
        }
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    }).filter(row => row !== null);
}

function displayQuestion(question) {
    const categoryBox = document.getElementById('categoryBox');
    const questionBox = document.getElementById('questionBox');
    const valueBox = document.getElementById('valueBox');
    const dateBox = document.getElementById('dateBox');
    const difficultyBox = document.getElementById('difficultyBox');
    const timesUsedBox = document.getElementById('timesUsedBox');
    const contestantBox = document.getElementById('contestantBox');
    const episodeBox = document.getElementById('episodeBox');
    const answerBox = document.getElementById('answerBox');

    categoryBox.textContent = question.category;
    questionBox.textContent = question.question;
    valueBox.textContent = `$${question.value}`;
    dateBox.textContent = `Aired on: ${new Date(question.airdate).toLocaleDateString()}`;
    
    // New information
    if (question.difficulty) {
        difficultyBox.textContent = `Difficulty: ${question.difficulty}`;
    }
    if (question.times_used) {
        timesUsedBox.textContent = `Used ${question.times_used} times`;
    }
    if (question.contestant) {
        contestantBox.textContent = `Answered by: ${question.contestant}`;
    }
    if (question.season && question.episode) {
        episodeBox.textContent = `Season ${question.season}, Episode ${question.episode}`;
    }
    
    // Hide the answer initially
    answerBox.textContent = '';
    answerBox.style.display = 'none';
}

async function getNewQuestion() {
    try {
        // Try API first
        const apiQuestion = await fetchFromAPI();
        if (apiQuestion) {
            displayQuestion(normalizeQuestionData(apiQuestion));
            return;
        }

        // If API fails, use local questions
        if (questions.length === 0) {
            const localQuestionsLoaded = await loadLocalQuestions();
            if (!localQuestionsLoaded) {
                displayErrorJoke();
                return;
            }
        }

        if (questions.length === 0) {
            throw new Error("No questions available");
        }

        const randomIndex = Math.floor(Math.random() * questions.length);
        const selectedQuestion = questions[randomIndex];
        questions.splice(randomIndex, 1);
        displayQuestion(normalizeQuestionData(selectedQuestion));
    } catch (error) {
        console.error("Failed to get new question:", error);
        displayErrorJoke();
    }
}

function normalizeQuestionData(question) {
    return {
        category: question.category?.title || question.category,
        question: question.question || question.clue,
        answer: question.answer,
        value: question.value || 200,
        airdate: question.airdate || new Date().toISOString(),
        difficulty: question.difficulty || 'Unknown',
        times_used: question.times_used || 1,
        contestant: question.contestant || 'Unknown',
        season: question.season || 'Unknown',
        episode: question.episode || 'Unknown'
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');
    
    const answerButton = document.getElementById('answerButton');
    const questionButton = document.getElementById('questionButton');
    const checkButton = document.getElementById('checkButton');
    const userInput = document.getElementById('inputbox');

    // Attach event listeners
    answerButton.addEventListener('click', showHideAnswer);
    questionButton.addEventListener('click', getNewQuestion);
    checkButton.addEventListener('click', checkAnswer);
    
    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            checkAnswer();
        }
    });
    
    // Initial question load
    await getNewQuestion();
});