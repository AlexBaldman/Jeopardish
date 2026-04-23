(function initLogic(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishLogic = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function logicFactory() {
  'use strict';

  function cleanAnswer(answer) {
    return String(answer || '')
      .toLowerCase()
      .replace(/^(what|who|where|when)\s+(is|are|was|were)\s+/i, '')
      .replace(/^(a|an|the)\s+/i, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  function getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, () => []);

    for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i += 1) {
      for (let j = 1; j <= a.length; j += 1) {
        const cost = b[i - 1] === a[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[b.length][a.length];
  }

  function compareAnswers(userAnswerRaw, correctAnswerRaw) {
    const userAnswer = cleanAnswer(userAnswerRaw);
    const correctAnswer = cleanAnswer(correctAnswerRaw);

    if (!userAnswer || !correctAnswer) {
      return false;
    }

    if (userAnswer === correctAnswer) {
      return true;
    }

    const levenshteinDistance = getLevenshteinDistance(userAnswer, correctAnswer);
    return levenshteinDistance <= Math.min(3, Math.floor(correctAnswer.length / 2));
  }

  function parseClueValue(value, fallback = 100) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }

    if (typeof value === 'string') {
      const digits = value.replace(/[^0-9]/g, '');
      const parsed = Number(digits);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return fallback;
  }

  return {
    cleanAnswer,
    getLevenshteinDistance,
    compareAnswers,
    parseClueValue,
  };
}));
