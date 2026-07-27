(function initStudyController(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../contracts/events.js'),
      require('../core/round-kernel.js'),
      require('../study/clue-packet.js'),
      require('../study/round-snapshot.js'),
    );
  } else {
    root.JeoPARODYStudyController = factory(
      root.JeopardishContracts,
      root.JeoPARODYRoundKernel,
      root.JeoPARODYCluePacket,
      root.JeoPARODYRoundSnapshot,
    );
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function studyControllerFactory(
  contracts,
  roundKernelModule,
  cluePacketModule,
  roundSnapshotModule,
) {
  'use strict';

  if (!contracts || !roundKernelModule || !cluePacketModule || !roundSnapshotModule) {
    throw new Error('StudyController requires contracts, round kernel, clue packet, and snapshot modules.');
  }

  const { GameEvents } = contracts;
  const { RoundPhases } = roundKernelModule;

  class StudyController {
    constructor({
      roundKernel,
      getGameState,
      renderer,
      eventBus,
      getContext,
      extractContent = (clue) => ({ questionText: clue?.question || '', media: [] }),
      revealAnswer = async () => false,
      renderHost = () => {},
      speak = () => false,
      snapshotStore = new roundSnapshotModule.RoundSnapshotStore(),
    } = {}) {
      if (!roundKernel) throw new Error('StudyController requires a roundKernel.');
      if (typeof getGameState !== 'function') {
        throw new Error('StudyController requires getGameState.');
      }
      if (!renderer) throw new Error('StudyController requires a renderer.');
      if (!eventBus) throw new Error('StudyController requires an eventBus.');
      if (typeof getContext !== 'function') throw new Error('StudyController requires getContext.');

      this.roundKernel = roundKernel;
      this.getGameState = getGameState;
      this.renderer = renderer;
      this.eventBus = eventBus;
      this.getContext = getContext;
      this.extractContent = extractContent;
      this.revealAnswer = revealAnswer;
      this.renderHost = renderHost;
      this.speak = speak;
      this.snapshotStore = snapshotStore;
      this.activePacket = null;
    }

    getState() {
      return Object.freeze({
        open: this.isOpen(),
        clueId: this.activePacket?.canonical?.clueId || null,
        grounding: this.activePacket?.grounding || null,
      });
    }

    isOpen() {
      return Boolean(this.activePacket && this.snapshotStore.peek());
    }

    async enter() {
      if (this.isOpen()) return false;
      const context = this.getContext() || {};
      if (!context.sourceClue) return false;

      if (this.roundKernel.phase === RoundPhases.ANSWERING) {
        await this.revealAnswer();
      }
      if (!this.roundKernel.canPause()) return false;

      let prepared;
      try {
        prepared = this.prepareStudy(context);
      } catch (error) {
        this.reportError('study-prepare-failed', error);
        return false;
      }

      const roundState = this.roundKernel.pause('study');
      if (!roundState) return false;

      try {
        this.snapshotStore.capture({
          clueId: prepared.packet.canonical.clueId,
          packet: prepared.packet,
          locale: prepared.locale,
          scoreReference: prepared.scoreReference,
          roundState,
          view: prepared.view,
        });
        this.activePacket = prepared.packet;
        this.renderer.renderStudyPanel(
          prepared.packet,
          cluePacketModule.getStudyActions(prepared.locale),
        );
        this.renderer.setStudyOpen(true);
        this.renderer.setControlsEnabled(false);
        this.renderHost('clue');
        this.speak(prepared.locale === 'pt-BR'
          ? 'Desvio de estudo aberto. Escolha uma direção.'
          : 'Study detour open. Choose a direction.');
        this.emit(GameEvents.STUDY_ENTERED, {
          clueId: prepared.packet.canonical.clueId,
          grounding: prepared.packet.grounding,
        });
        return true;
      } catch (error) {
        this.rollbackEntry(roundState, prepared.view);
        this.reportError('study-entry-failed', error);
        return false;
      }
    }

    prepareStudy(context) {
      const locale = context.locale === 'pt-BR' ? 'pt-BR' : 'en';
      const sourceContent = this.extractContent(context.sourceClue);
      const displayClue = context.displayClue || context.sourceClue;
      const displayContent = this.extractContent(displayClue);
      const canonical = cluePacketModule.createCanonicalCluePacket({
        ...context.sourceClue,
        question: sourceContent.questionText,
      }, {
        locale: 'en',
        media: sourceContent.media,
      });
      const packet = cluePacketModule.createGroundedCluePacket(canonical, {
        reviewed: context.episode?.reviewStatus === 'reviewed',
        explanation: context.sourceClue.explanation,
        citations: context.sourceClue.sources,
        backstory: context.sourceClue.learning?.backstory,
        connections: context.sourceClue.learning?.connections,
        presentation: {
          locale,
          category: displayClue.category || context.sourceClue.category,
          question: displayContent.questionText,
          answer: displayClue.answer || context.sourceClue.answer,
        },
      });
      const gameState = this.getGameState();

      return {
        locale,
        packet,
        scoreReference: {
          score: gameState.score,
          currentStreak: gameState.currentStreak,
          bestStreak: gameState.bestStreak,
        },
        view: this.renderer.captureRoundView(),
      };
    }

    selectAction(actionId) {
      if (!this.isOpen()) return null;
      const allowed = cluePacketModule.STUDY_ACTIONS.some((action) => action.id === actionId);
      if (!allowed) return null;

      const response = cluePacketModule.getStudyResponse(this.activePacket, actionId);
      this.renderer.renderStudyResponse(response);
      this.speak(response);
      this.emit(GameEvents.STUDY_ACTION_SELECTED, {
        clueId: this.activePacket.canonical.clueId,
        actionId,
        grounding: this.activePacket.grounding,
      });
      return response;
    }

    exit() {
      const pending = this.snapshotStore.peek();
      if (!pending || !this.isOpen()) return false;

      const scoreIntegrity = this.hasScoreIntegrity(pending.scoreReference);
      if (!scoreIntegrity) {
        this.reportError(
          'study-mutated-score',
          new Error('Study mode changed protected round scoring state.'),
        );
      }

      if (!this.roundKernel.resume(pending.roundState)) {
        this.reportError(
          'study-resume-rejected',
          new Error('The protected round snapshot no longer matches the active round.'),
        );
        return false;
      }

      const snapshot = this.snapshotStore.consume(pending.resumeToken);
      this.activePacket = null;
      try {
        this.renderer.setStudyOpen(false);
        this.renderer.restoreRoundView(snapshot.view);
        this.renderer.setControlsEnabled(snapshot.roundState.phase === RoundPhases.ANSWERING);
        this.renderer.setStudyAvailable(this.roundKernel.canPause());
      } catch (error) {
        this.reportError('study-view-restore-failed', error);
      }
      this.emit(GameEvents.STUDY_EXITED, {
        clueId: snapshot.clueId,
        scoreIntegrity,
      });
      return true;
    }

    hasScoreIntegrity(scoreReference = {}) {
      const gameState = this.getGameState();
      return ['score', 'currentStreak', 'bestStreak']
        .every((key) => gameState[key] === scoreReference[key]);
    }

    rollbackEntry(roundState, view) {
      this.snapshotStore.clear();
      this.activePacket = null;
      this.roundKernel.resume(roundState);
      try {
        this.renderer.setStudyOpen(false);
        this.renderer.restoreRoundView(view);
        this.renderer.setControlsEnabled(roundState.phase === RoundPhases.ANSWERING);
        this.renderer.setStudyAvailable(this.roundKernel.canPause());
      } catch (error) {
        this.reportError('study-entry-rollback-view-failed', error);
      }
    }

    emit(type, payload = {}) {
      return this.eventBus.emit(type, payload, { source: 'StudyController' });
    }

    reportError(code, error) {
      this.emit(GameEvents.ERROR_REPORTED, {
        code,
        message: error?.message || String(error),
      });
    }
  }

  return { StudyController };
}));
