/**
 * Answer Validation Utility Module
 * Handles comparing user answers with correct answers
 */

/**
 * Compare user answer with correct answer
 * @param {string} userAnswer - The user's answer
 * @param {string} correctAnswer - The correct answer
 * @returns {boolean} Whether the answer is correct
 */
export function compareAnswers(userAnswer, correctAnswer) {
  console.group('🎯 Answer Comparison');
  console.log('User Answer:', userAnswer);
  console.log('Correct Answer:', correctAnswer);
  
  const cleanedUser = cleanAnswer(userAnswer);
  const cleanedCorrect = cleanAnswer(correctAnswer);
  console.log('Cleaned User Answer:', cleanedUser);
  console.log('Cleaned Correct Answer:', cleanedCorrect);
  
  // Split correct answers into an array (handles multiple acceptable answers)
  // First clean the entire answer, then split by comma if it contains commas
  const correctAnswersArray = correctAnswer.includes(',') 
    ? correctAnswer.split(',').map(ans => cleanAnswer(ans.trim()))
    : [cleanedCorrect];
  
  // Check if user's answer matches any of the correct answers
  const isCorrect = correctAnswersArray.some(correct => {
    // Exact match
    if (cleanedUser === correct) return true;
    
    // Check if user answer contains the correct answer
    if (cleanedUser.includes(correct) && correct.length > 3) return true;
    
    // Check if correct answer contains user answer (for partial credit)
    if (correct.includes(cleanedUser) && cleanedUser.length > 3) return true;
    
    // Fuzzy matching for close answers
    return isCloseMatch(cleanedUser, correct);
  });
  
  console.log('Match Result:', isCorrect ? '✅ Accepted' : '❌ Rejected');
  console.groupEnd();
  
  return isCorrect;
}

/**
 * Clean answer by removing articles, punctuation, and normalizing
 * @param {string} answer - Answer to clean
 * @returns {string} Cleaned answer
 */
export function cleanAnswer(answer) {
  if (!answer) return '';
  
  // Convert to lowercase and trim
  let cleaned = answer.toLowerCase().trim();
  
  // Remove leading articles (a, an, the)
  cleaned = cleaned.replace(/^(a|an|the)\s+/i, '');
  
  // Remove parentheses and their contents
  cleaned = cleaned.replace(/\s*\([^)]+\)\s*/g, '').trim();
  
  // Remove backslashes
  cleaned = cleaned.replace(/\\/g, '');
  
  // Remove punctuation and extra spaces
  cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  console.log(`🧹 Cleaned answer: "${answer}" → "${cleaned}"`);
  return cleaned;
}

/**
 * Check if two strings are a close match (allowing for minor typos)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {boolean} Whether strings are close enough
 */
function isCloseMatch(str1, str2) {
  // If strings are very short, require exact match
  if (str1.length <= 3 || str2.length <= 3) {
    return str1 === str2;
  }
  
  // Calculate Levenshtein distance
  const distance = getLevenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  // Allow up to 20% difference for longer answers
  const threshold = Math.ceil(maxLength * 0.2);
  
  return distance <= threshold;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function getLevenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return dp[m][n];
}

/**
 * Get array of silly insults for cheating attempts
 * @returns {string} Random silly insult
 */
export function getRandomInsult() {
  const sillyInsults = [
    "scallywag",
    "scallawag",
    "ne'er-do-well",
    "rapscallion",
    "miscreant",
    "knave",
    "rascal",
    "trickster",
    "sneak",
    "rogue",
    "charlatan",
    "shenanigator",
    "cheeky monkey",
    "sly fox",
    "scofflaw",
    "mischief-maker",
    "rule-bender",
    "rascalicious one",
    "cunning linguist",
    "sneaky pete",
    "devious genius"
  ];
  
  return sillyInsults[Math.floor(Math.random() * sillyInsults.length)];
}

/**
 * Get array of cheeky comments for peeking at answers
 * @returns {string} Random cheeky comment
 */
export function getCheekyComment() {
  const cheekyComments = [
    "Nah uh buddy, not so fast! Trying to cheat?!!",
    "Nice try! Peeking at answers doesn't count!",
    "Oh come on, you already saw the answer!",
    "Hmm, suddenly you know the answer? How suspicious...",
    "Sorry, no points when you've already peeked!",
    "I see what you did there! No credit after peeking!",
    "Cheaters never prosper... but you can still try the next question!"
  ];
  
  return cheekyComments[Math.floor(Math.random() * cheekyComments.length)];
}
