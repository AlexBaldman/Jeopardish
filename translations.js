const translations = {
    en: {
        checkButton: "Check Answer",
        answerButton: "Show Answer",
        questionButton: "New Question",
        categoryLabel: "Category",
        valueLabel: "Value",
        correctMessage: "Correct!",
        incorrectMessage: "Sorry, that's incorrect.",
        streakMessage: "Current Streak:",
        bestStreakMessage: "Best Streak:",
        inputPlaceholder: "Your answer here...",
        flag: "",
        "WORDS IN JEOPARDY!": "WORDS IN JEOPARDY!",
    },
    pt: {
        checkButton: "Verificar Resposta",
        answerButton: "Mostrar Resposta",
        questionButton: "Nova Pergunta",
        categoryLabel: "Categoria",
        valueLabel: "Valor",
        correctMessage: "Correto!",
        incorrectMessage: "Desculpe, está incorreto.",
        streakMessage: "Sequência Atual:",
        bestStreakMessage: "Melhor Sequência:",
        inputPlaceholder: "Sua resposta aqui...",
        flag: "",
        "WORDS IN JEOPARDY!": "PALAVRAS EM JEOPARDY!",
    }
};

let currentLanguage = localStorage.getItem('language') || 'en';

// Track if we're currently updating to prevent loops
let isUpdating = false;

async function translateText(text, targetLang) {
    if (!text) return text;
    
    // Remove surrounding quotes if they exist
    const cleanText = text.replace(/^['"](.*)['"]$/, '$1');
    
    console.log('Translating:', cleanText, 'to', targetLang);
    
    try {
        // Always translate from the opposite language of the target
        const sourceLang = targetLang === 'pt' ? 'en' : 'pt';
        
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${sourceLang}|${targetLang}`;
        console.log('Translation URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        console.log('Translation response:', data);
        
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }
        
        console.log('Translation failed:', data.responseStatus);
        return cleanText;
    } catch (error) {
        console.error('Translation error:', error);
        return cleanText;
    }
}

// Clean text by removing escape characters and normalizing quotes
function cleanTextContent(text) {
    if (!text) return text;
    return text
        .replace(/\\'/g, "'")      // Replace \' with '
        .replace(/\\"/g, '"')      // Replace \" with "
        .replace(/\\\\/g, '\\');   // Replace \\ with \
}

async function updateQuestionAndAnswer(lang = currentLanguage) {
    if (!window.currentQuestion) {
        console.log('No current question to translate');
        return;
    }

    // Prevent update loops
    if (isUpdating) {
        console.log('Already updating, skipping...');
        return;
    }

    console.log('Updating question and answer for language:', lang);
    isUpdating = true;

    try {
        // Clean and translate question
        const cleanQuestion = cleanTextContent(window.currentQuestion.question);
        const translatedQuestion = await translateText(cleanQuestion, lang);
        if (translatedQuestion) {
            window.currentQuestion.translatedQuestion = translatedQuestion;
        }

        // Clean and translate answer
        const cleanAnswer = cleanTextContent(window.currentQuestion.answer);
        const translatedAnswer = await translateText(cleanAnswer, lang);
        if (translatedAnswer) {
            window.currentQuestion.translatedAnswer = translatedAnswer;
        }

        // Clean and translate category
        const cleanCategory = cleanTextContent(window.currentQuestion.category);
        const translatedCategory = await translateText(cleanCategory, lang);
        if (translatedCategory) {
            window.currentQuestion.translatedCategory = translatedCategory;
        }

        // Update display with translated content
        displayTranslatedQuestion({
            ...window.currentQuestion,
            question: window.currentQuestion.translatedQuestion || cleanQuestion,
            answer: window.currentQuestion.translatedAnswer || cleanAnswer,
            category: window.currentQuestion.translatedCategory || cleanCategory
        });

    } catch (error) {
        console.error('Translation error:', error);
    } finally {
        isUpdating = false;
    }
}

// Store the original display function
let originalDisplayQuestion = null;

// Update display function to not trigger translations
function displayTranslatedQuestion(questionData) {
    console.log('Display translated question called with:', questionData);
    if (originalDisplayQuestion) {
        originalDisplayQuestion(questionData);
    }
}

function hookIntoDisplayQuestion() {
    if (window.displayQuestion && !originalDisplayQuestion) {
        console.log('Found displayQuestion function, hooking in...');
        originalDisplayQuestion = window.displayQuestion;
        
        // Replace the global display function
        window.displayQuestion = function(question) {
            console.log('Display question intercepted:', question);
            window.currentQuestion = question;
            
            // For English, just display normally
            if (currentLanguage === 'en') {
                originalDisplayQuestion(question);
                return;
            }
            
            // For other languages, translate first
            if (!isUpdating) {
                updateQuestionAndAnswer(currentLanguage)
                    .then(() => {
                        console.log('Translation complete');
                    })
                    .catch(error => {
                        console.error('Translation failed:', error);
                        // Fallback to original text
                        originalDisplayQuestion(question);
                    });
            } else {
                console.log('Translation already in progress, using original display');
                originalDisplayQuestion(question);
            }
        };
    } else if (!window.displayQuestion) {
        console.log('displayQuestion not found, retrying in 500ms');
        setTimeout(hookIntoDisplayQuestion, 500);
    }
}

function toggleLanguage() {
    console.log('Toggling language from', currentLanguage);
    currentLanguage = currentLanguage === 'en' ? 'pt' : 'en';
    console.log('to', currentLanguage);
    
    // Save preference
    localStorage.setItem('language', currentLanguage);
    
    // Update button appearance
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.setAttribute('data-lang', currentLanguage);
    }
    
    // Update translations
    updateQuestionAndAnswer(currentLanguage);
}

function updatePageLanguage() {
    console.log('Updating page language to:', currentLanguage);
    
    const elements = {
        'checkButton': document.getElementById('checkButton'),
        'answerButton': document.getElementById('answerButton'),
        'questionButton': document.getElementById('questionButton'),
        'inputBox': document.getElementById('inputBox')
    };

    for (const [key, element] of Object.entries(elements)) {
        if (element) {
            if (key === 'inputBox') {
                element.placeholder = translations[currentLanguage].inputPlaceholder;
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        } else {
            console.warn(`Element ${key} not found`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Translations: DOM loaded - initializing language system');
    setTimeout(initializeLanguageSystem, 500);
});

function initializeLanguageSystem() {
    const langBtn = document.getElementById('lang-btn');
    const langText = document.querySelector('.lang-text');
    
    if (!langBtn || !langText) {
        console.error('Language button elements not found, retrying in 500ms');
        setTimeout(initializeLanguageSystem, 500);
        return;
    }
    
    console.log('Found language button elements, initializing...');
    
    langBtn.setAttribute('data-lang', currentLanguage);
    langText.innerHTML = `${translations[currentLanguage].flag} ${currentLanguage.toUpperCase()}`;
    
    updatePageLanguage();
    
    langBtn.addEventListener('click', (e) => {
        console.log('Language button clicked');
        e.preventDefault();
        toggleLanguage();
    });
    
    console.log('Language button initialized with currentLanguage:', currentLanguage);
    
    hookIntoDisplayQuestion();
}