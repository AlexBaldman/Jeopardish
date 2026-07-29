(function initEmergencyEpisode(root, factory) {
  const episode = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = episode;
  } else {
    root.JeoPARODYEmergencyEpisode = episode;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function emergencyEpisodeFactory() {
  'use strict';

  const EmergencyEpisode = {
    schemaVersion: 1,
    id: 'season-zero-emergency-broadcast',
    title: 'Season Zero: Emergency Broadcast',
    locale: 'en',
    kind: 'authored',
    sequenceMode: 'authored-order',
    contentRevision: 1,
    reviewStatus: 'reviewed',
    episodeLength: 3,
    description: 'A reviewed embedded broadcast used only when external question files are temporarily unreachable.',
    provenance: {
      source: 'JeoPARODY Season Zero editorial',
      reviewedOn: '2026-07-27',
      editorialPolicy: 'Reviewed clues and institutional sources retained from the canonical Season Zero episode.',
    },
    clues: [
      {
        id: 'emergency-01-braille',
        category: 'Signals You Can Touch',
        value: 200,
        clue: 'Its basic cell uses six raised-dot positions in two columns, producing 63 possible nonblank patterns for reading by touch.',
        answer: 'Braille',
        acceptedAnswers: ['the Braille system'],
        explanation: 'A standard braille cell has six dot positions arranged in two columns of three. Those positions can form 63 nonblank combinations.',
        sources: [{
          title: 'Library of Congress: About Braille',
          url: 'https://www.loc.gov/nls/services-and-resources/informational-publications/about-braille/',
        }],
        media: [],
        difficulty: 0.2,
        tags: ['accessibility', 'language', 'patterns'],
        learning: {
          backstory: 'Louis Braille developed the system as a teenager in nineteenth-century France.',
          connections: [
            'Each dot position is either raised or flat, much like one bit in a six-bit physical code.',
          ],
          reinforcement: {
            prompt: 'How many nonblank patterns can a six-dot braille cell produce?',
            answer: '63',
            acceptedAnswers: ['sixty-three', '63 patterns'],
            explanation: 'Six on-off positions create 64 combinations; removing the all-flat cell leaves 63.',
            promptPt: 'Quantos padrões não vazios uma célula braille de seis pontos pode produzir?',
            answerPt: '63',
            acceptedAnswersPt: ['sessenta e três', '63 padrões'],
            explanationPt: 'Seis posições criam 64 combinações; sem a célula totalmente plana, restam 63.',
          },
        },
        performance: {
          act: 1,
          expression: 'clue',
          hostLine: 'The archive doors are stuck, so we begin with a communications system that does not require electricity.',
          storyBeat: 'The emergency broadcast establishes resilient communication.',
        },
      },
      {
        id: 'emergency-02-rip-current',
        category: 'Beach Intelligence',
        value: 200,
        clue: 'This narrow, fast-moving flow carries water away from shore; experts advise swimmers caught in one to stay calm and swim parallel to the beach.',
        answer: 'Rip current',
        acceptedAnswers: ['a rip current', 'rip tide'],
        explanation: 'A rip current is a concentrated flow moving away from shore. Swimmers should avoid fighting it and move parallel to shore when possible.',
        sources: [{
          title: 'NOAA Ocean Service: What Is a Rip Current?',
          url: 'https://oceanservice.noaa.gov/facts/ripcurrent.html',
        }],
        media: [],
        difficulty: 0.25,
        tags: ['ocean', 'safety', 'long-beach'],
        learning: {
          backstory: 'Rip currents form where water pushed toward shore by breaking waves finds a concentrated route back seaward.',
          connections: [
            'Crossing the narrow current sideways is usually easier than fighting directly against it.',
          ],
          reinforcement: {
            prompt: 'Which direction should a swimmer move to escape a rip current?',
            answer: 'Parallel to shore',
            acceptedAnswers: ['parallel to the beach', 'sideways across the current'],
            explanation: 'Moving parallel to shore crosses the narrow current instead of fighting directly against it.',
            promptPt: 'Em que direção um nadador deve se mover para escapar de uma corrente de retorno?',
            answerPt: 'Paralelo à praia',
            acceptedAnswersPt: ['paralelamente à costa', 'de lado atravessando a corrente'],
            explanationPt: 'Mover-se paralelamente à praia atravessa a corrente sem lutar diretamente contra ela.',
          },
        },
        performance: {
          act: 1,
          expression: 'clue',
          hostLine: 'A beach-safety clue, because even emergency programming requires standards.',
          storyBeat: 'The beach setting remains part of the curriculum.',
        },
      },
      {
        id: 'emergency-03-ozone',
        category: 'Tiny Molecules, Large Responsibilities',
        value: 400,
        clue: "Made of three oxygen atoms, this gas in the stratosphere absorbs much of the Sun's harmful ultraviolet radiation.",
        answer: 'Ozone',
        acceptedAnswers: ['O3', 'O-three'],
        explanation: "Ozone is O3. High in the stratosphere, the ozone layer absorbs most of the Sun's damaging ultraviolet radiation.",
        sources: [{
          title: 'NASA Earth Observatory: Ozone',
          url: 'https://science.nasa.gov/earth/earth-observatory/ozone/',
        }],
        media: [],
        difficulty: 0.3,
        tags: ['chemistry', 'atmosphere', 'space'],
        learning: {
          backstory: 'The same molecule can be protective high in the atmosphere and harmful as a pollutant near the ground.',
          connections: [
            'Ordinary oxygen gas is O2; ozone adds one more oxygen atom to make O3.',
          ],
          reinforcement: {
            prompt: 'How many oxygen atoms are in one ozone molecule?',
            answer: 'Three',
            acceptedAnswers: ['3', 'three oxygen atoms'],
            explanation: 'Ozone is O3: one molecule contains three oxygen atoms.',
            promptPt: 'Quantos átomos de oxigênio existem em uma molécula de ozônio?',
            answerPt: 'Três',
            acceptedAnswersPt: ['3', 'três átomos de oxigênio'],
            explanationPt: 'O ozônio é O3: uma molécula contém três átomos de oxigênio.',
          },
        },
        performance: {
          act: 1,
          expression: 'clue',
          hostLine: 'Three atoms and one functioning backup plan. The station is exceeding expectations.',
          storyBeat: 'The emergency broadcast closes on the recurring O.',
        },
      },
    ],
  };

  return {
    EmergencyEpisode,
  };
}));
