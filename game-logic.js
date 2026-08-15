'use strict';

export function cleanAnswer(answer) {
    return String(answer || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/^(or|aka|also known as)\s+/i, '')
      .replace(/^(what|who|where|when)\s+(is|are|was|were)\s+/i, '')
      .replace(/^(a|an|the)\s+/i, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

export function getAcceptedAnswers(answer) {
    const raw = String(answer || '');
    const parentheticalMatches = Array.from(raw.matchAll(/\(([^)]+)\)/g), (match) => match[1]);
    const withoutParentheticals = raw.replace(/\([^)]*\)/g, ' ');
    const candidates = [raw, withoutParentheticals, ...parentheticalMatches];

    for (const part of raw.split(/\s+(?:or|aka|also known as)\s+|[;/|]/i)) {
      candidates.push(part);
    }

    for (const part of parentheticalMatches.flatMap((text) => text.split(/\s+(?:or|aka|also known as)\s+|[;/|]/i))) {
      candidates.push(part);
    }

    const cleaned = candidates
      .map(cleanAnswer)
      .filter(Boolean);

    return Array.from(new Set(cleaned));
  }

  const distanceBuffer = new Uint16Array(512);

export function getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const lenA = a.length;
    const lenB = b.length;

    if (lenB > distanceBuffer.length) {
      return getLevenshteinDistanceSlow(a, b);
    }

    for (let i = 0; i <= lenB; i += 1) {
      distanceBuffer[i] = i;
    }

    let prev = 0;
    for (let j = 1; j <= lenA; j += 1) {
      prev = distanceBuffer[0];
      distanceBuffer[0] = j;

      for (let i = 1; i <= lenB; i += 1) {
        const temp = distanceBuffer[i];
        const cost = b[i - 1] === a[j - 1] ? 0 : 1;
        distanceBuffer[i] = Math.min(
          distanceBuffer[i] + 1,
          distanceBuffer[i - 1] + 1,
          prev + cost,
        );
        prev = temp;
      }
    }

    return distanceBuffer[lenB];
  }

  function getLevenshteinDistanceSlow(a, b) {
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

export function compareAnswers(userAnswerRaw, correctAnswerRaw) {
    return compareAnswersDetailed(userAnswerRaw, correctAnswerRaw).isCorrect;
  }

export function compareAnswersDetailed(userAnswerRaw, correctAnswerRaw) {
    const userAnswer = cleanAnswer(userAnswerRaw);
    const acceptedAnswers = getAcceptedAnswers(correctAnswerRaw);
    const correctAnswer = acceptedAnswers[0] || '';

    if (!userAnswer || !correctAnswer) {
      return {
        isCorrect: false,
        reason: 'empty',
        userAnswer,
        correctAnswer,
        distance: null,
      };
    }

    for (const acceptedAnswer of acceptedAnswers) {
      if (userAnswer === acceptedAnswer) {
        return {
          isCorrect: true,
          reason: 'exact',
          userAnswer,
          correctAnswer: acceptedAnswer,
          acceptedAnswers,
          distance: 0,
        };
      }
    }

    let bestMatch = {
      answer: correctAnswer,
      distance: getLevenshteinDistance(userAnswer, correctAnswer),
      threshold: Math.min(3, Math.floor(correctAnswer.length / 2)),
    };

    for (const acceptedAnswer of acceptedAnswers.slice(1)) {
      const distance = getLevenshteinDistance(userAnswer, acceptedAnswer);
      const threshold = Math.min(3, Math.floor(acceptedAnswer.length / 2));

      if (distance < bestMatch.distance) {
        bestMatch = { answer: acceptedAnswer, distance, threshold };
      }
    }

    if (bestMatch.distance <= bestMatch.threshold) {
      return {
        isCorrect: true,
        reason: 'fuzzy',
        userAnswer,
        correctAnswer: bestMatch.answer,
        acceptedAnswers,
        distance: bestMatch.distance,
        threshold: bestMatch.threshold,
      };
    }

    return {
      isCorrect: false,
      reason: 'mismatch',
      userAnswer,
      correctAnswer: bestMatch.answer,
      acceptedAnswers,
      distance: bestMatch.distance,
      threshold: bestMatch.threshold,
    };
  }

export function parseClueValue(value, fallback = 100) {
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


