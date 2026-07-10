(function initLogic(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishLogic = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function logicFactory() {
  'use strict';

  const WHOLE_ANSWER_ALIASES = Object.freeze({
    unitedstates: ['us', 'usa', 'unitedstatesofamerica'],
    unitedkingdom: ['uk', 'greatbritain'],
  });

  function normalizeAnswer(answer) {
    return String(answer || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;|&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, ' and ')
      .replace(/\\/g, '')
      .trim()
      .replace(/^(?:what|who|where|when)\s+(?:is|are|was|were)\s+/i, '')
      .replace(/^what'?s\s+/i, '')
      .replace(/^(?:or|aka|also known as)\s+/i, '')
      .replace(/^(?:a|an|the)\s+/i, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanAnswer(answer) {
    return normalizeAnswer(answer).replace(/\s/g, '');
  }

  function addAcceptedAnswer(candidates, seen, answer) {
    const normalized = normalizeAnswer(answer);
    const compact = cleanAnswer(answer);
    if (!compact || seen.has(compact)) {
      return;
    }

    seen.add(compact);
    candidates.push({ normalized, compact });
  }

  function splitAlternates(answer) {
    const raw = String(answer || '').trim();
    if (!raw) {
      return [];
    }

    if (/\s+(?:or|aka|also known as)\s+/i.test(raw)) {
      return raw
        .replace(/\s*,?\s+(?:or|aka|also known as)\s+/gi, '|')
        .split(/\s*(?:,|\|)\s*/)
        .filter(Boolean);
    }

    if (/[;/|]/.test(raw)) {
      return raw.split(/\s*[;/|]\s*/).filter(Boolean);
    }

    return [];
  }

  function getAcceptedAnswerCandidates(answer) {
    const raw = String(answer || '').trim();
    const candidates = [];
    const seen = new Set();
    const parentheticals = Array.from(raw.matchAll(/\(([^)]+)\)/g), (match) => match[1].trim());
    const withoutParentheticals = raw.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    const topLevelAlternates = splitAlternates(withoutParentheticals);

    if (topLevelAlternates.length > 0) {
      topLevelAlternates.forEach((part) => addAcceptedAnswer(candidates, seen, part));
    } else {
      addAcceptedAnswer(candidates, seen, withoutParentheticals || raw);
    }

    let hasAlternativeAnnotation = false;
    parentheticals.forEach((parenthetical) => {
      let alternatives = [];
      const prefixedAlternative = parenthetical.match(/^(?:or|aka|also known as)\s+(.+)$/i);
      const acceptedAlternative = parenthetical.match(/^(.+?)\s+(?:also\s+)?accepted$/i);

      if (prefixedAlternative) {
        alternatives = splitAlternates(prefixedAlternative[1]);
        if (alternatives.length === 0) {
          alternatives = [prefixedAlternative[1]];
        }
      } else if (acceptedAlternative) {
        alternatives = splitAlternates(acceptedAlternative[1]);
        if (alternatives.length === 0) {
          alternatives = [acceptedAlternative[1]];
        }
      }

      if (alternatives.length > 0) {
        hasAlternativeAnnotation = true;
        alternatives.forEach((part) => addAcceptedAnswer(candidates, seen, part));
      }
    });

    if (!hasAlternativeAnnotation && parentheticals.length > 0) {
      addAcceptedAnswer(candidates, seen, raw);
    }

    if (parentheticals.length === 0 && topLevelAlternates.length === 0) {
      addAcceptedAnswer(candidates, seen, raw);
    }

    return candidates;
  }

  function getAcceptedAnswers(answer) {
    return getAcceptedAnswerCandidates(answer).map((candidate) => candidate.compact);
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

        if (
          i > 1
          && j > 1
          && b[i - 1] === a[j - 2]
          && b[i - 2] === a[j - 1]
        ) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
        }
      }
    }

    return matrix[b.length][a.length];
  }

  function isSimplePluralVariation(userAnswer, correctAnswer) {
    if (userAnswer.length < 4 || correctAnswer.length < 4) {
      return false;
    }

    return (
      `${userAnswer}s` === correctAnswer
      || userAnswer === `${correctAnswer}s`
      || `${userAnswer}es` === correctAnswer
      || userAnswer === `${correctAnswer}es`
      || (userAnswer.endsWith('y') && `${userAnswer.slice(0, -1)}ies` === correctAnswer)
      || (correctAnswer.endsWith('y') && userAnswer === `${correctAnswer.slice(0, -1)}ies`)
    );
  }

  function isWholeAnswerAlias(userAnswer, candidateAnswer) {
    return Object.entries(WHOLE_ANSWER_ALIASES).some(([canonical, aliases]) => (
      (candidateAnswer === canonical && aliases.includes(userAnswer))
      || (userAnswer === canonical && aliases.includes(candidateAnswer))
    ));
  }

  function getFuzzyThreshold(answer) {
    const length = String(answer || '').length;
    if (length <= 4) return 0;
    if (length <= 8) return 1;
    if (length <= 15) return 2;
    return 3;
  }

  function compareAnswers(userAnswerRaw, correctAnswerRaw) {
    return compareAnswersDetailed(userAnswerRaw, correctAnswerRaw).isCorrect;
  }

  function compareAnswersDetailed(userAnswerRaw, correctAnswerRaw) {
    const userAnswer = cleanAnswer(userAnswerRaw);
    const acceptedCandidates = getAcceptedAnswerCandidates(correctAnswerRaw);
    const acceptedAnswers = acceptedCandidates.map((candidate) => candidate.compact);
    const correctAnswer = acceptedAnswers[0] || '';

    if (!userAnswer || !correctAnswer) {
      return {
        isCorrect: false,
        reason: 'empty',
        userAnswer,
        correctAnswer,
        acceptedAnswers,
        distance: null,
        threshold: null,
      };
    }

    const exactMatch = acceptedCandidates.find((candidate) => userAnswer === candidate.compact);
    if (exactMatch) {
      return {
        isCorrect: true,
        reason: 'exact',
        userAnswer,
        correctAnswer: exactMatch.compact,
        acceptedAnswers,
        distance: 0,
        threshold: 0,
      };
    }

    const variationMatch = acceptedCandidates.find((candidate) => (
      isWholeAnswerAlias(userAnswer, candidate.compact)
      || isSimplePluralVariation(userAnswer, candidate.compact)
    ));
    if (variationMatch) {
      return {
        isCorrect: true,
        reason: 'variation',
        userAnswer,
        correctAnswer: variationMatch.compact,
        acceptedAnswers,
        distance: getLevenshteinDistance(userAnswer, variationMatch.compact),
        threshold: 0,
      };
    }

    let bestMatch = {
      answer: correctAnswer,
      distance: getLevenshteinDistance(userAnswer, correctAnswer),
      threshold: getFuzzyThreshold(correctAnswer),
    };

    acceptedAnswers.slice(1).forEach((acceptedAnswer) => {
      const distance = getLevenshteinDistance(userAnswer, acceptedAnswer);
      if (distance < bestMatch.distance) {
        bestMatch = {
          answer: acceptedAnswer,
          distance,
          threshold: getFuzzyThreshold(acceptedAnswer),
        };
      }
    });

    return {
      isCorrect: bestMatch.distance <= bestMatch.threshold,
      reason: bestMatch.distance <= bestMatch.threshold ? 'fuzzy' : 'mismatch',
      userAnswer,
      correctAnswer: bestMatch.answer,
      acceptedAnswers,
      distance: bestMatch.distance,
      threshold: bestMatch.threshold,
    };
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
    normalizeAnswer,
    cleanAnswer,
    getAcceptedAnswers,
    getLevenshteinDistance,
    compareAnswers,
    compareAnswersDetailed,
    parseClueValue,
  };
}));
