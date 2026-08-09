(function initVoiceController(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./voice-pack.js'));
  } else {
    root.JeoPARODYVoice = factory(root.JeoPARODYVoicePack);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function voiceControllerFactory(
  voicePackModule,
) {
  'use strict';

  if (!voicePackModule) throw new Error('VoiceController requires the VoicePack contract.');

  const {
    DefaultVoicePack,
    VoiceCapabilities,
    VoiceProviderKinds,
    normalizeVoicePack,
    resolveVoiceProviders,
    selectVoiceStyle,
  } = voicePackModule;

  const VoiceStates = Object.freeze({
    OFF: 'off',
    IDLE: 'idle',
    LISTENING: 'listening',
    SPEAKING: 'speaking',
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    ERROR: 'error',
  });

  const VoiceCommands = Object.freeze({
    NEW_CLUE: 'new-clue',
    REVEAL_ANSWER: 'reveal-answer',
    SUBMIT_ANSWER: 'submit-answer',
    REPEAT_CLUE: 'repeat-clue',
    OPEN_MENU: 'open-menu',
    CLOSE_MENU: 'close-menu',
    STUDY: 'study',
    TOGGLE_THEME: 'toggle-theme',
    TOGGLE_LANGUAGE: 'toggle-language',
    TOGGLE_SOUND: 'toggle-sound',
    VOICE_OFF: 'voice-off',
  });

  const COMMAND_PATTERNS = Object.freeze([
    [VoiceCommands.NEW_CLUE, /^(?:please )?(?:new|next|another) (?:clue|question)(?: please)?$/],
    [VoiceCommands.REVEAL_ANSWER, /^(?:please )?(?:reveal|show|give me) (?:the )?answer(?: please)?$|^i give up$/],
    [VoiceCommands.SUBMIT_ANSWER, /^(?:please )?(?:submit|check) (?:my )?answer(?: please)?$|^lock it in$/],
    [VoiceCommands.REPEAT_CLUE, /^(?:please )?(?:repeat|read) (?:the )?(?:clue|question)(?: again)?(?: please)?$/],
    [VoiceCommands.OPEN_MENU, /^(?:please )?open (?:the )?menu(?: please)?$/],
    [VoiceCommands.CLOSE_MENU, /^(?:please )?close (?:the )?menu(?: please)?$/],
    [VoiceCommands.STUDY, /^(?:please )?(?:ask xander|open study mode|study this)(?: please)?$/],
    [VoiceCommands.TOGGLE_THEME, /^(?:switch|toggle|change) (?:the )?(?:theme|day mode|night mode)$/],
    [VoiceCommands.TOGGLE_LANGUAGE, /^(?:switch|toggle|change) (?:the )?language$/],
    [VoiceCommands.TOGGLE_SOUND, /^(?:mute|unmute|toggle sound|toggle audio)$/],
    [VoiceCommands.VOICE_OFF, /^(?:turn|switch) (?:voice|voice mode) off$|^stop listening$/],
    [VoiceCommands.NEW_CLUE, /^(?:nova|proxima|outra) (?:pista|pergunta)$/],
    [VoiceCommands.REVEAL_ANSWER, /^(?:revele|mostre) (?:a )?resposta$|^eu desisto$/],
    [VoiceCommands.SUBMIT_ANSWER, /^(?:confirme|verifique) (?:a |minha )?resposta$|^valendo$/],
    [VoiceCommands.REPEAT_CLUE, /^(?:repita|leia) (?:a )?(?:pista|pergunta)(?: novamente)?$/],
    [VoiceCommands.OPEN_MENU, /^(?:abra|abrir) (?:o )?menu$/],
    [VoiceCommands.CLOSE_MENU, /^(?:feche|fechar) (?:o )?menu$/],
    [VoiceCommands.STUDY, /^(?:pergunte ao xander|modo de estudo|estudar isto)$/],
    [VoiceCommands.TOGGLE_THEME, /^(?:troque|mude|alternar) (?:o )?(?:tema|modo dia|modo noite)$/],
    [VoiceCommands.TOGGLE_LANGUAGE, /^(?:troque|mude|alternar) (?:o )?idioma$/],
    [VoiceCommands.TOGGLE_SOUND, /^(?:silencio|ativar som|desativar som|alternar som)$/],
    [VoiceCommands.VOICE_OFF, /^(?:desligue|desativar) (?:a )?voz$|^pare de ouvir$/],
  ]);

  function normalizeTranscript(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripAnswerPrefix(value) {
    return String(value || '')
      .trim()
      .replace(
        /^(?:(?:my (?:final )?answer is|i think (?:it is|it's)|what is|who is|what are|who are|answer|final answer)\s+|(?:minha resposta (?:e|é)|eu acho que (?:e|é)|o que (?:e|é)|quem (?:e|é)|resposta)\s+)/i,
        '',
      )
      .replace(/[.?!]+$/g, '')
      .trim();
  }

  function parseVoiceIntent(transcript, { context = 'answer' } = {}) {
    const raw = String(transcript || '').trim();
    const normalized = normalizeTranscript(raw);
    if (!normalized) return { type: 'empty', transcript: raw };

    const command = COMMAND_PATTERNS.find(([, pattern]) => pattern.test(normalized));
    if (command) {
      return { type: 'command', command: command[0], transcript: raw };
    }

    if (context === 'answer') {
      const answer = stripAnswerPrefix(raw);
      return answer
        ? { type: 'answer', answer, transcript: raw }
        : { type: 'empty', transcript: raw };
    }

    return { type: 'unknown', transcript: raw };
  }

  class VoiceController {
    constructor({
      speechSynthesisRef = globalThis.speechSynthesis,
      UtteranceClass = globalThis.SpeechSynthesisUtterance,
      RecognitionClass = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition,
      onState = () => {},
      onTranscript = () => {},
      onIntent = () => {},
      onError = () => {},
      language = 'en-US',
      voicePack = DefaultVoicePack,
      voiceStyleId = '',
      allowNeural = false,
    } = {}) {
      this.synthesis = speechSynthesisRef || null;
      this.UtteranceClass = UtteranceClass || null;
      this.RecognitionClass = RecognitionClass || null;
      this.onState = onState;
      this.onTranscript = onTranscript;
      this.onIntent = onIntent;
      this.onError = onError;
      this.language = language;
      this.voicePack = normalizeVoicePack(voicePack);
      this.voiceStyleId = String(voiceStyleId || '');
      this.allowNeural = Boolean(allowNeural);
      this.enabled = false;
      this.listening = false;
      this.speaking = false;
      this.recognition = null;
      this.speechGeneration = 0;
      this.recognitionGeneration = 0;
      this.state = this.isAvailable() ? VoiceStates.OFF : VoiceStates.UNAVAILABLE;
    }

    getCapabilities() {
      return Object.freeze({
        narration: Boolean(this.synthesis && this.UtteranceClass),
        recognition: Boolean(this.RecognitionClass),
      });
    }

    isAvailable() {
      const capabilities = this.getCapabilities();
      return capabilities.narration || capabilities.recognition;
    }

    setLanguage(language) {
      this.language = String(language || '').toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
      return this.language;
    }

    getVoicePack() {
      return this.voicePack;
    }

    getVoiceProfile({
      language = this.language,
      styleId = this.voiceStyleId,
      seed = '',
    } = {}) {
      const locale = String(language || '').toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
      const style = selectVoiceStyle(this.voicePack, { locale, styleId, seed });
      const providers = resolveVoiceProviders(this.voicePack, {
        locale,
        capability: VoiceCapabilities.NARRATION,
        allowNeural: this.allowNeural,
      });
      const browserProvider = providers.find(({ kind }) => kind === VoiceProviderKinds.BROWSER);
      return Object.freeze({
        packId: this.voicePack.id,
        locale,
        style,
        providerId: browserProvider?.id || '',
        candidates: Object.freeze(providers.map(({ id }) => id)),
      });
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled) && this.isAvailable();
      if (!this.enabled) {
        this.stop();
        this.setState(this.isAvailable() ? VoiceStates.OFF : VoiceStates.UNAVAILABLE);
      } else {
        this.setState(VoiceStates.IDLE);
      }
      return this.enabled;
    }

    toggleEnabled() {
      return this.setEnabled(!this.enabled);
    }

    speak(text, {
      language = this.language,
      rate,
      pitch,
      styleId = this.voiceStyleId,
      seed = '',
    } = {}) {
      const message = String(text || '').replace(/\s+/g, ' ').trim();
      if (!this.enabled || !message || !this.getCapabilities().narration) return false;

      const profile = this.getVoiceProfile({ language, styleId, seed });
      const resolvedRate = Number.isFinite(Number(rate)) ? Number(rate) : profile.style?.rate || 0.94;
      const resolvedPitch = Number.isFinite(Number(pitch)) ? Number(pitch) : profile.style?.pitch || 0.92;

      const token = ++this.speechGeneration;
      this.stopListening();
      this.synthesis.cancel?.();
      const utterance = new this.UtteranceClass(message);
      utterance.lang = profile.locale;
      utterance.rate = resolvedRate;
      utterance.pitch = resolvedPitch;
      utterance.voice = this.selectVoice(profile.locale);
      utterance.onstart = () => {
        if (token !== this.speechGeneration) return;
        this.speaking = true;
        this.setState(VoiceStates.SPEAKING, {
          message,
          voicePackId: profile.packId,
          voiceStyleId: profile.style?.id || '',
          voiceProviderId: profile.providerId,
        });
      };
      utterance.onend = () => {
        if (token !== this.speechGeneration) return;
        this.speaking = false;
        if (this.enabled) this.setState(VoiceStates.IDLE);
      };
      utterance.onerror = (event) => {
        if (token !== this.speechGeneration) return;
        this.speaking = false;
        this.reportError(event?.error || 'speech-failed');
      };
      this.synthesis.speak(utterance);
      return true;
    }

    selectVoice(language = this.language) {
      const languageRoot = String(language).toLowerCase().split('-')[0];
      const voices = this.synthesis?.getVoices?.() || [];
      return voices.find((voice) => String(voice.lang).toLowerCase() === String(language).toLowerCase())
        || voices.find((voice) => String(voice.lang).toLowerCase().startsWith(languageRoot))
        || null;
    }

    listen({ context = 'answer' } = {}) {
      if (!this.enabled || !this.getCapabilities().recognition || this.listening) return false;

      this.speechGeneration += 1;
      this.synthesis?.cancel?.();
      this.speaking = false;
      const token = ++this.recognitionGeneration;
      const recognition = new this.RecognitionClass();
      this.recognition = recognition;
      recognition.lang = this.language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        if (token !== this.recognitionGeneration) return;
        this.listening = true;
        this.setState(VoiceStates.LISTENING);
      };
      recognition.onresult = (event) => {
        if (token !== this.recognitionGeneration) return;
        let transcript = '';
        let isFinal = false;
        for (let index = event.resultIndex || 0; index < event.results.length; index += 1) {
          transcript += event.results[index]?.[0]?.transcript || '';
          isFinal = isFinal || Boolean(event.results[index]?.isFinal);
        }
        transcript = transcript.trim();
        this.onTranscript({ transcript, final: isFinal });
        if (isFinal && transcript) {
          this.onIntent(parseVoiceIntent(transcript, { context }));
        }
      };
      recognition.onerror = (event) => {
        if (token !== this.recognitionGeneration) return;
        this.listening = false;
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          this.setState(VoiceStates.DENIED, { error: event.error });
          this.onError({ code: event.error, recoverable: false });
          return;
        }
        if (event?.error === 'no-speech' || event?.error === 'aborted') {
          if (this.enabled) this.setState(VoiceStates.IDLE);
          return;
        }
        this.reportError(event?.error || 'recognition-failed');
      };
      recognition.onend = () => {
        if (token !== this.recognitionGeneration) return;
        this.listening = false;
        this.recognition = null;
        if (this.enabled && this.state === VoiceStates.LISTENING) this.setState(VoiceStates.IDLE);
      };

      try {
        recognition.start();
        return true;
      } catch (error) {
        this.recognition = null;
        this.reportError(error?.message || 'recognition-start-failed');
        return false;
      }
    }

    stopListening() {
      if (!this.recognition) return;
      this.recognitionGeneration += 1;
      const recognition = this.recognition;
      this.recognition = null;
      this.listening = false;
      recognition.abort?.();
    }

    stop() {
      this.stopListening();
      this.speechGeneration += 1;
      this.synthesis?.cancel?.();
      this.speaking = false;
    }

    setState(state, detail = {}) {
      this.state = state;
      this.onState({
        state,
        enabled: this.enabled,
        capabilities: this.getCapabilities(),
        ...detail,
      });
    }

    reportError(code) {
      this.setState(VoiceStates.ERROR, { error: code });
      this.onError({ code, recoverable: true });
    }
  }

  return {
    VoiceCommands,
    VoiceController,
    VoiceStates,
    normalizeTranscript,
    parseVoiceIntent,
    stripAnswerPrefix,
  };
}));
