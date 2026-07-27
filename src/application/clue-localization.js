(function initClueLocalization(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYClueLocalization = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function clueLocalizationFactory() {
  'use strict';

  class ClueLocalization {
    constructor({
      translationService,
      preferenceStore,
      renderer,
      extractContent,
      getCurrentContext = () => ({ sourceClue: null }),
      hasActiveClue = () => false,
      getRoundPresentation = () => ({ phase: null, canAnswer: false }),
      getClueValue = () => 0,
      updateDisplayClue = () => null,
      narrateCurrentClue = () => {},
      warn = (...args) => globalThis.console?.warn?.(...args),
      createAbortController = () => new AbortController(),
    } = {}) {
      if (!translationService || !preferenceStore || !renderer) {
        throw new Error('ClueLocalization requires translation, preferences, and renderer.');
      }
      if (typeof extractContent !== 'function') {
        throw new Error('ClueLocalization requires clue content extraction.');
      }
      this.translationService = translationService;
      this.preferenceStore = preferenceStore;
      this.renderer = renderer;
      this.extractContent = extractContent;
      this.getCurrentContext = getCurrentContext;
      this.hasActiveClue = hasActiveClue;
      this.getRoundPresentation = getRoundPresentation;
      this.getClueValue = getClueValue;
      this.updateDisplayClue = updateDisplayClue;
      this.narrateCurrentClue = narrateCurrentClue;
      this.warn = warn;
      this.createAbortController = createAbortController;
      this.generation = 0;
      this.abortController = null;
    }

    cancel() {
      this.generation += 1;
      this.abortController?.abort();
      this.abortController = null;
    }

    async prepare(clue, { signal, showLoading = true } = {}) {
      if (!clue || this.preferenceStore.get('language') !== 'pt-BR') {
        return clue;
      }

      if (showLoading) this.renderer.showTranslationLoading();
      const sourceContent = this.extractContent(clue);
      try {
        const translated = await this.translationService.translateClue(clue, {
          questionText: sourceContent.questionText,
          signal,
        });
        return {
          ...translated,
          media: [
            ...(Array.isArray(clue.media) ? clue.media : []),
            ...(Array.isArray(sourceContent.media) ? sourceContent.media : []),
          ],
        };
      } catch (error) {
        if (error?.name === 'AbortError') return null;
        this.warn(
          'Complete clue translation unavailable; showing the original clue.',
          error,
        );
        return {
          ...clue,
          translationFallback: true,
        };
      }
    }

    async refreshCurrent() {
      const { sourceClue } = this.getCurrentContext() || {};
      if (!sourceClue || !this.hasActiveClue()) return false;

      const roundView = this.renderer.captureRoundView();
      this.cancel();
      const generation = this.generation;
      const abortController = this.createAbortController();
      this.abortController = abortController;
      const displayClue = await this.prepare(sourceClue, {
        signal: abortController.signal,
      });
      if (!displayClue) {
        if (generation === this.generation) this.abortController = null;
        return false;
      }
      if (generation !== this.generation) return false;

      this.updateDisplayClue(displayClue);
      this.renderer.renderClue(displayClue, this.getClueValue());
      const round = this.getRoundPresentation();
      this.renderer.setRoundPhase(round.phase);
      this.renderer.restoreRoundView(roundView);
      this.renderer.setControlsEnabled(Boolean(round.canAnswer));
      this.narrateCurrentClue();
      this.abortController = null;
      return true;
    }
  }

  return { ClueLocalization };
}));
