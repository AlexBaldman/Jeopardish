(function initFinaleView(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYFinaleView = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function finaleViewFactory() {
  'use strict';

  class FinaleView {
    constructor({
      dom,
      getCopy,
      setGameMoment,
      hideOutcomeFeedback,
      setText,
      clearMedia,
      setQuestionText,
      toggleAnswer,
      decorateControlButton,
      setReviewQueueState,
      showScoreDrawer,
    } = {}) {
      const required = [
        getCopy,
        setGameMoment,
        hideOutcomeFeedback,
        setText,
        clearMedia,
        setQuestionText,
        toggleAnswer,
        decorateControlButton,
        setReviewQueueState,
        showScoreDrawer,
      ];
      if (!dom || required.some((adapter) => typeof adapter !== 'function')) {
        throw new Error('FinaleView requires DOM and completion presentation adapters.');
      }
      this.dom = dom;
      this.getCopy = getCopy;
      this.setGameMoment = setGameMoment;
      this.hideOutcomeFeedback = hideOutcomeFeedback;
      this.setText = setText;
      this.clearMedia = clearMedia;
      this.setQuestionText = setQuestionText;
      this.toggleAnswer = toggleAnswer;
      this.decorateControlButton = decorateControlButton;
      this.setReviewQueueState = setReviewQueueState;
      this.showScoreDrawer = showScoreDrawer;
    }

    render(progress) {
      if (!progress) return false;
      const copy = this.getCopy();
      const total = Number.isFinite(progress.total) ? progress.total : 0;
      const correct = Number.isFinite(progress.counts?.correct) ? progress.counts.correct : 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const artifactTitle = progress.finale?.artifactTitle || progress.finale?.title || '';
      const artifactBody = progress.finale?.artifactBody || '';
      const reviewTotal = Number.isFinite(progress.review?.total) ? progress.review.total : 0;
      const reviewLine = reviewTotal
        ? `${reviewTotal} clue${reviewTotal === 1 ? '' : 's'} saved for review`
        : 'No clues queued for review';
      const disputeLine = progress.disputes
        ? `${progress.disputes} ruling${progress.disputes === 1 ? '' : 's'} flagged`
        : '';

      this.setGameMoment('complete');
      this.hideOutcomeFeedback();
      this.setText(this.dom.categoryBox, copy.episodeComplete);
      this.clearMedia();
      this.setQuestionText([
        artifactTitle,
        `$${progress.score || 0} final score · ${accuracy}% accuracy`,
      ].filter(Boolean).join('\n'));
      this.setText(
        this.dom.answerBox,
        [
          artifactBody,
          `${total} clues aired`,
          `${progress.counts?.incorrect || 0} incorrect · ${progress.counts?.revealed || 0} revealed · ${progress.counts?.skipped || 0} skipped`,
          reviewLine,
          disputeLine,
        ].filter(Boolean).join('\n'),
      );
      this.toggleAnswer(true);
      if (this.dom.checkButton) this.dom.checkButton.disabled = true;
      if (this.dom.answerButton) this.dom.answerButton.disabled = true;
      if (this.dom.userInput) this.dom.userInput.disabled = true;
      this.decorateControlButton(this.dom.questionButton, copy.replayEpisode, 'Q');
      if (this.dom.questionButton) this.dom.questionButton.disabled = false;
      this.setReviewQueueState(progress.learning);
      this.showScoreDrawer();
      return true;
    }
  }

  return {
    FinaleView,
  };
}));
