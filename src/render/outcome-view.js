(function initOutcomeView(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYOutcomeView = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function outcomeViewFactory() {
  'use strict';

  class OutcomeView {
    constructor({
      dom,
      getCopy,
      setText,
      setGameMoment,
      clearMedia,
      setQuestionText,
      toggleAnswer,
    } = {}) {
      if (!dom || typeof getCopy !== 'function' || typeof setText !== 'function') {
        throw new Error('OutcomeView requires DOM, copy, and text presentation adapters.');
      }
      this.dom = dom;
      this.getCopy = getCopy;
      this.setText = setText;
      this.setGameMoment = setGameMoment;
      this.clearMedia = clearMedia;
      this.setQuestionText = setQuestionText;
      this.toggleAnswer = toggleAnswer;
    }

    displayCorrect(result) {
      const copy = this.getCopy();
      const currentStreak = typeof result === 'number' ? result : result?.currentStreak || 0;
      const scoreDelta = typeof result === 'number' ? 0 : result?.scoreDelta || 0;
      const correctAnswer = typeof result === 'object' ? result?.correctAnswer || '' : '';
      const judgment = {
        exact: copy.exactJudgment,
        variation: copy.variationJudgment,
        fuzzy: copy.fuzzyJudgment,
      }[result?.answerMatch?.reason] || '';
      this.setGameMoment('correct');
      this.setText(this.dom.categoryBox, copy.correctKicker);
      this.clearMedia();
      this.setQuestionText(
        scoreDelta > 0 ? `${copy.correctMessage} +$${scoreDelta}` : copy.correctMessage,
      );
      this.setText(this.dom.answerBox, [
        correctAnswer ? `${copy.correctResponseLabel} ${correctAnswer}` : '',
        judgment,
        `${copy.correctAnswerStreak}: ${currentStreak}`,
      ].filter(Boolean).join('\n'));
      this.toggleAnswer(true);
    }

    displayIncorrect(result) {
      const copy = this.getCopy();
      const correctAnswer = typeof result === 'string'
        ? result
        : result?.correctAnswer || 'Unknown';
      const submittedAnswer = typeof result === 'object' ? result?.submittedAnswer || '' : '';
      this.setGameMoment('incorrect');
      this.setText(this.dom.categoryBox, copy.incorrectKicker);
      this.clearMedia();
      this.setQuestionText(copy.incorrectMessage);
      this.setText(this.dom.answerBox, [
        submittedAnswer ? `${copy.yourResponseLabel} ${submittedAnswer}` : '',
        `${copy.correctResponseLabel} ${correctAnswer}`,
        copy.streakReset,
      ].filter(Boolean).join('\n'));
      this.toggleAnswer(true);
    }

    renderFeedback({ confidence = null, disputed = false } = {}) {
      if (!this.dom.outcomeFeedback) return false;
      const copy = this.getCopy();
      this.dom.outcomeFeedback.hidden = false;
      const ratings = [
        [this.dom.confidenceKnew, 'knew-it'],
        [this.dom.confidenceShaky, 'shaky'],
        [this.dom.confidenceLearned, 'learned-it'],
      ];
      ratings.forEach(([button, value]) => {
        button?.setAttribute?.('aria-pressed', String(confidence === value));
      });
      this.dom.disputeButton?.setAttribute?.('aria-pressed', String(Boolean(disputed)));
      this.setText(
        this.dom.disputeButton,
        disputed ? copy.disputeRecorded : copy.disputeJudgment,
      );
      this.setText(
        this.dom.outcomeFeedbackStatus,
        confidence
          ? `${copy.confidencePrompt} ${{
            'knew-it': copy.confidenceKnew,
            shaky: copy.confidenceShaky,
            'learned-it': copy.confidenceLearned,
          }[confidence]}.`
          : disputed ? copy.disputeRecorded : '',
      );
      return true;
    }

    hideFeedback() {
      if (!this.dom.outcomeFeedback) return false;
      this.dom.outcomeFeedback.hidden = true;
      this.setText(this.dom.outcomeFeedbackStatus, '');
      return true;
    }
  }

  return {
    OutcomeView,
  };
}));
