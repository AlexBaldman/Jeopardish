(function initEpisodeContract(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYEpisodeContract = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function episodeContractFactory() {
  'use strict';

  const EPISODE_SCHEMA_VERSION = 1;
  const EPISODE_KINDS = Object.freeze({
    AUTHORED: 'authored',
    LEGACY_ADAPTER: 'legacy-adapter',
  });
  const EPISODE_SEQUENCE_MODES = Object.freeze({
    AUTHORED_ORDER: 'authored-order',
    DETERMINISTIC_SAMPLE: 'deterministic-sample',
    RANDOM_SAMPLE: 'random-sample',
  });
  const MEDIA_TYPES = new Set(['image', 'video', 'audio']);

  class EpisodeContractError extends Error {
    constructor(issues) {
      super(`Episode contract rejected ${issues.length} issue${issues.length === 1 ? '' : 's'}: ${issues.join('; ')}`);
      this.name = 'EpisodeContractError';
      this.issues = Object.freeze([...issues]);
    }
  }

  function validateEpisodePack(input, { requireReviewed = false } = {}) {
    const issues = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new EpisodeContractError(['episode must be an object']);
    }

    const id = cleanText(input.id);
    const title = cleanText(input.title);
    const locale = cleanText(input.locale) || 'en';
    const kind = cleanText(input.kind) || EPISODE_KINDS.AUTHORED;
    const sequenceMode = cleanText(input.sequenceMode) || (
      kind === EPISODE_KINDS.AUTHORED
        ? EPISODE_SEQUENCE_MODES.AUTHORED_ORDER
        : EPISODE_SEQUENCE_MODES.DETERMINISTIC_SAMPLE
    );
    const contentRevision = Number(input.contentRevision ?? 1);
    const reviewStatus = cleanText(input.reviewStatus) || (
      kind === EPISODE_KINDS.AUTHORED ? 'draft' : 'archive'
    );
    const clues = Array.isArray(input.clues) ? input.clues : [];
    const episodeLength = Number(input.episodeLength ?? clues.length);

    if (!id || !/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
      issues.push('episode.id must be a stable slug');
    }
    if (!title) issues.push('episode.title is required');
    if (input.schemaVersion !== EPISODE_SCHEMA_VERSION) {
      issues.push(`episode.schemaVersion must be ${EPISODE_SCHEMA_VERSION}`);
    }
    if (!Object.values(EPISODE_KINDS).includes(kind)) {
      issues.push(`episode.kind must be ${Object.values(EPISODE_KINDS).join(' or ')}`);
    }
    if (!Object.values(EPISODE_SEQUENCE_MODES).includes(sequenceMode)) {
      issues.push(`episode.sequenceMode must be ${Object.values(EPISODE_SEQUENCE_MODES).join(' or ')}`);
    }
    if (!Number.isInteger(contentRevision) || contentRevision < 1) {
      issues.push('episode.contentRevision must be a positive integer');
    }
    if (requireReviewed && reviewStatus !== 'reviewed') {
      issues.push('episode.reviewStatus must be reviewed');
    }
    if (clues.length === 0) issues.push('episode.clues must contain at least one clue');
    if (!Number.isInteger(episodeLength) || episodeLength < 1 || episodeLength > clues.length) {
      issues.push('episode.episodeLength must be an integer within the clue list');
    }

    const normalizedClues = [];
    const clueIds = new Set();
    clues.forEach((clue, index) => {
      const normalized = normalizeClue(clue, index, issues, { requireReviewed });
      if (!normalized) return;
      if (clueIds.has(normalized.id)) {
        issues.push(`clues[${index}].id duplicates ${normalized.id}`);
      }
      clueIds.add(normalized.id);
      normalizedClues.push(normalized);
    });

    if (issues.length) throw new EpisodeContractError(issues);
    return deepFreeze({
      schemaVersion: EPISODE_SCHEMA_VERSION,
      id,
      title,
      locale,
      kind,
      sequenceMode,
      contentRevision,
      episodeLength,
      description: cleanText(input.description),
      reviewStatus,
      provenance: normalizeObject(input.provenance),
      finale: normalizeFinale(input.finale),
      clues: normalizedClues,
    });
  }

  function normalizeClue(input, index, issues, { requireReviewed }) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      issues.push(`clues[${index}] must be an object`);
      return null;
    }
    const path = `clues[${index}]`;
    const id = cleanText(input.id);
    const category = cleanText(input.category);
    const question = cleanText(input.clue ?? input.question);
    const answer = cleanText(input.answer);
    const value = parseValue(input.value);
    const acceptedAnswers = normalizeTextArray(input.acceptedAnswers);
    const explanation = cleanText(input.explanation);
    const sources = normalizeSources(input.sources, path, issues);
    const media = normalizeMedia(input.media, path, issues);
    const difficulty = input.difficulty == null ? null : Number(input.difficulty);

    if (!id) issues.push(`${path}.id is required`);
    if (!category) issues.push(`${path}.category is required`);
    if (!question) issues.push(`${path}.clue is required`);
    if (!answer) issues.push(`${path}.answer is required`);
    if (!Number.isInteger(value) || value < 0) {
      issues.push(`${path}.value must be a non-negative integer`);
    }
    if (input.acceptedAnswers != null && !Array.isArray(input.acceptedAnswers)) {
      issues.push(`${path}.acceptedAnswers must be an array`);
    }
    if (difficulty != null && (!Number.isFinite(difficulty) || difficulty < 0 || difficulty > 1)) {
      issues.push(`${path}.difficulty must be between 0 and 1`);
    }
    if (requireReviewed && !explanation) issues.push(`${path}.explanation is required`);
    if (requireReviewed && sources.length === 0) issues.push(`${path}.sources require review`);

    return {
      id,
      category,
      clue: question,
      question,
      answer,
      value,
      acceptedAnswers,
      explanation,
      sources,
      media,
      difficulty,
      tags: normalizeTextArray(input.tags),
      learning: normalizeLearning(input.learning, path, issues, { requireReviewed }),
      performance: normalizeObject(input.performance),
      provenance: normalizeObject(input.provenance),
    };
  }

  function adaptLegacyQuestionBank(questionBank, {
    id = 'season-zero-pilot',
    title = 'Season Zero: Pilot Broadcast',
    episodeLength = 10,
    locale = 'en',
    sequenceMode = EPISODE_SEQUENCE_MODES.DETERMINISTIC_SAMPLE,
  } = {}) {
    if (!Array.isArray(questionBank) || questionBank.length === 0) {
      throw new EpisodeContractError(['legacy question bank must be a non-empty array']);
    }
    const clues = questionBank.map((clue, index) => {
      const question = cleanText(clue?.question);
      const identity = [
        clue?.show_number,
        clue?.round,
        clue?.category,
        clue?.value,
        question,
      ].filter(Boolean).join('|');
      return {
        ...clue,
        id: cleanText(clue?.id) || `archive-${stableHash(identity || index).toString(36)}`,
        clue: question,
        question,
        value: parseValue(clue?.value),
        acceptedAnswers: normalizeTextArray(clue?.acceptedAnswers),
        explanation: cleanText(clue?.explanation),
        sources: Array.isArray(clue?.sources) ? clue.sources : [],
        media: Array.isArray(clue?.media) ? clue.media : [],
        difficulty: clue?.difficulty ?? null,
        tags: normalizeTextArray(clue?.tags),
        performance: normalizeObject(clue?.performance),
        provenance: {
          source: 'historical-archive',
          airDate: cleanText(clue?.air_date),
          round: cleanText(clue?.round),
          showNumber: cleanText(clue?.show_number),
        },
      };
    });

    return validateEpisodePack({
      schemaVersion: EPISODE_SCHEMA_VERSION,
      id,
      title,
      locale,
      kind: EPISODE_KINDS.LEGACY_ADAPTER,
      sequenceMode,
      contentRevision: 1,
      episodeLength: Math.min(Math.max(1, episodeLength), clues.length),
      description: 'Compatibility episode adapted from the historical research archive.',
      reviewStatus: 'archive',
      provenance: {
        source: 'legacy-question-bank',
        sourceCount: questionBank.length,
      },
      clues,
    });
  }

  function normalizeEpisodeSource(source, legacyOptions = {}, validationOptions = {}) {
    return Array.isArray(source)
      ? adaptLegacyQuestionBank(source, legacyOptions)
      : validateEpisodePack(source, validationOptions);
  }

  function normalizeSources(sources, path, issues) {
    if (sources == null) return [];
    if (!Array.isArray(sources)) {
      issues.push(`${path}.sources must be an array`);
      return [];
    }
    return sources.map((source, index) => {
      const title = cleanText(source?.title);
      const url = cleanText(source?.url);
      if (!title) issues.push(`${path}.sources[${index}].title is required`);
      if (!isSafeResourceUrl(url)) issues.push(`${path}.sources[${index}].url must use HTTPS`);
      return { title, url };
    });
  }

  function normalizeMedia(media, path, issues) {
    if (media == null) return [];
    if (!Array.isArray(media)) {
      issues.push(`${path}.media must be an array`);
      return [];
    }
    return media.map((item, index) => {
      const type = cleanText(item?.type).toLowerCase();
      const url = cleanText(item?.url);
      if (!MEDIA_TYPES.has(type)) {
        issues.push(`${path}.media[${index}].type is unsupported`);
      }
      if (!isSafeResourceUrl(url, { allowLocal: true })) {
        issues.push(`${path}.media[${index}].url must use HTTPS or a local path`);
      }
      return {
        type,
        url,
        title: cleanText(item?.title),
        alt: cleanText(item?.alt),
      };
    });
  }

  function normalizeFinale(finale) {
    if (!finale || typeof finale !== 'object' || Array.isArray(finale)) return {};
    return {
      title: cleanText(finale.title),
      artifactTitle: cleanText(finale.artifactTitle),
      artifactBody: cleanText(finale.artifactBody),
      hostLine: cleanText(finale.hostLine),
      teaser: cleanText(finale.teaser),
    };
  }

  function normalizeLearning(learning, path = 'clue', issues = [], { requireReviewed = false } = {}) {
    if (!learning || typeof learning !== 'object' || Array.isArray(learning)) {
      if (requireReviewed) issues.push(`${path}.learning.reinforcement is required`);
      return { backstory: '', connections: [], reinforcement: null };
    }
    const reinforcement = normalizeReinforcement(
      learning.reinforcement,
      path,
      issues,
      { requireLocalized: requireReviewed },
    );
    if (requireReviewed && !reinforcement) {
      issues.push(`${path}.learning.reinforcement is required`);
    }
    return {
      backstory: cleanText(learning.backstory),
      connections: normalizeTextArray(learning.connections),
      reinforcement,
    };
  }

  function normalizeReinforcement(
    reinforcement,
    path,
    issues,
    { requireLocalized = false } = {},
  ) {
    if (reinforcement == null) return null;
    if (typeof reinforcement !== 'object' || Array.isArray(reinforcement)) {
      issues.push(`${path}.learning.reinforcement must be an object`);
      return null;
    }
    const prompt = cleanText(reinforcement.prompt);
    const answer = cleanText(reinforcement.answer);
    const explanation = cleanText(reinforcement.explanation);
    if (!prompt) issues.push(`${path}.learning.reinforcement.prompt is required`);
    if (!answer) issues.push(`${path}.learning.reinforcement.answer is required`);
    if (!explanation) issues.push(`${path}.learning.reinforcement.explanation is required`);
    if (requireLocalized && !cleanText(reinforcement.promptPt)) {
      issues.push(`${path}.learning.reinforcement.promptPt is required`);
    }
    if (requireLocalized && !cleanText(reinforcement.answerPt)) {
      issues.push(`${path}.learning.reinforcement.answerPt is required`);
    }
    if (requireLocalized && !cleanText(reinforcement.explanationPt)) {
      issues.push(`${path}.learning.reinforcement.explanationPt is required`);
    }
    if (reinforcement.acceptedAnswers != null && !Array.isArray(reinforcement.acceptedAnswers)) {
      issues.push(`${path}.learning.reinforcement.acceptedAnswers must be an array`);
    }
    if (
      reinforcement.acceptedAnswersPt != null
      && !Array.isArray(reinforcement.acceptedAnswersPt)
    ) {
      issues.push(`${path}.learning.reinforcement.acceptedAnswersPt must be an array`);
    }
    return {
      prompt,
      answer,
      acceptedAnswers: normalizeTextArray(reinforcement.acceptedAnswers),
      explanation,
      promptPt: cleanText(reinforcement.promptPt),
      answerPt: cleanText(reinforcement.answerPt),
      acceptedAnswersPt: normalizeTextArray(reinforcement.acceptedAnswersPt),
      explanationPt: cleanText(reinforcement.explanationPt),
    };
  }

  function isSafeResourceUrl(value, { allowLocal = false } = {}) {
    const url = cleanText(value);
    if (!url || /^https:\/\//i.test(url)) return Boolean(url);
    return allowLocal && /^(?:\.{0,2}\/|\/)[^/]/.test(url);
  }

  function normalizeTextArray(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map(cleanText).filter(Boolean))];
  }

  function normalizeObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return JSON.parse(JSON.stringify(value));
  }

  function parseValue(value) {
    const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : NaN;
  }

  function cleanText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function stableHash(value) {
    let hash = 2166136261;
    const input = String(value || '');
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  return {
    EPISODE_KINDS,
    EPISODE_SEQUENCE_MODES,
    EPISODE_SCHEMA_VERSION,
    EpisodeContractError,
    adaptLegacyQuestionBank,
    normalizeEpisodeSource,
    validateEpisodePack,
  };
}));
