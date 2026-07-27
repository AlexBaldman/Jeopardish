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
      learningLedger,
      getContext,
      extractContent = (clue) => ({ questionText: clue?.question || '', media: [] }),
      revealAnswer = async () => false,
      renderHost = () => {},
      speak = () => false,
      onLearningProgress = () => {},
      snapshotStore = new roundSnapshotModule.RoundSnapshotStore(),
    } = {}) {
      if (!roundKernel) throw new Error('StudyController requires a roundKernel.');
      if (typeof getGameState !== 'function') {
        throw new Error('StudyController requires getGameState.');
      }
      if (!renderer) throw new Error('StudyController requires a renderer.');
      if (!eventBus) throw new Error('StudyController requires an eventBus.');
      if (!learningLedger) throw new Error('StudyController requires a learningLedger.');
      if (typeof getContext !== 'function') throw new Error('StudyController requires getContext.');

      this.roundKernel = roundKernel;
      this.getGameState = getGameState;
      this.renderer = renderer;
      this.eventBus = eventBus;
      this.learningLedger = learningLedger;
      this.getContext = getContext;
      this.extractContent = extractContent;
      this.revealAnswer = revealAnswer;
      this.renderHost = renderHost;
      this.speak = speak;
      this.onLearningProgress = onLearningProgress;
      this.snapshotStore = snapshotStore;
      this.activePacket = null;
      this.activeEpisodeId = null;
    }

    getState() {
      return Object.freeze({
        open: this.isOpen(),
        clueId: this.activePacket?.canonical?.clueId || null,
        grounding: this.activePacket?.grounding || null,
        reinforcement: Boolean(this.activePacket?.reinforcement),
        mastery: this.getActiveLearningEntry()?.mastery || 'unseen',
      });
    }

    isOpen() {
      return Boolean(this.activePacket && this.snapshotStore.peek());
    }

    async enter(contextOverride = null) {
      if (this.isOpen()) return false;
      const context = contextOverride || this.getContext() || {};
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
          episodeId: prepared.episodeId,
          scoreReference: prepared.scoreReference,
          roundState,
          view: prepared.view,
        });
        this.activePacket = prepared.packet;
        this.activeEpisodeId = prepared.episodeId;
        this.renderer.renderStudyPanel(
          prepared.packet,
          cluePacketModule.getStudyActions(prepared.locale),
        );
        this.renderer.setStudyOpen(true);
        this.renderer.setControlsEnabled(false);
        const learning = this.learningLedger.recordStudy({
          episodeId: prepared.episodeId,
          clueId: prepared.packet.canonical.clueId,
          grounding: prepared.packet.grounding,
        });
        this.renderHost('clue');
        this.speak(prepared.locale === 'pt-BR'
          ? 'Desvio de estudo aberto. Escolha uma direção.'
          : 'Study detour open. Choose a direction.');
        this.emit(GameEvents.STUDY_ENTERED, {
          clueId: prepared.packet.canonical.clueId,
          grounding: prepared.packet.grounding,
          mastery: learning?.mastery || 'studying',
        });
        this.onLearningProgress(learning);
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
        reinforcement: context.sourceClue.learning?.reinforcement,
        presentation: {
          locale,
          category: displayClue.category || context.sourceClue.category,
          question: displayContent.questionText,
          answer: displayClue.answer || context.sourceClue.answer,
        },
      });
      const gameState = this.getGameState();

      return {
        episodeId: String(context.episode?.id || 'archive'),
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
      if (actionId === 'quiz' && this.activePacket.reinforcement) {
        this.renderer.renderStudyReinforcement?.(
          this.activePacket.reinforcement,
          this.activePacket.presentation.locale,
        );
      }
      this.speak(response);
      const learning = this.learningLedger.recordAction({
        episodeId: this.activeEpisodeId,
        clueId: this.activePacket.canonical.clueId,
        actionId,
      });
      this.emit(GameEvents.STUDY_ACTION_SELECTED, {
        clueId: this.activePacket.canonical.clueId,
        actionId,
        grounding: this.activePacket.grounding,
        mastery: learning?.mastery || 'studying',
      });
      this.onLearningProgress(learning);
      return response;
    }

    submitReinforcement(response) {
      if (!this.isOpen() || !this.activePacket?.reinforcement) return null;
      const judgment = cluePacketModule.judgeReinforcement(this.activePacket, response);
      if (!judgment || judgment.reason === 'empty') {
        this.renderer.renderStudyReinforcementResult?.({
          correct: false,
          empty: true,
          message: this.activePacket.presentation.locale === 'pt-BR'
            ? 'Dê um palpite primeiro. Até uma resposta errada nos dá algo para ensinar.'
            : 'Take a swing first. Even a wrong answer gives us something useful to teach.',
        });
        return judgment;
      }
      const learning = this.learningLedger.recordReinforcement({
        episodeId: this.activeEpisodeId,
        clueId: this.activePacket.canonical.clueId,
        correct: judgment.isCorrect,
        reason: judgment.reason,
      });
      const reinforcement = this.activePacket.reinforcement;
      const message = judgment.isCorrect
        ? reinforcement.explanation
        : this.activePacket.presentation.locale === 'pt-BR'
          ? `Ainda não. A resposta é “${reinforcement.answer}”. ${reinforcement.explanation}`
          : `Not quite. The answer is “${reinforcement.answer}.” ${reinforcement.explanation}`;
      this.renderer.renderStudyReinforcementResult?.({
        correct: judgment.isCorrect,
        answer: reinforcement.answer,
        message,
      });
      this.speak(message);
      this.emit(GameEvents.STUDY_REINFORCEMENT_ANSWERED, {
        clueId: this.activePacket.canonical.clueId,
        correct: judgment.isCorrect,
        reason: judgment.reason,
        mastery: learning?.mastery || 'practicing',
        attemptCount: learning?.reinforcementAttempts || 1,
        grounding: this.activePacket.grounding,
      });
      this.onLearningProgress(learning);
      return Object.freeze({
        correct: judgment.isCorrect,
        reason: judgment.reason,
        mastery: learning?.mastery || 'practicing',
      });
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
      const learning = this.getActiveLearningEntry();
      this.activePacket = null;
      this.activeEpisodeId = null;
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
        mastery: learning?.mastery || 'unseen',
      });
      this.onLearningProgress(learning);
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
      this.activeEpisodeId = null;
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

    getActiveLearningEntry() {
      const clueId = this.activePacket?.canonical?.clueId;
      return clueId
        ? this.learningLedger.getEntry(this.activeEpisodeId, clueId)
        : null;
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
