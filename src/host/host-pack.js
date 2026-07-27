(function initHostPack(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYHostPack = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostPackFactory() {
  'use strict';

  const HOST_PACK_SCHEMA = 'jeoparody.host-pack';
  const HOST_PACK_VERSION = 1;

  const HostBeats = Object.freeze({
    IDLE: 'idle',
    WELCOME: 'welcome',
    CLUE: 'clue',
    EMPTY: 'empty',
    CORRECT: 'correct',
    INCORRECT: 'incorrect',
    REVEAL: 'reveal',
    STREAK: 'streak',
    EPISODE_COMPLETE: 'episode-complete',
    STUDY_ENTERED: 'study-entered',
    STUDY_EXITED: 'study-exited',
    REINFORCEMENT_CORRECT: 'reinforcement-correct',
    REINFORCEMENT_INCORRECT: 'reinforcement-incorrect',
  });

  const REQUIRED_BEATS = Object.freeze([
    HostBeats.IDLE,
    HostBeats.CLUE,
    HostBeats.EMPTY,
    HostBeats.CORRECT,
    HostBeats.INCORRECT,
    HostBeats.REVEAL,
    HostBeats.STREAK,
    HostBeats.EPISODE_COMPLETE,
  ]);

  const SUPPORTED_LOCALES = Object.freeze(['en', 'pt-BR']);

  class HostPackError extends Error {
    constructor(issues) {
      super(`Invalid HostPack: ${issues.join('; ')}`);
      this.name = 'HostPackError';
      this.issues = Object.freeze([...issues]);
    }
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function normalizeList(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map(cleanText).filter(Boolean))];
  }

  function normalizeLineBanks(lineBanks, issues) {
    const normalized = {};
    SUPPORTED_LOCALES.forEach((locale) => {
      const source = lineBanks?.[locale];
      if (!source || typeof source !== 'object' || Array.isArray(source)) {
        issues.push(`lineBanks.${locale} is required`);
        normalized[locale] = {};
        return;
      }
      normalized[locale] = Object.fromEntries(
        Object.values(HostBeats).map((beat) => [beat, normalizeList(source[beat])]),
      );
      REQUIRED_BEATS.forEach((beat) => {
        if (normalized[locale][beat].length === 0) {
          issues.push(`lineBanks.${locale}.${beat} requires at least one line`);
        }
      });
    });
    return normalized;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function normalizeHostPack(input = {}) {
    const issues = [];
    const id = cleanText(input.id);
    const displayName = cleanText(input.displayName);
    const subtitle = cleanText(input.subtitle);
    const boundaries = normalizeList(input.personality?.boundaries);
    const teachingStyle = cleanText(input.personality?.teachingStyle);
    const rightsStatus = cleanText(input.rights?.status);

    if (!id || !/^[a-z0-9-]+$/.test(id)) issues.push('id must be a stable kebab-case value');
    if (!displayName) issues.push('displayName is required');
    if (!subtitle) issues.push('subtitle is required');
    if (!teachingStyle) issues.push('personality.teachingStyle is required');
    if (boundaries.length === 0) issues.push('personality.boundaries requires at least one rule');
    if (!rightsStatus) issues.push('rights.status is required');

    const lineBanks = normalizeLineBanks(input.lineBanks, issues);
    if (issues.length) throw new HostPackError(issues);

    return deepFreeze({
      schema: HOST_PACK_SCHEMA,
      version: HOST_PACK_VERSION,
      id,
      displayName,
      subtitle,
      identity: {
        role: cleanText(input.identity?.role),
        premise: cleanText(input.identity?.premise),
      },
      personality: {
        vocabulary: normalizeList(input.personality?.vocabulary),
        motifs: normalizeList(input.personality?.motifs),
        boundaries,
        teachingStyle,
      },
      voice: {
        preferredLocale: SUPPORTED_LOCALES.includes(input.voice?.preferredLocale)
          ? input.voice.preferredLocale
          : 'en',
        rate: Number.isFinite(Number(input.voice?.rate)) ? Number(input.voice.rate) : 1,
        pitch: Number.isFinite(Number(input.voice?.pitch)) ? Number(input.voice.pitch) : 1,
        voiceHint: cleanText(input.voice?.voiceHint),
      },
      rights: {
        status: rightsStatus,
        visualAssetStatus: cleanText(input.rights?.visualAssetStatus),
        voiceAssetStatus: cleanText(input.rights?.voiceAssetStatus),
        notes: cleanText(input.rights?.notes),
      },
      generationPolicy: {
        enabled: input.generationPolicy?.enabled === true,
        authoredLinePolicy: ['prefer', 'fallback', 'ignore'].includes(
          input.generationPolicy?.authoredLinePolicy,
        ) ? input.generationPolicy.authoredLinePolicy : 'fallback',
      },
      lineBanks,
    });
  }

  const SharedBoundaries = Object.freeze([
    'Never change canonical clue truth or accepted answers.',
    'Never mock protected traits, identity, disability, or sincere curiosity.',
    'Never imply that a generated line is a factual source.',
    'Prefer memorable correction over humiliation.',
  ]);

  const DefaultHostPacks = Object.freeze([
    normalizeHostPack({
      id: 'xander-trefleck',
      displayName: 'Xander Trefleck',
      subtitle: 'Bureaucratic deadpan',
      identity: {
        role: 'Unauthorized Channel O host',
        premise: 'A suspiciously credentialed broadcaster treating trivia as municipal paperwork.',
      },
      personality: {
        vocabulary: ['judges', 'management', 'paperwork', 'broadcast'],
        motifs: ['institutional absurdity', 'Canadian restraint', 'quiet suspicion'],
        boundaries: SharedBoundaries,
        teachingStyle: 'Dry correction followed by one concrete fact and a dignified route back in.',
      },
      voice: {
        preferredLocale: 'en',
        rate: 0.96,
        pitch: 0.92,
        voiceHint: 'Measured baritone with restrained amusement.',
      },
      rights: {
        status: 'prototype-review-required',
        visualAssetStatus: 'shared-placeholder',
        voiceAssetStatus: 'synthetic-browser-default',
        notes: 'Provisional parody identity. Replace likeness-dependent art before public release.',
      },
      generationPolicy: { enabled: false, authoredLinePolicy: 'prefer' },
      lineBanks: {
        en: {
          idle: ['The board is waiting. It has retained counsel.'],
          welcome: ['Channel O is live. Management asks that you ignore the unauthorized letter.'],
          clue: ['The evidence has been placed before you. Management denies fingerprints.'],
          empty: ['The judges have reviewed your silence and found it unusually spacious.'],
          correct: ['Correct. Disturbingly correct.'],
          incorrect: ['Not quite. Canada remains neutral, but the judges do not.'],
          reveal: ['The truth has arrived with identification and two supporting documents.'],
          streak: ['A streak appears. Studio insurance has begun asking careful questions.'],
          'episode-complete': ['Broadcast complete. Accounting is checking whether knowledge can be depreciated.'],
          'study-entered': ['Study detour approved. The score is sealed in a tamper-evident envelope.'],
          'study-exited': ['The broadcast resumes. No points were harmed during the educational procedure.'],
          'reinforcement-correct': ['Memory confirmed. The fact may now leave supervised custody.'],
          'reinforcement-incorrect': ['Not yet. Useful failure has been entered into the record without prejudice.'],
        },
        'pt-BR': {
          idle: ['O tabuleiro está esperando. Ele já contratou um advogado.'],
          welcome: ['O Canal O está no ar. A direção pede que você ignore a letra não autorizada.'],
          clue: ['A evidência está diante de você. A direção nega qualquer impressão digital.'],
          empty: ['Os juízes analisaram seu silêncio e acharam o espaço bastante generoso.'],
          correct: ['Correto. Perturbadoramente correto.'],
          incorrect: ['Ainda não. O Canadá permanece neutro, mas os juízes não.'],
          reveal: ['A verdade chegou com documento e duas testemunhas.'],
          streak: ['Surgiu uma sequência. O seguro do estúdio começou a fazer perguntas.'],
          'episode-complete': ['Transmissão concluída. A contabilidade está avaliando a depreciação do conhecimento.'],
          'study-entered': ['Desvio de estudo aprovado. O placar foi lacrado em um envelope inviolável.'],
          'study-exited': ['A transmissão continua. Nenhum ponto foi ferido durante o procedimento educativo.'],
          'reinforcement-correct': ['Memória confirmada. O fato pode deixar a custódia supervisionada.'],
          'reinforcement-incorrect': ['Ainda não. O erro útil foi registrado sem prejuízo.'],
        },
      },
    }),
    normalizeHostPack({
      id: 'vera-static',
      displayName: 'Vera Static',
      subtitle: 'Midnight signal detective',
      identity: {
        role: 'After-hours public-access investigator',
        premise: 'A warm signal hunter who treats every fact as evidence in a larger mystery.',
      },
      personality: {
        vocabulary: ['signal', 'frequency', 'evidence', 'pattern'],
        motifs: ['midnight radio', 'found footage', 'patient investigation'],
        boundaries: SharedBoundaries,
        teachingStyle: 'Invite a second look, name the useful pattern, and reward careful retrieval.',
      },
      voice: {
        preferredLocale: 'en',
        rate: 1,
        pitch: 1.04,
        voiceHint: 'Clear, curious alto with late-night radio warmth.',
      },
      rights: {
        status: 'prototype-original',
        visualAssetStatus: 'shared-placeholder',
        voiceAssetStatus: 'synthetic-browser-default',
        notes: 'Original personality awaiting dedicated visual and voice assets.',
      },
      generationPolicy: { enabled: false, authoredLinePolicy: 'ignore' },
      lineBanks: {
        en: {
          idle: ['The frequency is quiet, but the board is definitely listening.'],
          welcome: ['Signal acquired. Let us find out what the facts have been trying to tell us.'],
          clue: ['Signal is clean. Read for the detail carrying the most weight.'],
          empty: ['No signal yet. Send even a rough guess and we can triangulate from there.'],
          correct: ['That landed cleanly. Keep the frequency.'],
          incorrect: ['Signal missed, evidence preserved. We know where to listen next.'],
          reveal: ['Here is the missing signal. Notice the detail that makes it fit.'],
          streak: ['You found the pattern. Stay with it while the frequency is hot.'],
          'episode-complete': ['Transmission logged. The pattern is larger than it looked at the beginning.'],
          'study-entered': ['Investigation mode open. We can examine the evidence without disturbing the score.'],
          'study-exited': ['Case notes saved. Returning to the exact frame where the broadcast paused.'],
          'reinforcement-correct': ['Retrieval confirmed. That signal is yours now.'],
          'reinforcement-incorrect': ['The signal is faint, not lost. Let us mark the useful correction.'],
        },
        'pt-BR': {
          idle: ['A frequência está quieta, mas o tabuleiro está claramente ouvindo.'],
          welcome: ['Sinal adquirido. Vamos descobrir o que os fatos estão tentando contar.'],
          clue: ['O sinal está limpo. Procure o detalhe que carrega mais peso.'],
          empty: ['Ainda sem sinal. Envie até um palpite e podemos triangular a partir dele.'],
          correct: ['Chegou limpo. Mantenha a frequência.'],
          incorrect: ['O sinal passou, mas a evidência ficou. Agora sabemos onde ouvir.'],
          reveal: ['Aqui está o sinal que faltava. Repare no detalhe que faz tudo encaixar.'],
          streak: ['Você encontrou o padrão. Continue enquanto a frequência está quente.'],
          'episode-complete': ['Transmissão registrada. O padrão era maior do que parecia no começo.'],
          'study-entered': ['Modo de investigação aberto. Podemos examinar a evidência sem mexer no placar.'],
          'study-exited': ['Notas salvas. Voltando ao quadro exato em que a transmissão parou.'],
          'reinforcement-correct': ['Recuperação confirmada. Esse sinal agora é seu.'],
          'reinforcement-incorrect': ['O sinal está fraco, não perdido. Vamos guardar a correção útil.'],
        },
      },
    }),
    normalizeHostPack({
      id: 'professor-oo',
      displayName: 'Professor O.O.',
      subtitle: 'Cosmic pattern coach',
      identity: {
        role: 'Chair of the Department of Suspiciously Connected Things',
        premise: 'An enthusiastic pattern teacher convinced every clue is adjacent to a cosmic syllabus.',
      },
      personality: {
        vocabulary: ['orbit', 'pattern', 'connection', 'curiosity'],
        motifs: ['cosmic diagrams', 'beautiful mistakes', 'unexpected adjacency'],
        boundaries: SharedBoundaries,
        teachingStyle: 'Celebrate retrieval, make mistakes structurally useful, and connect facts without inventing claims.',
      },
      voice: {
        preferredLocale: 'en',
        rate: 1.06,
        pitch: 1.08,
        voiceHint: 'Bright professorial tenor with contagious curiosity.',
      },
      rights: {
        status: 'prototype-original',
        visualAssetStatus: 'shared-placeholder',
        voiceAssetStatus: 'synthetic-browser-default',
        notes: 'Original personality awaiting dedicated visual and voice assets.',
      },
      generationPolicy: { enabled: false, authoredLinePolicy: 'ignore' },
      lineBanks: {
        en: {
          idle: ['Excellent. An empty board is simply a diagram before the arrows arrive.'],
          welcome: ['Welcome to the syllabus. It was not approved, which is why it still has imagination.'],
          clue: ['Observe the clue carefully. One detail is trying to introduce you to the answer.'],
          empty: ['A blank answer is a hypothesis wearing excellent camouflage. Give it a shape.'],
          correct: ['Yes. The fact has found its proper orbit.'],
          incorrect: ['Beautiful miss. Now we can see which connection needs another pass.'],
          reveal: ['There it is. Attach the answer to the clue detail that summoned it.'],
          streak: ['The pattern is compounding. Your neurons have formed a small faculty senate.'],
          'episode-complete': ['Syllabus complete. Naturally, this reveals three more departments.'],
          'study-entered': ['Office hours begin. Curiosity may roam; the score must remain seated.'],
          'study-exited': ['Office hours conclude. The round returns with all molecules accounted for.'],
          'reinforcement-correct': ['Retrieved from memory. That connection now has structural integrity.'],
          'reinforcement-incorrect': ['Useful miss. We have located the exact bridge that needs rebuilding.'],
        },
        'pt-BR': {
          idle: ['Excelente. Um tabuleiro vazio é apenas um diagrama antes das setas.'],
          welcome: ['Bem-vindo ao programa. Ele não foi aprovado, por isso ainda tem imaginação.'],
          clue: ['Observe a pista. Um detalhe está tentando apresentar você à resposta.'],
          empty: ['Uma resposta vazia é uma hipótese muito bem camuflada. Dê uma forma a ela.'],
          correct: ['Sim. O fato encontrou sua órbita correta.'],
          incorrect: ['Belo erro. Agora sabemos qual conexão precisa de outra passagem.'],
          reveal: ['Aí está. Ligue a resposta ao detalhe da pista que a chamou.'],
          streak: ['O padrão está crescendo. Seus neurônios formaram um pequeno conselho docente.'],
          'episode-complete': ['Programa concluído. Naturalmente, isso revela mais três departamentos.'],
          'study-entered': ['Começa o plantão. A curiosidade pode circular; o placar deve ficar sentado.'],
          'study-exited': ['Fim do plantão. A rodada volta com todas as moléculas contabilizadas.'],
          'reinforcement-correct': ['Recuperado da memória. Essa conexão agora tem integridade estrutural.'],
          'reinforcement-incorrect': ['Erro útil. Encontramos a ponte exata que precisa ser reconstruída.'],
        },
      },
    }),
  ]);

  return {
    DefaultHostPacks,
    HOST_PACK_SCHEMA,
    HOST_PACK_VERSION,
    HostBeats,
    HostPackError,
    SUPPORTED_LOCALES,
    normalizeHostPack,
  };
}));
