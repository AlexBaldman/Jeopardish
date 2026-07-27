(function initCluePipeline(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYCluePipeline = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function cluePipelineFactory() {
  'use strict';

  class CluePipeline {
    constructor({
      roundKernel,
      mediaPreflight,
      mediaEvents = {},
      maxAttempts = 12,
      createAbortController = () => new AbortController(),
    } = {}) {
      if (!roundKernel) throw new Error('CluePipeline requires a roundKernel.');
      if (!mediaPreflight) throw new Error('CluePipeline requires mediaPreflight.');

      this.roundKernel = roundKernel;
      this.mediaPreflight = mediaPreflight;
      this.mediaEvents = mediaEvents;
      this.maxAttempts = maxAttempts;
      this.createAbortController = createAbortController;
      this.generation = 0;
      this.abortController = null;
    }

    cancel() {
      this.generation += 1;
      this.abortController?.abort();
      this.abortController = null;
    }

    isCurrent(generation) {
      return generation === this.generation;
    }

    async load({
      getCandidates,
      getMedia,
      onLoading = () => {},
      onCandidate = () => {},
      prepareDisplay = async (clue) => clue,
      commit = () => {},
      onReady = () => {},
      onEmpty = () => {},
      onError = () => {},
    } = {}) {
      if (typeof getCandidates !== 'function') {
        throw new Error('CluePipeline.load requires getCandidates.');
      }
      if (typeof getMedia !== 'function') {
        throw new Error('CluePipeline.load requires getMedia.');
      }

      this.cancel();
      const generation = this.generation;
      const abortController = this.createAbortController();
      this.abortController = abortController;
      this.roundKernel.beginClueLoad();
      onLoading();

      try {
        const selected = await this.mediaPreflight.selectPlayable(
          getCandidates(this.maxAttempts),
          {
            signal: abortController.signal,
            getMedia,
            events: this.mediaEvents,
          },
        );
        if (!this.isCurrent(generation)) return null;

        const clue = selected?.clue || null;
        if (!clue) {
          this.roundKernel.cancel(undefined, 'no-playable-clue');
          onEmpty();
          return null;
        }

        onCandidate(selected);
        const displayClue = await prepareDisplay(clue, {
          signal: abortController.signal,
          generation,
        });
        if (!displayClue || !this.isCurrent(generation)) return null;

        await this.roundKernel.introduceClue(() => commit(clue, displayClue));
        if (!this.isCurrent(generation)) return null;

        onReady(clue, displayClue);
        return clue;
      } catch (error) {
        if (error?.name === 'AbortError' || !this.isCurrent(generation)) return null;
        this.roundKernel.cancel(undefined, 'clue-pipeline-failed');
        onError(error);
        return null;
      } finally {
        if (this.isCurrent(generation)) {
          this.abortController = null;
        }
      }
    }
  }

  return { CluePipeline };
}));
