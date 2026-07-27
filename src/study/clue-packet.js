(function initCluePacket(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../game-logic.js'));
  } else {
    root.JeoPARODYCluePacket = factory(root.JeopardishLogic);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function cluePacketFactory(logic) {
  'use strict';

  const PACKET_VERSION = 1;
  const STUDY_ACTIONS = Object.freeze([
    Object.freeze({ id: 'simple', label: 'Explain this simply', labelPt: 'Explique de forma simples' }),
    Object.freeze({ id: 'why', label: 'Why is that the answer?', labelPt: 'Por que essa é a resposta?' }),
    Object.freeze({ id: 'backstory', label: 'Give me the backstory', labelPt: 'Conte o contexto histórico' }),
    Object.freeze({ id: 'connect', label: 'Connect this to something I know', labelPt: 'Conecte isso a algo conhecido' }),
    Object.freeze({ id: 'quiz', label: 'Quiz me one step at a time', labelPt: 'Teste-me passo a passo' }),
  ]);

  function getStudyActions(locale = 'en') {
    return STUDY_ACTIONS.map((action) => Object.freeze({
      id: action.id,
      label: locale === 'pt-BR' ? action.labelPt : action.label,
    }));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function getClueId(clue) {
    if (clue?.id !== undefined && clue?.id !== null) return String(clue.id);
    return [clue?.category || 'unknown', clue?.value || 'unknown', clue?.question || 'unknown'].join('|');
  }

  function createCanonicalCluePacket(clue, { locale = 'en', media = [] } = {}) {
    if (!clue || !String(clue.question || '').trim() || !String(clue.answer || '').trim()) {
      throw new Error('A canonical clue packet requires question and answer text.');
    }
    const acceptedAnswers = [...new Set([
      ...(logic?.getAcceptedAnswers?.(clue.answer) || []),
      ...(Array.isArray(clue.acceptedAnswers) ? clue.acceptedAnswers : [])
        .map((answer) => logic?.cleanAnswer?.(answer) || String(answer || '').trim().toLowerCase())
        .filter(Boolean),
    ])];
    return deepFreeze({
      schema: 'jeoparody.canonical-clue',
      version: PACKET_VERSION,
      clueId: getClueId(clue),
      locale,
      category: String(clue.category || 'Unknown Category'),
      value: clue.value ?? null,
      question: String(clue.question).trim(),
      answer: String(clue.answer).trim(),
      acceptedAnswers,
      media: clone(media),
    });
  }

  function createGroundedCluePacket(canonical, enrichment = {}) {
    if (canonical?.schema !== 'jeoparody.canonical-clue') {
      throw new Error('A grounded clue packet requires a canonical clue packet.');
    }
    const citations = Array.isArray(enrichment.citations)
      ? clone(enrichment.citations).filter((citation) => (
        citation
        && String(citation.title || '').trim()
        && /^https?:\/\//i.test(String(citation.url || ''))
      ))
      : [];
    const reviewed = Boolean(enrichment.reviewed && enrichment.explanation && citations.length);
    const presentation = enrichment.presentation || canonical;
    return deepFreeze({
      schema: 'jeoparody.grounded-clue',
      version: PACKET_VERSION,
      canonical,
      presentation: {
        locale: presentation.locale || canonical.locale,
        category: String(presentation.category || canonical.category),
        question: String(presentation.question || canonical.question),
        answer: String(presentation.answer || canonical.answer),
      },
      grounding: reviewed ? 'reviewed' : 'canonical-only',
      explanation: reviewed ? String(enrichment.explanation) : '',
      backstory: reviewed ? String(enrichment.backstory || '') : '',
      connections: reviewed ? clone(enrichment.connections || []) : [],
      citations,
    });
  }

  function getStudyResponse(packet, actionId) {
    const clue = packet.canonical;
    const shown = packet.presentation || clue;
    if (shown.locale === 'pt-BR') {
      const unavailablePt = 'Esta pista do arquivo ainda não tem uma explicação revisada nem fontes anexadas. Não vou inventar conhecimento só para parecer conversador.';
      switch (actionId) {
        case 'simple': return packet.explanation || `A pista pede para ligar “${shown.question}” à resposta “${shown.answer}”. ${unavailablePt}`;
        case 'why': return packet.explanation || `A resposta canônica é “${shown.answer}”. A correção normaliza maiúsculas, pontuação, espaços, fórmulas comuns de quiz e pequenos erros de digitação. ${unavailablePt}`;
        case 'backstory': return packet.backstory || unavailablePt;
        case 'connect': return packet.connections.length ? packet.connections.join(' ') : unavailablePt;
        case 'quiz': return `Um passo de cada vez: sem olhar a resposta, diga qual é o detalhe mais importante desta pista: “${shown.question}”`;
        default: return 'Escolha um caminho de estudo e eu continuarei preso aos fatos conhecidos.';
      }
    }
    const unavailable = 'This archive clue has no reviewed explanation or citations attached yet. I will not invent the missing scholarship just to seem conversational.';
    switch (actionId) {
      case 'simple':
        return packet.explanation || `The clue asks you to connect “${clue.question}” with the response “${clue.answer}.” ${unavailable}`;
      case 'why':
        return packet.explanation || `The canonical response is “${clue.answer}.” Accepted responses are normalized for capitalization, punctuation, spacing, common trivia phrasing, and small spelling errors. ${unavailable}`;
      case 'backstory':
        return packet.backstory || unavailable;
      case 'connect':
        return packet.connections.length ? packet.connections.join(' ') : unavailable;
      case 'quiz':
        return `One step at a time: without looking at the response, name the most important detail in this clue: “${clue.question}”`;
      default:
        return 'Choose a study move and I will stay anchored to the clue packet.';
    }
  }

  return { PACKET_VERSION, STUDY_ACTIONS, getStudyActions, createCanonicalCluePacket, createGroundedCluePacket, getStudyResponse };
}));
